/**
 * Author: Chris West
 * Description:
 *   Responsible for updating the files in the dist directory.
 *
 *   src/main.js is the script that is loaded by the page.  The viewer (the
 *   editors, toolbar, result and console) runs inside of an IFRAME so its
 *   files are put into main.js wherever a placeholder like
 *   `[[JS_VIEWER_FILE_PLACEHOLDER]]` is found.
 */

const gulp = require('gulp');
const terser = require('terser');
const htmlMinifier = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const fs = require('fs');
const browserSync = require('browser-sync').create();

const cssViewerSrc = 'src/viewer.css';
const htmlViewerSrc = 'src/viewer.html';
const jsViewerSrc = 'src/viewer.js';
const jsPreviewRuntimeSrc = 'src/preview-runtime.js';
const jsSrc = 'src/main.js';
const typesSrc = 'src/yourjs-page.d.ts';
const dirDest = 'dist';
const outName = 'yourjs-page';

const pkg = require('./package.json');

// A license banner at the top of each dist file.  Minifiers keep comments that
// start with "/*!" so it also stays in the minified file.
const REPO_URL = pkg.repository.url.replace(/^git\+|\.git$/g, '');
const BANNER = `/*! ${pkg.name} v${pkg.version} | (c) 2026-present ${pkg.author} | ${pkg.license} License | ${REPO_URL} */\n`;

/**
 * Gets the values of the placeholders in main.js.
 * @param {boolean} useMinifiedJs
 *   If true the viewer and the preview runtime are minified.
 * @returns {Promise<{[name: string]: string}>}
 */
async function getPlaceholderValues(useMinifiedJs) {
  const read = path => fs.readFileSync(path, 'utf8');
  // The top-level functions in these files are only used by the rest of the
  // file so they are kept as they are (eg. not renamed).
  const minifyJs = async code => useMinifiedJs ? (await terser.minify(code)).code : code;
  return {
    // Information about this package that is shown in the viewer.
    PACKAGE_INFO: JSON.stringify({
      name: pkg.name,
      version: pkg.version,
      homepage: pkg.homepage,
      repoUrl: REPO_URL,
      bugsUrl: pkg.bugs.url,
    }),
    CSS_VIEWER: JSON.stringify(new CleanCSS().minify(read(cssViewerSrc)).styles),
    HTML_VIEWER: JSON.stringify(await htmlMinifier.minify(read(htmlViewerSrc), {
      collapseWhitespace: true,
      removeComments: true,
    })),
    JS_VIEWER: await minifyJs(read(jsViewerSrc)),
    JS_PREVIEW_RUNTIME: await minifyJs(read(jsPreviewRuntimeSrc)),
  };
}

/**
 * Replaces the placeholders in main.js (keeping the indentation of the ones
 * that are on their own lines).
 * @param {{[name: string]: string}} values
 * @returns {string}
 */
function fillPlaceholders(values) {
  return fs.readFileSync(jsSrc, 'utf8').replace(
    /((?<=^|\r|\n)(?:(?!\r|\n)\s)*|)\[\[\s*(\w+)_FILE_PLACEHOLDER\s*\]\]/g,
    (_, prefix, name) => {
      if (!(name in values)) throw new Error(`Unknown placeholder in ${jsSrc}:  ${name}`);
      return prefix ? values[name].replace(/^/gm, prefix) : values[name];
    }
  );
}

// Escapes every non-ASCII character (eg. "…" becomes "\\u2026") so that the
// files work even if they are served without a charset on a page that isn't
// UTF-8.  This is safe because the only non-ASCII characters are in strings,
// template literals, regular expressions and comments.
function escapeNonAscii(code) {
  return code.replace(/[^\x00-\x7F]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

function write(fileName, code) {
  fs.mkdirSync(dirDest, {recursive: true});
  fs.writeFileSync(`${dirDest}/${fileName}`, BANNER + escapeNonAscii(code));
}

// Builds:
// - yourjs-page.full.js with nothing minified (for debugging).
// - yourjs-page.js with the viewer minified.
// - yourjs-page.min.js with everything minified.
// - yourjs-page.d.ts (the TypeScript types for the YourJSPage global).
async function build() {
  write(`${outName}.full.js`, fillPlaceholders(await getPlaceholderValues(false)));

  const code = fillPlaceholders(await getPlaceholderValues(true));
  write(`${outName}.js`, code);

  // The functions that are turned into strings (eg. the viewer's code) can't
  // have their names changed or be dropped as unused.
  const minified = await terser.minify(code, {
    compress: {unused: false},
    mangle: false,
  });
  write(`${outName}.min.js`, minified.code);

  fs.copyFileSync(typesSrc, `${dirDest}/${outName}.d.ts`);
}

gulp.task('build', build);

// Watch for changes and rebuild.
gulp.task('watch', function () {
  return gulp.watch([cssViewerSrc, htmlViewerSrc, jsViewerSrc, jsPreviewRuntimeSrc, jsSrc, typesSrc], build);
});

// Serves the repo and reloads the browser whenever the dist files or the
// examples change.
gulp.task('serve', function (done) {
  browserSync.init({
    server: { baseDir: './' },
    startPath: '/',
    files: [`${dirDest}/*.js`, 'index.html', 'examples/**/*.html'],
    listen: 'localhost',
    notify: false,
    // Opens the examples in the default browser unless BROWSER=none is set
    // (eg. `BROWSER=none npm run dev`).
    open: process.env.BROWSER === 'none' ? false : 'local',
    ui: false,
  }, done);
});

// Default task: Build once and then watch for changes.
gulp.task('default', gulp.series('build', 'watch'));

// Build once, then watch for changes while serving the examples.
gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
