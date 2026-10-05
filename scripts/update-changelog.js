/**
 * Moves the notes under "## [Unreleased]" in CHANGELOG.md into a section for
 * the version in package.json and updates the compare links at the bottom.
 *
 * `npm version` runs this (via the "version" script in package.json) after it
 * changes the version and before it commits, so the changelog is part of the
 * version's commit.  If the version already has a section (eg. it was added
 * by hand) the changelog is left alone.
 */

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.resolve(__dirname, '..', 'CHANGELOG.md');
const UNRELEASED_HEADING = '## [Unreleased]';

/**
 * @param {string} changelog
 * @returns {string}
 *   The notes under the Unreleased heading (an empty string if there are
 *   none).
 */
function getUnreleasedNotes(changelog) {
  const start = changelog.indexOf(UNRELEASED_HEADING);
  if (start < 0) throw new Error(`CHANGELOG.md has no "${UNRELEASED_HEADING}" heading.`);
  const notesStart = start + UNRELEASED_HEADING.length;
  const nextHeading = changelog.indexOf('\n## ', notesStart);
  return changelog.slice(notesStart, nextHeading < 0 ? undefined : nextHeading)
    // The link definitions at the bottom (eg. "[Unreleased]: ...") aren't
    // notes.
    .replace(/^\[[^\]]+\]:\s.*$/gm, '')
    .trim();
}

/**
 * @param {string} changelog
 * @param {string} version
 * @returns {boolean}
 */
function hasVersion(changelog, version) {
  return changelog.includes(`\n## [${version}]`);
}

/**
 * The version that `npm version <releaseType>` will change `version` to.
 * @param {string} version
 * @param {"patch"|"minor"|"major"} releaseType
 * @returns {string}
 */
function getNextVersion(version, releaseType) {
  const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
  if (releaseType === 'major') return `${major + 1}.0.0`;
  if (releaseType === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Starts a section for the version under the (now empty) Unreleased heading
 * and adds its compare link.
 * @param {string} changelog
 * @param {string} version
 * @param {string} date
 *   The release date (eg. "2026-10-05").
 * @returns {string}
 */
function releaseChangelog(changelog, version, date) {
  if (hasVersion(changelog, version)) return changelog;
  if (!getUnreleasedNotes(changelog)) {
    throw new Error(`CHANGELOG.md has nothing under "${UNRELEASED_HEADING}" for ${version}.`);
  }

  changelog = changelog.replace(UNRELEASED_HEADING, `${UNRELEASED_HEADING}\n\n## [${version}] - ${date}`);

  // [Unreleased]: .../compare/v1.0.0...HEAD  becomes
  // [Unreleased]: .../compare/v1.1.0...HEAD
  // [1.1.0]: .../compare/v1.0.0...v1.1.0
  // For the first release, [Unreleased]: .../commits/main  becomes
  // [Unreleased]: .../compare/v1.0.0...HEAD
  // [1.0.0]: .../releases/tag/v1.0.0
  return changelog
    .replace(
      /^\[Unreleased\]: (.+\/compare\/)(v\d+\.\d+\.\d+)\.\.\.HEAD$/m,
      (match, compareUrl, previousTag) => [
        `[Unreleased]: ${compareUrl}v${version}...HEAD`,
        `[${version}]: ${compareUrl}${previousTag}...v${version}`,
      ].join('\n')
    )
    .replace(
      /^\[Unreleased\]: (.+)\/commits\/main$/m,
      (match, repoUrl) => [
        `[Unreleased]: ${repoUrl}/compare/v${version}...HEAD`,
        `[${version}]: ${repoUrl}/releases/tag/v${version}`,
      ].join('\n')
    );
}

/**
 * Today's date in the local time zone (eg. "2026-10-05").
 * @returns {string}
 */
function getToday() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map(part => String(part).padStart(2, '0'))
    .join('-');
}

module.exports = {getUnreleasedNotes, hasVersion, getNextVersion, releaseChangelog, getToday, CHANGELOG_PATH};

if (require.main === module) {
  const {version} = require('../package.json');
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  if (hasVersion(changelog, version)) {
    console.log(`CHANGELOG.md already has a section for ${version}.`);
  }
  else {
    try {
      fs.writeFileSync(CHANGELOG_PATH, releaseChangelog(changelog, version, getToday()));
    }
    catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    console.log(`Moved the Unreleased notes in CHANGELOG.md into ${version}.`);
  }
}
