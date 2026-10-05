/**
 * Runs the tests in Chrome, WebKit (Safari's engine) and Firefox at the same
 * time.  Each browser's results are shown once it finishes, followed by a
 * summary.  Run it with `npm run test:all` (which builds first).  Any
 * arguments (eg. part of a test's name) are passed on to test/run.js.
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BROWSERS = ['chrome', 'webkit', 'firefox'];

/**
 * Runs the tests in one browser.
 * @param {string} browser
 * @returns {Promise<{browser: string, output: string, code: number, seconds: number}>}
 */
function runTests(browser) {
  const start = Date.now();
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(ROOT, 'test/run.js'), ...process.argv.slice(2)], {
      cwd: ROOT,
      env: { ...process.env, TEST_BROWSER: browser },
    });
    let output = '';
    child.stdout.on('data', data => output += data);
    child.stderr.on('data', data => output += data);
    child.on('close', code => resolve({ browser, output, code, seconds: (Date.now() - start) / 1000 }));
  });
}

(async () => {
  console.log(`Testing in ${BROWSERS.join(', ')} at the same time...\n`);
  const results = await Promise.all(BROWSERS.map(browser => runTests(browser).then(result => {
    console.log(`${'='.repeat(20)} ${browser} (${result.seconds.toFixed(0)} s) ${'='.repeat(20)}`);
    console.log(result.output.trimEnd(), '\n');
    return result;
  })));

  console.log('Summary:');
  for (const { browser, output, code } of results) {
    const summary = /\d+ passed, \d+ failed/.exec(output)?.[0] ?? 'did not finish';
    console.log(`  ${code ? '✗' : '✓'} ${browser.padEnd(8)} ${summary}`);
  }
  process.exit(results.some(result => result.code) ? 1 : 0);
})();
