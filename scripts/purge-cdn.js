/**
 * Purges jsDelivr's cache of the version range URLs (eg. yourjs-page@1) so that
 * they point to the latest version right away instead of after up to 12 hours.
 *
 * Usage:  npm run purge-cdn [-- --dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_FILES = ['yourjs-page.min.js', 'yourjs-page.js', 'yourjs-page.full.js'];

/**
 * @param {Object} options
 * @param {string} options.name
 *   The package's name.
 * @param {string} options.version
 *   The version that the range URLs should point to.
 * @param {boolean=} options.dryRun
 *   If `true` the URLs are only listed.
 */
async function purgeCdn({name, version, dryRun}) {
  const range = version.split('.')[0];
  for (const file of DIST_FILES) {
    const url = `https://purge.jsdelivr.net/npm/${name}@${range}/dist/${file}`;
    if (dryRun) {
      console.log(`Would purge ${url}`);
      continue;
    }
    const response = await fetch(url);
    console.log(`${response.ok ? 'Purged' : `Failed (${response.status}) to purge`} ${url}`);
  }
  if (dryRun) return;

  // Shows which version jsDelivr now serves for the range.
  const response = await fetch(`https://cdn.jsdelivr.net/npm/${name}@${range}/dist/${DIST_FILES[0]}`, {method: 'HEAD'});
  const servedVersion = response.headers.get('x-jsd-version');
  console.log(
    servedVersion === version
      ? `jsDelivr now serves ${name}@${range} as ${version}.`
      : `jsDelivr still serves ${name}@${range} as ${servedVersion}.  It can take a minute, so try \`npm run purge-cdn\` again if needed.`
  );
}

module.exports = {purgeCdn};

if (require.main === module) {
  const {name, version} = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  purgeCdn({name, version, dryRun: process.argv.includes('--dry-run')}).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
