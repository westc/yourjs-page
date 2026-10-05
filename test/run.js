/**
 * Browser tests for the built files in dist/.  Run them with `npm test` which
 * builds first.  They use the installed copy of Google Chrome (set CHROME_PATH
 * to use a different Chromium based browser) and need an internet connection
 * because the page loads its libraries from CDNs.
 *
 * Set TEST_BROWSER to "webkit" (Safari's engine) or "firefox" to use
 * Playwright's builds of those browsers instead (install them once with
 * `npx playwright-core install webkit firefox`).  `npm run test:all` runs the
 * tests in all three.
 *
 * Run only some of the tests by passing part of their names:
 *   node test/run.js console layout
 */

const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium, firefox, webkit } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const MIME_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const IS_MAC = process.platform === 'darwin';
const RUN_KEYS = `${IS_MAC ? 'Meta' : 'Control'}+Enter`;

/** @type {{name: string, fn: (t: TestContext) => Promise<void>}[]} */
const TESTS = [];
const test = (name, fn) => TESTS.push({ name, fn });

/**
 * The message for a variable that isn't defined (which is different in each
 * browser).
 * @param {string} name
 * @returns {RegExp}
 */
const notDefined = name => new RegExp(`^ReferenceError: (${name} is not defined|Can't find variable: ${name})$`);

/**
 * Checks messages where some are matched with regular expressions.
 * @param {string[]} actual
 * @param {(string|RegExp)[]} expected
 */
function assertMessages(actual, expected) {
  assert.equal(actual.length, expected.length, actual.join('\n'));
  expected.forEach((item, index) => {
    if (item instanceof RegExp) assert.match(actual[index], item);
    else assert.equal(actual[index], item);
  });
}

/**
 * The pages opened by the tests (by their paths) which the server serves.
 * (Routing them with Playwright would stop requests from the sandboxed result
 * from working.)
 * @type {Map<string, string>}
 */
const TEST_PAGES = new Map();

/**
 * Serves the repo so that the dist files and examples can be loaded.
 * @returns {Promise<http.Server>}
 */
function startServer() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // Folders are served as empty pages which the tests use as a starting point.
    if (pathname.endsWith('/')) {
      res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!DOCTYPE html>');
      return;
    }
    // Fake libraries (requests from the sandboxed result can't be routed by
    // Playwright so they are served for real).
    const fakeLibrary = /^\/fake-cdn\/(.+)$/.exec(pathname);
    if (fakeLibrary) {
      const name = fakeLibrary[1];
      // Never finishes loading (so the page never finishes loading).
      if (name === 'never.js') return;
      if (name === 'missing.js') {
        res.writeHead(404).end();
        return;
      }
      const isCss = name.endsWith('.css');
      res.writeHead(200, { 'Content-Type': isCss ? 'text/css' : 'text/javascript', 'Access-Control-Allow-Origin': '*' });
      res.end(isCss
        ? 'p { color: rgb(0, 0, 255); margin-left: 7px; }'
        : `window.libs = (window.libs || []).concat(${JSON.stringify(name)});`);
      return;
    }
    if (TEST_PAGES.has(pathname)) {
      res.writeHead(200, { 'Content-Type': 'text/html' }).end(TEST_PAGES.get(pathname));
      return;
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/**
 * Helpers for working with the pages made by YourJS Page.
 */
class TestContext {
  constructor(browser, baseUrl) {
    this.browser = browser;
    this.baseUrl = baseUrl;
  }

  /**
   * Opens a new page with the given HTML (`SRC` is replaced with the URL of
   * the dist file).
   * @param {string} html
   * @param {{width?: number, routes?: [string, Function][]}=} options
   */
  async open(html, options = {}) {
    await this.close();
    this.context = await this.browser.newContext({
      viewport: { width: options.width ?? 1200, height: 800 },
    });
    for (const [url, handler] of options.routes ?? []) await this.context.route(url, handler);
    this.page = await this.context.newPage();
    this.dialogs = [];
    this.page.on('dialog', dialog => {
      this.dialogs.push(dialog.message());
      // "Again?" is answered slowly (see the loop protection tests).
      setTimeout(() => dialog.accept(), dialog.message() === 'Again?' ? 400 : 0);
    });
    // The page is served from a real URL (in the test folder so that relative
    // URLs work) so that it can be reloaded.
    const pagePath = `/test/page-${TEST_PAGES.size + 1}.html`;
    TEST_PAGES.set(pagePath, html.replace(/SRC/g, `${this.baseUrl}/dist/yourjs-page.min.js`));
    // (Waiting for the page to load would wait for everything in the result,
    // which might never finish loading.)
    await this.page.goto(this.baseUrl + pagePath, { waitUntil: 'domcontentloaded' });
    return this;
  }

  /**
   * Opens a page with one YourJS Page made from a script tag with the given
   * data attributes.  The code comes from <template> elements.
   * @param {{html?: string, css?: string, js?: string}} code
   * @param {{[name: string]: string}=} attributes
   * @param {{width?: number, routes?: [string, Function][]}=} options
   */
  async openPage(code, attributes = {}, options = {}) {
    const attrs = Object.entries({
      ...code.html != null && { htmlSelector: '#html' },
      ...code.css != null && { cssSelector: '#css' },
      ...code.js != null && { jsSelector: '#js' },
      ...attributes,
    })
      .map(([name, value]) => ` data-${name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${value}"`)
      .join('');
    const templates = ['html', 'css', 'js']
      .filter(key => code[key] != null)
      .map(key => `<template id="${key}">${code[key]}</template>`)
      .join('');
    await this.open(
      `<!DOCTYPE html><html><body style="margin:0">${templates}`
      + `<div id="wrapper" style="height:600px"><script src="SRC"${attrs}></script></div>`
      + `</body></html>`,
      options
    );
    await this.useViewer();
    return this;
  }

  /**
   * Waits for a viewer to be ready and uses it.
   * @param {string=} iframeSelector
   */
  async useViewer(iframeSelector = 'iframe') {
    await this.page.waitForFunction(selector => {
      const doc = document.querySelector(selector)?.contentDocument;
      return doc && (doc.querySelector('#app')?.hidden === false || doc.querySelector('#splash.failed'));
    }, iframeSelector, { timeout: 20000 });
    this.viewer = await (await this.page.$(iframeSelector)).contentFrame();
    return this.viewer;
  }

  async close() {
    await this.context?.close();
  }

  /** The URL that the fake libraries are served from. */
  get cdn() {
    return `${this.baseUrl}/fake-cdn/`;
  }

  /** Evaluates a function in the viewer. */
  inViewer(fn, arg) {
    return this.viewer.evaluate(fn, arg);
  }

  /** Gets the result's IFRAME (once its code has run). */
  async result() {
    const handle = await this.viewer.waitForSelector('#result iframe');
    const frame = await handle.contentFrame();
    await frame.waitForLoadState('load');
    return frame;
  }

  editorValue(key) {
    return this.inViewer(k => ace.edit(document.querySelector(`.panel[data-lang="${k}"] .editor`)).getValue(), key);
  }

  setEditorValue(key, value) {
    return this.inViewer(([k, v]) => ace.edit(document.querySelector(`.panel[data-lang="${k}"] .editor`)).setValue(v, -1), [key, value]);
  }

  click(selector) {
    return this.viewer.click(selector);
  }

  /** Clicks Run and waits for the new result to load. */
  async run() {
    const oldFrame = await this.viewer.$('#result iframe');
    await this.click('#run-button');
    await this.viewer.waitForFunction(old => document.querySelector('#result iframe') !== old, oldFrame);
    return this.result();
  }

  /**
   * Gets the console's messages as `"level: text"`.
   * @param {number=} count
   *   If given, waits until there are at least this many.
   */
  async messages(count = 0) {
    await this.viewer.waitForFunction(n => document.querySelectorAll('#console-entries .entry').length >= n, count);
    return this.inViewer(() => Array.from(
      document.querySelectorAll('#console-entries .entry'),
      entry => `${entry.className.match(/level-(\w+)/)[1]}: ${entry.querySelector('.entry-text').textContent}`
    ));
  }

  /** Gets the classes of the viewer's #app element. */
  appClasses() {
    return this.inViewer(() => Array.from(document.querySelector('#app').classList));
  }
}

const SIMPLE_CODE = {
  html: '<h1 id="title">Hello</h1>',
  css: 'h1 { color: rgb(255, 0, 0); }',
  js: 'document.getElementById("title").textContent += " world";',
};

// ---------------------------------------------------------------------------
// Loading

test('replaces the script with a page that runs the code from the selectors', async t => {
  await t.open(`<!DOCTYPE html><html><body>
    <div id="yourjs-page-wrapper">
      <script src="SRC" data-html-selector="pre#html-code > code" data-css-selector="pre#css-code > code" data-js-selector="pre#javascript-code > code"></script>
    </div>
    <pre id="html-code"><code>&lt;p id="p"&gt;Hi &amp;amp; bye&lt;/p&gt;</code></pre>
    <pre id="css-code"><code>p > b, p { color: rgb(0, 128, 0); }</code></pre>
    <pre id="javascript-code"><code>document.getElementById('p').dataset.ran = 1 &lt; 2;</code></pre>
  </body></html>`);
  await t.useViewer();
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('script').length), 0);
  assert.equal(await t.page.evaluate(() => document.querySelector('#yourjs-page-wrapper > iframe') !== null), true);
  assert.equal(await t.editorValue('html'), '<p id="p">Hi &amp; bye</p>');
  assert.equal(await t.editorValue('css'), 'p > b, p { color: rgb(0, 128, 0); }');
  const result = await t.result();
  assert.deepEqual(await result.evaluate(() => {
    const p = document.getElementById('p');
    return [p.textContent, getComputedStyle(p).color, p.dataset.ran];
  }), ['Hi & bye', 'rgb(0, 128, 0)', 'true']);
});

