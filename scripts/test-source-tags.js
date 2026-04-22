#!/usr/bin/env node

/**
 * test-source-tags — regression test for .claude/sowhat-core/bin/source-tag-parser.js
 *
 * Runs the parser against fixtures and asserts the expected counts.
 * Exits 0 on success, 1 on failure.
 */

'use strict';

const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const parser = path.join(repoRoot, '.claude', 'sowhat-core', 'bin', 'source-tag-parser.js');
const fixturesRoot = path.join(repoRoot, 'scripts', 'fixtures');

function runParser(file) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [parser, 'validate', file, '--project', fixturesRoot, '--json'],
      { encoding: 'utf8' }
    );
    return { exitCode: 0, result: JSON.parse(stdout) };
  } catch (err) {
    // exit code 1 — parser found issues (expected for invalid fixture)
    return {
      exitCode: err.status,
      result: err.stdout ? JSON.parse(err.stdout) : null,
    };
  }
}

const cases = [
  {
    name: 'valid fixture passes cleanly',
    file: path.join(fixturesRoot, 'valid-section.md'),
    expect: { exitCode: 0, errorCount: 0, warningCount: 0 },
  },
  {
    name: 'invalid fixture reports exact issues',
    file: path.join(fixturesRoot, 'invalid-section.md'),
    expect: { exitCode: 1, errorCount: 6, warningCount: 1 },
  },
];

let failures = 0;
for (const c of cases) {
  const { exitCode, result } = runParser(c.file);
  const got = {
    exitCode,
    errorCount: result ? result.errorCount : null,
    warningCount: result ? result.warningCount : null,
  };

  const pass =
    got.exitCode === c.expect.exitCode &&
    got.errorCount === c.expect.errorCount &&
    got.warningCount === c.expect.warningCount;

  if (pass) {
    console.log(`  ok  ${c.name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${c.name}`);
    console.log(`    expected: ${JSON.stringify(c.expect)}`);
    console.log(`    actual:   ${JSON.stringify(got)}`);
  }
}

console.log('');
console.log(failures === 0 ? 'All tests passed.' : `${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
