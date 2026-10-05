// Runs in the viewer IFRAME (see viewerScript() in main.js).  The page that
// created the IFRAME calls window.yourjsPageViewer.init() once it has loaded.

const LANGUAGE_KEYS = ['html', 'css', 'js'];
const LANGUAGE_NAMES = {html: 'HTML', css: 'CSS', js: 'JavaScript'};
const ACE_MODES = {html: 'ace/mode/html', css: 'ace/mode/css', js: 'ace/mode/javascript'};
const LAYOUTS = ['top', 'left', 'right', 'tabs'];
const TABS = [...LANGUAGE_KEYS, 'result'];
const CONSOLE_LEVELS = ['log', 'info', 'debug', 'warn', 'error', 'result', 'command'];

/** If the viewer is narrower than this the automatic layout is tabs. */
const NARROW_WIDTH = 600;
/** The smallest that dragging a divider can make something (in pixels). */
const MIN_PANE_SIZE = 30;
/**
 * How long the code needs to have been running without freezing the page (in
 * milliseconds) before it doesn't need to be run in safe mode the next time.
 */
const SAFE_MODE_DELAY = 1000;
/**
 * How long ago (in milliseconds) code that didn't finish needs to have started
 * to be treated as having frozen the page (instead of running in another tab).
 */
const SAFE_MODE_MIN_AGE = 3000;
/** The longest data URL that the result is loaded from (see createResultFrame()). */
const MAX_DATA_URL_LENGTH = 1900000;
/** Older console messages are removed once there are more than this. */
const MAX_CONSOLE_ENTRIES = 1000;

const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const RUN_SHORTCUT = IS_MAC ? 'Cmd+Enter' : 'Ctrl+Enter';
const FORMAT_SHORTCUT = 'Shift+Alt+F';

// Without allow-same-origin the result's code can't get to the viewer or to
// the page (eg. its cookies).
const RESULT_SANDBOX = 'allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-downloads allow-presentation';
const RESULT_ALLOW = 'fullscreen; clipboard-read; clipboard-write';