test('shows a comment for code that is missing', async t => {
  await t.open(`<!DOCTYPE html><html><body><script src="SRC" data-css-selector="#nope" data-js-selector="!!"></script></body></html>`);
  await t.useViewer();
  assert.equal(await t.editorValue('html'), '<!-- No data-html-selector, data-html-url or data-gist attribute was given. -->');
  assert.equal(await t.editorValue('css'), '/* No element matches the CSS selector:  #nope */');
  assert.equal(await t.editorValue('js'), '// The JavaScript selector is not valid:  !!');
});

test('reads code that comes after the script and from templates', async t => {
  await t.openPage({ html: '<b>a &amp; b</b>', css: 'b > i {}', js: 'if (1 < 2) {}' });
  assert.equal(await t.editorValue('html'), '<b>a &amp; b</b>');
  assert.equal(await t.editorValue('css'), 'b > i {}');
  assert.equal(await t.editorValue('js'), 'if (1 < 2) {}');
});

test('loads the code from data-html-url, data-css-url and data-js-url', async t => {
  // Relative URLs are relative to the page (which is in the test folder).
  await t.open(`<!DOCTYPE html><html><body><div style="height:600px">
    <script src="SRC" data-html-url="fixtures/page.html" data-css-url="fixtures/style.css" data-js-url="${t.baseUrl}/test/fixtures/script.js"></script>
  </div></body></html>`);
  await t.useViewer();
  assert.equal(await t.editorValue('html'), '<h1 id="title">From a file</h1>\n');
  assert.equal(await t.editorValue('css'), 'h1 { color: rgb(0, 128, 0); }\n');
  assert.deepEqual(await t.messages(1), ['log: script.js ran From a file rgb(0, 128, 0)']);
});

test('shows a comment for code that could not be loaded', async t => {
  await t.open(`<!DOCTYPE html><html><body><div style="height:600px">
    <script src="SRC" data-html-url="fixtures/missing.html" data-css-url="http://127.0.0.1:1/style.css" data-js-url="fixtures/script.js" data-js-selector="#js"></script>
  </div><template id="js">console.log("selector wins")</template></body></html>`);
  await t.useViewer();
  assert.equal(await t.editorValue('html'), '<!-- The HTML could not be loaded (404 Not Found) from:  fixtures/missing.html -->');
  assert.equal(await t.editorValue('css'), '/* The CSS could not be loaded from:  http://127.0.0.1:1/style.css */');
  // A selector wins over a URL.
  assert.equal(await t.editorValue('js'), 'console.log("selector wins")');
});

test('YourJSPage.create() loads code from URLs', async t => {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body><div id="target" style="height:500px"></div></body></html>');
  const before = await t.page.evaluate(() => {
    window.instance = YourJSPage.create({
      target: '#target',
      htmlUrl: 'fixtures/page.html',
      cssUrl: 'fixtures/style.css',
      jsUrl: 'fixtures/script.js',
    });
    // Code given to setCode() before the files are loaded wins.
    instance.setCode({ css: 'h1 { color: rgb(1, 2, 3); }' });
    return instance.getCode();
  });
  // The files haven't loaded yet.
  assert.deepEqual([before.html, before.css, before.js], ['', 'h1 { color: rgb(1, 2, 3); }', '']);
  await t.useViewer('#target iframe');
  assert.deepEqual(await t.messages(1), ['log: script.js ran From a file rgb(1, 2, 3)']);
  assert.equal(await t.page.evaluate(() => instance.getCode().html), '<h1 id="title">From a file</h1>\n');
});

/**
 * Stands in for GitHub's gists (the JSONP list of files and the raw files).
 * @param {{[id: string]: {[fileName: string]: string}}} gists
 * @returns {[string, Function][]}
 */
function fakeGistRoutes(gists) {
  return [
    ['https://gist.github.com/**', route => {
      const url = new URL(route.request().url());
      const id = /([\da-f]+)\.json$/.exec(url.pathname)?.[1];
      if (!gists[id]) return route.fulfill({ status: 404, body: 'Not Found' });
      route.fulfill({
        contentType: 'application/javascript',
        body: `/**/${url.searchParams.get('callback')}(${JSON.stringify({ files: Object.keys(gists[id]), div: '<div></div>' })})`,
      });
    }],
    ['https://gist.githubusercontent.com/**', route => {
      const [, id, fileName] = /^\/raw\/([^/]+)\/(.+)$/.exec(new URL(route.request().url()).pathname) ?? [];
      const text = gists[id]?.[decodeURIComponent(fileName)];
      route.fulfill({
        status: text == null ? 404 : 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'text/plain',
        body: text ?? '404: Not Found',
      });
    }],
  ];
}

const GIST_ID = 'aaaa1111bbbb2222';
const FAKE_GISTS = {
  [GIST_ID]: {
    'notes.md': '# Notes',
    'index.html': '<h1 id="title">From a gist</h1>',
    'style.css': 'h1 { color: rgb(0, 0, 255); }',
    'other.js': 'console.log("other.js")',
    'app.js': 'console.log("app.js", getComputedStyle(document.getElementById("title")).color)',
  },
  'cccc3333': { 'only.js': 'console.log("only.js")' },
};

/** Gets what the load error dialog says (or null if it isn't open). */
function getLoadErrors(t) {
  return t.inViewer(() => document.querySelector('#load-error-dialog').open
    ? Array.from(document.querySelectorAll('#load-error-list li'), li => li.innerText.replace(/\s+/g, ' '))
    : null);
}

test('loads the code from a gist', async t => {
  await t.openPage({}, { gist: `https://gist.github.com/someone/${GIST_ID}#file-app-js` }, { routes: fakeGistRoutes(FAKE_GISTS) });
  // The files are found by their names.
  assert.equal(await t.editorValue('html'), FAKE_GISTS[GIST_ID]['index.html']);
  assert.equal(await t.editorValue('css'), FAKE_GISTS[GIST_ID]['style.css']);
  assert.deepEqual(await t.messages(1), ['log: app.js rgb(0, 0, 255)']);
  assert.equal(await getLoadErrors(t), null);
});

test('skips the cache when loading gists', async t => {
  const requested = [];
  const routes = fakeGistRoutes(FAKE_GISTS).map(([url, handler]) => [url, route => {
    requested.push(route.request().url());
    return handler(route);
  }]);
  for (let index = 0; index < 2; index++) {
    await t.openPage({}, { gist: GIST_ID }, { routes });
    await t.messages(1);
    await t.page.waitForTimeout(5);
  }
  const rawUrls = requested.filter(url => url.startsWith('https://gist.githubusercontent.com/'));
  assert.equal(rawUrls.length, 6);
  // Every file loaded by a page has the same cache buster, which is new for
  // each page.
  const busters = rawUrls.map(url => new URL(url).searchParams.get('t'));
  assert.ok(busters.every(Boolean), rawUrls.join('\n'));
  assert.equal(new Set(busters.slice(0, 3)).size, 1);
  assert.equal(new Set(busters.slice(3)).size, 1);
  assert.notEqual(busters[0], busters[3]);
  // The list of files has a new callback each time.
  const listUrls = requested.filter(url => url.startsWith('https://gist.github.com/'));
  assert.equal(new Set(listUrls).size, 2);
});

test('data-gist-html, data-gist-css and data-gist-js choose the files', async t => {
  await t.openPage({}, { gist: 'cccc3333', gistJs: 'only.js' }, { routes: fakeGistRoutes(FAKE_GISTS) });
  assert.deepEqual(await t.messages(1), ['log: only.js']);
  // Not having a file for a language isn't a problem.
  assert.equal(await t.editorValue('css'), '/* The gist cccc3333 has no CSS file. */');
  assert.equal(await getLoadErrors(t), null);

  await t.openPage({}, { gist: GIST_ID, gistJs: 'other.js', gistHtml: 'index.html' }, { routes: fakeGistRoutes(FAKE_GISTS) });
  assert.deepEqual(await t.messages(1), ['log: other.js']);
  assert.equal(await t.editorValue('css'), FAKE_GISTS[GIST_ID]['style.css']);
});

