#!/usr/bin/env node
/**
 * PostToolUse validation — runs source-tag-parser on modified .claude/ files.
 * Runs asynchronously after Write/Edit tool calls.
 *
 * Exit 0 = silent success. Exit 2 = validation failed (stderr shown).
 */

const { execSync } = require('child_process');
const path = require('path');
const input = JSON.parse(process.argv[2] || '{}');
const toolName = input.tool_name || '';
const toolInput = input.tool_input || {};

// Only validate file-writing tools
if (!['Write', 'Edit'].includes(toolName)) {
  process.exit(0);
}

const filePath = toolInput.file_path || '';
const normalized = filePath.replace(/\\/g, '/');

// Only validate .md files inside .claude/
if (!normalized.includes('/.claude/') || !filePath.endsWith('.md')) {
  process.exit(0);
}

// Run source-tag-parser if it exists
const parserPath = path.join(process.cwd(), '.claude', 'sowhat-core', 'bin', 'source-tag-parser.js');
try {
  require('fs').accessSync(parserPath);
} catch {
  // Parser not found — skip silently
  process.exit(0);
}

try {
  execSync(`node "${parserPath}" validate "${filePath}"`, { stdio: 'pipe' });
  // Silent on success
  process.exit(0);
} catch (err) {
  const output = err.stdout ? err.stdout.toString() : '';
  const errOutput = err.stderr ? err.stderr.toString() : '';
  if (output || errOutput) {
    process.stderr.write(`[sowhat validate] ${filePath}\n${output}${errOutput}\n`);
  }
  // Exit 0 even on validation warning (non-blocking post-hook)
  process.exit(0);
}
