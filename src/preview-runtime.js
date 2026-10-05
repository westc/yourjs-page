// Runs in the result IFRAME before anything else (see previewRuntime() in
// main.js).  `config` is given by the viewer:
// - config.runId:  Sent with every message so that the viewer can ignore the
//   messages of an earlier run.
// - config.loopTimeout:  How long (in milliseconds) loops can keep the page
//   busy before they are stopped (see __yourjsPageLoopGuard() below).
//
// It sends what is logged (and any errors) to the viewer's console, runs code
// typed into the viewer's console and provides yourjsPageRunJs() which runs
// the user's JavaScript at the end of the body.

const VIEWER = parent;
const RUN_ID = config.runId;

/** The name that the user's JavaScript has in stack traces and errors. */
const SCRIPT_NAME = 'script.js';

/** How many levels of objects inside of objects are shown. */
const MAX_DEPTH = 2;
/** How many items (eg. properties) of an object are shown. */
const MAX_ITEMS = 100;
/** How many characters of an element's HTML are shown. */
const MAX_HTML_LENGTH = 500;
/** How many properties (or items) are shown when a value is expanded. */
const MAX_CHILDREN = 200;
/** How many rows console.table() shows. */
const MAX_TABLE_ROWS = 1000;

/**
 * Sends a message to the viewer.
 * @param {string} type
 * @param {Object=} data
 */
function send(type, data) {
  try {
    VIEWER.postMessage({yourjsPage: RUN_ID, type, ...data}, '*');
  }
  catch (e) {}
}

const toString = value => Object.prototype.toString.call(value);
const isIdentifier = key => /^[A-Za-z_$][\w$]*$/.test(key);

/**
 * Gets the kind of a value (used to color it in the console).
 * @param {*} value
 * @returns {string}
 */
function getKind(value) {
  if (value === null) return 'null';
  if (value instanceof Error) return 'error';
  if ('object' === typeof value && value instanceof Node) return 'node';
  return typeof value;
}

/**
 * Shows a value as text (on one line unless it is something like an error at
 * the top level).
 * @param {*} value
 * @param {number=} depth
 *   How deep inside of other values this one is.  Strings at the top level
 *   are shown without quotes.
 * @param {any[]=} parents
 *   The objects that this value is inside of (to find circular references).
 * @returns {string}
 */
function preview(value, depth = 0, parents = []) {
  switch (typeof value) {
    case 'string': return depth ? JSON.stringify(value) : value;
    case 'number': return Object.is(value, -0) ? '-0' : `${value}`;
    case 'bigint': return `${value}n`;
    case 'symbol': return value.toString();
    case 'boolean':
    case 'undefined': return `${value}`;
    case 'function': return previewFunction(value);
  }
  if (value === null) return 'null';
  if (parents.includes(value)) return '[Circular]';
  try {
    return previewObject(value, depth, [...parents, value]);
  }
  catch (e) {
    // Eg. a proxy that throws.
    return toString(value);
  }
}

/**
 * @param {Function} fn
 * @returns {string}
 */
function previewFunction(fn) {
  const source = Function.prototype.toString.call(fn);
  return /^class\b/.test(source) ? `class ${fn.name}` : `ƒ ${fn.name}()`;
}

/**
 * @param {Object} value
 * @param {number} depth
 * @param {any[]} parents
 * @returns {string}
 */
