#!/usr/bin/env node

/**
 * test-migrate-walton — regression test for scripts/migrate-toulmin-to-walton.js
 *
 * Runs the migration script against a known v2.x fixture and asserts
 * structural properties of the output (deterministic field transforms).
 * Exits 0 on success, 1 on failure.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const migrationScript = path.join(repoRoot, 'scripts', 'migrate-toulmin-to-walton.js');
const fixture = path.join(repoRoot, 'scripts', 'fixtures', 'v2x-section.md');
const outFile = fixture.replace(/\.md$/, '.migrated.md');

// Clean up before test
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

let failures = 0;

function check(name, actual, expected) {
  const pass = actual === expected;
  if (pass) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}`);
    console.log(`    expected: ${JSON.stringify(expected)}`);
    console.log(`    actual:   ${JSON.stringify(actual)}`);
  }
}

function checkContains(name, haystack, needle) {
  const pass = haystack.includes(needle);
  if (pass) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}`);
    console.log(`    expected to contain: ${JSON.stringify(needle)}`);
  }
}

function checkNotContains(name, haystack, needle) {
  const pass = !haystack.includes(needle);
  if (pass) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}`);
    console.log(`    expected NOT to contain: ${JSON.stringify(needle)}`);
  }
}

// ── Run migration ────────────────────────────────────────────────────────────

try {
  execFileSync(process.execPath, [migrationScript, fixture], { encoding: 'utf8' });
} catch (err) {
  console.error('Migration script failed:', err.message);
  process.exit(1);
}

if (!fs.existsSync(outFile)) {
  console.error(`Output file not created: ${outFile}`);
  process.exit(1);
}

const output = fs.readFileSync(outFile, 'utf8');

// ── Assertions ───────────────────────────────────────────────────────────────

// Frontmatter: scheme mapped correctly
checkContains('scheme → Sample to Population', output, 'scheme: Sample to Population');

// Frontmatter: confidence mapped correctly (usually → very likely)
checkContains('qualifier → confidence band', output, 'confidence: very likely (80-95%)');

// Frontmatter: qualifier removed
checkNotContains('qualifier field removed', output, 'qualifier:');

// Frontmatter: claim_tier removed
checkNotContains('claim_tier field removed', output, 'claim_tier:');

// Frontmatter: status downgraded
checkContains('status downgraded to draft', output, 'status: draft');

// New sections present
checkContains('## CQ Responses added', output, '## CQ Responses');
checkContains('## Confidence added', output, '## Confidence');
checkContains('MIGRATION-TODO comment', output, 'MIGRATION-TODO');

// Toulmin sections removed from live content
// (they are archived in HTML comment, not as ## headings)
const liveWarrant = output.match(/\n## Warrant\n/);
check('## Warrant removed from live content', liveWarrant, null);
const liveRebuttal = output.match(/\n## Rebuttal\n/);
check('## Rebuttal removed from live content', liveRebuttal, null);
const liveBacking = output.match(/\n## Backing\n/);
check('## Backing removed from live content', liveBacking, null);

// Archived content preserved in comment
checkContains('old Warrant archived in comment', output, '[ARCHIVED Warrant]');
checkContains('old Rebuttal archived in comment', output, '[ARCHIVED Rebuttal');
checkContains('old Backing archived in comment', output, '[ARCHIVED Backing]');

// Grounds and Claim preserved
checkContains('## Grounds preserved', output, '## Grounds');
checkContains('## Claim preserved', output, '## Claim');
checkContains('G1 content preserved', output, 'G1:');
checkContains('G2 content preserved', output, 'G2:');

// CQ table rows present (Sample to Population CQs)
checkContains('CQ1 row', output, '| CQ1 |');
checkContains('CQ2 row', output, '| CQ2 |');

// ── Cleanup ──────────────────────────────────────────────────────────────────

fs.unlinkSync(outFile);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('');
console.log(failures === 0 ? 'All tests passed.' : `${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