test('a dialog explains what code could not be loaded', async t => {
  await t.openPage({ js: 'console.log("still runs")' }, { gist: GIST_ID, gistCss: 'missing.css', htmlUrl: 'fixtures/missing.html' }, { routes: fakeGistRoutes(FAKE_GISTS) });
  assert.deepEqual(await getLoadErrors(t), [
    'HTML The HTML could not be loaded (404 Not Found) from: fixtures/missing.html',
    `CSS The gist ${GIST_ID} doesn't have a file named missing.css.`,
  ]);
  assert.equal(await t.editorValue('css'), `/* The gist ${GIST_ID} doesn't have a file named missing.css. */`);
  // The rest of the code still runs.
  assert.deepEqual(await t.messages(1), ['log: still runs']);
  await t.click('#load-error-dialog .dialog-close');
  assert.equal(await getLoadErrors(t), null);

  await t.openPage({}, { gist: 'dddd4444' }, { routes: fakeGistRoutes(FAKE_GISTS) });
  const message = 'The gist dddd4444 could not be loaded. Check that it exists.';
  assert.deepEqual(await getLoadErrors(t), [`HTML ${message}`, `CSS ${message}`, `JavaScript ${message}`]);
  assert.equal(await t.editorValue('js'), '// The gist dddd4444 could not be loaded.  Check that it exists.');

  await t.openPage({}, { gist: 'not a gist!' });
  assert.equal((await getLoadErrors(t)).length, 3);
  assert.equal(await t.editorValue('html'), '<!-- This is not the URL or ID of a gist:  not a gist! -->');
});

test('YourJSPage.create() loads code from a gist', async t => {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body><div id="target" style="height:500px"></div></body></html>', { routes: fakeGistRoutes(FAKE_GISTS) });
  await t.page.evaluate(id => {
    window.instance = YourJSPage.create({ target: '#target', gist: id, gistJs: 'missing.js', cssUrl: 'fixtures/style.css' });
    // The JavaScript that can't be loaded is replaced so it doesn't matter.
    instance.setCode({ js: 'console.log("replaced")' });
  }, GIST_ID);
  await t.useViewer('#target iframe');
  assert.deepEqual(await t.messages(1), ['log: replaced']);
  assert.equal(await t.editorValue('html'), FAKE_GISTS[GIST_ID]['index.html']);
  // A URL wins over a gist.
  assert.equal(await t.editorValue('css'), 'h1 { color: rgb(0, 128, 0); }\n');
  assert.equal(await getLoadErrors(t), null);
});

test('a script in the head only provides the API', async t => {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body></body></html>');
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('iframe').length), 0);
  assert.match(await t.page.evaluate(() => YourJSPage.version), /^\d+\.\d+\.\d+/);
});

test('waits to load until it is about to be scrolled into view', async t => {
  await t.open(`<!DOCTYPE html><html><body><div style="height:3000px"></div><script src="SRC"></script></body></html>`);
  await t.page.waitForTimeout(500);
  assert.equal(await t.page.evaluate(() => document.querySelector('iframe').srcdoc), '');
  await t.page.evaluate(() => document.querySelector('iframe').scrollIntoView());
  await t.useViewer();
});

test('data-loading="eager" loads right away', async t => {
  await t.open(`<!DOCTYPE html><html><body><div style="height:3000px"></div><script src="SRC" data-loading="eager"></script></body></html>`);
  await t.useViewer();
});

test('explains when the editor fails to load', async t => {
  await t.open(`<!DOCTYPE html><html><body><script src="SRC"></script></body></html>`, {
    routes: [['https://unpkg.com/**', route => route.abort()]],
  });
  await t.useViewer();
  assert.match(await t.inViewer(() => document.querySelector('#splash.failed .splash-error').innerText), /couldn.t load its code editor/);
});

test('the viewer starts again if its IFRAME is moved', async t => {
  await t.openPage(SIMPLE_CODE);
  await t.page.evaluate(() => {
    // Moving an IFRAME makes the browser load it again.
    const container = Object.assign(document.createElement('div'), { id: 'moved' });
    container.style.height = '600px';
    document.body.append(container);
    container.append(document.querySelector('iframe'));
  });
  await t.useViewer('#moved iframe');
  assert.equal(await (await t.result()).textContent('#title'), 'Hello world');
});

test('uses data-height and otherwise fills the container', async t => {
  await t.openPage(SIMPLE_CODE);
  assert.equal(await t.page.evaluate(() => document.querySelector('iframe').offsetHeight), 600);
  await t.openPage(SIMPLE_CODE, { height: '300' });
  assert.equal(await t.page.evaluate(() => document.querySelector('iframe').offsetHeight), 300);
});

// ---------------------------------------------------------------------------
// Running

test('runs the code in a sandbox', async t => {
  await t.openPage({ js: 'try { parent.document; console.log("not sandboxed"); } catch (e) { console.log("sandboxed"); }' });
  assert.deepEqual(await t.messages(1), ['log: sandboxed']);
});

test('runs the code that was edited with the Run button and the shortcut', async t => {
  await t.openPage(SIMPLE_CODE);
  assert.equal(await (await t.result()).textContent('#title'), 'Hello world');
  assert.equal(await t.inViewer(() => document.querySelector('#run-button').classList.contains('is-stale')), false);

  await t.setEditorValue('html', '<h1 id="title">Bye</h1>');
  // (It is shown once the typing stops.)
  await t.viewer.waitForSelector('#run-button.is-stale');
  // The code only runs when asked to.
  await t.page.waitForTimeout(300);
  assert.equal(await (await t.result()).textContent('#title'), 'Hello world');
  assert.equal(await (await t.run()).textContent('#title'), 'Bye world');
  assert.equal(await t.inViewer(() => document.querySelector('#run-button').classList.contains('is-stale')), false);

  await t.setEditorValue('js', 'document.getElementById("title").textContent += "!";');
  const oldFrame = await t.viewer.$('#result iframe');
  await t.click('.panel[data-lang="js"] .ace_content');
  await t.page.keyboard.press(RUN_KEYS);
  await t.viewer.waitForFunction(old => document.querySelector('#result iframe') !== old, oldFrame);
  assert.equal(await (await t.result()).textContent('#title'), 'Bye!');
  // The shortcut doesn't add a line.
  assert.equal(await t.editorValue('js'), 'document.getElementById("title").textContent += "!";');
});

test('the run shortcut also works in the result', async t => {
  await t.openPage({ html: '<input id="input">', js: 'console.log("ran")' });
  await t.messages(1);
  const oldFrame = await t.viewer.$('#result iframe');
  await (await t.result()).click('#input');
  await t.page.keyboard.press(RUN_KEYS);
  await t.viewer.waitForFunction(old => document.querySelector('#result iframe') !== old, oldFrame);
  assert.deepEqual(await t.messages(1), ['log: ran']);
});

test('the JavaScript runs before DOMContentLoaded like a script at the end of the body', async t => {
  await t.openPage({
    html: '<p>Hi</p>',
    js: 'console.log(document.readyState, document.querySelector("p").textContent, document.querySelectorAll("script").length === 1);'
      + 'document.addEventListener("DOMContentLoaded", () => console.log("loaded"));',
  });
  assert.deepEqual(await t.messages(2), ['log: loading Hi true', 'log: loaded']);
});

test('relative URLs are relative to the page and links to parts of the result work', async t => {
  await t.openPage({
    html: '<a id="link" href="#bottom">Down</a><div style="height:3000px"></div><p id="bottom">Bottom</p><img id="img" src="fixtures/logo.svg">',
    js: [
      'console.log(new URL("fixtures/style.css", document.baseURI).href.endsWith("/test/fixtures/style.css"));',
      'document.getElementById("link").click();',
      'setTimeout(() => console.log(scrollY > 1000, document.getElementById("bottom").textContent), 100);',
    ].join('\n'),
  });
  assert.deepEqual(await t.messages(2), ['log: true', 'log: true Bottom']);
});

test('code with "</script>" in it works', async t => {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body><div id="a" style="height:500px"></div></body></html>');
  await t.page.evaluate(() => YourJSPage.create({
    target: '#a',
    html: '<p>a</p><!-- unclosed? -->',
    css: 'p::after { content: "</style>"; }',
    js: 'console.log("</script><!--", getComputedStyle(document.querySelector("p"), "::after").content)',
  }));
  await t.useViewer('#a iframe');
  assert.deepEqual(await t.messages(1), ['log: </script><!-- "</style>"']);
});