function previewObject(value, depth, parents) {
  if (value === window) return 'Window';
  if (value instanceof Error) {
    const summary = `${value.name}: ${value.message}`;
    if (depth || !value.stack) return summary;
    // At the top level the stack is shown too (without the lines for the code
    // that ran the user's JavaScript, which in Safari start with the call to
    // append() that added the script).
    const stack = getStack(value)
      .replace(/(\n[^\n]*append@\[native code\])?\n[^\n]*\byourjsPageRunJs\b[^]*/, '');
    // Only some browsers start the stack with the error's name and message.
    return stack.split('\n')[0].includes(value.message) ? stack : `${summary}\n${stack}`;
  }
  if (value instanceof Node) return previewNode(value, depth);
  if (value instanceof Date) return isNaN(value) ? 'Invalid Date' : depth ? value.toISOString() : `${value}`;
  if (value instanceof RegExp) return `${value}`;
  if (value instanceof Promise) return 'Promise {…}';
  if (value instanceof WeakMap || value instanceof WeakSet) return `${value.constructor.name} {…}`;

  const isArray = Array.isArray(value) || ArrayBuffer.isView(value);
  const constructorName = getConstructorName(value);
  const prefix = isArray
    ? (constructorName === 'Array' ? '' : constructorName)
    : (constructorName === 'Object' ? '' : `${constructorName} `);

  if (value instanceof Map || value instanceof Set) {
    const name = `${constructorName}(${value.size})`;
    if (depth > MAX_DEPTH) return `${name} {…}`;
    const items = [];
    for (const item of value) {
      if (items.length >= MAX_ITEMS) {
        items.push('…');
        break;
      }
      items.push(value instanceof Map
        ? `${preview(item[0], depth + 1, parents)} => ${preview(item[1], depth + 1, parents)}`
        : preview(item, depth + 1, parents));
    }
    return `${name} {${items.join(', ')}}`;
  }

  if (isArray) {
    if (depth > MAX_DEPTH) return `${prefix || 'Array'}(${value.length})`;
    const items = [];
    for (let index = 0; index < value.length; index++) {
      if (items.length >= MAX_ITEMS) {
        items.push('…');
        break;
      }
      items.push(index in value ? preview(value[index], depth + 1, parents) : 'empty');
    }
    return `${prefix ? `${prefix}(${value.length}) ` : ''}[${items.join(', ')}]`;
  }

  if (depth > MAX_DEPTH) return `${prefix}{…}`;
  // The enumerable keys (including symbols) like the browser's console.
  const keys = Reflect.ownKeys(value).filter(key => Object.prototype.propertyIsEnumerable.call(value, key));
  const items = keys.slice(0, MAX_ITEMS).map(key => {
    let text;
    try {
      text = preview(value[key], depth + 1, parents);
    }
    catch (e) {
      text = '(…)';
    }
    const name = 'symbol' === typeof key ? `[${key.toString()}]` : isIdentifier(key) ? key : JSON.stringify(key);
    return `${name}: ${text}`;
  });
  if (keys.length > MAX_ITEMS) items.push('…');
  return `${prefix}{${items.join(', ')}}`;
}

/**
 * @param {Object} value
 * @returns {string}
 */
function getConstructorName(value) {
  const proto = Object.getPrototypeOf(value);
  if (!proto) return 'Object';
  const name = proto.constructor?.name;
  return 'string' === typeof name && name ? name : toString(value).slice(8, -1);
}

/**
 * @param {Node} node
 * @param {number} depth
 * @returns {string}
 */
function previewNode(node, depth) {
  switch (node.nodeType) {
    case Node.ELEMENT_NODE: {
      if (!depth) {
        const html = node.outerHTML;
        return html.length > MAX_HTML_LENGTH ? `${html.slice(0, MAX_HTML_LENGTH)}…` : html;
      }
      const attributes = Array.from(node.attributes, ({name, value}) => ` ${name}="${value}"`).join('');
      return `<${node.localName}${attributes}>`;
    }
    case Node.TEXT_NODE: return `#text ${JSON.stringify(node.data)}`;
    case Node.COMMENT_NODE: return `<!--${node.data}-->`;
    case Node.DOCUMENT_NODE: return '#document';
    case Node.DOCUMENT_FRAGMENT_NODE: return '#document-fragment';
    default: return node.nodeName;
  }
}

/**
 * Turns the arguments given to a console function into what is sent to the
 * viewer.  Like the browser's console, a first argument with placeholders
 * (eg. "%s") has the arguments after it put into it.
 * @param {any[]} args
 * @returns {{kind: string, text: string}[]}
 */
function toParts(args) {
  if ('string' === typeof args[0] && args.length > 1 && /%[sdifoOc]/.test(args[0])) {
    const rest = args.slice(1);
    const text = args[0].replace(/%([sdifoOc%])/g, (match, letter) => {
      if (letter === '%') return '%';
      if (!rest.length) return match;
      const value = rest.shift();
      switch (letter) {
        case 's': return 'string' === typeof value ? value : preview(value, 1);
        case 'd':
        case 'i': return 'symbol' === typeof value ? 'NaN' : `${parseInt(value, 10)}`;
        case 'f': return 'symbol' === typeof value ? 'NaN' : `${parseFloat(value)}`;
        // Styles aren't supported.
        case 'c': return '';
        default: return preview(value, 1);
      }
    });
    args = [text, ...rest];
  }
  return args.map(value => toPart(value));
}

/**
 * The values that can be expanded in the viewer's console (by their IDs).
 * Only the newest ones are kept (so that code that logs a lot doesn't keep
 * everything that it logged from being freed).
 * @type {Map<number, Object>}
 */
const expandableValues = new Map();
const MAX_EXPANDABLE_VALUES = 5000;
let lastExpandableId = 0;

/**
 * Whether a value has something to show when it is expanded in the console.
 * @param {*} value
 * @returns {boolean}
 */
