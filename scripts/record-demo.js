/**
 * Records demo.gif (shown at the top of the README) by scripting a page in
 * Chrome and turning screenshots of it into a GIF with ffmpeg.  Run it with
 * `npm run record-demo` after `npm run build` (ffmpeg must be installed).
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'demo.gif');
const WIDTH = 960;
const HEIGHT = 540;

const HTML = `<main class="card">
  <h1>Hello, <span id="name">world</span>!</h1>
  <button id="button">Click me</button>
  <p id="count">Not clicked yet</p>
</main>`;

const CSS = `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 90vh;
  background: #eef2ff;
}
.card {
  background: white;
  padding: 1em 2em;
  border-radius: 12px;
  box-shadow: 0 8px 24px #0002;
  text-align: center;
}
`;

const JS = `let clicks = 0;
document.getElementById('button').onclick = () => {
  clicks++;
  const time = new Date().toLocaleTimeString();
  document.getElementById('count').textContent = \`Clicked \${clicks} times\`;
  console.log('Clicked!', {clicks, time});
};`;

// A fake mouse pointer so that the clicks can be seen.
const CURSOR_SVG = '<svg width="22" height="22" viewBox="0 0 16 16"><path d="M2 1l11 7-5 1 3 5-2 1-3-5-4 3z" fill="#fff" stroke="#000" stroke-width="1"/></svg>';

const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yourjs-page-demo-'));
  const pagePath = path.join(dir, 'demo.html');
  fs.writeFileSync(pagePath, `<!DOCTYPE html>
    <html><head><style>
      html, body { margin: 0; height: 100%; overflow: hidden; }
      #cursor { position: fixed; left: ${WIDTH * 0.6}px; top: ${HEIGHT * 0.6}px; z-index: 10; pointer-events: none;
        transition: left 0.6s ease-in-out, top 0.6s ease-in-out, transform 0.1s; }
      #cursor.pressed { transform: scale(0.8); }
    </style></head>
    <body>
      <div style="height: 100%">
        <script src="${path.join(ROOT, 'dist/yourjs-page.min.js')}" data-theme="dark" data-title="My demo" data-layout="top"
          data-html-selector="#html" data-css-selector="#css" data-js-selector="#js"></script>
      </div>
      <pre id="html" hidden>${escapeHtml(HTML)}</pre>
      <pre id="css" hidden>${escapeHtml(CSS)}</pre>
      <pre id="js" hidden>${escapeHtml(JS)}</pre>
      <div id="cursor">${CURSOR_SVG}</div>
    </body></html>`);

  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
  await page.goto('file://' + pagePath);
  const viewer = await (await page.waitForSelector('iframe')).contentFrame();
  await viewer.waitForFunction(() => document.querySelector('#splash')?.classList.contains('hidden'), null, { timeout: 30000 });
  await page.waitForTimeout(800);

  // Takes screenshots until stopped, remembering when each one was taken.
  const frames = [];
  let isRecording = true;
  const recording = (async () => {
    while (isRecording) {
      frames.push({ buffer: await page.screenshot(), time: Date.now() });
    }
  })();

  const wait = ms => page.waitForTimeout(ms);
  /**
   * Moves the pointer to an element (in the viewer or in the result) and
   * clicks it.
   * @param {import('playwright-core').Frame} frame
   * @param {string} selector
   * @param {{offsetX?: number, offsetY?: number}=} options
   *   Where to click as a fraction of the element's size.
   */
  async function click(frame, selector, { offsetX = 0.5, offsetY = 0.5 } = {}) {
    const element = await frame.waitForSelector(selector);
    const box = await element.boundingBox();
    const x = box.x + box.width * offsetX;
    const y = box.y + box.height * offsetY;
    await page.evaluate(({ x, y }) => Object.assign(document.querySelector('#cursor').style, { left: x - 3 + 'px', top: y - 2 + 'px' }), { x, y });
    await wait(750);
    await page.evaluate(() => document.querySelector('#cursor').classList.add('pressed'));
    // (Clicking with the mouse doesn't always reach the result's IFRAME in a
    // headless browser.)
    await element.evaluate(target => target.click());
    await wait(120);
    await page.evaluate(() => document.querySelector('#cursor').classList.remove('pressed'));
  }
  const getResult = async () => (await viewer.waitForSelector('#result iframe')).contentFrame();

  // Uses the result.
  await wait(500);
  await click(await getResult(), '#button');
  await wait(500);
  await click(await getResult(), '#button');
  await wait(800);

  // Shows what was logged.
  await click(viewer, '#console-button');
  await wait(800);
  await click(viewer, '.entry:last-child .expander', { offsetX: 0.1 });
  await wait(1400);

  // Changes the CSS and runs it.
  await viewer.evaluate(() => {
    const editor = ace.edit(document.querySelector('.panel[data-lang="css"] .editor'));
    editor.gotoLine(editor.session.getLength(), 0);
  });
  await click(viewer, '.panel[data-lang="css"] .ace_content', { offsetX: 0.5, offsetY: 0.92 });
  await viewer.evaluate(() => {
    const editor = ace.edit(document.querySelector('.panel[data-lang="css"] .editor'));
    editor.focus();
    editor.gotoLine(editor.session.getLength(), 0);
    editor.scrollToLine(editor.session.getLength(), false, false);
  });
  await page.keyboard.type('#name { color: tomato; }', { delay: 70 });
  await wait(500);
  await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+Enter`);
  await wait(1500);

  // Changes the view.
  await click(viewer, '#layout-button');
  await wait(600);
  await click(viewer, '#layout-menu [data-layout="left"]');
  await wait(2500);

  isRecording = false;
  await recording;
  await browser.close();

  // Each frame is shown until the next one was taken.
  const list = frames.map(({ buffer, time }, index) => {
    const file = path.join(dir, `frame-${String(index).padStart(5, '0')}.png`);
    fs.writeFileSync(file, buffer);
    const duration = ((frames[index + 1]?.time ?? time + 100) - time) / 1000;
    return `file '${file}'\nduration ${duration}`;
  });
  // The concat demuxer ignores the last duration unless the file is repeated.
  list.push(list[list.length - 1].split('\n')[0]);
  fs.writeFileSync(path.join(dir, 'frames.txt'), list.join('\n'));

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'frames.txt'),
    '-vf', `fps=12,scale=${WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    '-loop', '0',
    OUTPUT,
  ], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`Saved ${path.relative(ROOT, OUTPUT)} (${frames.length} frames, ${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB)`);
})();