// ---------------------------------------------------------------------------
// Console

test('shows what is logged in the console', async t => {
  await t.openPage({
    js: [
      'console.log("text", 1, -0, 2n, true, null, undefined, Symbol("s"), [1, "a", [2]], {a: 1, "b-c": {d: {e: {f: 1}}}});',
      'console.info("%s is %d years old%c", "Bob", 42.5, "color: red");',
      'console.warn("careful");',
      'console.error("bad");',
      'console.debug(function named() {}, class Foo {}, new Map([[1, "x"]]), new Set([1]));',
      'const o = {}; o.self = o; console.log(o);',
      'console.group("group"); console.log("inside"); console.groupEnd(); console.log("outside");',
      'console.assert(1 === 2, "math");',
      'console.count(); console.count();',
      'console.log(document.createElement("div"));',
    ].join('\n'),
  });
  await t.click('#console-button');
  assert.deepEqual(await t.messages(13), [
    'log: text 1 -0 2n true null undefined Symbol(s) [1, "a", [2]] {a: 1, "b-c": {d: {e: {…}}}}',
    'info: Bob is 42 years old',
    'warn: careful',
    'error: bad',
    'debug: ƒ named() class Foo Map(1) {1 => "x"} Set(1) {1}',
    'log: {self: [Circular]}',
    'log: group',
    'log: inside',
    'log: outside',
    'error: Assertion failed: math',
    'log: default: 1',
    'log: default: 2',
    'log: <div></div>',
  ]);
  // Grouped messages are indented.
  assert.equal(await t.inViewer(() => document.querySelectorAll('.entry')[7].style.paddingLeft), '36px');
});

test('logged values can be expanded', async t => {
  await t.openPage({
    html: '<ul id="list"><li>One</li></ul>',
    js: [
      'class Point { constructor(x) { this.x = x; } get double() { throw new Error("getters aren\'t called"); } }',
      'console.log({a: {b: [1, "two"]}, [Symbol("s")]: true}, new Point(3), new Map([["k", {v: 1}]]), new Set(["x"]), document.getElementById("list"), "text", 5);',
    ].join('\n'),
  }, { showConsole: 'true' });
  await t.messages(1);
  // Only objects can be expanded.
  assert.equal(await t.inViewer(() => document.querySelectorAll('.entry > .entry-text > .expander').length), 5);

  /** Expands a value and gets the rows that it shows. */
  const expand = async selector => {
    await t.click(selector);
    await t.viewer.waitForFunction(s => document.querySelector(s).closest('.entry, .tree-children > div, .tree > div') && document.querySelectorAll('.tree-row').length, selector);
    await t.page.waitForTimeout(100);
  };
  const rows = () => t.inViewer(() => Array.from(document.querySelectorAll('.tree-row'), row => row.textContent));

  await expand('.entry-text > .expander:nth-child(1)');
  assert.deepEqual(await rows(), ['a: {b: [1, "two"]}', '[Symbol(s)]: true']);
  await expand('.tree-row .expander');
  assert.deepEqual(await rows(), ['a: {b: [1, "two"]}', 'b: [1, "two"]', '[Symbol(s)]: true']);
  // Collapsing hides the properties.
  await t.click('.entry-text > .expander:nth-child(1)');
  assert.equal(await t.inViewer(() => document.querySelector('.tree').hidden), true);

  await t.inViewer(() => document.querySelectorAll('.tree').forEach(tree => tree.remove()));
  for (const index of [2, 3, 4, 5]) await expand(`.entry-text > .expander:nth-of-type(${index})`);
  assert.deepEqual(await rows(), [
    // The class's prototype is shown.
    'x: 3', '[[Prototype]]: {}',
    '"k" => {v: 1}',
    '0: "x"',
    ': <li>',
  ]);
  // The getter (on the prototype) isn't called.
  await expand('.tree-row .expander');
  assert.ok((await rows()).includes('double: (…)'));
  assert.deepEqual(await t.messages(1), ['log: {a: {b: [1, "two"]}, [Symbol(s)]: true} Point {x: 3} Map(1) {"k" => {v: 1}} Set(1) {"x"} <ul id="list"><li>One</li></ul> text 5']);
});

test('console.table() shows a table', async t => {
  await t.openPage({ js: 'console.table([{name: "Ann", age: 31}, {name: "Bob", city: "Oslo"}, 5]); console.table({a: {x: 1}}, ["x", "y"]); console.table("not a table");' }, { showConsole: 'true' });
  await t.messages(3);
  assert.deepEqual(await t.inViewer(() => Array.from(document.querySelectorAll('.console-table'), table => Array.from(table.rows, row => Array.from(row.cells, cell => cell.textContent)))), [
    [['(index)', 'name', 'age', 'city', 'Value'], ['0', '"Ann"', '31', '', ''], ['1', '"Bob"', '', '"Oslo"', ''], ['2', '', '', '', '5']],
    [['(index)', 'x', 'y'], ['a', '1', '']],
  ]);
  assert.equal(await t.inViewer(() => document.querySelectorAll('.entry')[2].textContent), 'not a table');
});

test('shows uncaught errors with where they happened', async t => {
  await t.openPage({ js: 'console.log("first");\n\nnotDefined();' });
  await t.click('#console-button');
  assertMessages(await t.messages(2), ['log: first', new RegExp(`^error: Uncaught ${notDefined('notDefined').source.slice(1)}`)]);
  assert.equal(await t.inViewer(() => document.querySelector('.entry-location').textContent), 'script.js:3');
  await t.click('.entry-location');
  assert.deepEqual(await t.inViewer(() => {
    const editor = ace.edit(document.querySelector('.panel[data-lang="js"] .editor'));
    return [editor.getCursorPosition().row, editor.isFocused()];
  }), [2, true]);

  await t.setEditorValue('js', 'Promise.reject(new Error("nope"));');
  await t.run();
  assert.deepEqual(await t.messages(1), ['error: Uncaught (in promise) Error: nope']);
});

test('logged errors show their stack without YourJS Page lines', async t => {
  await t.openPage({ js: 'function f() { console.log(new TypeError("bad")); }\nf();' });
  const [message] = await t.messages(1);
  // Each browser shows stacks differently but none of them should have the
  // lines for the code that ran the JavaScript.
  const [first, ...lines] = message.split('\n');
  assert.equal(first, 'log: TypeError: bad');
  assert.equal(lines.length, 2, message);
  assert.match(lines[0], /\bf\b.*:1:\d+/);
  assert.match(lines[1], /:2:\d+/);
  assert.doesNotMatch(message, /yourjsPageRunJs|append/);
});

test('the console runs code in the result', async t => {
  await t.openPage({ js: 'var answer = 42;' });
  await t.click('#console-button');
  await t.viewer.fill('#console-input', 'answer + 1');
  await t.viewer.press('#console-input', 'Enter');
  await t.viewer.fill('#console-input', '"text"');
  await t.viewer.press('#console-input', 'Enter');
  await t.viewer.fill('#console-input', 'nope()');
  await t.viewer.press('#console-input', 'Enter');
  assertMessages(await t.messages(6), [
    'command: answer + 1',
    'result: 43',
    'command: "text"',
    'result: "text"',
    'command: nope()',
    new RegExp(`^error: Uncaught ${notDefined('nope').source.slice(1)}`),
  ]);
  // The up arrow brings back what was typed.
  await t.viewer.press('#console-input', 'ArrowUp');
  await t.viewer.press('#console-input', 'ArrowUp');
  assert.equal(await t.viewer.inputValue('#console-input'), '"text"');
});

test('the console badge counts messages while it is hidden', async t => {
  await t.openPage({ js: 'console.log(1); console.error(2);' });
  await t.viewer.waitForSelector('#console-badge:not([hidden])');
  assert.deepEqual(await t.inViewer(() => {
    const badge = document.querySelector('#console-badge');
    return [badge.textContent, badge.classList.contains('has-errors')];
  }), ['2', true]);
  await t.click('#console-button');
  assert.equal(await t.inViewer(() => document.querySelector('#console-badge').hidden), true);
});

test('the console is cleared when the code runs and by console.clear()', async t => {
  await t.openPage({ js: 'console.log("a");' }, { showConsole: 'true' });
  assert.deepEqual(await t.messages(1), ['log: a']);
  await t.run();
  await t.page.waitForTimeout(300);
  assert.deepEqual(await t.messages(1), ['log: a']);
  await t.setEditorValue('js', 'console.log("a"); setTimeout(() => { console.clear(); console.log("b"); }, 100);');
  await t.run();
  await t.viewer.waitForFunction(() => document.querySelector('#console-entries').textContent === 'b');
});

// ---------------------------------------------------------------------------
// Layout

