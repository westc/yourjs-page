/**
 * Releases a new version to GitHub, npm and the CDNs.
 *
 * Usage:  npm run release -- <patch|minor|major> [--skip-tests] [--dry-run]
 *
 * 1. Checks that you're on an up to date, clean main branch.
 * 2. Runs the tests (unless --skip-tests is given).
 * 3. Runs `npm version`, which rebuilds dist, moves the notes under
 *    "Unreleased" in CHANGELOG.md into a section for the new version (see
 *    update-changelog.js), commits and tags.
 * 4. Pushes main and then the tag separately (GitHub Pages doesn't always
 *    deploy when a branch and a tag are pushed together).
 * 5. Publishes to npm (which asks for your 2FA).
 * 6. Waits for npm to list the new version and then purges jsDelivr's cache
 *    so that the yourjs-page@1 style URLs point to it.
 *
 * With --dry-run the checks are run but nothing is changed.
 */

const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const {purgeCdn} = require('./purge-cdn.js');
const changelog = require('./update-changelog.js');

const ROOT = path.resolve(__dirname, '..');
const RELEASE_TYPES = ['patch', 'minor', 'major'];
const NPM_WAIT_MS = 15 * 60 * 1000;
const NPM_POLL_MS = 15 * 1000;

const args = process.argv.slice(2);
const releaseType = args.find(arg => !arg.startsWith('--'));
const isDryRun = args.includes('--dry-run');
const skipTests = args.includes('--skip-tests');

/**
 * Runs a command (showing its output) and stops the release if it fails.
 * @param {string} command
 * @param {string[]} commandArgs
 * @param {{capture?: boolean, changesSomething?: boolean}=} options
 *   `capture` returns the output instead of showing it.  `changesSomething`
 *   skips the command in a dry run.
 * @returns {string}
 */
function run(command, commandArgs, {capture, changesSomething} = {}) {
  const display = `${command} ${commandArgs.join(' ')}`;
  if (changesSomething && isDryRun) {
    console.log(`\n[dry run] Would run:  ${display}`);
    return '';
  }
  if (!capture) console.log(`\n$ ${display}`);
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail(`\`${display}\` failed.${capture && result.stderr ? `\n${result.stderr.trim()}` : ''}`);
  }
  return (result.stdout || '').trim();
}

function fail(message) {
  console.error(`\nRelease stopped:  ${message}`);
  process.exit(1);
}

const readPackage = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

(async () => {
  if (!RELEASE_TYPES.includes(releaseType)) {
    fail(`Give the type of release:  npm run release -- <${RELEASE_TYPES.join('|')}> [--skip-tests] [--dry-run]`);
  }

  // 1. Checks
  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {capture: true});
  if (branch !== 'main') fail(`Switch to main first (you're on ${branch}).`);
  if (run('git', ['status', '--porcelain'], {capture: true})) fail('Commit or stash your changes first.');
  run('git', ['fetch', '--quiet', 'origin'], {capture: true});
  const behind = +run('git', ['rev-list', '--count', 'HEAD..origin/main'], {capture: true});
  if (behind) fail(`main is ${behind} commit(s) behind origin/main.  Pull first.`);

  const {name, version: oldVersion} = readPackage();
  console.log(`Releasing a ${releaseType} version of ${name} (currently ${oldVersion})${isDryRun ? ' as a dry run' : ''}.`);

  // The new version needs notes in the changelog (unless it already has a
  // section for it).
  const nextVersion = changelog.getNextVersion(oldVersion, releaseType);
  const changelogText = fs.readFileSync(changelog.CHANGELOG_PATH, 'utf8');
  if (!changelog.hasVersion(changelogText, nextVersion)) {
    if (!changelog.getUnreleasedNotes(changelogText)) {
      fail(`Add notes for ${nextVersion} under "## [Unreleased]" in CHANGELOG.md (and commit them) first.`);
    }
    console.log(`The notes under "Unreleased" in CHANGELOG.md will become ${nextVersion}.`);
  }

  // 2. Tests
  if (!skipTests) {
    run('npm', ['test']);
    // The tests rebuild dist/ which should match what is committed.
    if (run('git', ['status', '--porcelain'], {capture: true})) {
      fail('Running the tests rebuilt files that differ from what is committed (eg. dist/).  Commit them first.');
    }
  }

  // 3. Version
  run('npm', ['version', releaseType], {changesSomething: true});
  const version = isDryRun ? `(next ${releaseType} version)` : readPackage().version;

  // 4. Push main and then the tag
  run('git', ['push'], {changesSomething: true});
  run('git', ['push', '--follow-tags'], {changesSomething: true});

  // 5. Publish
  run('npm', ['publish'], {changesSomething: true});

  if (isDryRun) {
    console.log('\n[dry run] Would wait for npm to list the new version and then purge jsDelivr\'s cache.');
    await purgeCdn({name, version: oldVersion, dryRun: true});
    console.log('\nDry run finished.  Nothing was changed.');
    return;
  }

  // 6. Wait for npm and then purge jsDelivr
  console.log(`\nWaiting for npm to list ${name}@${version} (this usually takes a few minutes)...`);
  const startTime = Date.now();
  while (true) {
    const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--prefer-online'], {
      cwd: ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (result.stdout?.trim() === version) break;
    if (Date.now() - startTime > NPM_WAIT_MS) {
      fail(`npm still doesn't list ${version}.  Once it does, run \`npm run purge-cdn\`.`);
    }
    await new Promise(resolve => setTimeout(resolve, NPM_POLL_MS));
  }
  console.log(`npm lists ${version}.\n`);
  await purgeCdn({name, version});

  console.log(`\nReleased ${name}@${version}:`);
  console.log(`  https://www.npmjs.com/package/${name}`);
  console.log(`  https://cdn.jsdelivr.net/npm/${name}@${version}/dist/yourjs-page.min.js`);
  console.log('  GitHub Pages deploys from main in a minute or two.');
})();
