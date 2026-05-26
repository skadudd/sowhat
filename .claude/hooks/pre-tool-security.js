#!/usr/bin/env node
/**
 * PreToolUse security gate — blocks writes outside .claude/ directory.
 * Runs synchronously before Write/Edit tool calls.
 *
 * Exit 0 = allow, Exit 2 = block (stderr message shown to user).
 */

const input = JSON.parse(process.argv[2] || '{}');
const toolName = input.tool_name || '';
const toolInput = input.tool_input || {};

// Only inspect file-writing tools
if (!['Write', 'Edit', 'NotebookEdit'].includes(toolName)) {
  process.exit(0);
}

const filePath = toolInput.file_path || '';

// Normalize path separators
const normalized = filePath.replace(/\\/g, '/');

// Block writes to root commands/, sowhat-core/, agents/ (build artifacts)
const buildArtifactPatterns = [
  /\/commands\/sowhat\//,
  /\/sowhat-core\//,
  /\/agents\/sowhat-/,
];

const isBuildArtifact = buildArtifactPatterns.some(p => p.test(normalized));
const isInsideDotClaude = normalized.includes('/.claude/') || normalized.endsWith('/.claude');

if (isBuildArtifact && !isInsideDotClaude) {
  process.stderr.write(
    `[sowhat security] ❌ Write blocked: ${filePath}\n` +
    `Root commands/, sowhat-core/, agents/ are build artifacts — edit .claude/ instead.\n` +
    `(scripts/build.js syncs .claude/ → root on npm publish)\n`
  );
  process.exit(2);
}

// Block writes to secret files
const secretPatterns = [/\.env($|\.)/, /\.key$/, /\.pem$/, /\.p12$/];
const isSecret = secretPatterns.some(p => p.test(normalized));

if (isSecret) {
  process.stderr.write(
    `[sowhat security] ❌ Write blocked: ${filePath}\n` +
    `Secret file patterns (.env, .key, .pem, .p12) are blocked.\n`
  );
  process.exit(2);
}

process.exit(0);
