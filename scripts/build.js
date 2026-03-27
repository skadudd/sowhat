#!/usr/bin/env node

/**
 * Build script: copies .claude/ source files into npm package structure.
 * Run before `npm publish`.
 *
 * .claude/commands/sowhat/  → commands/sowhat/
 * .claude/agents/sowhat-*   → agents/
 * .claude/sowhat-core/      → sowhat-core/
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, '.claude');

function copyRecursive(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`Source not found: ${from}`);
    process.exit(1);
  }

  if (fs.existsSync(to)) {
    fs.rmSync(to, { recursive: true });
  }
  fs.mkdirSync(to, { recursive: true });

  let count = 0;
  const entries = fs.readdirSync(from, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      count += copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

console.log('Building sowhat-cc package...\n');

// 1. Commands
const cmdCount = copyRecursive(
  path.join(src, 'commands', 'sowhat'),
  path.join(root, 'commands', 'sowhat')
);
console.log(`  commands/sowhat/  ${cmdCount} files`);

// 2. Agents (only sowhat-* files)
const agentsSrc = path.join(src, 'agents');
const agentsDest = path.join(root, 'agents');
if (fs.existsSync(agentsDest)) fs.rmSync(agentsDest, { recursive: true });
fs.mkdirSync(agentsDest, { recursive: true });

const agentFiles = fs.readdirSync(agentsSrc)
  .filter(f => f.startsWith('sowhat-') && f.endsWith('.md'));
for (const f of agentFiles) {
  fs.copyFileSync(path.join(agentsSrc, f), path.join(agentsDest, f));
}
console.log(`  agents/           ${agentFiles.length} files`);

// 3. Core (workflows + references + VERSION)
const coreCount = copyRecursive(
  path.join(src, 'sowhat-core'),
  path.join(root, 'sowhat-core')
);
console.log(`  sowhat-core/      ${coreCount} files`);

// 4. Sync VERSION → package.json
const version = fs.readFileSync(
  path.join(root, 'sowhat-core', 'VERSION'), 'utf8'
).trim();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== version) {
  pkg.version = version;
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  );
  console.log(`\n  package.json version synced to ${version}`);
}

console.log(`\n  Build complete. Ready to publish.\n`);
