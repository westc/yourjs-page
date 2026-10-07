/**
 * Types for the `YourJSPage` global that yourjs-page.min.js defines.
 *
 * To use them in a page's scripts (eg. in VS Code), add this to the top of a
 * JavaScript file:
 *   /// <reference types="yourjs-page" />
 */

/** The code of a page. */
export interface YourJSPageCode {
  html: string;
  css: string;
  js: string;
  /** The URLs of the CSS libraries (in the order they are added). */
  cssUrls: string[];
  /** The URLs of the JavaScript libraries (in the order they are added). */
  jsUrls: string[];
}

/** The options that are the same as the `data-*` attributes of the script. */
export interface YourJSPageSettings {
  /**
   * Where the editors go:  `"top"` (above the result), `"left"`, `"right"` or
   * `"tabs"` (one thing at a time).  If not given, the editors are on top
   * unless the page is narrower than 600px, in which case tabs are used.
   */
  layout?: 'top' | 'left' | 'right' | 'tabs';
  /**
   * Where the menu (the toolbar with the Run button) goes:  `"bottom"` (the
   * default, like YourJS Box) or `"top"`.
   */
  menu?: 'bottom' | 'top';
  /**
   * Which tab is shown first in the tabs layout.  Defaults to `"result"`.
   */
  tab?: 'html' | 'css' | 'js' | 'result';
  /**
   * `"light"` or `"dark"`.  If not given, the system's color scheme is used.
   */
  theme?: 'light' | 'dark';
  /** A title that is shown in the toolbar (and in the result's tab). */
  title?: string;
  /**
   * The CSS height of the page (a number is treated as pixels).  If not given
   * the page fills its container but is never less than 400px tall.
   */
  height?: string | number;
  /** Wraps long lines in the editors.  Defaults to `false`. */
  wordWrap?: boolean | 'true' | 'false';
  /** Stops the code from being edited.  Defaults to `false`. */
  readOnly?: boolean | 'true' | 'false';
  /** Shows the console when the page loads.  Defaults to `false`. */
  showConsole?: boolean | 'true' | 'false';
  /**
   * `"lazy"` (the default) waits to load the page until it is about to be
   * scrolled into view.  `"eager"` loads it right away.
   */
  loading?: 'lazy' | 'eager';
  /**
   * The editors that start expanded (eg. `["html", "js"]` or `"html js"`).
   * The others start collapsed (and can be expanded).  An empty list (or
   * `""`) starts with every editor collapsed.  Defaults to all of them.
   */
  editors?: ('html' | 'css' | 'js')[] | string;
  /**
   * How long (in milliseconds) loops can keep the page busy before they are
   * stopped (so that a loop that never ends can't freeze the page).  `0` turns
   * this off.  Defaults to `2000`.
   */
  loopTimeout?: number | string;
  /**
   * `false` hides the search for libraries on cdnjs in the Libraries dialog
   * (libraries can still be added by URL).  Defaults to `true`.
   */
  librarySearch?: boolean | 'true' | 'false';
  /**
   * Where Ace, js-beautify and Acorn are loaded from.  `{name}` and
   * `{version}` are replaced with each library's name and version.  Defaults
   * to `"https://unpkg.com/{name}@{version}/"`.
   */
  librariesUrl?: string;
}

export interface YourJSPageOptions extends YourJSPageSettings {
  /** The element (or a CSS selector for it) that the page is placed relative to. */
  target: string | Element;
  /**
   * Where the page goes:  `"fill"` (the default) replaces the target's
   * contents, `"append"` and `"prepend"` add it inside of the target,
   * `"replace"` replaces the target itself and `"before"` and `"after"` add it
   * next to the target.
   */
  placement?: 'fill' | 'append' | 'prepend' | 'replace' | 'before' | 'after';
  /** The HTML that the page starts with (wins over `htmlSelector`, `htmlUrl` and `gist`). */
  html?: string;
  /** The CSS that the page starts with (wins over `cssSelector`, `cssUrl` and `gist`). */
  css?: string;
  /** The JavaScript that the page starts with (wins over `jsSelector`, `jsUrl` and `gist`). */
  js?: string;
  /** A CSS selector for the element whose text is the starting HTML (wins over `htmlUrl`). */
  htmlSelector?: string;
  /** A CSS selector for the element whose text is the starting CSS (wins over `cssUrl`). */
  cssSelector?: string;
  /** A CSS selector for the element whose text is the starting JavaScript (wins over `jsUrl`). */
  jsSelector?: string;
  /** The URL (relative to the page) of a file with the starting HTML (wins over `gist`). */
  htmlUrl?: string;
  /** The URL (relative to the page) of a file with the starting CSS (wins over `gist`). */
  cssUrl?: string;
  /** The URL (relative to the page) of a file with the starting JavaScript (wins over `gist`). */
  jsUrl?: string;
  /**
   * The URL or ID of a gist with the starting code (used for each language
   * without code, a selector or a URL).
   */
  gist?: string;
  /** The name of the gist's file with the HTML (found by its name if not given). */
  gistHtml?: string;
  /** The name of the gist's file with the CSS (found by its name if not given). */
  gistCss?: string;
  /** The name of the gist's file with the JavaScript (found by its name if not given). */
  gistJs?: string;
  /**
   * The URLs of CSS libraries to start with (an array or a string with the
   * URLs separated by whitespace).
   */
  cssUrls?: string[] | string;
  /**
   * The URLs of JavaScript libraries to start with (an array or a string with
   * the URLs separated by whitespace).
   */
  jsUrls?: string[] | string;
}

export interface YourJSPageInstance {
  /** The IFRAME that holds the page. */
  readonly element: HTMLIFrameElement;
  /**
   * Gets the code that is currently in the editors.  Code that is still being
   * loaded from a URL is empty until it is loaded.
   */
  getCode(): YourJSPageCode;
  /**
   * Replaces the code in some (or all) of the editors (and the libraries if
   * `cssUrls` or `jsUrls` is given) and runs it unless `{run: false}` is
   * given.
   */
  setCode(code: Partial<YourJSPageCode>, options?: {run?: boolean}): void;
  /** Runs the code that is in the editors. */
  run(): void;
  /** Removes the page and stops its code. */
  destroy(): void;
}

export interface YourJSPageStatic {
  /** The version of YourJS Page that was loaded. */
  readonly version: string;
  /** Creates a page. */
  create(options: YourJSPageOptions): YourJSPageInstance;
}

declare global {
  interface Window {
    YourJSPage: YourJSPageStatic;
  }
  const YourJSPage: YourJSPageStatic;
}