function isExpandable(value) {
  if (value === null || 'object' !== typeof value) return false;
  if (value instanceof Node) return value.hasChildNodes();
  // These are shown in full already (or have nothing more to show).
  return !(value instanceof Error || value instanceof Date || value instanceof RegExp || value instanceof Promise);
}

/**
 * Turns a value into what the viewer's console shows.  Values that can be
 * expanded get an ID which the viewer uses to ask for their properties.
 * @param {*} value
 * @param {number=} depth
 * @returns {{kind: string, text: string, id?: number}}
 */
function toPart(value, depth = 0) {
  const part = {kind: getKind(value), text: preview(value, depth)};
  if (isExpandable(value)) {
    part.id = ++lastExpandableId;
    expandableValues.set(part.id, value);
    if (expandableValues.size > MAX_EXPANDABLE_VALUES) expandableValues.delete(expandableValues.keys().next().value);
  }
  return part;
}

/**
 * Whether a prototype is one of the browser's own (eg. Array.prototype) which
 * isn't shown when an object is expanded.
 * @param {Object} proto
 * @returns {boolean}
 */
function isBuiltInPrototype(proto) {
  try {
    return proto === Object.prototype || /\[native code\]\s*\}$/.test(Function.prototype.toString.call(proto.constructor));
  }
  catch (e) {
    return true;
  }
}

/**
 * Gets what is shown when a value is expanded in the viewer's console.
 * Getters aren't called (so that expanding a value has no side effects).
 * @param {Object} value
 * @returns {{key: string, separator?: string, kind: string, text: string, id?: number}[]}
 */
function getChildren(value) {
  const children = [];
  let total = 0;
  const add = (key, part, separator) => {
    total++;
    if (children.length < MAX_CHILDREN) children.push({key, ...separator && {separator}, ...part});
  };
  try {
    if (value instanceof Map) {
      for (const [key, item] of value) add(preview(key, 1), toPart(item, 1), ' => ');
    }
    else if (value instanceof Set) {
      let index = 0;
      for (const item of value) add(`${index++}`, toPart(item, 1));
    }
    else if (value instanceof Node) {
      for (const child of value.childNodes) add('', toPart(child, 1), '');
    }
    else {
      for (const key of Reflect.ownKeys(value)) {
        const name = 'symbol' === typeof key ? `[${key.toString()}]` : key;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        add(name, descriptor && !('value' in descriptor)
          ? {kind: 'getter', text: descriptor.get ? '(\u2026)' : 'undefined'}
          : toPart(descriptor?.value, 1));
      }
      const proto = Object.getPrototypeOf(value);
      if (proto && !isBuiltInPrototype(proto)) add('[[Prototype]]', toPart(proto, 1));
    }
  }
  catch (e) {
    add('', {kind: 'error', text: `${e}`}, '');
  }
  if (total > children.length) children.push({key: '', separator: '', kind: 'null', text: `\u2026 ${total - children.length} more`});
  return children;
}

/**
 * Gets what console.table() shows (like the browser's console).
 * @param {*} data
 * @param {*} columns
 *   If given, the properties to show.
 * @returns {{columns: string[], rows: ({kind: string, text: string}?)[][]}?}
 *   Null if the data can't be shown as a table.
 */
function toTable(data, columns) {
  if (data === null || 'object' !== typeof data) return null;
  const entries = data instanceof Map ? Array.from(data, ([key, row]) => [preview(key, 1), row])
    : data instanceof Set ? Array.from(data, (row, index) => [`${index}`, row])
    : Object.keys(data).map(key => [key, data[key]]);
  const rows = entries.slice(0, MAX_TABLE_ROWS);
  const isObject = row => row !== null && ('object' === typeof row || 'function' === typeof row);
  const cell = (row, key) => {
    try {
      return toPart(key == null ? row : row[key], 1);
    }
    catch (e) {
      return {kind: 'error', text: `${e}`};
    }
  };
  const keys = new Set();
  let hasValues = false;
  for (const [, row] of rows) {
    if (isObject(row)) Object.keys(row).forEach(key => keys.add(key));
    else hasValues = true;
  }
  const columnKeys = Array.isArray(columns) ? columns.map(key => `${key}`) : [...keys];
  return {
    columns: ['(index)', ...columnKeys, ...hasValues ? ['Value'] : []],
    rows: rows.map(([key, row]) => [
      {kind: 'index', text: key},
      ...columnKeys.map(columnKey => isObject(row) && columnKey in row ? cell(row, columnKey) : null),
      ...hasValues ? [isObject(row) ? null : cell(row)] : [],
    ]),
  };
}