test('the editors are on top unless the page is narrow', async t => {
  await t.openPage(SIMPLE_CODE);
  assert.ok((await t.appClasses()).includes('layout-top'));
  await t.openPage(SIMPLE_CODE, {}, { width: 500 });
  assert.ok((await t.appClasses()).includes('layout-tabs'));
  assert.equal(await t.inViewer(() => document.querySelector('#app').dataset.tab), 'result');
  await t.page.setViewportSize({ width: 1000, height: 800 });
  await t.viewer.waitForFunction(() => document.querySelector('#app').classList.contains('layout-top'));
});

test('data-layout and data-tab choose the layout and tab', async t => {
  for (const layout of ['left', 'right', 'tabs']) {
    await t.openPage(SIMPLE_CODE, { layout, tab: 'css' });
    assert.ok((await t.appClasses()).includes(`layout-${layout}`));
  }
  assert.equal(await t.inViewer(() => document.querySelector('.panel.is-active-tab').dataset.lang), 'css');
  assert.equal(await t.inViewer(() => document.querySelector('.panel[data-lang="css"] .editor').offsetHeight > 100), true);
  assert.equal(await t.inViewer(() => document.querySelector('#output').offsetHeight), 0);
  await t.click('#tabs [data-tab="result"]');
  assert.equal(await t.inViewer(() => document.querySelector('#output').offsetHeight > 100), true);
});

test('the view menu changes the layout', async t => {
  await t.openPage(SIMPLE_CODE);
  await t.click('#layout-button');
  assert.equal(await t.inViewer(() => document.querySelector('[data-layout="top"]').getAttribute('aria-checked')), 'true');
  await t.click('#layout-menu [data-layout="right"]');
  assert.ok((await t.appClasses()).includes('layout-right'));
  assert.equal(await t.inViewer(() => document.querySelector('#layout-menu').hidden), true);
  // The editors are on the right.
  assert.equal(await t.inViewer(() => document.querySelector('#editors').getBoundingClientRect().left > 500), true);
});

test('the tabs layout shows the result when the code is run', async t => {
  await t.openPage(SIMPLE_CODE, { layout: 'tabs', tab: 'js' });
  await t.run();
  assert.equal(await t.inViewer(() => document.querySelector('#app').dataset.tab), 'result');
});

test('editors can be collapsed', async t => {
  await t.openPage(SIMPLE_CODE);
  await t.click('.panel[data-lang="css"] .panel-title');
  assert.deepEqual(await t.inViewer(() => {
    const panel = document.querySelector('.panel[data-lang="css"]');
    return [panel.offsetWidth < 40, document.querySelector('.panel[data-lang="js"]').offsetWidth > 500];
  }), [true, true]);
  await t.click('.panel[data-lang="css"] .panel-title');
  assert.equal(await t.inViewer(() => document.querySelector('.panel[data-lang="css"]').offsetWidth > 300), true);
});

test('dividers resize the editors and the result', async t => {
  await t.openPage(SIMPLE_CODE);
  const getHeight = () => t.inViewer(() => document.querySelector('#editors').offsetHeight);
  const before = await getHeight();
  const box = await (await t.viewer.$('#main-divider')).boundingBox();
  await t.page.mouse.move(box.x + 100, box.y + 2);
  await t.page.mouse.down();
  await t.page.mouse.move(box.x + 100, box.y + 102, { steps: 5 });
  await t.page.mouse.up();
  assert.ok(Math.abs(await getHeight() - before - 100) <= 2);
});

// ---------------------------------------------------------------------------
// Toolbar

test('formats the code', async t => {
  await t.openPage({ html: '<div><p>hi</p></div>', css: 'a{color:red}', js: 'if(a){b()}' });
  for (const key of ['js', 'css', 'html']) {
    await t.click(`.panel[data-lang="${key}"] .format-button`);
  }
  await t.viewer.waitForFunction(() => ace.edit(document.querySelector('.panel[data-lang="html"] .editor')).getValue().includes('\n'));
  assert.equal(await t.editorValue('js'), 'if (a) {\n  b()\n}');
  assert.equal(await t.editorValue('css'), 'a {\n  color: red\n}');
  assert.equal(await t.editorValue('html'), '<div>\n  <p>hi</p>\n</div>');
});

test('reset puts back the original code', async t => {
  await t.openPage(SIMPLE_CODE);
  await t.setEditorValue('html', 'changed');
  await t.click('#more-button');
  await t.click('#reset-button');
  assert.equal(t.dialogs.length, 1);
  assert.equal(await t.editorValue('html'), SIMPLE_CODE.html);
  assert.equal(await (await t.result()).textContent('#title'), 'Hello world');
});

test('opens the result in a new tab', async t => {
  await t.openPage(SIMPLE_CODE, { title: 'My <Page>' });
  const [popup] = await Promise.all([t.page.waitForEvent('popup'), t.click('#open-button')]);
  await popup.waitForSelector('iframe');
  assert.equal(await popup.title(), 'My <Page>');
  assert.equal(await popup.evaluate(() => document.querySelector('iframe').getAttribute('sandbox').includes('allow-same-origin')), false);
  const frame = await (await popup.$('iframe')).contentFrame();
  await frame.waitForSelector('#title');
  await frame.waitForFunction(() => document.querySelector('#title').textContent === 'Hello world');
});

test('full screen falls back to filling the window', async t => {
  await t.openPage(SIMPLE_CODE);
  await t.inViewer(() => Object.defineProperty(document, 'fullscreenEnabled', { value: false }));
  await t.click('#fullscreen-button');
  assert.equal(await t.page.evaluate(() => document.querySelector('iframe').style.position), 'fixed');
  await t.viewer.press('#run-button', 'Escape');
  assert.equal(await t.page.evaluate(() => document.querySelector('iframe').style.position), '');
});

// ---------------------------------------------------------------------------
// Options

test('data-read-only stops the code from being edited', async t => {
  await t.openPage(SIMPLE_CODE, { readOnly: 'true' });
  assert.deepEqual(await t.inViewer(() => [
    ace.edit(document.querySelector('.panel[data-lang="js"] .editor')).getReadOnly(),
    document.querySelector('.format-button').hidden,
    document.querySelector('#reset-button').hidden,
  ]), [true, true, true]);
});

test('data-theme, data-title and data-word-wrap', async t => {
  await t.openPage(SIMPLE_CODE, { theme: 'dark', title: 'Demo', wordWrap: 'true' });
  assert.deepEqual(await t.inViewer(() => [
    document.documentElement.dataset.theme,
    document.querySelector('#title').textContent,
    ace.edit(document.querySelector('.panel[data-lang="js"] .editor')).session.getUseWrapMode(),
  ]), ['dark', 'Demo', true]);
  assert.equal(await (await t.result()).evaluate(() => document.title), 'Demo');
});

test('data-editors chooses the editors that are shown', async t => {
  await t.openPage({ html: '<p id="p">Hi</p>', css: 'p { color: rgb(1, 2, 3); }', js: 'console.log(getComputedStyle(document.getElementById("p")).color)' }, { editors: 'html js', tab: 'css' });
  assert.deepEqual(await t.inViewer(() => [
    Array.from(document.querySelectorAll('.panel'), panel => panel.dataset.lang),
    document.querySelectorAll('#editors > .divider').length,
    Array.from(document.querySelectorAll('#tabs [data-tab]'), tab => tab.dataset.tab),
  ]), [['html', 'js'], 1, ['html', 'js', 'result']]);
  // The CSS that isn't shown still runs and the hidden tab can't be chosen.
  assert.deepEqual(await t.messages(1), ['log: rgb(1, 2, 3)']);
  assert.equal(await t.inViewer(() => document.querySelector('#app').dataset.tab), 'result');
});

test('data-editors="" only shows the result', async t => {
  await t.openPage({ html: '<p id="p">Only the result</p>' }, { editors: '' });
  assert.deepEqual(await t.inViewer(() => [
    document.querySelector('#editors').offsetHeight,
    document.querySelector('#tabs').offsetHeight,
    document.querySelector('#layout-button').hidden,
    document.querySelector('#result').offsetHeight > 400,
  ]), [0, 0, true, true]);
  assert.equal(await (await t.result()).textContent('#p'), 'Only the result');
});

// ---------------------------------------------------------------------------
// Loop protection

test('stops loops that run for too long', async t => {
  await t.openPage({ js: 'let i = 0;\nwhile (true) i++;\nconsole.log("after", i > 0);' }, { loopTimeout: '300' });
  await t.click('#console-button');
  assert.deepEqual(await t.messages(2), [
    'warn: The loop on line 2 was stopped because the code ran for more than 0.3 seconds without a break.',
    'log: after true',
  ]);
  assert.equal(await t.inViewer(() => document.querySelector('.entry-location').textContent), 'script.js:2');
});