/** Where libraries are searched for. */
const CDNJS_API_URL = 'https://api.cdnjs.com/libraries';
/** Where the files of the libraries found on cdnjs are. */
const CDNJS_FILES_URL = 'https://cdnjs.cloudflare.com/ajax/libs/';
/** How long to wait after typing stops before searching (in milliseconds). */
const SEARCH_DELAY = 250;
/** The names of the files that each editor's code is saved as. */
const FILE_NAMES = {html: 'index.html', css: 'style.css', js: 'script.js'};
/** The files that can be loaded into each editor. */
const FILE_TYPES = {html: '.html,.htm,text/html', css: '.css,text/css', js: '.js,.mjs,text/javascript'};
/** The text sizes that the "..." menu goes through (as fractions of 100%). */
const TEXT_SCALES = [0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
/** Where the text size is remembered (for every page in this browser). */
const TEXT_SCALE_KEY = 'yourjs-page:text-scale';
/** The editors' font size (in pixels) at 100%. */
const EDITOR_FONT_SIZE = 13;
/** The shortest time (in milliseconds) that the loading screen is shown. */
const SPLASH_MIN_TIME = 1000;
/** The biggest file that can be opened (in bytes). */
const MAX_OPEN_FILE_SIZE = 20 * 1024 * 1024;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const escapeHtml = text => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
// Keeps "</style>" and "</script>" in the code from ending the element early.
const escapeStyle = css => css.replace(/<\/(?=style)/gi, '<\\/');
const escapeScript = js => js.replace(/<\/(?=script)/gi, '<\\/');

/**
 * Creates an element.
 * @param {string} tagName
 * @param {Object=} props
 *   Properties to set (eg. `className` and `textContent`).
 * @param {(Node|string)[]=} children
 * @returns {HTMLElement}
 */
function createElement(tagName, props, children) {
  const element = Object.assign(document.createElement(tagName), props);
  if (children) element.append(...children);
  return element;
}

/**
 * @param {string} url
 * @param {AbortSignal=} signal
 * @returns {Promise<any>}
 */
async function fetchJson(url, signal) {
  const response = await fetch(url, {signal});
  if (!response.ok) throw new Error(`${url} responded with ${response.status}.`);
  return response.json();
}

/**
 * Loads a script into the viewer.
 * @param {string} url
 * @returns {Promise<void>}
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${url}`));
    document.head.append(script);
  });
}

/** The kinds of loops that protectLoops() guards. */
const LOOP_TYPES = ['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement'];

/**
 * Adds a guard to the start of the body of every loop in the JavaScript which
 * stops the loop if it keeps the page busy for too long (see
 * __yourjsPageLoopGuard() in preview-runtime.js).  The guards are added to the
 * same lines so that the line numbers in errors don't change.  Needs Acorn.
 * @param {string} js
 * @returns {string}
 *   The code with the guards or, if it can't be parsed (eg. it has a syntax
 *   error which the browser will show when it runs), the code as it is.
 */
function protectLoops(js) {
  let ast;
  try {
    ast = acorn.parse(js, {ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true});
  }
  catch (e) {
    return js;
  }

  const insertions = [];
  (function visit(node, depth) {
    if (!node || 'string' !== typeof node.type) return;
    const isLoop = LOOP_TYPES.includes(node.type);
    if (isLoop) {
      const guard = `if (__yourjsPageLoopGuard(${node.loc.start.line})) break;`;
      const {body} = node;
      if (body.type === 'BlockStatement') {
        insertions.push({position: body.start + 1, text: guard, depth});
      }
      else {
        // A body that isn't a block (eg. "while (x) y();") becomes one.
        insertions.push({position: body.start, text: `{${guard}`, depth}, {position: body.end, text: '}', depth});
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(child => visit(child, depth + isLoop));
      else if (value && 'object' === typeof value) visit(value, depth + isLoop);
    }
  })(ast, 0);

  // From the end so the positions don't change.  Where an outer loop's body
  // starts at an inner loop (eg. "while (a) while (b) x;") the outer loop's
  // guard comes first.
  insertions.sort((a, b) => b.position - a.position || b.depth - a.depth);
  let result = js;
  for (const {position, text} of insertions) result = result.slice(0, position) + text + result.slice(position);
  return result;
}

/**
 * A short hash of some text (eg. to use in a storage key).
 * @param {string} text
 * @returns {string}
 */
function hashText(text) {
  let hash = 5381;
  for (let index = 0; index < text.length; index++) hash = (Math.imul(hash, 33) ^ text.charCodeAt(index)) >>> 0;
  return hash.toString(36);
}

/**
 * Starts downloading a file.
 * @param {Blob} blob
 * @param {string} fileName
 */
function download(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = createElement('a', {href: url, download: fileName});
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

//#region ZIP files
const CRC_TABLE = Array.from({length: 256}, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

/**
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

/**
 * Makes a ZIP file.  The files are stored without compression (they are
 * small text files).
 * @param {{name: string, text: string}[]} files
 * @returns {Blob}
 */
function createZip(files) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const {name, text} of files) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(text);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);
    local.setUint16(4, 20, true);
    // The names are UTF-8.
    local.setUint16(6, 0x0800, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    localParts.push(local, nameBytes, data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014B50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(12, dosTime, true);
    central.setUint16(14, dosDate, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint32(42, offset, true);
    centralParts.push(central, nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }
  const centralSize = centralParts.reduce((size, part) => size + part.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end], {type: 'application/zip'});
}

/** The biggest file in a ZIP file that is read (in bytes). */
const MAX_ZIP_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Reads the list of files in a ZIP file (that are stored or deflated).  A
 * file's contents are only read (and decompressed) when it is used.
 * @param {ArrayBuffer} buffer
 * @returns {Map<string, () => Promise<Uint8Array>>}
 *   A function that reads each file by its path.
 */
function readZip(buffer) {
  const view = new DataView(buffer);
  // The end of central directory record is at the end (before a comment).
  let end = -1;
  for (let index = buffer.byteLength - 22; index >= Math.max(0, buffer.byteLength - 22 - 0xFFFF); index--) {
    if (view.getUint32(index, true) === 0x06054B50) {
      end = index;
      break;
    }
  }
  if (end < 0) throw new Error('This is not a ZIP file.');

  const decoder = new TextDecoder();
  const files = new Map();
  let position = view.getUint32(end + 16, true);
  for (let count = view.getUint16(end + 10, true); count--;) {
    if (view.getUint32(position, true) !== 0x02014B50) throw new Error('The ZIP file is damaged.');
    const method = view.getUint16(position + 10, true);
    const compressedSize = view.getUint32(position + 20, true);
    const nameLength = view.getUint16(position + 28, true);
    const localOffset = view.getUint32(position + 42, true);
    const name = decoder.decode(new Uint8Array(buffer, position + 46, nameLength));
    position += 46 + nameLength + view.getUint16(position + 30, true) + view.getUint16(position + 32, true);

    // Skips folders and the extra files that macOS adds.
    if (name.endsWith('/') || /(^|\/)__MACOSX\//.test(name) || (method !== 0 && method !== 8)) continue;
    files.set(name, async () => {
      const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const data = new Uint8Array(buffer, dataStart, compressedSize);
      if (method === 0) return data;
      // Stops a small file that decompresses into a huge one (a "ZIP bomb").
      const chunks = [];
      let size = 0;
      const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      for (let result; !(result = await reader.read()).done;) {
        size += result.value.length;
        if (size > MAX_ZIP_FILE_SIZE) {
          reader.cancel();
          throw new Error(`${name} is too big.`);
        }
        chunks.push(result.value);
      }
      return new Uint8Array(await new Blob(chunks).arrayBuffer());
    });
  }
  return files;
}
//#endregion

/** The viewport that documents get if they don't have one. */
const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1';

/**
 * Turns a parsed document back into HTML.
 * @param {Document} doc
 * @returns {string}
 */
function serializeDocument(doc) {
  return Array.from(doc.childNodes, node => node.nodeType === Node.DOCUMENT_TYPE_NODE
    ? new XMLSerializer().serializeToString(node)
    : node.nodeType === Node.COMMENT_NODE ? `<!--${node.data}-->` : node.outerHTML
  ).join('\n');
}

/**
 * Whether a script runs JavaScript (instead of being eg. a template).
 * @param {Element} script
 * @returns {boolean}
 */
function isJavaScript(script) {
  const type = (script.getAttribute('type') ?? '').trim().toLowerCase();
  return !type || /^(module|(text|application)\/(java|ecma)script)$/.test(type);
}

/**
 * Gets the code (and libraries) from an HTML document such as one made by
 * "Download as an HTML file" (or a ZIP file's index.html).  These are found
 * where they are put by the viewer:
 * - The libraries are the stylesheets and scripts at the start of the head.
 * - The CSS is the last <style> (or local stylesheet) in the head.
 * - The JavaScript is the script at the end of the body.  Scripts from
 *   elsewhere right before it are libraries too.
 * Everything else (eg. the <style> elements and scripts that were in the
 * HTML) stays in the HTML.
 * @param {string} html
 * @param {(url: string) => string?} getLocalFile
 *   Gets the text of a file that the document refers to (eg. in the same ZIP
 *   file) or null if there isn't one.
 * @param {string} defaultTitle
 *   The title that the viewer gives documents that don't have one.
 * @returns {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[], integrities: Map<string, string>}}
 */
function parseHtmlDocument(html, getLocalFile, defaultTitle) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const {documentElement: root, head, body} = doc;
  const result = {html: '', css: '', js: '', cssUrls: [], jsUrls: [], integrities: new Map()};
  // The code in a <style> or <script> starts and ends with the new lines
  // that "Download as an HTML file" adds.
  const trimCode = code => code.replace(/^\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
  const isStylesheet = element => element.matches('link[rel~="stylesheet" i][href]');
  const isScriptFile = element => element.matches('script[src]') && isJavaScript(element);

  /**
   * Removes an element along with the new line (or other space) after it.
   * @param {Element} element
   */
  function remove(element) {
    const next = element.nextSibling;
    if (next?.nodeType === Node.TEXT_NODE && !next.data.trim()) next.remove();
    element.remove();
  }

  /**
   * Makes an element a library (if it isn't a file in the ZIP file).
   * @param {Element} element
   * @param {string[]} urls
   * @returns {boolean}
   */
  function addLibrary(element, urls) {
    const url = element.getAttribute(element.localName === 'link' ? 'href' : 'src');
    if (getLocalFile(url) != null) return false;
    urls.push(url);
    const integrity = element.getAttribute('integrity');
    if (integrity) result.integrities.set(url, integrity);
    remove(element);
    return true;
  }

  // The libraries at the start of the head (after things like <meta>).
  for (const element of Array.from(head.children)) {
    if (element.matches('meta, title, base')) continue;
    const urls = isStylesheet(element) ? result.cssUrls : isScriptFile(element) ? result.jsUrls : null;
    if (!urls || !addLibrary(element, urls)) break;
  }

  // The CSS
  const cssElement = Array.from(head.children).reverse()
    .find(element => element.localName === 'style' || (isStylesheet(element) && getLocalFile(element.getAttribute('href')) != null));
  if (cssElement) {
    result.css = cssElement.localName === 'style'
      ? trimCode(cssElement.textContent)
      : getLocalFile(cssElement.getAttribute('href'));
    remove(cssElement);
  }

  // The JavaScript and the libraries right before it
  const jsElement = body.lastElementChild;
  if (jsElement?.localName === 'script' && isJavaScript(jsElement)) {
    const code = jsElement.hasAttribute('src') ? getLocalFile(jsElement.getAttribute('src')) : trimCode(jsElement.textContent);
    if (code != null) {
      result.js = code;
      remove(jsElement);
      const jsUrls = [];
      while (body.lastElementChild && isScriptFile(body.lastElementChild) && addLibrary(body.lastElementChild, jsUrls));
      result.jsUrls.push(...jsUrls.reverse());
    }
  }

  // If all that is left is what the viewer adds to HTML that is only what
  // goes in the body, only what is in the body is kept.
  const isOnlyBody = Array.from(head.childNodes).every(node => node.nodeType === Node.TEXT_NODE
      ? !node.data.trim()
      : node.matches?.(`meta[charset="utf-8" i], meta[name="viewport" i][content="${DEFAULT_VIEWPORT}"]`)
        || (node.localName === 'title' && node.textContent === defaultTitle))
    && Array.from(root.attributes).every(({name, value}) => name === 'lang' && value === 'en')
    && !body.attributes.length;
  result.html = isOnlyBody
    ? body.innerHTML.replace(/^\r?\n/, '').trimEnd()
    : serializeDocument(doc).trimEnd();
  return result;
}

window.yourjsPageViewer = {
  /**
   * Starts the viewer.
   * @param {Object} config
   * @param {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[]}} config.code
   * @param {{layout?: string, tab?: string, theme: "light"|"dark"|null, title: string, wordWrap: boolean, readOnly: boolean, showConsole: boolean, librarySearch: boolean, editors: string[]?}} config.options
   * @param {{key: string, language: string, message: string}[]} config.loadErrors
   *   The code that couldn't be loaded (eg. from a URL or a gist).
   * @param {string} config.runtimeCode
   *   The code of previewRuntime() in main.js.
   * @param {string[]} config.formatterUrls
   *   The js-beautify files to load the first time code is formatted.
   * @param {{name: string, version: string, homepage: string}} config.packageInfo
   * @param {{setMaximized: (isMaximized: boolean) => void}} host
   *   What the viewer can ask the page to do.
   */
  init(config, host) {
    const {options, loadErrors, runtimeCode, formatterUrls, parserUrl, aceUrl, pageUrl, pageIndex, packageInfo, libraryVersions, embedSettings} = config;
    const app = $('#app');
    const splash = $('#splash');

    if (!window.ace) {
      splash.classList.add('failed');
      let code = {...config.code};
      return {
        getCode: () => ({...code}),
        setCode(newCode) {
          code = {...newCode};
        },
        run() {},
        destroy() {},
      };
    }

    const originalCode = {...config.code};
    const originalCodeJson = JSON.stringify(originalCode);
    // The URLs of the CSS and JavaScript libraries (in the order they are
    // added to the result).
    const libraries = {css: [...config.code.cssUrls], js: [...config.code.jsUrls]};
    /**
     * The integrity hashes of library URLs (eg. from cdnjs).
     * @type {Map<string, string>}
     */
    const integrities = new Map();
    const runButton = $('#run-button');
    const consoleButton = $('#console-button');
    const consoleBadge = $('#console-badge');
    const consoleEntries = $('#console-entries');
    const consoleInput = $('#console-input');
    const fullscreenButton = $('#fullscreen-button');

    let layout = 'top';
    let isLayoutAuto = !LAYOUTS.includes(options.layout);
    let activeTab = TABS.includes(options.tab) ? options.tab : 'result';
    const isToolbarBottom = options.menu !== 'top';
    app.classList.toggle('is-toolbar-bottom', isToolbarBottom);
    let isConsoleShown = false;
    let unseenCount = 0;
    let unseenErrorCount = 0;
    let isMaximized = false;
    let lastRunCode = '';
    /** Sent with messages to (and from) the result IFRAME. */
    let runId = '';
    /** @type {HTMLIFrameElement?} */
    let resultFrame = null;

    //#region Theme
    const darkQuery = matchMedia('(prefers-color-scheme: dark)');
    const getTheme = () => options.theme ?? (darkQuery.matches ? 'dark' : 'light');
    const getAceTheme = () => `ace/theme/cloud_editor${getTheme() === 'dark' ? '_dark' : ''}`;
    function applyTheme() {
      document.documentElement.dataset.theme = getTheme();
      for (const key of LANGUAGE_KEYS) editors[key]?.setTheme(getAceTheme());
      for (const popOut of popOuts.values()) {
        popOut.window.document.documentElement.dataset.theme = getTheme();
        popOut.editor?.setTheme(getAceTheme());
      }
    }
    // Without a theme the system's color scheme is followed.
    if (!options.theme) darkQuery.addEventListener('change', applyTheme);
    //#endregion

    //#region Text size
    /** The size of the text in the editors and the console (1 is 100%). */
    let textScale = (() => {
      try {
        const scale = +localStorage.getItem(TEXT_SCALE_KEY);
        return TEXT_SCALES.includes(scale) ? scale : 1;
      }
      catch (e) {
        return 1;
      }
    })();

    /**
     * Changes the size of the text in the editors and the console.
     * @param {number} scale
     */
    function setTextScale(scale) {
      textScale = scale;
      for (const key of LANGUAGE_KEYS) editors[key].setFontSize(EDITOR_FONT_SIZE * scale);
      for (const popOut of popOuts.values()) popOut.editor?.setFontSize(EDITOR_FONT_SIZE * scale);
      app.style.setProperty('--text-scale', `${scale}`);
      $('#text-reset-button').textContent = `${Math.round(scale * 100)}%`;
      $('#text-smaller-button').disabled = scale <= TEXT_SCALES[0];
      $('#text-bigger-button').disabled = scale >= TEXT_SCALES.at(-1);
      try {
        if (scale === 1) localStorage.removeItem(TEXT_SCALE_KEY);
        else localStorage.setItem(TEXT_SCALE_KEY, `${scale}`);
      }
      catch (e) {}
    }

    /**
     * Makes the text one size smaller or bigger.
     * @param {-1|1} offset
     */
    function changeTextScale(offset) {
      const index = TEXT_SCALES.indexOf(textScale) + offset;
      if (index >= 0 && index < TEXT_SCALES.length) setTextScale(TEXT_SCALES[index]);
    }
    //#endregion

    //#region Editors
    /** @type {{[key: string]: AceAjax.Editor}} */
    const editors = {};
    for (const key of LANGUAGE_KEYS) {
      const panel = $(`.panel[data-lang="${key}"]`);
      const editor = ace.edit($('.editor', panel), {
        mode: ACE_MODES[key],
        theme: getAceTheme(),
        fontSize: 13,
        tabSize: 2,
        useSoftTabs: true,
        showPrintMargin: false,
        wrap: options.wordWrap,
        readOnly: options.readOnly,
      });
      editor.setKeyboardHandler('ace/keyboard/vscode');
      editor.setFontSize(EDITOR_FONT_SIZE * textScale);
      // -1 puts the cursor at the start instead of selecting everything.
      editor.setValue(config.code[key], -1);
      // Keeps undo from removing the starting code.
      editor.session.getUndoManager().reset();
      if (options.readOnly) {
        editor.setHighlightActiveLine(false);
        editor.session.setUseWorker(false);
      }
      // The HTML is only part of a document so its warnings (eg. that there
      // isn't a doctype) don't apply, and Ace's CSS checker doesn't know about
      // newer CSS (eg. place-items).
      if (key !== 'js') editor.session.setUseWorker(false);
      editor.on('change', scheduleRunButtonUpdate);
      // Changes made here (eg. by Reset) are made in its window too.
      editor.session.on('change', delta => syncToPopOut(key, delta));
      // Ace only notices when the window is resized.
      new ResizeObserver(() => editor.resize()).observe(editor.container);
      editors[key] = editor;

      const title = $('.panel-title', panel);
      title.title = `Collapse or expand the ${LANGUAGE_NAMES[key]}`;
      title.addEventListener('click', () => {
        if (layout !== 'tabs') setCollapsed(key, !panel.classList.contains('is-collapsed'));
      });

      const menuButton = $('.panel-menu-button', panel);
      menuButton.title = `More for the ${LANGUAGE_NAMES[key]} (eg. format, copy or save it)`;
      menuButton.addEventListener('click', () => {
        if (openMenuInfo?.button === menuButton) closeMenu();
        else openPanelMenu(key, menuButton);
      });
    }

    /**
     * @param {string} key
     * @param {boolean} isCollapsed
     */
    function setCollapsed(key, isCollapsed) {
      const panel = $(`.panel[data-lang="${key}"]`);
      panel.classList.toggle('is-collapsed', isCollapsed);
      $('.panel-title', panel).setAttribute('aria-expanded', `${!isCollapsed}`);
      // When every editor is collapsed the editors only take up the room
      // needed for their titles.
      app.classList.toggle('are-editors-collapsed', $$('.panel').every(panel => panel.classList.contains('is-collapsed')));
    }

    // The editors that data-editors doesn't list start collapsed (but can
    // always be expanded).
    if (options.editors) {
      for (const key of LANGUAGE_KEYS) setCollapsed(key, !options.editors.includes(key));
    }

    /** @returns {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[]}} */
    function getCode() {
      return {
        ...Object.fromEntries(LANGUAGE_KEYS.map(key => [key, editors[key].getValue()])),
        cssUrls: [...libraries.css],
        jsUrls: [...libraries.js],
      };
    }

    /**
     * @param {{html?: string, css?: string, js?: string, cssUrls?: string[], jsUrls?: string[]}} code
     */
    function setCode(code) {
      for (const key of LANGUAGE_KEYS) {
        // Setting the document's value (instead of the session's) can be
        // undone.
        if (code[key] != null && editors[key].getValue() !== code[key]) {
          editors[key].session.doc.setValue(code[key]);
          editors[key].clearSelection();
        }
      }
      if (code.cssUrls) libraries.css = [...code.cssUrls];
      if (code.jsUrls) libraries.js = [...code.jsUrls];
      renderLibraries();
      updateRunButton();
    }

    let runButtonTimer = 0;
    /** Updates the run button soon (instead of after every key). */
    function scheduleRunButtonUpdate() {
      clearTimeout(runButtonTimer);
      runButtonTimer = setTimeout(updateRunButton, 150);
    }

    /** Shows whether the code has changed since it was run. */
    function updateRunButton() {
      clearTimeout(runButtonTimer);
      runButton.classList.toggle('is-stale', !!lastRunCode && JSON.stringify(getCode()) !== lastRunCode);
    }
    //#endregion

    //#region Formatting
    /** @type {Promise<void>?} */
    let formatterPromise = null;

    /** Loads js-beautify the first time it is needed. */
    function loadFormatter() {
      formatterPromise ??= formatterUrls.reduce(
        (promise, url) => promise.then(() => loadScript(url)),
        Promise.resolve()
      );
      // Lets it be tried again later.
      formatterPromise.catch(() => formatterPromise = null);
      return formatterPromise;
    }

    /**
     * Formats the code in one of the editors.
     * @param {string} key
     */
    async function format(key) {
      if (options.readOnly) return;
      try {
        await loadFormatter();
      }
      catch (e) {
        alert('The code formatter (js-beautify) could not be loaded.');
        return;
      }
      const editor = editors[key];
      const beautify = {html: window.html_beautify, css: window.css_beautify, js: window.js_beautify}[key];
      const code = editor.getValue();
      const formatted = beautify(code, {
        indent_size: editor.session.getTabSize(),
        preserve_newlines: true,
        max_preserve_newlines: 2,
        wrap_line_length: 0,
        end_with_newline: /\n$/.test(code),
      });
      if (formatted !== code) {
        const {row} = editor.getCursorPosition();
        editor.session.doc.setValue(formatted);
        editor.clearSelection();
        editor.gotoLine(Math.min(row + 1, editor.session.getLength()), 0, false);
      }
      editor.focus();
    }
    //#endregion

    //#region Running the code
    /**
     * Makes the document of the result (or of a download) by putting the
     * libraries, the CSS and the JavaScript into the HTML.  The HTML can be a
     * whole document (with <html>, <head> and <body>) or only what goes in the
     * body.  Like JSBin:
     * - The libraries go at the start of the head (before the stylesheets and
     *   scripts that are in the HTML).
     * - The CSS goes at the end of the head.
     * - The JavaScript goes at the end of the body.
     * @param {ReturnType<getCode>} code
     * @param {{runId?: string, fileNames?: {css: string, js: string}}=} buildOptions
     *   `runId` makes the document for the result (with the runtime that
     *   sends its messages with this ID).  Otherwise it is a document that
     *   works on its own and, if `fileNames` is given, the CSS and JavaScript
     *   are linked to these files instead of being in the document.
     * @returns {string}
     */
    function buildDocument(code, {runId, fileNames} = {}) {
      const isResult = runId != null;
      const doc = new DOMParser().parseFromString(code.html, 'text/html');
      const {documentElement: root, head, body} = doc;
      // Escaping "<" keeps something like "</script>" in the code from ending
      // the script early.
      const toJson = value => JSON.stringify(value).replace(/</g, '\\u003C');

      /**
       * @param {string} tagName
       * @param {{[name: string]: string}=} attributes
       * @param {string=} text
       */
      function create(tagName, attributes = {}, text) {
        const element = doc.createElement(tagName);
        for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
        if (text != null) element.textContent = text;
        return element;
      }

      // The attributes that make the browser check a library's integrity.
      const getIntegrityAttributes = url => integrities.has(url)
        ? {integrity: integrities.get(url), crossorigin: 'anonymous'}
        : {};

      // A whole document is used as it is except that it needs to say that it
      // is UTF-8 (which downloads are).  HTML that is only what goes in the
      // body also gets a viewport and a title.
      const isWholeDocument = /<(html|head|body)[\s>]/i.test(code.html);
      if (!head.querySelector('meta[charset]')) head.prepend(create('meta', {charset: 'utf-8'}), '\n');
      const headStart = [];
      if (!isWholeDocument) {
        headStart.push(create('meta', {name: 'viewport', content: DEFAULT_VIEWPORT}));
        const title = options.title || (isResult ? '' : 'YourJS Page');
        if (title) headStart.push(create('title', {}, title));
      }
      // Relative URLs in the HTML are relative to the page (like they would be
      // in a srcdoc document) unless the HTML has its own <base>.
      if (isResult && !head.querySelector('base[href]')) headStart.unshift(create('base', {href: document.baseURI}));
      // This runs first so that it can catch libraries that fail to load.
      if (isResult) headStart.push(create('script', {}, `(${runtimeCode})(${toJson({runId, loopTimeout: options.loopTimeout})});`));
      headStart.push(
        ...code.cssUrls.map(url => create('link', {rel: 'stylesheet', href: url, ...getIntegrityAttributes(url)})),
        ...code.jsUrls.map(url => create('script', {src: url, ...getIntegrityAttributes(url)})),
      );
      // Things like <meta charset> that are in the HTML stay first.
      const firstOther = Array.from(head.children).find(element => !element.matches('meta, title, base')) ?? null;
      // Each element that is added is followed by a new line (which
      // parseHtmlDocument() removes along with it).
      for (const element of headStart) {
        head.insertBefore(element, firstOther);
        head.insertBefore(doc.createTextNode('\n'), firstOther);
      }

      // HTML that is only what goes in the body is laid out neatly.
      if (!isWholeDocument) {
        root.insertBefore(doc.createTextNode('\n'), head);
        root.insertBefore(doc.createTextNode('\n'), body);
        root.append('\n');
        head.prepend('\n');
        body.prepend('\n');
        body.append('\n');
        if (!isResult && !root.hasAttribute('lang')) root.setAttribute('lang', 'en');
      }

      head.append(fileNames
        ? create('link', {rel: 'stylesheet', href: fileNames.css})
        : create('style', {}, isResult ? escapeStyle(code.css) : `\n${escapeStyle(code.css)}\n`), '\n');
      body.append(fileNames
        ? create('script', {src: fileNames.js})
        : create('script', {}, isResult ? `yourjsPageRunJs(${toJson(code.js)});` : `\n${escapeScript(code.js)}\n`), '\n');
      if (!doc.doctype) doc.insertBefore(doc.implementation.createDocumentType('html', '', ''), doc.firstChild);
      return `${serializeDocument(doc)}\n`;
    }

    /**
     * @param {string} html
     * @returns {HTMLIFrameElement}
     */
    function createResultFrame(html) {
      const frame = document.createElement('iframe');
      frame.title = 'Result';
      frame.setAttribute('sandbox', RESULT_SANDBOX);
      frame.setAttribute('allow', RESULT_ALLOW);
      // A data URL is used because Safari hides the details of errors (eg.
      // their messages) in srcdoc documents.  Documents that are too big for
      // a URL use srcdoc.
      const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
      if (url.length <= MAX_DATA_URL_LENGTH) frame.src = url;
      else frame.srcdoc = html;
      return frame;
    }

    /** @type {Promise<void>?} */
    let parserPromise = null;

    /**
     * Adds the loop guards to JavaScript (see protectLoops()) unless loop
     * protection is turned off.  Acorn is loaded the first time code with a
     * loop runs.
     * @param {string} js
     * @returns {Promise<string>}
     */
    async function getProtectedJs(js) {
      if (!(options.loopTimeout > 0) || !/\b(for|while|do)\b/.test(js)) return js;
      try {
        await (parserPromise ??= loadScript(parserUrl));
      }
      catch (e) {
        // Lets it be tried again later.
        parserPromise = null;
        addConsoleEntry({level: 'warn', parts: [{kind: 'string', text: 'Loops can\u2019t be stopped if they run for too long because the JavaScript parser (Acorn) couldn\u2019t be loaded.'}]});
        return js;
      }
      return protectLoops(js);
    }

    /**
     * Runs the code in a new result IFRAME.
     * @param {boolean} showResult
     *   If true and the tabs layout is being used the result is shown.
     */
    async function run(showResult) {
      const code = getCode();
      lastRunCode = JSON.stringify(code);
      updateRunButton();
      clearConsole();
      $('#safe-mode-notice').hidden = true;
      const thisRunId = runId = `${Date.now()}-${Math.random()}`;
      // The old result stops right away (eg. if it is stuck in a loop).
      resultFrame?.remove();
      resultFrame = null;
      if (showResult && layout === 'tabs') setTab('result');
      setRunningOriginalCode(lastRunCode === originalCodeJson);

      const js = await getProtectedJs(code.js);
      // Another run started while waiting.
      if (runId !== thisRunId) return;
      resultFrame = createResultFrame(buildDocument({...code, js}, {runId}));
      $('#result').append(resultFrame);
    }

    // Messages from the result IFRAME.
    addEventListener('message', event => {
      const data = event.data;
      if (!resultFrame || event.source !== resultFrame.contentWindow || data?.yourjsPage !== runId) return;
      if (data.type === 'log') addConsoleEntry(data);
      else if (data.type === 'clear') clearConsole();
      else if (data.type === 'run') run(true);
      else if (data.type === 'loaded') {
        // The code is only known to have finished once the page has been fine
        // for a moment.  (Leaving the page can make the result finish loading,
        // eg. in Firefox, but then this never happens.)
        const loadedRunId = runId;
        setTimeout(() => {
          if (runId === loadedRunId) setRunningOriginalCode(false);
        }, SAFE_MODE_DELAY);
      }
      else if (data.type === 'children') {
        pendingChildren.get(data.requestId)?.(Array.isArray(data.children) ? data.children : []);
        pendingChildren.delete(data.requestId);
      }
    });

    /** Opens the result in a new tab (still in a sandbox). */
    async function openInNewTab() {
      // The tab is opened right away so that it isn't blocked as a pop-up.
      const newWindow = open('', '_blank');
      if (!newWindow) return;
      const code = getCode();
      code.js = await getProtectedJs(code.js);
      const doc = newWindow.document;
      doc.open();
      doc.write([
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${escapeHtml(options.title || 'YourJS Page')}</title>`,
        '<style>html,body{height:100%;margin:0}iframe{border:0;display:block;height:100%;width:100%}</style>',
        '</head>',
        '<body></body>',
        '</html>',
      ].join(''));
      doc.close();
      doc.body.append(createResultFrame(buildDocument(code, {runId: ''})));
      // The result can't do anything to this page through the new tab.
      newWindow.opener = null;
    }
    //#endregion

    //#region Console
    /**
     * Adds a message to the console.
     * @param {{level: string, parts: {kind: string, text: string}[], depth?: number, location?: {line: number, column: number}}} data
     */
    function addConsoleEntry({level, parts, depth, location, table}) {
      if (!CONSOLE_LEVELS.includes(level) || !Array.isArray(parts)) return;
      const entry = document.createElement('div');
      entry.className = `entry level-${level}`;
      if (depth > 0) entry.style.paddingLeft = `${20 + Math.min(depth, 20) * 16}px`;

      // Where the properties of expanded values go.
      const trees = createElement('div', {className: 'entry-trees'});
      const text = createElement('div', {className: 'entry-text'});
      parts.forEach((part, index) => {
        if (index) text.append(' ');
        text.append(createValueElement(part, trees));
      });
      if (table) text.append(createTable(table));
      entry.append(text);

      // Where the error happened in the JavaScript (if it is shown).
      const line = Math.floor(location?.line);
      if (line > 0) {
        const column = Math.max(1, Math.floor(location.column) || 1);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'entry-location';
        button.textContent = `script.js:${line}`;
        button.title = 'Show this line in the JavaScript';
        button.addEventListener('click', () => goToJsLine(line, column));
        entry.append(button);
      }
      entry.append(trees);

      const isAtBottom = consoleEntries.scrollHeight - consoleEntries.scrollTop - consoleEntries.clientHeight < 4;
      consoleEntries.append(entry);
      while (consoleEntries.childElementCount > MAX_CONSOLE_ENTRIES) consoleEntries.firstElementChild.remove();
      if (isAtBottom) consoleEntries.scrollTop = consoleEntries.scrollHeight;

      if (!isConsoleShown && level !== 'command') {
        unseenCount++;
        if (level === 'error') unseenErrorCount++;
        updateConsoleBadge();
      }
    }

    /**
     * Shows a value in the console.  Values that can be expanded (eg. objects)
     * show their properties (from the result) when clicked.
     * @param {{kind?: string, text?: string, id?: number}} part
     * @param {HTMLElement} treeContainer
     *   Where the properties go.
     * @returns {HTMLElement}
     */
    function createValueElement(part, treeContainer) {
      const element = createElement('span', {textContent: `${part?.text ?? ''}`});
      if (/^\w+$/.test(part?.kind ?? '')) element.className = `kind-${part.kind}`;
      if (!Number.isInteger(part?.id)) return element;

      element.classList.add('expander');
      element.tabIndex = 0;
      element.setAttribute('role', 'button');
      element.setAttribute('aria-expanded', 'false');
      /** @type {HTMLElement?} */
      let tree = null;
      const toggle = async () => {
        const isExpanded = element.getAttribute('aria-expanded') !== 'true';
        element.setAttribute('aria-expanded', `${isExpanded}`);
        if (tree) {
          tree.hidden = !isExpanded;
          return;
        }
        tree = createElement('div', {className: 'tree'});
        treeContainer.append(tree);
        const children = await requestChildren(part.id);
        tree.replaceChildren(...children.map(child => {
          const childTree = createElement('div', {className: 'tree-children'});
          const row = createElement('div', {className: 'tree-row'}, [
            createElement('span', {className: 'tree-key', textContent: `${child?.key ?? ''}`}),
            `${child?.separator ?? ': '}`,
            createValueElement(child, childTree),
          ]);
          return createElement('div', {}, [row, childTree]);
        }));
        scrollIntoConsoleView(tree);
      };
      element.addEventListener('click', toggle);
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
      return element;
    }

    /**
     * Scrolls the console (but not the page) so that as much of an element as
     * possible can be seen.
     * @param {HTMLElement} element
     */
    function scrollIntoConsoleView(element) {
      const elementRect = element.getBoundingClientRect();
      const consoleRect = consoleEntries.getBoundingClientRect();
      const below = elementRect.bottom - consoleRect.bottom;
      // The whole element if it fits or else as much as fits under its value.
      if (below > 0) consoleEntries.scrollTop += Math.min(below, elementRect.top - consoleRect.top - 24);
    }

    /** The requests for the properties of values (by their IDs). */
    const pendingChildren = new Map();
    let nextRequestId = 1;

    /**
     * Gets the properties of a logged value from the result.
     * @param {number} id
     * @returns {Promise<any[]>}
     */
    function requestChildren(id) {
      return new Promise(resolve => {
        const requestId = nextRequestId++;
        pendingChildren.set(requestId, resolve);
        resultFrame?.contentWindow.postMessage({yourjsPage: runId, type: 'expand', id, requestId}, '*');
      });
    }

    /**
     * Shows what console.table() logged.
     * @param {{columns: string[], rows: ({kind: string, text: string}?)[][]}} table
     * @returns {HTMLElement}
     */
    function createTable({columns, rows}) {
      if (!Array.isArray(columns) || !Array.isArray(rows)) return createElement('span');
      const cell = (tagName, part) => {
        const element = createElement(tagName, {textContent: `${part?.text ?? ''}`});
        if (/^\w+$/.test(part?.kind ?? '')) element.className = `kind-${part.kind}`;
        return element;
      };
      return createElement('div', {className: 'console-table-wrapper'}, [
        createElement('table', {className: 'console-table'}, [
          createElement('thead', {}, [createElement('tr', {}, columns.map(column => cell('th', {text: column})))]),
          createElement('tbody', {}, rows.filter(Array.isArray).map(row => createElement('tr', {}, row.map(part => cell('td', part))))),
        ]),
      ]);
    }

    function clearConsole() {
      consoleEntries.replaceChildren();
      // The values that were being expanded are gone.
      for (const resolve of pendingChildren.values()) resolve([]);
      pendingChildren.clear();
      unseenCount = unseenErrorCount = 0;
      updateConsoleBadge();
    }

    function updateConsoleBadge() {
      consoleBadge.hidden = !unseenCount;
      consoleBadge.textContent = unseenCount > 99 ? '99+' : `${unseenCount}`;
      consoleBadge.classList.toggle('has-errors', !!unseenErrorCount);
      consoleButton.title = unseenCount
        ? `Console (${unseenCount} new message${unseenCount === 1 ? '' : 's'})`
        : 'Console';
    }

    /**
     * @param {boolean} isShown
     * @param {boolean=} showResult
     *   If true (the default) and the tabs layout is being used, showing the
     *   console also shows the result (where the console is).
     */
    function setConsoleShown(isShown, showResult = true) {
      isConsoleShown = isShown;
      app.classList.toggle('is-console-shown', isShown);
      consoleButton.setAttribute('aria-pressed', `${isShown}`);
      if (isShown) {
        unseenCount = unseenErrorCount = 0;
        updateConsoleBadge();
        consoleEntries.scrollTop = consoleEntries.scrollHeight;
        if (showResult && layout === 'tabs') setTab('result');
      }
    }

    /**
     * Shows a line of the JavaScript (eg. where an error happened).
     * @param {number} line
     * @param {number} column
     */
    function goToJsLine(line, column) {
      if (layout === 'tabs') setTab('js');
      else setCollapsed('js', false);
      const editor = editors.js;
      editor.gotoLine(line, column - 1, false);
      editor.scrollToLine(line - 1, true, false);
      editor.focus();
    }

    // The code typed into the console (newest last).
    const consoleHistory = [];
    let historyIndex = 0;

    function resizeConsoleInput() {
      consoleInput.style.height = 'auto';
      consoleInput.style.height = `${consoleInput.scrollHeight}px`;
    }

    consoleInput.addEventListener('input', resizeConsoleInput);
    consoleInput.addEventListener('keydown', event => {
      const {value, selectionStart, selectionEnd} = consoleInput;
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (!value.trim()) return;
        if (consoleHistory.at(-1) !== value) consoleHistory.push(value);
        historyIndex = consoleHistory.length;
        addConsoleEntry({level: 'command', parts: [{kind: 'string', text: value}]});
        const thisRunId = runId;
        getProtectedJs(value).then(code => {
          if (runId !== thisRunId) return;
          if (resultFrame) resultFrame.contentWindow.postMessage({yourjsPage: runId, type: 'eval', code}, '*');
          else addConsoleEntry({level: 'error', parts: [{kind: 'string', text: 'The code can\u2019t be run until the result has loaded.'}]});
        });
        consoleInput.value = '';
        resizeConsoleInput();
      }
      // Like the browser's console, the up arrow on the first line (or the
      // down arrow on the last line) goes through what was typed before.
      else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && selectionStart === selectionEnd) {
        const isUp = event.key === 'ArrowUp';
        const isOnEdgeLine = isUp
          ? !value.slice(0, selectionStart).includes('\n')
          : !value.slice(selectionEnd).includes('\n');
        const newIndex = historyIndex + (isUp ? -1 : 1);
        if (!isOnEdgeLine || newIndex < 0 || newIndex > consoleHistory.length) return;
        event.preventDefault();
        historyIndex = newIndex;
        consoleInput.value = consoleHistory[newIndex] ?? '';
        resizeConsoleInput();
      }
    });

    consoleButton.addEventListener('click', () => setConsoleShown(!isConsoleShown));
    $('#close-console-button').addEventListener('click', () => setConsoleShown(false));
    $('#clear-console-button').addEventListener('click', clearConsole);
    //#endregion

    //#region Layout and tabs
    /**
     * @param {string} newLayout
     */
    function setLayout(newLayout) {
      layout = newLayout;
      for (const name of LAYOUTS) app.classList.toggle(`layout-${name}`, name === layout);
      for (const item of $$('#layout-menu [data-layout]')) {
        item.setAttribute('aria-checked', `${item.dataset.layout === layout}`);
      }
    }

    /**
     * Shows one of the tabs (in the tabs layout).
     * @param {string} tab
     */
    function setTab(tab) {
      activeTab = tab;
      app.dataset.tab = tab;
      for (const panel of $$('.panel')) panel.classList.toggle('is-active-tab', panel.dataset.lang === tab);
      for (const button of $$('#tabs [data-tab]')) {
        button.setAttribute('aria-selected', `${button.dataset.tab === tab}`);
      }
    }

    const getAutoLayout = () => innerWidth < NARROW_WIDTH ? 'tabs' : 'top';
    setLayout(isLayoutAuto ? getAutoLayout() : options.layout);
    setTab(activeTab);
    // Until a layout is chosen it depends on the width of the viewer.
    addEventListener('resize', () => {
      if (isLayoutAuto && getAutoLayout() !== layout) setLayout(getAutoLayout());
    });

    for (const button of $$('#tabs [data-tab]')) {
      button.addEventListener('click', () => {
        setTab(button.dataset.tab);
        editors[button.dataset.tab]?.focus();
      });
    }

    for (const item of $$('#layout-menu [data-layout]')) {
      item.addEventListener('click', () => {
        isLayoutAuto = false;
        setLayout(item.dataset.layout);
        closeMenu();
      });
    }
    //#endregion

    //#region Dividers
    const getFlexGrow = element => parseFloat(getComputedStyle(element).flexGrow) || 0;

    /**
     * Lets a divider be dragged to resize the things on either side of it.
     * @param {HTMLElement} divider
     * @param {PointerEvent} event
     */
    function startDragging(divider, event) {
      if (event.button !== 0) return;
      const prev = divider.previousElementSibling;
      const next = divider.nextElementSibling;
      if (prev.classList.contains('is-collapsed') || next.classList.contains('is-collapsed')) return;
      event.preventDefault();

      const isRow = getComputedStyle(divider.parentElement).flexDirection.startsWith('row');
      const prevRect = prev.getBoundingClientRect();
      const nextRect = next.getBoundingClientRect();
      const getSize = rect => isRow ? rect.width : rect.height;
      const startPrevSize = getSize(prevRect);
      const totalSize = startPrevSize + getSize(nextRect);
      // The flex-grow of each side is set so that they keep their share of
      // the space when the viewer is resized.
      const totalGrow = getFlexGrow(prev) + getFlexGrow(next);
      // The "right" layout reverses the order.
      const direction = (isRow ? prevRect.left <= nextRect.left : prevRect.top <= nextRect.top) ? 1 : -1;
      const startPosition = isRow ? event.clientX : event.clientY;

      divider.setPointerCapture(event.pointerId);
      divider.classList.add('is-dragging');
      app.classList.add('is-dragging-divider');

      function onMove(moveEvent) {
        const moved = direction * ((isRow ? moveEvent.clientX : moveEvent.clientY) - startPosition);
        const prevSize = Math.max(MIN_PANE_SIZE, Math.min(totalSize - MIN_PANE_SIZE, startPrevSize + moved));
        prev.style.flexGrow = `${totalGrow * prevSize / totalSize}`;
        next.style.flexGrow = `${totalGrow * (totalSize - prevSize) / totalSize}`;
      }
      function onEnd() {
        divider.removeEventListener('pointermove', onMove);
        divider.removeEventListener('pointerup', onEnd);
        divider.removeEventListener('pointercancel', onEnd);
        divider.classList.remove('is-dragging');
        app.classList.remove('is-dragging-divider');
      }
      divider.addEventListener('pointermove', onMove);
      divider.addEventListener('pointerup', onEnd);
      divider.addEventListener('pointercancel', onEnd);
    }

    for (const divider of $$('.divider')) {
      divider.addEventListener('pointerdown', event => startDragging(divider, event));
    }
    //#endregion

    //#region Menus
    /** @type {{button: HTMLElement, menu: HTMLElement}?} */
    let openMenuInfo = null;

    /**
     * @param {HTMLElement} button
     * @param {HTMLElement} menu
     */
    function openMenu(button, menu) {
      closeMenu();
      openMenuInfo = {button, menu};
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      const buttonRect = button.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      // Menus open downwards unless there isn't room (eg. from a toolbar at
      // the bottom).
      const menuHeight = menu.offsetHeight;
      menu.style.top = buttonRect.bottom + 4 + menuHeight > innerHeight - 8 && buttonRect.top - 4 - menuHeight >= 8
        ? `${buttonRect.top - 4 - menuHeight}px`
        : `${buttonRect.bottom + 4}px`;
      menu.style.left = `${Math.max(8, Math.min(buttonRect.right - menuWidth, innerWidth - menuWidth - 8))}px`;
      ($('[aria-checked="true"]', menu) ?? $('button, a', menu))?.focus();
    }

    /**
     * @param {boolean=} focusButton
     */
    function closeMenu(focusButton) {
      if (!openMenuInfo) return;
      const {button, menu} = openMenuInfo;
      openMenuInfo = null;
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (focusButton) button.focus();
    }

    for (const [button, menu] of [[$('#layout-button'), $('#layout-menu')], [$('#more-button'), $('#more-menu')]]) {
      button.addEventListener('click', () => {
        if (openMenuInfo?.menu === menu) closeMenu();
        else openMenu(button, menu);
      });
    }
    document.addEventListener('pointerdown', event => {
      if (openMenuInfo && !openMenuInfo.menu.contains(event.target) && !openMenuInfo.button.contains(event.target)) {
        closeMenu();
      }
    });
    // Eg. clicking in the result or the page.
    addEventListener('blur', () => closeMenu());

    const resetButton = $('#reset-button');
    resetButton.hidden = options.readOnly;
    resetButton.nextElementSibling.hidden = options.readOnly;
    resetButton.addEventListener('click', () => {
      closeMenu();
      if (confirm('Reset the code to how it was when the page was loaded?  Your changes will be lost.')) {
        setCode(originalCode);
        run(true);
      }
    });
    //#endregion

    //#region The editors' menus
    const panelMenu = $('#panel-menu');
    const panelFileInput = $('#panel-file-input');
    /** The editor that the menu (or the file being loaded) is for. */
    let panelMenuKey = 'html';

    /**
     * Opens the menu of an editor.
     * @param {string} key
     * @param {HTMLElement} button
     */
    function openPanelMenu(key, button) {
      panelMenuKey = key;
      $('[data-panel-action="save"]', panelMenu).textContent = `Save as ${FILE_NAMES[key]}`;
      $('[data-panel-action="popOut"]', panelMenu).textContent = popOuts.has(key) ? 'Bring back into the page' : 'Pop out into a window';
      // Read-only code can only be copied and saved.
      for (const action of ['format', 'load']) $(`[data-panel-action="${action}"]`, panelMenu).hidden = options.readOnly;
      openMenu(button, panelMenu);
    }

    /**
     * Briefly shows what happened (eg. "Copied!") in an editor's title bar.
     * @param {string} key
     * @param {string} text
     */
    function showPanelStatus(key, text) {
      const status = $(`.panel[data-lang="${key}"] .panel-status`);
      status.textContent = text;
      clearTimeout(status.timer);
      status.timer = setTimeout(() => status.textContent = '', 1600);
    }

    const panelActions = {
      format: key => format(key),
      async copy(key) {
        await copyText(editors[key].getValue());
        showPanelStatus(key, 'Copied!');
      },
      save(key) {
        download(new Blob([editors[key].getValue()], {type: 'text/plain'}), FILE_NAMES[key]);
      },
      load(key) {
        panelFileInput.accept = FILE_TYPES[key];
        panelFileInput.value = '';
        panelFileInput.click();
      },
      popOut(key) {
        if (popOuts.has(key)) bringBack(key);
        else popOut(key);
      },
    };

    for (const item of $$('[data-panel-action]', panelMenu)) {
      item.addEventListener('click', () => {
        closeMenu();
        panelActions[item.dataset.panelAction](panelMenuKey);
      });
    }

    panelFileInput.addEventListener('change', async () => {
      const file = panelFileInput.files[0];
      if (!file) return;
      if (file.size > MAX_OPEN_FILE_SIZE) {
        alert(`${file.name} is too big to load.`);
        return;
      }
      const editor = editors[panelMenuKey];
      // Setting the document's value (instead of the session's) can be
      // undone.
      editor.session.doc.setValue(await file.text());
      editor.clearSelection();
      updateRunButton();
      showPanelStatus(panelMenuKey, `Loaded ${file.name}`);
      editor.focus();
    });
    //#endregion

    //#region Popping editors out into their own windows
    /**
     * The editors that are in their own windows (by their keys).
     * @type {Map<string, {window: Window, editor: AceAjax.Editor?, isSyncing: boolean, timer: number}>}
     */
    const popOuts = new Map();

    /**
     * Makes a change (from an editor in the page) in the editor's window.
     * @param {string} key
     * @param {Object} delta
     */
    function syncToPopOut(key, delta) {
      const popOut = popOuts.get(key);
      if (!popOut?.editor || popOut.isSyncing) return;
      popOut.isSyncing = true;
      try {
        popOut.editor.session.doc.applyDelta(delta);
      }
      finally {
        popOut.isSyncing = false;
      }
    }

    /**
     * Opens an editor in its own window.  The editor in the page and the one
     * in the window are kept the same and closing the window brings the
     * editor back.
     * @param {string} key
     */
    function popOut(key) {
      const name = LANGUAGE_NAMES[key];
      const popup = open('', `yourjs-page-${pageIndex}-${key}`, 'popup,width=760,height=560');
      if (!popup) {
        showPanelStatus(key, 'The window was blocked');
        return;
      }
      const popupDocument = popup.document;
      popupDocument.open();
      popupDocument.write([
        '<!DOCTYPE html>',
        `<html lang="en" data-theme="${getTheme()}">`,
        '<head>',
        '<meta charset="utf-8">',
        `<title>${escapeHtml(`${name} – ${options.title || 'YourJS Page'}`)}</title>`,
        // The window looks like the page.
        `<style>${escapeStyle($('#viewer-style').textContent)}</style>`,
        '<style>body{display:flex;flex-direction:column}#popout-editor{flex-grow:1;min-height:0}#toolbar{border-bottom:1px solid var(--toolbar-border)}</style>',
        '</head>',
        '<body>',
        '</body>',
        '</html>',
      ].join(''));
      popupDocument.close();
      const bringBackButton = createElement('button', {type: 'button', className: 'text-button', textContent: 'Bring back into the page'});
      const runButton = createElement('button', {type: 'button', className: 'run-button', title: `Run (${RUN_SHORTCUT})`});
      runButton.innerHTML = '<svg aria-hidden="true"><use href="#icon-run"/></svg><span>Run</span>';
      popupDocument.body.append(
        // The icons that the buttons use.
        document.querySelector('.svg-defs').cloneNode(true),
        createElement('header', {id: 'toolbar'}, [
          createElement('div', {className: 'title', textContent: name}),
          createElement('div', {className: 'spacer'}),
          bringBackButton,
          runButton,
        ]),
        createElement('div', {id: 'popout-editor'}),
      );
      bringBackButton.addEventListener('click', () => bringBack(key));
      runButton.addEventListener('click', () => run(true));

      const state = {window: popup, editor: null, isSyncing: false, timer: 0};
      popOuts.set(key, state);
      const panel = $(`.panel[data-lang="${key}"]`);
      panel.classList.add('is-popped-out');
      $('.popped-out-name', panel).textContent = name;

      // The same keyboard shortcuts work in the window.
      popup.addEventListener('keydown', event => {
        const isCommandKey = IS_MAC ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
        if (isCommandKey && event.key === 'Enter' && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          event.stopPropagation();
          run(true);
        }
        else if (event.shiftKey && event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyF') {
          event.preventDefault();
          event.stopPropagation();
          format(key);
        }
      }, true);
      // Closing the window brings the editor back.
      popup.addEventListener('pagehide', () => bringBack(key));
      state.timer = setInterval(() => {
        if (popup.closed) bringBack(key);
      }, 500);

      // The window gets its own copy of Ace (which loads from the CDN).
      const script = popupDocument.createElement('script');
      script.src = aceUrl;
      script.onload = () => {
        if (popOuts.get(key) !== state) return;
        const editor = popup.ace.edit(popupDocument.getElementById('popout-editor'), {
          mode: ACE_MODES[key],
          theme: getAceTheme(),
          fontSize: EDITOR_FONT_SIZE * textScale,
          tabSize: 2,
          useSoftTabs: true,
          showPrintMargin: false,
          wrap: options.wordWrap,
          readOnly: options.readOnly,
          useWorker: false,
        });
        editor.setKeyboardHandler('ace/keyboard/vscode');
        editor.setValue(editors[key].getValue(), -1);
        editor.session.getUndoManager().reset();
        // Changes made in the window are made in the page too.
        editor.session.on('change', delta => {
          if (state.isSyncing) return;
          state.isSyncing = true;
          try {
            editors[key].session.doc.applyDelta(delta);
          }
          finally {
            state.isSyncing = false;
          }
        });
        state.editor = editor;
        editor.focus();
      };
      script.onerror = () => {
        popupDocument.getElementById('popout-editor').textContent = 'The code editor (Ace) could not be loaded.';
      };
      popupDocument.head.append(script);
      popup.focus();
    }

    /**
     * Puts an editor that is in its own window back into the page (and
     * closes the window).
     * @param {string} key
     */
    function bringBack(key) {
      const state = popOuts.get(key);
      if (!state) return;
      popOuts.delete(key);
      clearInterval(state.timer);
      if (!state.window.closed) state.window.close();
      const panel = $(`.panel[data-lang="${key}"]`);
      panel.classList.remove('is-popped-out');
      if (layout === 'tabs') setTab(key);
      else setCollapsed(key, false);
      editors[key].resize();
      editors[key].focus();
    }

    for (const panel of $$('.panel')) {
      const key = panel.dataset.lang;
      $('.popped-out-show-button', panel).addEventListener('click', () => popOuts.get(key)?.window.focus());
      $('.popped-out-bring-back-button', panel).addEventListener('click', () => bringBack(key));
    }
    // The windows can't work without this page.
    addEventListener('pagehide', () => {
      for (const key of [...popOuts.keys()]) bringBack(key);
    });
    //#endregion

    $('#text-smaller-button').addEventListener('click', () => changeTextScale(-1));
    $('#text-bigger-button').addEventListener('click', () => changeTextScale(1));
    $('#text-reset-button').addEventListener('click', () => setTextScale(1));
    setTextScale(textScale);

    //#region About
    const aboutDialog = $('#about-dialog');
    $('#about-version').textContent = `Version ${packageInfo.version}`;
    $('#about-website-link').href = packageInfo.homepage;
    $('#about-github-link').href = packageInfo.repoUrl;
    $('#about-docs-link').href = `${packageInfo.repoUrl}#readme`;
    $('#about-issues-link').href = packageInfo.bugsUrl;
    $('#about-footer').textContent = `MIT License \u00a9 2026-present Chris West \u00b7 Built with Ace ${libraryVersions['ace-builds']}, js-beautify ${libraryVersions['js-beautify']} and Acorn ${libraryVersions.acorn}`;

    /**
     * Fills a list of terms and their descriptions.
     * @param {HTMLElement} list
     * @param {[(string|Node)[], string][]} items
     */
    function fillDetails(list, items) {
      list.replaceChildren(...items.flatMap(([terms, description]) => [
        createElement('dt', {}, terms),
        createElement('dd', {textContent: description}),
      ]));
    }

    /**
     * Keys to press together (eg. ["Ctrl", "Enter"]).
     * @param {string[]} keys
     * @returns {(string|Node)[]}
     */
    const keys = (...names) => names.flatMap((name, index) => [
      ...index ? [' + '] : [],
      createElement('kbd', {textContent: name}),
    ]);

    /** Shows the About window (with what is true right now). */
    function openAbout() {
      closeMenu();
      const layoutNames = {
        top: 'Editors on top of the result',
        left: 'Editors on the left of the result',
        right: 'Editors on the right of the result',
        tabs: 'Tabs that show one thing at a time',
      };
      const libraryCount = libraries.css.length + libraries.js.length;
      fillDetails($('#about-details'), [
        [['Layout'], `${layoutNames[layout]}${isLayoutAuto ? ' (chosen for the width of the page)' : ''}`],
        [['Theme'], `${getTheme() === 'dark' ? 'Dark' : 'Light'}${options.theme ? '' : ' (following the system)'}`],
        [['Menu'], isToolbarBottom ? 'At the bottom' : 'At the top'],
        [['Editing'], options.readOnly ? 'Read only (the code can still be run)' : 'Allowed'],
        [['Libraries'], libraryCount
          ? `${libraries.css.length} CSS and ${libraries.js.length} JavaScript`
          : 'None'],
        [['The result'], 'Runs in a sandbox so its code can\u2019t reach this page'],
        [['Loops'], options.loopTimeout > 0
          ? `Stopped if the code runs them for more than ${options.loopTimeout / 1000} seconds without a break`
          : 'Never stopped'],
      ]);
      const commandKey = IS_MAC ? '\u2318' : 'Ctrl';
      fillDetails($('#about-shortcuts'), [
        [keys(commandKey, 'Enter'), 'Run the code (in the editors or the result)'],
        ...options.readOnly ? [] : [[keys('Shift', IS_MAC ? '\u2325' : 'Alt', 'F'), 'Format the code in the editor']],
        [keys('Enter'), 'Run the code typed into the console'],
        [keys('Shift', 'Enter'), 'Start a new line in the console'],
        [[...keys('\u2191'), ' / ', ...keys('\u2193')], 'Go through the code typed into the console'],
        [keys('Esc'), 'Close this window, a menu or full screen'],
      ]);
      setAboutTab('about');
      // Copies get new IDs each time (so that more than one can be on a page).
      embedId = `yourjs-page-${Math.random().toString(36).slice(2, 7)}`;
      aboutDialog.showModal();
      $('.dialog-close', aboutDialog).focus();
    }

    /**
     * Shows a tab of the About window.
     * @param {"about"|"embed"} tab
     */
    function setAboutTab(tab) {
      for (const button of $$('[data-about-tab]', aboutDialog)) {
        button.setAttribute('aria-selected', `${button.dataset.aboutTab === tab}`);
      }
      for (const panel of $$('[data-about-panel]', aboutDialog)) panel.hidden = panel.dataset.aboutPanel !== tab;
      aboutDialog.classList.toggle('is-embed', tab === 'embed');
      if (tab === 'embed') renderEmbed();
    }
    for (const button of $$('[data-about-tab]', aboutDialog)) {
      button.addEventListener('click', () => setAboutTab(button.dataset.aboutTab));
    }

    //#region Embedding
    /** The script that copies of this page load (this major version from the CDN). */
    const SCRIPT_URL = `https://cdn.jsdelivr.net/npm/${packageInfo.name}@${packageInfo.version.split('.')[0]}/dist/${packageInfo.name}.min.js`;
    /** The ID that the elements of copies start with. */
    let embedId = 'yourjs-page';
    /** Which code copies start with:  "current" or "original". */
    let embedCodeChoice = 'current';
    /** @type {{[key: string]: AceAjax.Editor}} */
    const embedPreviews = {};
    /** The snippets that are shown (and copied). */
    const embedSnippets = {html: '', api: ''};

    const escapeAttribute = text => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const escapeText = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /**
     * Makes the HTML for a copy of this page:  the script (with this page's
     * settings) and the code in hidden <pre> elements.
     * @param {ReturnType<getCode>} code
     * @returns {string}
     */
    function buildEmbedHtml(code) {
      const attributes = [`src="${SCRIPT_URL}"`];
      for (const [name, value] of Object.entries(embedSettings)) {
        attributes.push(`data-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}="${escapeAttribute(value)}"`);
      }
      if (code.cssUrls.length) attributes.push(`data-css-urls="${escapeAttribute(code.cssUrls.join(' '))}"`);
      if (code.jsUrls.length) attributes.push(`data-js-urls="${escapeAttribute(code.jsUrls.join(' '))}"`);
      for (const key of LANGUAGE_KEYS) attributes.push(`data-${key}-selector="#${embedId}-${key}"`);
      return [
        // Without a height the page fills its container.
        embedSettings.height ? '<div>' : '<div style="height: 500px;">',
        `  <script ${attributes.join('\n          ')}><\/script>`,
        '</div>',
        // (The browser removes the new line at the start of a <pre>.)
        ...LANGUAGE_KEYS.map(key => `<pre id="${embedId}-${key}" hidden>\n${escapeText(code[key])}</pre>`),
        '',
      ].join('\n');
    }

    /**
     * Makes the HTML for a copy of this page made with YourJSPage.create().
     * @param {ReturnType<getCode>} code
     * @returns {string}
     */
    function buildEmbedApi(code) {
      // A template literal (that can't end the <script> early).
      const toLiteral = text => '`' + text
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${')
        .replace(/<\/(script)/gi, '<\\/$1') + '`';
      // "true" becomes true and numbers that are lengths become numbers.
      const toValue = (name, value) => /^(true|false)$/.test(value) ? value
        : /^(height|loopTimeout)$/.test(name) && /^\d+(\.\d+)?$/.test(value) ? value
        : JSON.stringify(value);
      const options = [
        `target: '#${embedId}',`,
        ...LANGUAGE_KEYS.map(key => `${key}: ${toLiteral(code[key])},`),
        ...code.cssUrls.length ? [`cssUrls: ${JSON.stringify(code.cssUrls)},`] : [],
        ...code.jsUrls.length ? [`jsUrls: ${JSON.stringify(code.jsUrls)},`] : [],
        ...Object.entries(embedSettings).map(([name, value]) => `${name}: ${toValue(name, value)},`),
      ];
      return [
        embedSettings.height ? `<div id="${embedId}"></div>` : `<div id="${embedId}" style="height: 500px;"></div>`,
        `<script src="${SCRIPT_URL}"><\/script>`,
        '<script>',
        '  YourJSPage.create({',
        // (Only the first line of each option is indented so that the code
        // in the template literals stays exactly the same.)
        ...options.map(option => `    ${option}`),
        '  });',
        '<\/script>',
        '',
      ].join('\n');
    }

    /** Shows the snippets for the chosen code. */
    function renderEmbed() {
      const code = embedCodeChoice === 'original'
        ? {...originalCode, cssUrls: [...originalCode.cssUrls], jsUrls: [...originalCode.jsUrls]}
        : getCode();
      embedSnippets.html = buildEmbedHtml(code);
      embedSnippets.api = buildEmbedApi(code);
      for (const key of ['html', 'api']) {
        embedPreviews[key] ??= ace.edit($(`#embed-${key}-preview`), {
          mode: 'ace/mode/html',
          theme: getAceTheme(),
          fontSize: 12,
          readOnly: true,
          showPrintMargin: false,
          highlightActiveLine: false,
          useWorker: false,
        });
        embedPreviews[key].setTheme(getAceTheme());
        embedPreviews[key].setValue(embedSnippets[key], -1);
      }
      for (const button of $$('[data-embed-code]', aboutDialog)) {
        button.setAttribute('aria-checked', `${button.dataset.embedCode === embedCodeChoice}`);
      }
    }

    for (const button of $$('[data-embed-code]', aboutDialog)) {
      button.addEventListener('click', () => {
        embedCodeChoice = button.dataset.embedCode;
        renderEmbed();
      });
    }

    /**
     * Copies text to the clipboard.
     * @param {string} text
     */
    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
      }
      catch (e) {
        // Falls back to the older way of copying text.
        const textarea = createElement('textarea', {value: text});
        document.body.append(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
    }

    for (const button of $$('[data-embed-copy]', aboutDialog)) {
      button.addEventListener('click', async () => {
        await copyText(embedSnippets[button.dataset.embedCopy]);
        button.textContent = 'Copied!';
        setTimeout(() => button.textContent = 'Copy', 1500);
      });
    }
    //#endregion

    $('#about-button').addEventListener('click', openAbout);
    const logoButton = $('#logo-button');
    logoButton.title = `About YourJS Page (version ${packageInfo.version})`;
    logoButton.addEventListener('click', openAbout);
    $('.dialog-close', aboutDialog).addEventListener('click', () => aboutDialog.close());
    // Clicking outside of the window closes it.
    aboutDialog.addEventListener('click', event => {
      if (event.target === aboutDialog) aboutDialog.close();
    });
    //#endregion

    //#region Libraries
    const librariesDialog = $('#libraries-dialog');
    const librariesButton = $('#libraries-button');
    const librariesBadge = $('#libraries-badge');
    const searchInput = $('#library-search-input');
    const searchStatus = $('#library-search-status');
    const searchResults = $('#library-results');

    librariesDialog.classList.toggle('is-read-only', options.readOnly);
    $('#library-search').hidden = !options.librarySearch;

    /**
     * Shows a library's URL in a shorter form (eg. "jquery@3.7.1/jquery.min.js"
     * for a file on cdnjs).
     * @param {string} url
     * @returns {string}
     */
    function describeLibraryUrl(url) {
      const match = /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/([^/]+)\/([^/]+)\/(.+)$/.exec(url);
      return match ? `${match[1]}@${match[2]}/${match[3]}` : url;
    }

    /** Shows the libraries in the dialog and how many there are. */
    function renderLibraries() {
      for (const type of ['css', 'js']) {
        const urls = libraries[type];
        $(`#${type}-libraries`).replaceChildren(...urls.map((url, index) => {
          const makeButton = (icon, title, disabled, onClick) => {
            const button = createElement('button', {type: 'button', className: 'icon-button', title, disabled});
            button.innerHTML = `<svg aria-hidden="true"><use href="#icon-${icon}"/></svg>`;
            button.addEventListener('click', onClick);
            return button;
          };
          return createElement('li', {}, [
            createElement('span', {className: 'library-url-text', textContent: describeLibraryUrl(url), title: url}),
            makeButton('up', 'Move up', index === 0, () => moveLibrary(type, index, -1)),
            makeButton('down', 'Move down', index === urls.length - 1, () => moveLibrary(type, index, 1)),
            makeButton('close', 'Remove', false, () => removeLibrary(type, index)),
          ]);
        }));
      }
      const count = libraries.css.length + libraries.js.length;
      librariesBadge.hidden = !count;
      librariesBadge.textContent = `${count}`;
      librariesButton.title = count ? `Libraries (${count})` : 'Libraries';
    }

    /**
     * @param {"css"|"js"} type
     * @param {string} url
     * @param {string=} integrity
     */
    function addLibrary(type, url, integrity) {
      if (integrity) integrities.set(url, integrity);
      if (!libraries[type].includes(url)) libraries[type].push(url);
      renderLibraries();
      updateRunButton();
    }

    /**
     * @param {"css"|"js"} type
     * @param {number} index
     * @param {number} offset
     */
    function moveLibrary(type, index, offset) {
      const urls = libraries[type];
      [urls[index], urls[index + offset]] = [urls[index + offset], urls[index]];
      renderLibraries();
      updateRunButton();
      // Keeps the focus on the same button so it can be pressed again.
      const buttons = $$(`#${type}-libraries li`)[index + offset]?.querySelectorAll('button');
      (buttons?.[offset < 0 ? 0 : 1].disabled ? buttons[offset < 0 ? 1 : 0] : buttons?.[offset < 0 ? 0 : 1])?.focus();
    }

    /**
     * @param {"css"|"js"} type
     * @param {number} index
     */
    function removeLibrary(type, index) {
      libraries[type].splice(index, 1);
      renderLibraries();
      updateRunButton();
    }

    /**
     * The integrity hashes of the files in each version of the libraries on
     * cdnjs (by "name@version").
     * @type {Map<string, Promise<{[file: string]: string}>>}
     */
    const cdnjsHashes = new Map();

    /**
     * Gets the files and integrity hashes of a version of a library on cdnjs.
     * @param {string} name
     * @param {string} version
     * @returns {Promise<{files: string[], sri: {[file: string]: string}}>}
     */
    function getCdnjsVersion(name, version) {
      const key = `${name}@${version}`;
      if (!cdnjsHashes.has(key)) {
        const promise = fetchJson(`${CDNJS_API_URL}/${encodeURIComponent(name)}/${encodeURIComponent(version)}?fields=files,sri`);
        // Lets it be tried again later.
        promise.catch(() => cdnjsHashes.delete(key));
        cdnjsHashes.set(key, promise);
      }
      return cdnjsHashes.get(key);
    }

    /**
     * Adds a file of a library on cdnjs.
     * @param {string} name
     * @param {string} version
     * @param {string} file
     * @param {HTMLButtonElement} button
     *   The button that was clicked (which shows that the file was added).
     */
    async function addCdnjsFile(name, version, file, button) {
      let integrity;
      try {
        integrity = (await getCdnjsVersion(name, version)).sri?.[file];
      }
      catch (e) {
        // The file can still be added without its hash.
      }
      addLibrary(/\.css$/i.test(file) ? 'css' : 'js', `${CDNJS_FILES_URL}${name}/${version}/${file}`, integrity);
      const oldText = button.textContent;
      button.textContent = 'Added';
      setTimeout(() => button.textContent = oldText, 1500);
    }

    /**
     * Shows the versions and files of a library that was found.
     * @param {{name: string, version: string}} library
     * @param {HTMLElement} container
     */
    async function showLibraryFiles(library, container) {
      container.replaceChildren('Loading…');
      let versions;
      try {
        ({versions} = await fetchJson(`${CDNJS_API_URL}/${encodeURIComponent(library.name)}?fields=versions`));
      }
      catch (e) {
        container.replaceChildren('The versions could not be loaded.');
        return;
      }
      versions = [...new Set([library.version, ...versions])]
        .sort((a, b) => b.localeCompare(a, undefined, {numeric: true}));
      const select = createElement('select', {title: 'Version'}, versions.map(
        version => createElement('option', {value: version, textContent: version, selected: version === library.version})
      ));
      const fileList = createElement('div', {className: 'library-file-list'});

      async function showFiles() {
        const version = select.value;
        fileList.replaceChildren('Loading…');
        let files;
        try {
          ({files} = await getCdnjsVersion(library.name, version));
        }
        catch (e) {
          fileList.replaceChildren('The files could not be loaded.');
          return;
        }
        if (select.value !== version) return;
        // Minified files first, then the shortest paths.
        files = files
          .filter(file => /\.(css|js)$/i.test(file))
          .sort((a, b) => (b.includes('.min.') - a.includes('.min.')) || a.length - b.length || a.localeCompare(b));
        fileList.replaceChildren(...files.length ? files.map(file => {
          const button = createElement('button', {type: 'button', textContent: file, title: `Add ${file}`});
          button.addEventListener('click', () => addCdnjsFile(library.name, version, file, button));
          return button;
        }) : ['There are no CSS or JavaScript files in this version.']);
      }

      select.addEventListener('change', showFiles);
      container.replaceChildren(select, fileList);
      showFiles();
    }

    /**
     * @param {{name: string, version: string, description?: string, filename?: string}} library
     * @returns {HTMLElement}
     */
    function createSearchResult(library) {
      const addButton = createElement('button', {type: 'button', className: 'text-button', textContent: 'Add', title: `Add ${library.filename}`});
      addButton.addEventListener('click', () => addCdnjsFile(library.name, library.version, library.filename, addButton));
      const filesButton = createElement('button', {type: 'button', className: 'text-button', textContent: 'Files'});
      filesButton.title = 'Choose a version and file';
      filesButton.setAttribute('aria-expanded', 'false');
      const files = createElement('div', {className: 'library-files', hidden: true});
      filesButton.addEventListener('click', () => {
        files.hidden = !files.hidden;
        filesButton.setAttribute('aria-expanded', `${!files.hidden}`);
        if (!files.hidden && !files.childNodes.length) showLibraryFiles(library, files);
      });
      return createElement('div', {className: 'library-result'}, [
        createElement('div', {className: 'library-result-main'}, [
          createElement('div', {className: 'library-result-text'}, [
            createElement('span', {className: 'library-name', textContent: library.name}),
            createElement('span', {className: 'library-version', textContent: library.version}),
            createElement('div', {className: 'library-description', textContent: library.description ?? '', title: library.description ?? ''}),
          ]),
          addButton,
          filesButton,
        ]),
        files,
      ]);
    }

    /** @type {AbortController?} */
    let searchController = null;
    let searchTimer = 0;

    /** Searches cdnjs for what was typed. */
    async function searchLibraries() {
      const query = searchInput.value.trim();
      searchController?.abort();
      if (!query) {
        searchController = null;
        searchStatus.textContent = '';
        searchResults.replaceChildren();
        return;
      }
      const controller = searchController = new AbortController();
      searchStatus.textContent = 'Searching…';
      try {
        const {results} = await fetchJson(
          `${CDNJS_API_URL}?search=${encodeURIComponent(query)}&fields=version,description,filename&limit=25`,
          controller.signal
        );
        // Only libraries with a default file can be added with one click.
        const found = results.filter(library => library.version && library.filename);
        searchStatus.textContent = found.length ? '' : `No libraries match “${query}”.`;
        searchResults.replaceChildren(...found.map(createSearchResult));
      }
      catch (e) {
        if (controller.signal.aborted) return;
        searchStatus.textContent = 'The search failed.  Please check your connection and try again.';
        searchResults.replaceChildren();
      }
    }

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(searchLibraries, SEARCH_DELAY);
    });

    $('#library-url-form').addEventListener('submit', event => {
      event.preventDefault();
      const input = $('#library-url-input');
      // Relative URLs are relative to the page.
      let url;
      try {
        url = new URL(input.value.trim(), document.baseURI).href;
      }
      catch (e) {
        return;
      }
      addLibrary(event.submitter?.dataset.type === 'css' ? 'css' : 'js', url);
      input.value = '';
    });

    librariesButton.addEventListener('click', () => {
      closeMenu();
      librariesDialog.showModal();
      if (options.librarySearch && !options.readOnly) searchInput.focus();
    });
    for (const button of $$('.dialog-close', librariesDialog)) {
      button.addEventListener('click', () => librariesDialog.close());
    }
    // Clicking outside of the dialog closes it.
    librariesDialog.addEventListener('click', event => {
      if (event.target === librariesDialog) librariesDialog.close();
    });
    $('#libraries-run-button').addEventListener('click', () => {
      librariesDialog.close();
      run(true);
    });
    renderLibraries();
    //#endregion

    //#region Saving and opening
    /** The name of downloaded files (without the extension). */
    function getFileBaseName() {
      return (options.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'yourjs-page';
    }

    $('#download-html-button').addEventListener('click', () => {
      closeMenu();
      download(new Blob([buildDocument(getCode())], {type: 'text/html'}), `${getFileBaseName()}.html`);
    });

    $('#download-zip-button').addEventListener('click', () => {
      closeMenu();
      const code = getCode();
      const folder = getFileBaseName();
      download(createZip([
        {name: `${folder}/index.html`, text: buildDocument(code, {fileNames: {css: 'style.css', js: 'script.js'}})},
        {name: `${folder}/style.css`, text: code.css},
        {name: `${folder}/script.js`, text: code.js},
      ]), `${folder}.zip`);
    });

    const fileInput = $('#file-input');
    const openFileButton = $('#open-file-button');
    openFileButton.hidden = options.readOnly;
    openFileButton.addEventListener('click', () => {
      closeMenu();
      fileInput.value = '';
      fileInput.click();
    });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        await openFile(file);
      }
      catch (e) {
        alert(`${file.name} could not be opened.  ${e.message}`);
      }
    });

    /**
     * Opens an HTML or ZIP file (eg. one that was downloaded) and runs it.
     * @param {File} file
     */
    async function openFile(file) {
      if (file.size > MAX_OPEN_FILE_SIZE) throw new Error('It is too big.');
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const decoder = new TextDecoder();
      // The title that downloads get (see buildDocument()).
      const defaultTitle = options.title || 'YourJS Page';
      let code;
      // ZIP files start with "PK\x03\x04".
      if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
        // Only the files that could be code are read (up to a total size).
        const files = new Map();
        let totalSize = 0;
        for (const [path, read] of readZip(buffer)) {
          if (!/\.(html?|css|m?js)$/i.test(path)) continue;
          const data = await read();
          totalSize += data.length;
          if (totalSize > MAX_OPEN_FILE_SIZE * 2.5) throw new Error('Its files are too big.');
          files.set(path, data);
        }
        // Uses the index.html that is the least deep (or else any HTML file).
        const htmlPath = [...files.keys()]
          .filter(path => /\.html?$/i.test(path))
          .sort((a, b) => (/(^|\/)index\.html?$/i.test(b) - /(^|\/)index\.html?$/i.test(a))
            || a.split('/').length - b.split('/').length
            || a.localeCompare(b))[0];
        if (!htmlPath) throw new Error('There is no HTML file in it.');
        const folder = htmlPath.replace(/[^/]*$/, '');
        const getFile = url => {
          const resolved = new URL(url, `https://zip/${htmlPath}`);
          const path = resolved.origin === 'https://zip' ? decodeURIComponent(resolved.pathname.slice(1)) : null;
          return path != null && files.has(path) ? decoder.decode(files.get(path)) : null;
        };
        code = parseHtmlDocument(decoder.decode(files.get(htmlPath)), getFile, defaultTitle);
        // Some exports (eg. CodePen's src folder) have the CSS and JavaScript
        // next to the HTML without the HTML referring to them.
        for (const [key, fileName] of [['css', 'style.css'], ['js', 'script.js']]) {
          if (!code[key] && files.has(folder + fileName)) code[key] = decoder.decode(files.get(folder + fileName));
        }
      }
      else {
        code = parseHtmlDocument(decoder.decode(bytes), () => null, defaultTitle);
      }
      for (const [url, integrity] of code.integrities) integrities.set(url, integrity);
      setCode(code);
      run(true);
    }
    //#endregion

    //#region Safe mode
    // If the code that the page starts with is run but never finishes (eg.
    // because it froze the page and the page had to be reloaded) it isn't run
    // automatically the next time.
    const safeModeKey = `yourjs-page:running:${hashText(`${pageUrl}\n${pageIndex}\n${originalCodeJson}`)}`;
    // Storage can't be used in some pages (eg. sandboxed ones).
    const storage = (() => {
      try {
        return localStorage;
      }
      catch (e) {
        return null;
      }
    })();

    /**
     * Remembers whether the code that the page starts with is running.
     * @param {boolean} isRunning
     */
    function setRunningOriginalCode(isRunning) {
      try {
        if (isRunning) storage?.setItem(safeModeKey, `${Date.now()}`);
        else storage?.removeItem(safeModeKey);
      }
      catch (e) {}
    }

    /** @returns {boolean} */
    function didOriginalCodeNotFinish() {
      try {
        // Code that only just started is probably running in another tab.
        const startTime = storage?.getItem(safeModeKey);
        return startTime != null && Date.now() - startTime > SAFE_MODE_MIN_AGE;
      }
      catch (e) {
        return false;
      }
    }

    // Leaving the page normally (eg. reloading it) means it didn't freeze.  A
    // page that froze can't run this so the next time it is opened the code
    // isn't run automatically.
    addEventListener('pagehide', () => setRunningOriginalCode(false));

    $('#safe-mode-run-button').addEventListener('click', () => run(true));
    //#endregion

    //#region Full screen
    /**
     * Makes the viewer fill the page's window (when full screen isn't
     * allowed).
     * @param {boolean} value
     */
    function setMaximized(value) {
      isMaximized = value;
      host.setMaximized(value);
      updateFullscreenButton();
    }

    function updateFullscreenButton() {
      const isFullscreen = !!document.fullscreenElement || isMaximized;
      $('use', fullscreenButton).setAttribute('href', isFullscreen ? '#icon-exit-fullscreen' : '#icon-fullscreen');
      fullscreenButton.title = isFullscreen ? 'Exit full screen' : 'Full screen';
    }

    async function toggleFullscreen() {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      else if (isMaximized) {
        setMaximized(false);
      }
      else {
        try {
          if (!document.fullscreenEnabled) throw new Error('Full screen is not allowed.');
          await document.documentElement.requestFullscreen();
        }
        catch (e) {
          setMaximized(true);
        }
      }
    }

    fullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    //#endregion

    //#region Keyboard shortcuts
    // Listening while capturing makes the shortcuts work before the editors
    // see the keys.
    addEventListener('keydown', event => {
      const isCommandKey = IS_MAC ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      if (isCommandKey && event.key === 'Enter' && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        run(true);
      }
      else if (event.shiftKey && event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyF') {
        const key = LANGUAGE_KEYS.find(key => editors[key].isFocused());
        if (key) {
          event.preventDefault();
          event.stopPropagation();
          format(key);
        }
      }
      // The dialogs close themselves.
      else if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
        if (openMenuInfo) closeMenu(true);
        else if (isMaximized) setMaximized(false);
      }
    }, true);
    //#endregion

    runButton.title = `Run (${RUN_SHORTCUT})`;
    runButton.addEventListener('click', () => run(true));
    $('#open-button').addEventListener('click', openInNewTab);
    const titleElement = $('#title');
    titleElement.textContent = options.title;
    titleElement.title = options.title;
    updateConsoleBadge();
    setConsoleShown(options.showConsole, false);

    app.hidden = false;
    // The loading screen is shown for at least a moment (from when this page
    // started loading) so that it doesn't just flash.
    setTimeout(() => splash.classList.add('hidden'), Math.max(0, SPLASH_MIN_TIME - performance.now()));
    // A viewer that starts again (eg. because its IFRAME moved) is in a page
    // that didn't freeze.
    if (!config.isRestart && didOriginalCodeNotFinish()) {
      $('#safe-mode-notice').hidden = false;
      $('#safe-mode-run-button').focus();
    }
    else {
      run(false);
    }

    // Explains what code couldn't be loaded (which the editors show too).
    if (loadErrors.length) {
      const dialog = $('#load-error-dialog');
      $('#load-error-list').replaceChildren(...loadErrors.map(error => createElement('li', {}, [
        createElement('span', {className: 'load-error-language', textContent: error.language}),
        createElement('span', {className: 'load-error-message', textContent: error.message}),
      ])));
      $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
      dialog.showModal();
      $('.dialog-close', dialog).focus();
    }

    return {
      getCode,
      /**
       * @param {{html: string, css: string, js: string, cssUrls: string[], jsUrls: string[]}} code
       * @param {{run: boolean}} runOptions
       */
      setCode(code, runOptions) {
        setCode(code);
        if (runOptions.run) run(false);
        else updateRunButton();
      },
      run: () => run(false),
      destroy() {
        resultFrame?.remove();
        resultFrame = null;
      },
    };
  },
};
