# Changelog

All notable changes to YourJS Page are listed here, newest first.  The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-10-05

### Added

- An About window (opened by clicking the logo or from the **&#8943;** menu)
  with the version, links, how the page is set up and the keyboard shortcuts,
  like YourJS Box's.  The shortcuts moved there from the **&#8943;** menu.
  Its **Embed** tab has the HTML and the JavaScript (`YourJSPage.create()`)
  for a copy of the page (with its current or original code), each with a
  **Copy** button.
- `data-menu="top"` (or the `menu` option) puts the menu (the toolbar with
  the **Run** button) at the top.
- Each editor has a **&#8942;** menu that formats, copies, saves (as
  `index.html`, `style.css` or `script.js`) or loads its code (instead of a
  format button), or pops the editor out into its own window until the window
  is closed.
- **Text size** in the **&#8943;** menu makes the editors' and the console's
  text smaller or bigger (and is remembered in the browser).
- A playground on the landing page's site (`playground.html`) that saves the
  code in the browser, makes links that open the code, opens gists (`?gist=`)
  and saves the code as a gist (with a GitHub token that can only change
  gists).

### Changed

- Like YourJS Box, the menu (the toolbar) is at the bottom (unless
  `data-menu="top"` is given), the logo is followed by "YourJS Page" and
  **Run** is on the right.
- The loading screen is shown for at least a second (instead of flashing).

## [1.0.1] - 2026-10-05

### Changed

- `data-editors` chooses which editors start expanded instead of which are
  shown.  The others start collapsed and can always be expanded, and
  `data-editors=""` starts with every editor collapsed (a bar of titles above
  the result or a thin column beside it).

### Fixed

- Pages with the same code in one document (or the same page opened in two
  tabs at once) could each think the other's code froze and not run.

## [1.0.0] - 2026-10-05

### Added

- A CodePen-like playground that replaces its script tag, with HTML, CSS and
  JS editors (Ace) whose starting code comes from the elements matched by
  `data-html-selector`, `data-css-selector` and `data-js-selector` (or from
  `<template>` elements).  A missing selector, or one that matches nothing,
  starts that editor with a comment saying so.
- `data-html-url`, `data-css-url` and `data-js-url` (and the `htmlUrl`,
  `cssUrl` and `jsUrl` options) load the starting code from files.
- `data-gist` (and `data-gist-html`, `data-gist-css` and `data-gist-js` to
  name the files) loads the starting code from a gist without GitHub's API
  (and its limit of 60 requests an hour).  GitHub's cache is skipped so edits
  to a gist show up right away.
- A dialog lists the code that couldn't be loaded from a URL or a gist, and
  those editors start with a comment saying what went wrong.
- Like JSBin, the HTML can be a whole document (with `<html>`, `<head>` and
  `<body>`) or just what goes in the body.  The libraries go at the start of
  the head, the CSS at the end of the head and the JavaScript at the end of
  the body.
- The code runs in a sandboxed IFRAME when the page loads and then whenever
  **Run** is clicked or <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Enter</kbd> is
  pressed.
- A console that shows what the code logs and its uncaught errors (with links
  to the line in the JS editor) and runs code typed into it.  Objects, arrays,
  maps, sets and elements can be expanded and `console.table()` shows a table.
- Loops that keep the page busy for more than 2 seconds are stopped (with a
  warning) so that a loop that never ends can't freeze the page
  (`data-loop-timeout` changes how long or turns this off).  If the code that
  a page starts with didn't finish running the last time, it isn't run
  automatically again.
- `data-editors` chooses which editors are shown (or only the result).
- Layouts with the editors on top, on the left or on the right of the result,
  or tabs (automatically used on narrow screens).  Editors can be collapsed
  and the dividers can be dragged.
- Formatting (js-beautify), opening the result in a new tab, full screen and
  resetting the code.
- Options:  `data-layout`, `data-tab`, `data-theme`, `data-title`,
  `data-height`, `data-word-wrap`, `data-read-only`, `data-show-console`,
  `data-loading` and `data-libraries-url`.
- A Libraries dialog that searches cdnjs (adding files with their integrity
  hashes) or takes any URL, and lets the CSS and JavaScript libraries be
  reordered and removed.  `data-css-urls` and `data-js-urls` start a page
  with libraries and `data-library-search="false"` hides the search.
- Downloading the code as an HTML file or as a ZIP file (`index.html`,
  `style.css` and `script.js`), and opening HTML and ZIP files (including
  CodePen exports).
- A logo and a loading screen.
- `YourJSPage.create()` for making pages from JavaScript, which returns an
  object with `getCode()`, `setCode()`, `run()` and `destroy()`, along with
  TypeScript types (`dist/yourjs-page.d.ts`).

[Unreleased]: https://github.com/westc/yourjs-page/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/westc/yourjs-page/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/westc/yourjs-page/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/westc/yourjs-page/releases/tag/v1.0.0