test('loop protection keeps the code working the same way', async t => {
  await t.openPage({
    js: [
      'const out = [];',
      'outer: for (let i = 0; i < 3; i++) for (let j = 0; ; j++) if (j > 1) continue outer; else out.push(`${i}${j}`);',
      'let n = 0; do n++; while (n < 3)',
      'for (const k in {a: 1, b: 2}) out.push(k);',
      'for (const v of [7, 8]) { if (v === 8) break; out.push(v); }',
      'while (n < 6) n += 1',
      'console.log(out.join(), n, "for while do");',
      // Loops that give the browser a break aren't stopped.
      '(async () => { for (let x = 0; x < 3; x++) await new Promise(r => setTimeout(r, 150)); console.log("async done"); })();',
    ].join('\n'),
  }, { loopTimeout: '200' });
  assert.deepEqual(await t.messages(2), ['log: 00,01,10,11,20,21,a,b,7 6 for while do', 'log: async done']);
});

test('code that can\'t be parsed still runs (to show its error)', async t => {
  await t.openPage({ js: 'for (let i = 0; i < 3; i++) {\nconsole.log(i);' });
  const [message] = await t.messages(1);
  assert.match(message, /^error: Uncaught SyntaxError/);
});

test('data-loop-timeout="0" turns off loop protection', async t => {
  await t.openPage({ js: 'for (let i = 0; i < 2; i++);\nconsole.log("ran")' }, { loopTimeout: '0' });
  assert.deepEqual(await t.messages(1), ['log: ran']);
  // Acorn is never loaded.
  assert.equal(await t.inViewer(() => 'acorn' in window), false);
});

test('time spent in alert(), confirm() and prompt() isn\'t counted against loops', async t => {
  await t.openPage({ js: 'let answers = 0;\nwhile (answers < 2) { if (confirm("Again?")) answers++; }\nconsole.log("answered", answers);' }, { loopTimeout: '300' });
  // The dialogs are answered slowly (more than the loop timeout).
  assert.deepEqual(await t.messages(1), ['log: answered 2']);
});

test('the console\'s code is protected too', async t => {
  await t.openPage({ js: '' }, { loopTimeout: '200', showConsole: 'true' });
  await t.viewer.fill('#console-input', 'let c = 0; while (true) c++; "done"');
  await t.viewer.press('#console-input', 'Enter');
  assert.deepEqual(await t.messages(3), [
    'command: let c = 0; while (true) c++; "done"',
    'warn: The loop on line 1 was stopped because the code ran for more than 0.2 seconds without a break.',
    'result: "done"',
  ]);
});

test('code that never finished isn\'t run again automatically', async t => {
  // A page whose code never finishes (here because of a library that never
  // loads) that is never left normally is like a page that froze.
  await t.openPage({ js: 'console.log("started");' }, { jsUrls: `${t.cdn}never.js` });
  await t.page.waitForTimeout(300);
  const url = t.page.url();
  t.page = await t.context.newPage();
  await t.page.goto(url, { waitUntil: 'domcontentloaded' });
  await t.useViewer();
  assert.equal(await t.inViewer(() => document.querySelector('#safe-mode-notice').hidden), false);
  assert.equal(await t.inViewer(() => document.querySelector('#result iframe')), null);

  await t.setEditorValue('js', 'console.log("fixed")');
  await t.click('#safe-mode-run-button');
  assert.equal(await t.inViewer(() => document.querySelector('#safe-mode-notice').hidden), true);
  await t.viewer.waitForSelector('#result iframe');
});

test('reloading a page right away doesn\'t stop its code from running', async t => {
  await t.openPage({ js: 'console.log("fine")' });
  await t.page.reload({ waitUntil: 'domcontentloaded' });
  await t.useViewer();
  assert.equal(await t.inViewer(() => document.querySelector('#safe-mode-notice').hidden), true);
  assert.deepEqual(await t.messages(1), ['log: fine']);
});

// ---------------------------------------------------------------------------
// Libraries

/** Answers the cdnjs API like cdnjs does. */
const FAKE_CDNJS_ROUTE = ['https://api.cdnjs.com/**', route => {
  const url = new URL(route.request().url());
  const json = body => route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
  if (url.pathname === '/libraries') {
    return json({ results: [
      { name: 'fakelib', version: '2.0.0', description: 'A <b>fake</b> library', filename: 'fakelib.min.js' },
      { name: 'nofile', version: '1.0.0', description: 'No default file' },
    ] });
  }
  if (url.pathname === '/libraries/fakelib') return json({ versions: ['1.0.0', '2.0.0', '10.0.0'] });
  const match = /^\/libraries\/fakelib\/([^/]+)$/.exec(url.pathname);
  if (match) {
    return json({
      files: ['fakelib.js', 'fakelib.min.js', 'fakelib.min.css', 'README.md'],
      sri: { 'fakelib.min.js': `sha512-js-${match[1]}`, 'fakelib.min.css': `sha512-css-${match[1]}` },
    });
  }
  route.fulfill({ status: 404, body: '' });
}];

test('data-css-urls and data-js-urls add libraries before the code', async t => {
  await t.openPage({
    html: '<p>Hi</p>',
    css: 'p { margin-left: 3px; }',
    js: 'console.log(window.libs.join(), getComputedStyle(document.querySelector("p")).color, getComputedStyle(document.querySelector("p")).marginLeft);',
  }, {
    cssUrls: `${t.cdn}lib.css`,
    jsUrls: `${t.cdn}a.js\n  ${t.cdn}b.js`,
  });
  // The libraries load in order before the code and the code's CSS wins.
  assert.deepEqual(await t.messages(1), ['log: a.js,b.js rgb(0, 0, 255) 3px']);
  assert.equal(await t.inViewer(() => document.querySelector('#libraries-badge').textContent), '3');
});

test('libraries that fail to load are shown in the console', async t => {
  await t.openPage({ js: '' }, { jsUrls: `${t.cdn}missing.js` });
  assert.deepEqual(await t.messages(1), [`error: Failed to load ${t.cdn}missing.js`]);
});

test('libraries can be added by URL, reordered and removed', async t => {
  await t.openPage({ js: 'console.log((window.libs || []).join() || "none")' }, {});
  await t.click('#libraries-button');
  for (const [url, type] of [[`${t.cdn}a.js`, 'js'], [`${t.cdn}b.js`, 'js'], [`${t.cdn}lib.css`, 'css']]) {
    await t.viewer.fill('#library-url-input', url);
    await t.click(`#library-url-form [data-type="${type}"]`);
  }
  const list = type => t.inViewer(k => Array.from(document.querySelectorAll(`#${k}-libraries li`), li => li.textContent), type);
  assert.deepEqual(await list('js'), [`${t.cdn}a.js`, `${t.cdn}b.js`]);
  assert.deepEqual(await list('css'), [`${t.cdn}lib.css`]);
  assert.equal(await t.inViewer(() => document.querySelector('#run-button').classList.contains('is-stale')), true);

  await t.click('#js-libraries li:nth-child(2) [title="Move up"]');
  assert.deepEqual(await list('js'), [`${t.cdn}b.js`, `${t.cdn}a.js`]);
  await t.click('#libraries-run-button');
  assert.equal(await t.inViewer(() => document.querySelector('#libraries-dialog').open), false);
  await t.viewer.waitForFunction(() => document.querySelector('#run-button:not(.is-stale)'));
  await t.click('#console-button');
  assert.deepEqual(await t.messages(1), ['log: b.js,a.js']);

  await t.click('#libraries-button');
  await t.click('#css-libraries li [title="Remove"]');
  assert.deepEqual(await list('css'), []);
});

test('libraries can be found on cdnjs', async t => {
  await t.openPage({ js: '' }, {}, { routes: [FAKE_CDNJS_ROUTE] });
  await t.click('#libraries-button');
  await t.viewer.fill('#library-search-input', 'fake');
  await t.viewer.waitForSelector('.library-result');
  // Libraries without a default file aren't listed and descriptions are text.
  assert.deepEqual(await t.inViewer(() => Array.from(document.querySelectorAll('.library-result'), result => [
    result.querySelector('.library-name').textContent,
    result.querySelector('.library-description').innerHTML,
  ])), [['fakelib', 'A &lt;b&gt;fake&lt;/b&gt; library']]);

  await t.click('.library-result-main .text-button');
  await t.viewer.waitForSelector('#js-libraries li');
  assert.equal(await t.inViewer(() => document.querySelector('#js-libraries li').textContent), 'fakelib@2.0.0/fakelib.min.js');

  // Another version's CSS file
  await t.click('.library-result [aria-expanded]');
  await t.viewer.waitForSelector('.library-file-list button');
  assert.deepEqual(await t.inViewer(() => Array.from(document.querySelector('.library-files select').options, o => o.value)), ['10.0.0', '2.0.0', '1.0.0']);
  assert.deepEqual(await t.inViewer(() => Array.from(document.querySelectorAll('.library-file-list button'), b => b.textContent)), ['fakelib.min.js', 'fakelib.min.css', 'fakelib.js']);
  await t.viewer.selectOption('.library-files select', '1.0.0');
  await t.viewer.waitForFunction(() => document.querySelector('.library-file-list button'));
  await t.click('.library-file-list button:nth-child(2)');
  await t.viewer.waitForSelector('#css-libraries li');

  // The integrity hashes are used in the result.
  await t.click('#libraries-run-button');
  await t.viewer.waitForFunction(() => document.querySelector('#run-button:not(.is-stale)'));
  assert.deepEqual(await t.inViewer(() => {
    const iframe = document.querySelector('#result iframe');
    const html = iframe.srcdoc || decodeURIComponent(iframe.src.replace(/^data:[^,]*,/, ''));
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [
      doc.querySelector('link').getAttribute('href'),
      doc.querySelector('link').integrity,
      doc.querySelector('link').crossOrigin,
      doc.querySelector('script[src]').getAttribute('src'),
      doc.querySelector('script[src]').integrity,
    ];
  }), [
    'https://cdnjs.cloudflare.com/ajax/libs/fakelib/1.0.0/fakelib.min.css',
    'sha512-css-1.0.0',
    'anonymous',
    'https://cdnjs.cloudflare.com/ajax/libs/fakelib/2.0.0/fakelib.min.js',
    'sha512-js-2.0.0',
  ]);
});

