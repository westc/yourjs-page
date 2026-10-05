/**
 * Makes og-image.png (the picture shown when the landing page is shared) by
 * taking a screenshot of a page with a real YourJS Page in Chrome.  Run it
 * with `npm run og-image` after `npm run build`.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'og-image.png');

const HTML = `<main class="card">
  <h1>Hello, <span>world</span>!</h1>
  <button>Click me</button>
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
span { color: tomato; }`;

const JS = `document.querySelector('button').onclick = () => {
  console.log('Clicked!');
};`;

const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yourjs-page-og-'));
  const pagePath = path.join(dir, 'og.html');
  fs.writeFileSync(pagePath, `<!DOCTYPE html>
    <html><head><style>
      html, body { margin: 0; height: 100%; overflow: hidden; }
      body {
        background: radial-gradient(circle at 20% 10%, #2a2b2f, #17181a 70%);
        color: #e6e6e6;
        display: flex;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        gap: 40px;
        padding: 56px;
        box-sizing: border-box;
      }
      .text { display: flex; flex: 0 0 400px; flex-direction: column; justify-content: center; }
      .logo { align-items: center; display: flex; font-size: 40px; font-weight: 700; gap: 16px; letter-spacing: -0.01em; }
      .logo img { filter: drop-shadow(0 6px 12px rgb(0 0 0 / 0.35)); height: 68px; width: 68px; }
      .logo .your { font-weight: 400; opacity: 0.8; }
      h1 { font-size: 40px; letter-spacing: -0.03em; line-height: 1.12; margin: 30px 0 18px; }
      .highlight { background: linear-gradient(transparent 70%, rgb(34 163 90 / 0.45) 70%); }
      p { color: #9aa0a6; font-size: 19px; line-height: 1.5; margin: 0; }
      .page { border-radius: 10px; box-shadow: 0 12px 40px rgb(0 0 0 / 0.5); flex: 1; overflow: hidden; }
    </style></head>
    <body>
      <div class="text">
        <div class="logo"><img src="${path.join(ROOT, 'logo.svg')}" alt=""><span><span class="your">Your</span>JS Page</span></div>
        <h1>An HTML, CSS &amp; JS playground you can <span class="highlight">drop into any page</span></h1>
        <p>One script tag. Live editors, a console, libraries from cdnjs and code from files or gists.</p>
      </div>
      <div class="page">
        <script src="${path.join(ROOT, 'dist/yourjs-page.min.js')}" data-theme="dark" data-layout="left" data-height="518" data-loading="eager"
          data-html-selector="#html" data-css-selector="#css" data-js-selector="#js"></script>
      </div>
      <pre id="html" hidden>${escapeHtml(HTML)}</pre>
      <pre id="css" hidden>${escapeHtml(CSS)}</pre>
      <pre id="js" hidden>${escapeHtml(JS)}</pre>
    </body></html>`);

  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + pagePath);
  const viewer = await (await page.waitForSelector('iframe')).contentFrame();
  await viewer.waitForFunction(() => document.querySelector('#splash')?.classList.contains('hidden'), null, { timeout: 30000 });
  // Gives the result more room and shows something in the console.
  await viewer.evaluate(() => document.querySelector('#editors').style.flexGrow = '1.1');
  const result = await (await viewer.waitForSelector('#result iframe')).contentFrame();
  await result.click('button');
  await result.click('button');
  await viewer.click('#console-button');
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUTPUT });
  await browser.close();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`Saved ${path.relative(ROOT, OUTPUT)}`);
})();
