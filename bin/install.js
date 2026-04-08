#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkg = require('../package.json');

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
const hasVersion = args.includes('--version') || args.includes('-v');
const hasHelp = args.includes('--help') || args.includes('-h');

if (hasVersion) {
  console.log(`
${cyan}  ███████╗ ██████╗     ██╗    ██╗██╗  ██╗ █████╗ ████████╗██████╗
  ██╔════╝██╔═══██╗    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝╚════██╗
  ███████╗██║   ██║    ██║ █╗ ██║███████║███████║   ██║     █████╔╝
  ╚════██║██║   ██║    ██║███╗██║██╔══██║██╔══██║   ██║    ██╔═══╝
  ███████║╚██████╔╝    ╚███╔███╔╝██║  ██║██║  ██║   ██║    ███████╗
  ╚══════╝ ╚═════╝      ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚══════╝${reset}

  ${dim}Structured argumentation for Claude Code${reset} ${green}v${pkg.version}${reset}
`);
  process.exit(0);
}

if (hasHelp || (!hasGlobal && !hasLocal && !hasUninstall)) {
  console.log(`
${cyan}  ███████╗ ██████╗     ██╗    ██╗██╗  ██╗ █████╗ ████████╗██████╗
  ██╔════╝██╔═══██╗    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝╚════██╗
  ███████╗██║   ██║    ██║ █╗ ██║███████║███████║   ██║     █████╔╝
  ╚════██║██║   ██║    ██║███╗██║██╔══██║██╔══██║   ██║    ██╔═══╝
  ███████║╚██████╔╝    ╚███╔███╔╝██║  ██║██║  ██║   ██║    ███████╗
  ╚══════╝ ╚═════╝      ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚══════╝${reset}

  ${dim}Structured argumentation for Claude Code${reset} ${dim}v${pkg.version}${reset}

  ${yellow}Usage:${reset} npx sowhat-cc [options]

  ${yellow}Options:${reset}
    ${cyan}-g, --global${reset}     Install globally (to ~/.claude/)
    ${cyan}-l, --local${reset}      Install locally (to ./.claude/)
    ${cyan}-u, --uninstall${reset}  Remove sowhat files
    ${cyan}-v, --version${reset}    Show version
    ${cyan}-h, --help${reset}       Show this help

  ${yellow}Examples:${reset}
    ${dim}npx sowhat-cc --global${reset}     Install for all projects
    ${dim}npx sowhat-cc --local${reset}      Install for current project only
`);
  process.exit(0);
}

// Source directories (relative to this script)
const src = path.join(__dirname, '..');

function getTargetDir(isGlobal) {
  if (isGlobal) {
    // Check CLAUDE_CONFIG_DIR first, then default
    const configDir = process.env.CLAUDE_CONFIG_DIR;
    if (configDir) return configDir;
    return path.join(os.homedir(), '.claude');
  }
  return path.join(process.cwd(), '.claude');
}

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;

  // Clean install: remove existing to prevent orphaned files
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  let count = 0;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      count += copyRecursive(srcPath, destPath);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');

      // Replace @.claude/ references with correct path for global installs
      if (entry.name.endsWith('.md')) {
        const resolvedTarget = path.resolve(destDir).replace(/\\/g, '/');
        const homeDir = os.homedir().replace(/\\/g, '/');

        // For execution_context @references in command files:
        // @.claude/sowhat-core/... → @$HOME/.claude/sowhat-core/... (global)
        // or leave as-is for local
        if (resolvedTarget.startsWith(homeDir)) {
          const relFromClaude = resolvedTarget.slice(homeDir.length);
          // Only transform if we're in a global install
          content = content.replace(
            /@\.claude\/sowhat-core\//g,
            `@$HOME/.claude/sowhat-core/`
          );
        }
      }

      fs.writeFileSync(destPath, content);
      count++;
    }
  }
  return count;
}