test('data-library-search="false" hides the search', async t => {
  await t.openPage({ js: '' }, { librarySearch: 'false' });
  await t.click('#libraries-button');
  assert.deepEqual(await t.inViewer(() => [
    document.querySelector('#library-search').offsetHeight,
    document.querySelector('#library-url-form').offsetHeight > 0,
  ]), [0, true]);
});

test('read-only pages only list their libraries', async t => {
  await t.openPage({ js: '' }, { readOnly: 'true', jsUrls: `${t.cdn}a.js` });
  await t.click('#libraries-button');
  assert.deepEqual(await t.inViewer(() => [
    document.querySelector('#library-search').offsetHeight,
    document.querySelector('#library-url-form').offsetHeight,
    document.querySelector('#js-libraries li').textContent,
    document.querySelector('#js-libraries li button').offsetHeight,
  ]), [0, 0, `${t.cdn}a.js`, 0]);
});

/**
 * Opens a page made with YourJSPage.create() (which, unlike a <template>, can
 * start with a whole document).
 */
async function openApiPage(t, options) {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body style="margin:0"><div id="target" style="height:600px"></div></body></html>');
  await t.page.evaluate(o => { window.instance = YourJSPage.create({ target: '#target', ...o }); }, options);
  await t.useViewer('#target iframe');
}

/** A whole document for the HTML editor (written the way it is serialized). */
const FULL_DOCUMENT = (cdn) => [
  '<!DOCTYPE html>',
  '<html class="themed" lang="fr"><head>',
  '<meta charset="utf-8">',
  '<title>Mine</title>',
  `<link rel="stylesheet" href="${cdn}own.css">`,
  '<style>p { margin-left: 5px; }</style>',
  '<script>window.order = ["head script"];</script>',
  '</head>',
  '<body data-x="1">',
  '<p>Hi</p>',
  '<script>window.order.push("body script");</script>',
  '</body></html>',
].join('\n');

test('the HTML can be a whole document', async t => {
  await openApiPage(t, {
    html: FULL_DOCUMENT(t.cdn),
    css: 'p { margin-left: 3px; }',
    js: [
      'const p = document.querySelector("p");',
      'console.log(document.documentElement.className, document.body.dataset.x, document.title, window.libs.join(), order.join(), getComputedStyle(p).marginLeft);',
      'console.log(Array.from(document.head.children, e => e.localName + ((e.href || e.src) && e.localName !== "base" ? ":" + (e.href || e.src).split("/").pop() : "")).join());',
    ].join('\n'),
    cssUrls: [`${t.cdn}lib.css`],
    jsUrls: [`${t.cdn}a.js`],
    title: 'Not used',
  });
  // The libraries come before the head's stylesheets and scripts, the CSS
  // comes last in the head (so it wins) and the JavaScript runs last.
  assert.deepEqual(await t.messages(2), [
    'log: themed 1 Mine a.js head script,body script 3px',
    'log: meta,title,base,link:lib.css,script:a.js,link:own.css,style,script,style',
  ]);
});

test('a whole document can be downloaded and opened again', async t => {
  const html = FULL_DOCUMENT(t.cdn);
  await openApiPage(t, {
    html,
    css: 'p { margin-left: 3px; }',
    js: 'console.log(order.join())',
    cssUrls: [`${t.cdn}lib.css`],
    jsUrls: [`${t.cdn}a.js`],
  });
  assert.deepEqual(await t.messages(1), ['log: head script,body script']);
  for (const button of ['#download-html-button', '#download-zip-button']) {
    const file = await downloadFrom(t, button);
    await t.page.evaluate(() => instance.setCode({ html: '', css: '', js: '', cssUrls: [], jsUrls: [] }, { run: false }));
    await openFile(t, file.path);
    // The <style> and <script> elements that were in the HTML stay there.
    // The stylesheet at the start of the head can't be told apart from the
    // libraries so it becomes one (which works the same way).
    assert.deepEqual(await t.page.evaluate(() => instance.getCode()), {
      html: html.replace(`<link rel="stylesheet" href="${t.cdn}own.css">\n`, ''),
      css: 'p { margin-left: 3px; }',
      js: 'console.log(order.join())',
      cssUrls: [`${t.cdn}lib.css`, `${t.cdn}own.css`],
      jsUrls: [`${t.cdn}a.js`],
    }, button);
    assert.deepEqual(await t.messages(1), ['log: head script,body script']);
  }
});

// ---------------------------------------------------------------------------
// Saving and opening

/**
 * Makes a ZIP file (in Node) to open in a test.
 * @param {{[name: string]: string}} files
 * @param {boolean} deflate
 */
function makeZip(files, deflate) {
  const zlib = require('zlib');
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  const crc32 = buffer => {
    let crc = -1;
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  };
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(text);
    const stored = deflate ? zlib.deflateRawSync(data) : data;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034B50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    locals.push(local, nameBuffer, stored);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014B50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(deflate ? 8 : 0, 10);
    central.writeUInt32LE(crc32(data), 16);
    central.writeUInt32LE(stored.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuffer);
    offset += 30 + nameBuffer.length + stored.length;
  }
  const centralBuffer = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054B50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuffer, end]);
}

const SAVE_CODE = {
  html: '<h1 id="title">Saved</h1>\n<p>Text</p>',
  css: 'h1 { color: rgb(255, 0, 0); }\np::after { content: "</style>"; }',
  js: 'console.log("saved", "</script>");',
};

/**
 * Opens a page with SAVE_CODE in its editors.  (A <template> can't have
 * "</style>" in it so the code is put into the editors.)
 */
async function openSavePage(t, attributes) {
  await t.openPage({ html: '', css: '', js: '' }, attributes);
  for (const key of ['html', 'css', 'js']) await t.setEditorValue(key, SAVE_CODE[key]);
}

/**
 * Downloads a file using one of the items in the more menu.
 * @returns {Promise<{name: string, path: string}>}
 */
async function downloadFrom(t, buttonSelector) {
  await t.click('#more-button');
  const [downloadEvent] = await Promise.all([t.page.waitForEvent('download'), t.click(buttonSelector)]);
  return { name: downloadEvent.suggestedFilename(), path: await downloadEvent.path() };
}

/** Opens a file using "Open a file..." in the more menu. */
async function openFile(t, file) {
  await t.click('#more-button');
  const [chooser] = await Promise.all([t.page.waitForEvent('filechooser'), t.click('#open-file-button')]);
  const oldFrame = await t.viewer.$('#result iframe');
  await chooser.setFiles(file);
  await t.viewer.waitForFunction(old => document.querySelector('#result iframe') !== old, oldFrame);
}