/**
 * Gets an error's stack with the result's URL (a long data URL which has all
 * of the code in it) shortened to "result".
 * @param {*} error
 * @returns {string}
 */
function getStack(error) {
  return `${error?.stack ?? ''}`.split(location.href).join('result');
}

/**
 * Gets where an error happened in the user's JavaScript.
 * @param {*} error
 * @returns {{line: number, column: number}?}
 */
function getScriptLocation(error) {
  // (Not eg. "typescript.js" from a library.)
  const match = new RegExp(`(?<![\\w./-])${SCRIPT_NAME.replace('.', '\\.')}:(\\d+):(\\d+)`).exec(getStack(error));
  return match ? {line: +match[1], column: +match[2]} : null;
}

let groupDepth = 0;

/**
 * Sends a message to the viewer's console.
 * @param {"log"|"info"|"debug"|"warn"|"error"|"result"} level
 * @param {any[]} args
 * @param {Object=} extra
 */
function log(level, args, extra) {
  send('log', {level, parts: toParts(args), depth: groupDepth, ...extra});
}

const counts = new Map();
const timers = new Map();
const ORIGINAL_CONSOLE = {...console};

// What each console function shows in the viewer (besides what the browser
// shows in its own console).
const CONSOLE_FUNCS = {
  log: (...args) => log('log', args),
  info: (...args) => log('info', args),
  debug: (...args) => log('debug', args),
  warn: (...args) => log('warn', args),
  error: (...args) => log('error', args),
  dir: value => log('log', [value]),
  dirxml: (...args) => log('log', args),
  table: (data, columns) => {
    const table = toTable(data, columns);
    if (table) send('log', {level: 'log', parts: [], table, depth: groupDepth});
    else log('log', [data]);
  },
  trace: (...args) => log('log', args.length ? args : ['console.trace']),
  assert: (condition, ...args) => {
    if (!condition) {
      log('error', 'string' === typeof args[0]
        ? [`Assertion failed: ${args[0]}`, ...args.slice(1)]
        : ['Assertion failed', ...args]);
    }
  },
  clear: () => send('clear'),
  count: (label = 'default') => {
    counts.set(`${label}`, (counts.get(`${label}`) ?? 0) + 1);
    log('log', [`${label}: ${counts.get(`${label}`)}`]);
  },
  countReset: (label = 'default') => counts.delete(`${label}`),
  time: (label = 'default') => timers.set(`${label}`, performance.now()),
  timeLog: (label = 'default', ...args) => {
    if (timers.has(`${label}`)) log('log', [`${label}: ${performance.now() - timers.get(`${label}`)} ms`, ...args]);
  },
  timeEnd: (label = 'default') => {
    if (timers.has(`${label}`)) log('log', [`${label}: ${performance.now() - timers.get(`${label}`)} ms`]);
    timers.delete(`${label}`);
  },
  group: (...args) => {
    log('log', args.length ? args : ['console.group']);
    groupDepth++;
  },
  groupCollapsed: (...args) => CONSOLE_FUNCS.group(...args),
  groupEnd: () => {
    groupDepth = Math.max(0, groupDepth - 1);
  },
};

for (const [name, func] of Object.entries(CONSOLE_FUNCS)) {
  const original = ORIGINAL_CONSOLE[name];
  console[name] = function(...args) {
    try {
      func(...args);
    }
    catch (e) {}
    return original?.apply(this, args);
  };
}

/**
 * Sends an uncaught error to the viewer's console.
 * @param {string} prefix
 * @param {*} error
 * @param {{line: number, column: number}?} location
 */
function logUncaught(prefix, error, location) {
  const text = error instanceof Error
    ? `${prefix} ${error.name}: ${error.message}`
    : `${prefix} ${preview(error, 1)}`;
  send('log', {
    level: 'error',
    parts: [{kind: 'error', text}],
    depth: 0,
    location: location ?? getScriptLocation(error),
  });
}

addEventListener('error', event => {
  // Safari doesn't use the script's name (see yourjsPageRunJs()) so errors
  // while the user's JavaScript is running (and not in a function called from
  // it) are known to be in it.
  const isInScript = event.filename === SCRIPT_NAME
    || (isRunningScript && !getStack(event.error).includes(SCRIPT_NAME));
  // Errors from scripts loaded from other origins only have a message (eg.
  // "Script error.").
  if (event.error == null && !isInScript) {
    send('log', {level: 'error', parts: [{kind: 'error', text: event.message}], depth: 0});
    return;
  }
  logUncaught('Uncaught', event.error, isInScript ? {line: event.lineno, column: event.colno} : null);
});