function copyAgents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  fs.mkdirSync(destDir, { recursive: true });

  let count = 0;
  const entries = fs.readdirSync(srcDir).filter(f => f.startsWith('sowhat-') && f.endsWith('.md'));

  // Remove existing sowhat agents only
  if (fs.existsSync(destDir)) {
    const existing = fs.readdirSync(destDir).filter(f => f.startsWith('sowhat-'));
    for (const f of existing) {
      fs.unlinkSync(path.join(destDir, f));
    }
  }

  for (const file of entries) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    count++;
  }
  return count;
}

function verifyDir(dir, label) {
  if (fs.existsSync(dir)) {
    const count = fs.readdirSync(dir, { recursive: true })
      .filter(f => typeof f === 'string' && f.endsWith('.md')).length;
    console.log(`  ${green}✓${reset} ${label} (${count} files)`);
    return true;
  }
  console.log(`  ${red}✗${reset} ${label} — failed`);
  return false;
}

// ── UNINSTALL ──
if (hasUninstall) {
  const isGlobal = hasGlobal || !hasLocal;
  const targetDir = getTargetDir(isGlobal);
  const label = isGlobal ? targetDir.replace(os.homedir(), '~') : './.claude';

  console.log(`\n  Uninstalling sowhat from ${cyan}${label}${reset}\n`);

  const dirs = [
    path.join(targetDir, 'commands', 'sowhat'),
    path.join(targetDir, 'sowhat-core'),
  ];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
      console.log(`  ${green}✓${reset} Removed ${dir.replace(os.homedir(), '~')}`);
    }
  }

  // Remove sowhat agents
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir).filter(f => f.startsWith('sowhat-'));
    for (const f of agents) {
      fs.unlinkSync(path.join(agentsDir, f));
      console.log(`  ${green}✓${reset} Removed agent ${f}`);
    }
  }

  console.log(`\n  ${green}Uninstall complete.${reset}\n`);
  process.exit(0);
}

// ── INSTALL ──
const isGlobal = hasGlobal;
const targetDir = getTargetDir(isGlobal);
const locationLabel = isGlobal
  ? targetDir.replace(os.homedir(), '~')
  : targetDir.replace(process.cwd(), '.');

console.log(`
${cyan}  sowhat${reset} ${dim}v${pkg.version}${reset}
  Structured argumentation for Claude Code

  Installing to ${cyan}${locationLabel}${reset}
`);

const failures = [];

// 1. Commands
const cmdCount = copyRecursive(
  path.join(src, 'commands', 'sowhat'),
  path.join(targetDir, 'commands', 'sowhat')
);
if (!verifyDir(path.join(targetDir, 'commands', 'sowhat'), `Commands (${cmdCount} files)`)) {
  failures.push('commands/sowhat');
}

// 2. Agents
const agentCount = copyAgents(
  path.join(src, 'agents'),
  path.join(targetDir, 'agents')
);
console.log(`  ${green}✓${reset} Agents (${agentCount} files)`);

// 3. Core (workflows + references + VERSION)
const coreCount = copyRecursive(
  path.join(src, 'sowhat-core'),
  path.join(targetDir, 'sowhat-core')
);
if (!verifyDir(path.join(targetDir, 'sowhat-core'), `Core (${coreCount} files)`)) {
  failures.push('sowhat-core');
}

// Summary
if (failures.length > 0) {
  console.log(`\n  ${red}✗ Installation failed:${reset} ${failures.join(', ')}`);
  process.exit(1);
} else {
  console.log(`
  ${green}✓ Installation complete!${reset}

  ${yellow}Get started:${reset}
    cd your-project
    ${dim}/sowhat:init${reset}          Start a new argumentation project
    ${dim}/sowhat:progress${reset}      Check project status
    ${dim}/sowhat:help${reset}          Show available commands

  ${yellow}Update later:${reset}
    ${dim}npx sowhat-cc@latest ${isGlobal ? '--global' : '--local'}${reset}
`);
}