test('downloads an HTML file that can be opened again', async t => {
  await openSavePage(t, { title: 'My Saved Page!', cssUrls: `${t.cdn}lib.css` });
  const file = await downloadFrom(t, '#download-html-button');
  assert.equal(file.name, 'my-saved-page.html');
  const html = fs.readFileSync(file.path, 'utf8');
  assert.match(html, /<title>My Saved Page!<\/title>/);
  assert.ok(html.includes(`<link rel="stylesheet" href="${t.cdn}lib.css">`), html);
  assert.match(html, /content: "<\\\/style>"/);
  assert.match(html, /console\.log\("saved", "<\\\/script>"\);/);

  // The file works on its own.
  // (Playwright saves downloads without their extension.)
  const htmlPath = path.join(require('os').tmpdir(), `yourjs-page-test-${Date.now()}.html`);
  fs.copyFileSync(file.path, htmlPath);
  const page = await t.context.newPage();
  const logs = [];
  page.on('console', message => logs.push(message.text()));
  try {
    await page.goto(`file://${htmlPath}`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('h1')).color), 'rgb(255, 0, 0)');
    assert.deepEqual(logs, ['saved </script>']);
  }
  finally {
    await page.close();
    fs.unlinkSync(htmlPath);
  }

  // Opening it puts back the same code.
  await t.setEditorValue('html', 'changed');
  await openFile(t, file.path);
  assert.equal(await t.editorValue('html'), SAVE_CODE.html);
  assert.equal(await t.editorValue('css'), SAVE_CODE.css.replace('</style', '<\\/style'));
  assert.equal(await t.editorValue('js'), SAVE_CODE.js.replace('</script', '<\\/script'));
  assert.equal(await t.inViewer(() => document.querySelector('#css-libraries li').textContent), `${t.cdn}lib.css`);
});

test('downloads a ZIP file that can be opened again', async t => {
  await openSavePage(t, { jsUrls: `${t.cdn}a.js` });
  const file = await downloadFrom(t, '#download-zip-button');
  assert.equal(file.name, 'yourjs-page.zip');
  const unzipped = require('child_process').execFileSync('unzip', ['-l', file.path], { encoding: 'utf8' });
  for (const name of ['yourjs-page/index.html', 'yourjs-page/style.css', 'yourjs-page/script.js']) assert.ok(unzipped.includes(name), unzipped);
  assert.equal(require('child_process').execFileSync('unzip', ['-p', file.path, 'yourjs-page/script.js'], { encoding: 'utf8' }), SAVE_CODE.js);

  await t.setEditorValue('css', 'changed');
  await openFile(t, file.path);
  assert.equal(await t.editorValue('html'), SAVE_CODE.html);
  assert.equal(await t.editorValue('css'), SAVE_CODE.css);
  assert.equal(await t.editorValue('js'), SAVE_CODE.js);
  assert.equal(await t.inViewer(() => document.querySelector('#js-libraries li').textContent), `${t.cdn}a.js`);
});

test('opens a compressed ZIP file like the ones CodePen exports', async t => {
  await t.openPage({ js: '' });
  const zipPath = path.join(require('os').tmpdir(), `yourjs-page-test-${Date.now()}.zip`);
  fs.writeFileSync(zipPath, makeZip({
    'my-pen/README.markdown': '# My Pen',
    'my-pen/src/index.html': '<p id="p">From CodePen</p>',
    'my-pen/src/style.css': 'p { color: rgb(0, 128, 0); }',
    'my-pen/src/script.js': 'console.log("from codepen")',
    '__MACOSX/my-pen/._index.html': 'junk',
  }, true));
  try {
    await openFile(t, zipPath);
  }
  finally {
    fs.unlinkSync(zipPath);
  }
  assert.equal(await t.editorValue('html'), '<p id="p">From CodePen</p>');
  assert.equal(await t.editorValue('css'), 'p { color: rgb(0, 128, 0); }');
  assert.deepEqual(await t.messages(1), ['log: from codepen']);
});

test('opening a file is not offered on read-only pages', async t => {
  await t.openPage(SIMPLE_CODE, { readOnly: 'true' });
  assert.equal(await t.inViewer(() => document.querySelector('#open-file-button').hidden), true);
});

// ---------------------------------------------------------------------------
// JavaScript API

test('YourJSPage.create() makes a page that can be controlled', async t => {
  await t.open(`<!DOCTYPE html><html><head><script src="SRC"></script></head><body>
    <div id="target" style="height:500px"><p>Replaced</p></div>
    <pre id="css-code">p { margin: 0; }</pre>
  </body></html>`);
  await t.page.evaluate(() => {
    window.instance = YourJSPage.create({
      target: '#target',
      html: '<p id="p">from html</p>',
      cssSelector: '#css-code',
      js: 'console.log("ran")',
      layout: 'left',
    });
  });
  assert.equal(await t.page.evaluate(() => document.querySelector('#target').children.length), 1);
  await t.useViewer('#target iframe');
  assert.ok((await t.appClasses()).includes('layout-left'));
  assert.deepEqual(await t.page.evaluate(() => instance.getCode()), {
    html: '<p id="p">from html</p>',
    css: 'p { margin: 0; }',
    js: 'console.log("ran")',
    cssUrls: [],
    jsUrls: [],
  });

  await t.page.evaluate(() => instance.setCode({ js: 'console.log("changed")' }));
  assert.equal(await t.editorValue('js'), 'console.log("changed")');
  assert.deepEqual(await t.messages(1), ['log: changed']);

  await t.page.evaluate(() => instance.setCode({ html: 'not run' }, { run: false }));
  assert.equal(await t.inViewer(() => document.querySelector('#run-button').classList.contains('is-stale')), true);
  await t.page.evaluate(() => instance.run());
  await t.viewer.waitForFunction(() => document.querySelector('#run-button:not(.is-stale)'));

  await t.page.evaluate(() => instance.destroy());
  assert.equal(await t.page.evaluate(() => document.querySelectorAll('iframe').length), 0);
  assert.equal(await t.page.evaluate(() => instance.getCode().html), 'not run');
});

test('setCode() before the page is parsed wins over the starting code', async t => {
  await t.open(`<!DOCTYPE html><html><head><script src="SRC"></script></head><body>
    <div id="target" style="height:500px"></div>
    <script>
      window.instance = YourJSPage.create({ target: '#target', htmlSelector: '#html', cssUrls: ['a.css'] });
      instance.setCode({ html: '<p>from setCode</p>', cssUrls: [] }, { run: false });
    </script>
    <template id="html"><p>from the selector</p></template>
  </body></html>`);
  await t.useViewer('#target iframe');
  assert.equal(await t.editorValue('html'), '<p>from setCode</p>');
  assert.deepEqual(await t.page.evaluate(() => instance.getCode().cssUrls), []);
});

test('code from URLs isn\'t loaded until the page is about to be shown', async t => {
  await t.open(`<!DOCTYPE html><html><body><div style="height:3000px"></div>
    <script src="SRC" data-js-url="fixtures/script.js"></script></body></html>`);
  const requested = () => t.page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/fixtures/script.js')));
  await t.page.waitForTimeout(500);
  assert.equal(await requested(), false);
  await t.page.evaluate(() => document.querySelector('iframe').scrollIntoView());
  await t.useViewer();
  assert.equal(await requested(), true);
});

test('YourJSPage.create() checks its options', async t => {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body><div id="a"></div></body></html>');
  const error = fn => t.page.evaluate(fn).then(() => null, e => e.message);
  assert.match(await error(() => YourJSPage.create({ target: '#nope' })), /no element matches the target "#nope"/);
  assert.match(await error(() => YourJSPage.create({ target: 1 })), /target must be an element or a CSS selector/);
  assert.match(await error(() => YourJSPage.create({ target: '#a', placement: 'x' })), /placement must be one of/);
});

test('YourJSPage.create() supports each placement', async t => {
  await t.open('<!DOCTYPE html><html><head><script src="SRC"></script></head><body><div id="parent"><div id="a">a</div></div></body></html>');
  const layout = await t.page.evaluate(() => {
    const target = document.getElementById('a');
    const results = {};
    for (const placement of ['append', 'prepend', 'before', 'after', 'fill']) {
      const page = YourJSPage.create({ target, placement, loading: 'lazy' });
      results[placement] = Array.from(page.element.parentNode.childNodes).indexOf(page.element) + ':' + page.element.parentNode.id;
      page.destroy();
    }
    return results;
  });
  assert.deepEqual(layout, { append: '1:a', prepend: '0:a', before: '0:parent', after: '1:parent', fill: '0:a' });
});

// ---------------------------------------------------------------------------

(async () => {
  const filters = process.argv.slice(2).map(f => f.toLowerCase());
  const tests = TESTS.filter(({ name }) => !filters.length || filters.some(f => name.toLowerCase().includes(f)));
  const server = await startServer();
  const browserName = (process.env.TEST_BROWSER || 'chrome').toLowerCase();
  const browser = browserName === 'webkit' ? await webkit.launch()
    : browserName === 'firefox' ? await firefox.launch()
    : await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  console.log(`Testing in ${browserName} ${browser.version()}\n`);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let failures = 0;
  for (const { name, fn } of tests) {
    const t = new TestContext(browser, baseUrl);
    const start = Date.now();
    try {
      await fn(t);
      console.log(`✓ ${name} (${Date.now() - start} ms)`);
    }
    catch (e) {
      failures++;
      console.log(`✗ ${name}\n    ${`${e.stack || e.message}`.replace(/\n/g, '\n    ')}`);
    }
    finally {
      await t.close();
    }
  }
  await browser.close();
  server.close();
  console.log(`\n${tests.length - failures} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
