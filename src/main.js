(() => {
  /**
   * The viewer IFRAME's CSS code.
   * @type {string}
   */
  const VIEWER_CSS = [[CSS_VIEWER_FILE_PLACEHOLDER]];
  /**
   * The viewer IFRAME's HTML code (what goes in its body).
   * @type {string}
   */
  const VIEWER_HTML = [[HTML_VIEWER_FILE_PLACEHOLDER]];
  /**
   * Information about this package (eg. its version).
   * @type {{name: string, version: string, homepage: string, repoUrl: string, bugsUrl: string}}
   */
  const PACKAGE_INFO = [[PACKAGE_INFO_FILE_PLACEHOLDER]];

  /**
   * The code that runs in the viewer IFRAME.  It is turned into a string so
   * it can't use anything defined outside of it.
   */
  function viewerScript() {
    [[JS_VIEWER_FILE_PLACEHOLDER]]
  }

  /**
   * The code that runs in the result IFRAME before the user's code (eg. to
   * show what is logged in the viewer's console).  It is turned into a string
   * so it can't use anything defined outside of it.
   * @param {{runId: string}} config
   */
  function previewRuntime(config) {
    [[JS_PREVIEW_RUNTIME_FILE_PLACEHOLDER]]
  }

  /**
   * The libraries that the viewer loads along with the exact versions that it
   * was tested with.
   */
  const LIBRARY_VERSIONS = {
    'ace-builds': '1.44.0',
    // Only loaded the first time code is formatted.
    'js-beautify': '2.0.3',
    // Only loaded the first time JavaScript with a loop runs (to stop loops
    // that run for too long).
    'acorn': '8.18.0',
  };

  /**
   * Where the libraries are loaded from unless data-libraries-url is given.
   * `{name}` and `{version}` are replaced with each library's name and version.
   */
  const DEFAULT_LIBRARIES_URL = 'https://unpkg.com/{name}@{version}/';

  /**
   * @param {string} librariesUrl
   *   The URL template (see DEFAULT_LIBRARIES_URL).  Relative URLs are relative
   *   to the page.
   * @param {keyof LIBRARY_VERSIONS} name
   * @param {string} path
   *   The path of the file within the library's package.
   * @returns {string}
   */
  function getLibraryFileUrl(librariesUrl, name, path) {
    const baseUrl = librariesUrl
      .replace(/\{(name|version)\}/g, (_, key) => key === 'name' ? name : LIBRARY_VERSIONS[name])
      .replace(/\/?$/, '/');
    return new URL(baseUrl + path, document.baseURI).href;
  }

  /**
   * The languages that a page has code for.
   */
  const LANGUAGES = [
    // The text (eg. a URL) can't end the comment early.
    {key: 'html', name: 'HTML', toComment: text => `<!-- ${text.replace(/--(!?)>/g, '--$1 >')} -->`},
    {key: 'css', name: 'CSS', toComment: text => `/* ${text.replace(/\*\//g, '* /')} */`},
    {key: 'js', name: 'JavaScript', toComment: text => `// ${text.replace(/[\r\n]+/g, ' ')}`},
  ];

  /** How long to wait for code from a URL or a gist (in milliseconds). */
  const LOAD_TIMEOUT = 30000;
  /** How long to wait for the list of a gist's files (in milliseconds). */
  const GIST_LIST_TIMEOUT = 15000;

  /**
   * Something that couldn't be loaded (which the viewer shows in a dialog).
   * @typedef {{key: string, language: string, message: string}} LoadError
   */

  /**
   * Gets the starting code for one language from (in this order) the code
   * itself, the first element that matches a selector, a URL or a file in a
   * gist.
   * @param {(typeof LANGUAGES)[number]} language
   * @param {{code?: *, selector?: *, url?: *, gist?: *, gistFile?: *}} sources
   * @param {LoadError[]} errors
   *   Where to add what couldn't be loaded.
   * @param {string=} missingMessage
   *   If given and there is nothing to get the code from, the code is a
   *   comment with this message.
   * @returns {string|(() => Promise<string>)}
   *   The code or, if it needs to be loaded (from a URL or a gist), a function
   *   that loads it (which is called once the page is about to be shown).
   */
  function getStartingCode(language, {code, selector, url, gist, gistFile}, errors, missingMessage) {
    if (code != null) return `${code}`;
    if (selector != null) return getCodeFromSelector(language, `${selector}`);
    // What couldn't be loaded is also shown in the editor (as a comment).
    const fail = message => {
      errors.push({key: language.key, language: language.name, message});
      return language.toComment(message);
    };
    if (url != null) return () => getCodeFromUrl(language, `${url}`, fail);
    if (gist != null) return () => getCodeFromGist(language, `${gist}`, gistFile == null ? null : `${gistFile}`, fail);
    return missingMessage ? language.toComment(missingMessage) : '';
  }

  /**
   * Gets the code for one language from the first element that matches a
   * selector.  If there isn't one a comment in that language says so.
   * @param {(typeof LANGUAGES)[number]} language
   * @param {string} selector
   * @returns {string}
   */
  function getCodeFromSelector(language, selector) {
    let element;
    try {
      element = document.querySelector(selector);
    }
    catch (e) {
      return language.toComment(`The ${language.name} selector is not valid:  ${selector}`);
    }
    if (!element) return language.toComment(`No element matches the ${language.name} selector:  ${selector}`);
    // The text of a <template> is in its content.  Its HTML is used as is so
    // that the HTML doesn't need to be escaped.
    if (element.localName === 'template') {
      return language.key === 'html' ? element.innerHTML : element.content.textContent;
    }
    return element.textContent;
  }

  /**
   * Loads the code for one language from a URL (relative to the page).
   * @param {(typeof LANGUAGES)[number]} language
   * @param {string} url
   * @param {(message: string) => string} fail
   *   Called (and its result returned) if the code can't be loaded.
   * @returns {Promise<string>}
   */
  async function getCodeFromUrl(language, url, fail) {
    let response;
    try {
      response = await fetch(new URL(url, document.baseURI), {signal: AbortSignal.timeout(LOAD_TIMEOUT)});
    }
    catch (e) {
      // Eg. the URL isn't valid, there's no connection, it took too long or
      // (for a URL on another site) the site doesn't allow it.
      return fail(`The ${language.name} could not be loaded from:  ${url}`);
    }
    if (!response.ok) {
      return fail(`The ${language.name} could not be loaded (${getStatusText(response)}) from:  ${url}`);
    }
    try {
      return await response.text();
    }
    catch (e) {
      return fail(`The ${language.name} could not be loaded from:  ${url}`);
    }
  }

  /**
   * @param {Response} response
   * @returns {string}
   *   Eg. "404 Not Found".
   */
  function getStatusText(response) {
    return `${response.status} ${response.statusText}`.trim();
  }

  /**
   * The files that are used for each language when a gist's file isn't named
   * (the first pattern that matches one of the gist's files wins).
   */
  const GIST_FILE_PATTERNS = {
    html: [/^index\.html?$/i, /\.html?$/i],
    css: [/^styles?\.css$/i, /\.css$/i],
    js: [/^(script|index|main|app)\.m?js$/i, /\.m?js$/i],
  };

  /**
   * Added to the URLs of gists' files so that GitHub's cache (which keeps
   * them for 5 minutes) is skipped and edits show up right away.  The same
   * value is used for every file loaded while the page is open.  (The list of
   * a gist's files doesn't need it since its URL has a new callback name each
   * time.)
   */
  const GIST_CACHE_BUSTER = `${Date.now()}`;

  /**
   * Gets the ID of a gist from its URL (eg.
   * "https://gist.github.com/westc/2fe0bfa42237139860f32972ddc608f1") or ID.
   * @param {string} gist
   * @returns {string?}
   */
  function getGistId(gist) {
    const match = /^\s*(?:https?:\/\/gist\.github(?:usercontent)?\.com\/(?:[^/?#]+\/)?)?([\da-f]+)(?:[/?#.][^]*)?\s*$/i.exec(gist);
    return match?.[1] ?? null;
  }

  /**
   * The names of the files in each gist (by ID) so each gist's list is only
   * loaded once.
   * @type {Map<string, Promise<string[]>>}
   */
  const gistFileNames = new Map();

  /**
   * Gets the names of the files in a gist.  This uses the JSONP version of
   * the gist (like https://gist.github.com/westc/2fe0bfa42237139860f32972ddc608f1)
   * instead of GitHub's API which only allows 60 requests an hour.
   * @param {string} id
   * @returns {Promise<string[]>}
   */
  function getGistFileNames(id) {
    if (!gistFileNames.has(id)) {
      const promise = new Promise((resolve, reject) => {
        const callbackName = `yourjsPageGist_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement('script');
        // The callback is never called if GitHub sends something unexpected.
        const timer = setTimeout(() => {
          cleanUp();
          reject(new Error(`The gist ${id} took too long to load.`));
        }, GIST_LIST_TIMEOUT);
        const cleanUp = () => {
          clearTimeout(timer);
          // Keeps a late response from causing an error.
          window[callbackName] = () => {};
          script.remove();
        };
        window[callbackName] = data => {
          cleanUp();
          if (Array.isArray(data?.files)) resolve(data.files.map(name => `${name}`));
          else reject(new Error(`The gist ${id} could not be read.`));
        };
        script.onerror = () => {
          cleanUp();
          reject(new Error(`The gist ${id} could not be loaded.  Check that it exists.`));
        };
        script.src = `https://gist.github.com/${id}.json?callback=${callbackName}`;
        document.head.append(script);
      });
      // Lets it be tried again later.
      promise.catch(() => gistFileNames.delete(id));
      gistFileNames.set(id, promise);
    }
    return gistFileNames.get(id);
  }

  /**
   * Loads the code for one language from a file in a gist.
   * @param {(typeof LANGUAGES)[number]} language
   * @param {string} gist
   *   The gist's URL or ID.
   * @param {string?} fileName
   *   The file to use.  If not given, the gist's file for the language is
   *   found by its name (see GIST_FILE_PATTERNS).
   * @param {(message: string) => string} fail
   *   Called (and its result returned) if the code can't be loaded.
   * @returns {Promise<string>}
   */
  async function getCodeFromGist(language, gist, fileName, fail) {
    const id = getGistId(gist);
    if (!id) return fail(`This is not the URL or ID of a gist:  ${gist}`);
    if (fileName == null) {
      let names;
      try {
        names = await getGistFileNames(id);
      }
      catch (e) {
        return fail(e.message);
      }
      fileName = GIST_FILE_PATTERNS[language.key]
        .map(pattern => names.find(name => pattern.test(name)))
        .find(Boolean);
      // A gist doesn't need a file for every language.
      if (!fileName) return language.toComment(`The gist ${id} has no ${language.name} file.`);
    }
    // The raw files can be loaded from any site and (unlike GitHub's API)
    // aren't limited to a number of requests an hour.  The browser's cache is
    // skipped too.
    let response;
    try {
      response = await fetch(
        `https://gist.githubusercontent.com/raw/${id}/${encodeURIComponent(fileName)}?t=${GIST_CACHE_BUSTER}`,
        {cache: 'no-store', signal: AbortSignal.timeout(LOAD_TIMEOUT)}
      );
    }
    catch (e) {
      return fail(`${fileName} could not be loaded from the gist ${id}.`);
    }
    if (response.status === 404) return fail(`The gist ${id} doesn't have a file named ${fileName}.`);
    if (!response.ok) return fail(`${fileName} could not be loaded (${getStatusText(response)}) from the gist ${id}.`);
    try {
      return await response.text();
    }
    catch (e) {
      return fail(`${fileName} could not be loaded from the gist ${id}.`);
    }
  }

  /**
   * Turns a list of URLs (an array or a string of URLs separated by
   * whitespace) into an array.
   * @param {*} value
   * @returns {string[]}
   */
  function toUrlList(value) {
    if (value == null) return [];
    return (Array.isArray(value) ? value.map(url => `${url}`) : `${value}`.split(/\s+/))
      .map(url => url.trim())
      .filter(Boolean);
  }

  /**
   * Prevents the HTML parser from ending an inline script early.  The code
   * must only have "</script" and "<!--" in strings.
   * @param {string} code
   * @returns {string}
   */
  function toInlineScript(code) {
    return code.replace(/<(?=\/script|!--)/gi, '\\x3C');
  }

  /**
   * Calls the function once the page has been parsed (so that elements after
   * the script can be found).
   * @param {() => void} callback
   */
  function whenParsed(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, {once: true});
    }
    else {
      callback();
    }
  }

  /** The settings that copies of a page keep (see "Embed" in the viewer). */
  const EMBED_SETTING_NAMES = ['layout', 'tab', 'menu', 'theme', 'title', 'height', 'editors', 'wordWrap', 'readOnly', 'showConsole', 'librarySearch', 'loopTimeout', 'loading'];

  /**
   * Where the number of pages made in this document is kept.  It is kept on
   * the window because each script tag runs its own copy of this code.
   */
  const PAGE_COUNT_KEY = Symbol.for('yourjs-page:page-count');

  /**
   * Creates a page.
   * @param {Object} options
   * @param {(errors: LoadError[]) => {[key in keyof import('./yourjs-page').YourJSPageCode]: import('./yourjs-page').YourJSPageCode[key] | (() => Promise<import('./yourjs-page').YourJSPageCode[key]>)}} options.getCode
   *   Gets the code that the page starts with (where each part may be a
   *   function that loads it from a URL or a gist) and adds what can't be
   *   loaded to `errors`.  It is called once the document has been parsed.
   * @param {{[name: string]: string}} options.dataset
   *   The options for the page in the same form as the data attributes of a
   *   script tag (eg. `{layout: 'left', theme: 'dark'}`).
   * @param {(element: HTMLIFrameElement) => void} options.insert
   *   Puts the page's element into the document.
   * @returns {import('./yourjs-page').YourJSPageInstance}
   */
  function createPage({getCode, dataset, insert}) {
    const pageIndex = window[PAGE_COUNT_KEY] = (window[PAGE_COUNT_KEY] ?? -1) + 1;
    const libraryUrl = getLibraryFileUrl.bind(null, dataset.librariesUrl || DEFAULT_LIBRARIES_URL);

    // The theme is determined up front so that the loading screen uses it.
    const theme = /^(light|dark)$/.test(dataset.theme) ? dataset.theme : null;
    const initialTheme = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const iframe = document.createElement('iframe');
    iframe.title = dataset.title || 'YourJS Page';
    // The result can go full screen and use the clipboard.
    iframe.setAttribute('allow', 'fullscreen; clipboard-read; clipboard-write');
    const height = dataset.height;
    Object.assign(iframe.style, {
      width: '100%',
      // Fills its container unless a height is given but, since a container
      // without a height would make it very short, it is never less than
      // 400px unless a height is given.
      height: height ? (/^\d+(\.\d+)?$/.test(height) ? `${height}px` : height) : '100%',
      minHeight: height ? '150px' : '400px',
      border: '0',
      display: 'block',
    });
    insert(iframe);

    /**
     * The code before the viewer is loaded (or after it is destroyed).  The
     * parts that are loaded from URLs are empty until they are loaded.
     * @type {import('./yourjs-page').YourJSPageCode}
     */
    let code = {html: '', css: '', js: '', cssUrls: [], jsUrls: []};
    /**
     * The parts of the code that were given to setCode() before the viewer
     * was loaded.  These win over parts that are still being loaded.
     */
    const changedKeys = new Set();
    /** @type {ReturnType<Window['yourjsPageViewer']['init']>?} */
    let viewer = null;
    let normalCssText = null;
    let isDestroyed = false;

    // What the viewer can ask this script to do.
    const hostApi = {
      /**
       * Makes the IFRAME fill the window (used if full screen isn't allowed).
       * @param {boolean} isMaximized
       */
      setMaximized(isMaximized) {
        const {style} = iframe;
        if (isMaximized) {
          normalCssText ??= style.cssText;
          Object.assign(style, {position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '2147483647'});
        }
        else if (normalCssText != null) {
          style.cssText = normalCssText;
          normalCssText = null;
        }
      },
    };

    /** @type {LoadError[]} */
    const loadErrors = [];
    /**
     * The functions that load the parts of the starting code that come from
     * a URL or a gist (by their keys).
     * @type {[string, () => Promise<string>][]}
     */
    const codeLoaders = [];
    let isCodeCollected = false;

    /**
     * Gets the starting code (once the document has been parsed).
     */
    function collectCode() {
      if (isCodeCollected) return;
      isCodeCollected = true;
      for (const [key, value] of Object.entries(getCode(loadErrors))) {
        // Code given to setCode() wins.
        if (changedKeys.has(key)) continue;
        // Code that doesn't need to be loaded is available right away.
        if ('function' === typeof value) codeLoaders.push([key, value]);
        else code[key] = value;
      }
    }
    whenParsed(collectCode);
    /** @type {Promise<void>?} */
    let codeLoaded = null;

    /**
     * Loads the parts of the starting code that come from a URL or a gist (once
     * the page is about to be shown).
     * @returns {Promise<void>}
     */
    function loadCode() {
      // (Some browsers (eg. Firefox) can say that the document was parsed
      // before it calls the DOMContentLoaded listeners.)
      collectCode();
      return codeLoaded ??= Promise.all(codeLoaders.map(async ([key, load]) => {
        const value = await load();
        if (!changedKeys.has(key)) code[key] = value;
      }));
    }

    /**
     * Loads the viewer once the document has been parsed.
     */
    function load() {
      whenParsed(() => {
        if (isDestroyed || iframe.srcdoc) return;
        loadCode();
        const runtimeCode = toInlineScript(`${previewRuntime}`);
        let startCount = 0;
        // The loading screen is shown until the code is loaded too.  The
        // viewer is started each time its page loads because the browser
        // reloads an IFRAME that is moved (eg. by a framework) and then it
        // starts with the last code that it was given.
        iframe.addEventListener('load', async () => {
          await loadCode();
          const viewerWindow = iframe.contentWindow;
          if (isDestroyed || !viewerWindow?.yourjsPageViewer) return;
          viewer = viewerWindow.yourjsPageViewer.init({
            code,
            // The viewer is starting again (eg. because its IFRAME moved).
            isRestart: startCount++ > 0,
            options: {
              layout: dataset.layout,
              tab: dataset.tab,
              theme,
              title: dataset.title || '',
              wordWrap: dataset.wordWrap === 'true',
              readOnly: dataset.readOnly === 'true',
              showConsole: dataset.showConsole === 'true',
              librarySearch: dataset.librarySearch !== 'false',
              // Where the menu (the toolbar) is:  at the bottom unless "top"
              // is given.
              menu: dataset.menu === 'top' ? 'top' : 'bottom',
              // How long loops can keep the page busy (0 turns this off).
              loopTimeout: /^\d+$/.test(dataset.loopTimeout ?? '') ? +dataset.loopTimeout : 2000,
              // Which editors are shown (all of them unless the attribute is
              // given).
              editors: dataset.editors == null
                ? null
                : dataset.editors.toLowerCase().split(/[\s,]+/).filter(key => LANGUAGES.some(language => language.key === key)),
            },
            // Code that was replaced with setCode() before it was loaded
            // doesn't matter.
            loadErrors: loadErrors
              .filter(error => !changedKeys.has(error.key))
              // In the same order as the editors (instead of the order they
              // failed in).
              .sort((a, b) => LANGUAGES.findIndex(({key}) => key === a.key) - LANGUAGES.findIndex(({key}) => key === b.key)),
            runtimeCode,
            parserUrl: libraryUrl('acorn', 'dist/acorn.js'),
            // For editors that are popped out into their own windows.
            aceUrl: libraryUrl('ace-builds', 'src-min-noconflict/ace.js'),
            // Used to know when the page's own code froze the last time.
            pageUrl: location.href.replace(/#.*/, ''),
            // Which page this is in the document (so that pages with the
            // same code are told apart).
            pageIndex,
            formatterUrls: [
              libraryUrl('js-beautify', 'js/lib/beautify.js'),
              libraryUrl('js-beautify', 'js/lib/beautify-css.js'),
              libraryUrl('js-beautify', 'js/lib/beautify-html.js'),
            ],
            packageInfo: PACKAGE_INFO,
            libraryVersions: LIBRARY_VERSIONS,
            // The settings for copies of this page (see "Embed" in the
            // viewer's About window) which get their code another way and
            // load the libraries from the CDN.
            embedSettings: Object.fromEntries(Object.entries(dataset).filter(([name]) => EMBED_SETTING_NAMES.includes(name))),
          }, hostApi);
        });

        iframe.srcdoc = [
          '<!DOCTYPE html>',
          `<html lang="en" data-theme="${initialTheme}">`,
          '<head>',
          '<meta charset="utf-8">',
          `<style id="viewer-style">${VIEWER_CSS}</style>`,
          '</head>',
          '<body>',
          VIEWER_HTML,
          // Exact versions are used so that a new release of a library can
          // never change how an existing version of this page works.  Ace
          // loads other files (eg. language modes) from next to this file.
          `<script src="${libraryUrl('ace-builds', 'src-min-noconflict/ace.js')}"><\/script>`,
          `<script>${toInlineScript(`(${viewerScript})();`)}<\/script>`,
          '</body>',
          '</html>',
        ].join('\n');
      });
    }

    // Unless data-loading="eager" is given, nothing is loaded until the page
    // is about to be scrolled into view (or a hidden page is shown).
    /** @type {IntersectionObserver?} */
    let loadObserver = null;
    if (dataset.loading !== 'eager' && 'function' === typeof window.IntersectionObserver) {
      loadObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadObserver.disconnect();
          loadObserver = null;
          load();
        }
      }, {rootMargin: '200px'});
      loadObserver.observe(iframe);
    }
    else {
      load();
    }

    const getCurrentCode = () => {
      const current = viewer?.getCode() ?? code;
      return {...current, cssUrls: [...current.cssUrls], jsUrls: [...current.jsUrls]};
    };

    return {
      element: iframe,
      getCode: getCurrentCode,
      setCode(newCode, options) {
        const current = getCurrentCode();
        newCode = Object(newCode);
        for (const {key} of LANGUAGES) {
          if (newCode[key] != null) current[key] = `${newCode[key]}`;
        }
        for (const key of ['cssUrls', 'jsUrls']) {
          if (newCode[key] != null) current[key] = toUrlList(newCode[key]);
        }
        for (const key of Object.keys(current)) {
          if (newCode[key] != null) changedKeys.add(key);
        }
        code = current;
        // Before the viewer is loaded there is nothing to run (the code runs
        // once it is loaded).
        viewer?.setCode(current, {run: options?.run !== false});
      },
      run() {
        viewer?.run();
      },
      destroy() {
        if (isDestroyed) return;
        isDestroyed = true;
        // Keeps the code for getCode().
        if (viewer) code = viewer.getCode();
        viewer?.destroy();
        viewer = null;
        loadObserver?.disconnect();
        iframe.remove();
      },
    };
  }

  /**
   * Creates a page in place of a script tag using its data attributes.
   * @param {HTMLScriptElement} script
   */
  function createPageFromScript(script) {
    const dataset = JSON.parse(JSON.stringify(script.dataset));
    return createPage({
      getCode: errors => ({
        ...Object.fromEntries(LANGUAGES.map(({key}, index) => [
          key,
          getStartingCode(
            LANGUAGES[index],
            {
              selector: dataset[`${key}Selector`],
              url: dataset[`${key}Url`],
              gist: dataset.gist,
              gistFile: dataset[`gist${key[0].toUpperCase()}${key.slice(1)}`],
            },
            errors,
            `No data-${key}-selector, data-${key}-url or data-gist attribute was given.`
          ),
        ])),
        cssUrls: toUrlList(dataset.cssUrls),
        jsUrls: toUrlList(dataset.jsUrls),
      }),
      dataset,
      insert: element => script.replaceWith(element),
    });
  }

  /**
   * Where YourJSPage.create() can put a page relative to its target.
   */
  const PLACEMENTS = {
    fill: (target, element) => target.replaceChildren(element),
    append: (target, element) => target.append(element),
    prepend: (target, element) => target.prepend(element),
    replace: (target, element) => target.replaceWith(element),
    before: (target, element) => target.before(element),
    after: (target, element) => target.after(element),
  };

  /**
   * The options of YourJSPage.create() which are the same as the data
   * attributes of a script tag.
   */
  const PAGE_OPTION_NAMES = ['editors', 'height', 'layout', 'librariesUrl', 'librarySearch', 'loading', 'loopTimeout', 'readOnly', 'showConsole', 'menu', 'tab', 'theme', 'title', 'wordWrap'];

  /**
   * The JavaScript API for creating pages (available as window.YourJSPage).
   */
  const YourJSPage = Object.freeze({
    version: PACKAGE_INFO.version,

    /**
     * Creates a page.  See yourjs-page.d.ts for the options.
     * @param {import('./yourjs-page').YourJSPageOptions} options
     * @returns {import('./yourjs-page').YourJSPageInstance}
     */
    create(options) {
      options = Object(options);
      const {target, placement = 'fill'} = options;
      const targetElement = 'string' === typeof target ? document.querySelector(target) : target;
      if (targetElement?.nodeType !== 1) {
        throw new TypeError(
          'string' === typeof target
            ? `YourJSPage.create(): no element matches the target ${JSON.stringify(target)}.`
            : 'YourJSPage.create(): target must be an element or a CSS selector.'
        );
      }
      if (!Object.hasOwn(PLACEMENTS, placement)) {
        throw new TypeError(`YourJSPage.create(): placement must be one of ${Object.keys(PLACEMENTS).join(', ')}.`);
      }

      const dataset = {};
      for (const name of PAGE_OPTION_NAMES) {
        if (options[name] != null) dataset[name] = `${options[name]}`;
      }

      return createPage({
        getCode: errors => ({
          ...Object.fromEntries(LANGUAGES.map(({key}, index) => [
            key,
            getStartingCode(LANGUAGES[index], {
              code: options[key],
              selector: options[`${key}Selector`],
              url: options[`${key}Url`],
              gist: options.gist,
              gistFile: options[`gist${key[0].toUpperCase()}${key.slice(1)}`],
            }, errors),
          ])),
          cssUrls: toUrlList(options.cssUrls),
          jsUrls: toUrlList(options.jsUrls),
        }),
        dataset,
        insert: element => PLACEMENTS[placement](targetElement, element),
      });
    },
  });

  // The first copy of this script that is loaded provides the API.
  if (!window.YourJSPage) window.YourJSPage = YourJSPage;

  // A script in the body is replaced by a page while a script in the head only
  // provides the API.
  const currentScript = document.currentScript;
  if (currentScript && !document.head?.contains(currentScript)) {
    createPageFromScript(currentScript);
  }
})();