// Libraries (and other files) that fail to load.  Their errors don't bubble
// so they are caught while capturing.
addEventListener('error', event => {
  const {target} = event;
  if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) {
    send('log', {
      level: 'error',
      parts: [{kind: 'error', text: `Failed to load ${target.src || target.href}`}],
      depth: 0,
    });
  }
}, true);

addEventListener('unhandledrejection', event => {
  logUncaught('Uncaught (in promise)', event.reason);
});

// Runs code typed into the viewer's console and sends the properties of
// values that are expanded in it.
addEventListener('message', event => {
  const data = event.data;
  if (event.source !== VIEWER || data?.yourjsPage !== RUN_ID) return;
  if (data.type === 'expand') {
    const value = expandableValues.get(data.id);
    send('children', {requestId: data.requestId, children: value ? getChildren(value) : []});
    return;
  }
  if (data.type !== 'eval') return;
  let result;
  try {
    // An indirect eval runs the code in the global scope.
    result = (0, eval)(`${data.code}\n//# sourceURL=console.js`);
  }
  catch (error) {
    logUncaught('Uncaught', error, null);
    return;
  }
  send('log', {level: 'result', parts: [toPart(result, 'string' === typeof result ? 1 : 0)], depth: 0});
});

// The viewer adds a call to this at the start of the body of every loop in
// the JavaScript (see protectLoops() in the viewer).  It stops loops once the
// code has been running loops for longer than config.loopTimeout without a
// break (eg. awaiting a timer) so that a loop that never ends can't freeze the
// page.
let loopTaskStart = null;
const stoppedLoopLines = new Set();
window.__yourjsPageLoopGuard = line => {
  const now = performance.now();
  if (loopTaskStart == null) {
    loopTaskStart = now;
    // This runs once the code gives the browser a break.
    setTimeout(() => {
      loopTaskStart = null;
      stoppedLoopLines.clear();
    });
    return false;
  }
  if (now - loopTaskStart < config.loopTimeout) return false;
  if (!stoppedLoopLines.has(line)) {
    stoppedLoopLines.add(line);
    send('log', {
      level: 'warn',
      parts: [{
        kind: 'string',
        text: `The loop on line ${line} was stopped because the code ran for more than ${config.loopTimeout / 1000} seconds without a break.`,
      }],
      depth: 0,
      location: {line, column: 1},
    });
  }
  return true;
};

// The time that loops spend waiting for alert(), confirm() or prompt() (eg.
// asking until an answer is given) isn't counted.
for (const name of ['alert', 'confirm', 'prompt']) {
  const original = window[name];
  window[name] = function(...args) {
    try {
      return original.apply(this, args);
    }
    finally {
      if (loopTaskStart != null) loopTaskStart = performance.now();
    }
  };
}

// Tells the viewer that the code finished running (the page has been parsed
// and the JavaScript at the end of the body has run).
document.addEventListener('DOMContentLoaded', () => send('loaded'));

// Links to a part of the page (eg. href="#top") scroll to it.  Otherwise they
// would go to that part of the page that the result is in since relative URLs
// are relative to it (see the <base> added by the viewer).
addEventListener('click', event => {
  const link = event.target instanceof Element && event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || (link.target && link.target !== '_self')) return;
  event.preventDefault();
  let id = link.getAttribute('href').slice(1);
  try {
    id = decodeURIComponent(id);
  }
  catch (e) {}
  const target = id ? document.getElementById(id) ?? document.getElementsByName(id)[0] : document.documentElement;
  target?.scrollIntoView();
});

// The shortcut for running the code also works in the result.
addEventListener('keydown', event => {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const isCommandKey = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (isCommandKey && event.key === 'Enter' && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    send('run');
  }
}, true);

/**
 * Runs the user's JavaScript.  It is called by a script at the end of the
 * body so that the code runs before DOMContentLoaded (like a script at the
 * end of the body would).
 * @param {string} js
 */
let isRunningScript = false;

// (A function declaration is used so that its name (which is used to find it
// in stack traces) isn't removed when it is minified.)
window.yourjsPageRunJs = yourjsPageRunJs;
function yourjsPageRunJs(js) {
  delete window.yourjsPageRunJs;
  // The script that called this isn't part of the user's HTML.
  document.currentScript?.remove();
  const script = document.createElement('script');
  // The name makes errors and the browser's dev tools point to the code.
  script.textContent = `${js}\n//# sourceURL=${SCRIPT_NAME}`;
  // The script runs as soon as it is added.
  isRunningScript = true;
  try {
    document.body.append(script);
  }
  finally {
    isRunningScript = false;
  }
  script.remove();
}

// This script isn't part of the user's HTML either.
document.currentScript?.remove();
