#!/usr/bin/env node

/**
 * source-tag-parser — cycle 7 Plan G implementation
 *
 * Toulmin 섹션 파일의 불릿마다 [source:...] 태그의 존재와 유효성을 검증한다.
 * cycle 7 의 "AI가 구체값을 자동 생성할 경로 제거"를 코드 수준에서 보증한다.
 *
 * Spec: .claude/sowhat-core/references/ai-content-boundary.md
 *       §"Plan G: Structured Output Parser"
 *
 * Usage:
 *   node .claude/sowhat-core/bin/source-tag-parser.js validate <file.md>            # single file
 *   node .claude/sowhat-core/bin/source-tag-parser.js validate --all <dir>          # directory
 *   node .claude/sowhat-core/bin/source-tag-parser.js validate <file> --json        # JSON output
 *   node .claude/sowhat-core/bin/source-tag-parser.js validate <file> --project <.> # retrieval root
 *
 * Exit codes:
 *   0 — no issues
 *   1 — issues found (errors or warnings per --strict)
 *   2 — CLI usage error
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TOULMIN_FIELDS = ['Grounds', 'Backing', 'Warrant', 'Rebuttal'];

// Whitelist of allowed source values (ai-content-boundary.md §"허용 source 값")
const SOURCE_VALIDATORS = [
  { name: 'user',         test: (v) => v === 'user' },
  { name: 'finding',      test: (v) => /^#\d{3}$/.test(v) },
  { name: 'sub-research', test: (v) => v === 'sub-research' },
  { name: 'file',         test: (v) => /^file:.+/.test(v) },
  { name: 'target',       test: (v) => v === 'target' },
  { name: 'placeholder',  test: (v) => v === 'placeholder' },
  { name: 'inference',    test: (v) => v === 'inference' },
];

// Concrete-value patterns: if a bullet matches these AND carries only
// placeholder/inference tag, flag as suspicious (structural tag with content).
const CONCRETE_PATTERNS = [
  /\d+(?:\.\d+)?\s*%/,                              // percentage
  /\d+(?:\.\d+)?\s*배/,                             // multiplier (ko)
  /\$\s*\d+(?:\.\d+)?[BMK]?/i,                      // dollar
  /\d+(?:\.\d+)?\s*(?:조|억|백만|천만|만)\s*원/,    // won units
  /https?:\/\/\S+/,                                 // URL
  /\bdoi:\S+/i,                                     // DOI
  /\b10\.\d{4,}\//,                                 // DOI prefix
  /\b(?:19|20)\d{2}\b/,                             // year (1900-2099)
];

// Concrete-but-retrieval-OK: these patterns are fine if source is retrieval-
// backed (user/#NNN/sub-research/file/target). Same as CONCRETE_PATTERNS but
// named separately for clarity.
const RETRIEVAL_SOURCES = new Set(['user', 'finding', 'sub-research', 'file', 'target']);
const STRUCTURAL_SOURCES = new Set(['placeholder', 'inference']);

// ---------------------------------------------------------------------------
// Source tag extraction
// ---------------------------------------------------------------------------

/**
 * Extracts ALL `[source:...]` tags from a bullet. Most bullets have one, but
 * some may contain retrieval citations of multiple findings.
 */
function extractSourceTags(line) {
  const re = /\[source:([^\]]+)\]/g;
  const tags = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    tags.push({ raw: m[0], value: m[1].trim(), index: m.index });
  }
  return tags;
}

function classifySource(value) {
  for (const v of SOURCE_VALIDATORS) {
    if (v.test(value)) return v.name;
  }
  return null; // unknown / invalid
}

function hasConcreteValue(text) {
  // Strip source tags first so they don't pollute the match
  const stripped = text.replace(/\[source:[^\]]+\]/g, '');
  return CONCRETE_PATTERNS.some((p) => p.test(stripped));
}

// ---------------------------------------------------------------------------
// Section parsing
// ---------------------------------------------------------------------------

/**
 * Returns: { frontmatter: {...} | null, body: string, bodyStartLine: number }
 */
function parseFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let frontmatter = null;
  let body = raw;
  let bodyStartLine = 1;

  if (lines[0] === '---') {
    let end = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') { end = i; break; }
    }
    if (end !== -1) {
      frontmatter = lines.slice(1, end).join('\n');
      body = lines.slice(end + 1).join('\n');
      bodyStartLine = end + 2;
    }
  }

  return { frontmatter, body, bodyStartLine, rawLines: lines };
}

/**
 * Finds Toulmin field sections (## Grounds, ## Backing, etc.) and collects
 * bullets under each. Returns: [{ field, bullets: [{text, lineNumber}] }]
 */
function extractFieldBullets(rawLines, bodyStartLine) {
  const sections = [];
  let currentField = null;
  let currentBullets = null;

  for (let i = bodyStartLine - 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lineNumber = i + 1;

    // Section header detection: ## FieldName (allow surrounding text)
    const headerMatch = line.match(/^##\s+([A-Za-z][A-Za-z0-9 ]+)\s*$/);
    if (headerMatch) {
      // Close previous field
      if (currentField) {
        sections.push({ field: currentField, bullets: currentBullets });
      }
      const title = headerMatch[1].trim();
      const canonical = TOULMIN_FIELDS.find((f) => title === f);
      if (canonical) {
        currentField = canonical;
        currentBullets = [];
      } else {
        currentField = null;
        currentBullets = null;
      }
      continue;
    }

    if (!currentField) continue;

    // Bullet detection: line starts with `- ` or `* ` (allow indentation for
    // sub-bullets; we still record them so a missing tag isn't hidden)
    const bulletMatch = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (bulletMatch) {
      currentBullets.push({
        text: bulletMatch[1],
        lineNumber,
        rawLine: line,
      });
    }
  }

  if (currentField) {
    sections.push({ field: currentField, bullets: currentBullets });
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Retrieval existence check
// ---------------------------------------------------------------------------

function checkFindingExists(nnn, projectRoot) {
  const researchDir = path.join(projectRoot, 'research');
  if (!fs.existsSync(researchDir)) return false;
  const prefix = `${nnn}-`;
  try {
    const entries = fs.readdirSync(researchDir);
    return entries.some((e) => e.startsWith(prefix) && e.endsWith('.md'));
  } catch (e) {
    return false;
  }
}

/**
 * Returns: { ok: true } | { ok: false, reason: string }
 *
 * file: paths must resolve under projectRoot (sandbox). Absolute paths and
 * `..` traversal outside the project are rejected so `[source:file:...]`
 * cannot point at arbitrary filesystem locations.
 */
function checkFileExists(filePath, projectRoot) {
  const absolute = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(projectRoot, filePath);

  const root = path.resolve(projectRoot);
  const rel = path.relative(root, absolute);
  const escapesSandbox =
    rel.startsWith('..') || path.isAbsolute(rel);

  if (escapesSandbox) {
    return { ok: false, reason: 'projectRoot 밖 경로 (sandbox 이탈)' };
  }
  if (!fs.existsSync(absolute)) {
    return { ok: false, reason: '경로 미실존' };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Returns an array of issues. Each issue:
 * { severity: 'error'|'warning', field, bulletIndex, line, reason, text }
 */
function validateFile(filePath, projectRoot) {
  const { rawLines, bodyStartLine } = parseFile(filePath);
  const sections = extractFieldBullets(rawLines, bodyStartLine);

  const issues = [];
  let totalBullets = 0;
  let taggedBullets = 0;

  for (const section of sections) {
    for (let i = 0; i < section.bullets.length; i++) {
      const bullet = section.bullets[i];
      totalBullets++;

      const tags = extractSourceTags(bullet.text);

      if (tags.length === 0) {
        // Missing tag
        const hasConcrete = hasConcreteValue(bullet.text);
        issues.push({
          severity: hasConcrete ? 'error' : 'warning',
          field: section.field,
          bulletIndex: i,
          line: bullet.lineNumber,
          reason: hasConcrete
            ? '태그 없음 + 구체값 포함 — parser drop 대상'
            : '태그 없음 — [source:inference] 또는 [source:placeholder] 부착 권장',
          text: bullet.text,
        });
        continue;
      }

      taggedBullets++;

      for (const tag of tags) {
        const sourceType = classifySource(tag.value);

        if (sourceType === null) {
          issues.push({
            severity: 'error',
            field: section.field,
            bulletIndex: i,
            line: bullet.lineNumber,
            reason: `유효하지 않은 source 값: "${tag.value}" (허용: user/#NNN/sub-research/file:path/target/placeholder/inference)`,
            text: bullet.text,
          });
          continue;
        }

        // Retrieval existence checks
        if (sourceType === 'finding') {
          const nnn = tag.value.slice(1); // strip #
          if (!checkFindingExists(nnn, projectRoot)) {
            issues.push({
              severity: 'error',
              field: section.field,
              bulletIndex: i,
              line: bullet.lineNumber,
              reason: `[source:${tag.value}] — research/${nnn}-*.md 미실존`,
              text: bullet.text,
            });
          }
        } else if (sourceType === 'file') {
          const fp = tag.value.slice(5); // strip "file:"
          const check = checkFileExists(fp, projectRoot);
          if (!check.ok) {
            issues.push({
              severity: 'error',
              field: section.field,
              bulletIndex: i,
              line: bullet.lineNumber,
              reason: `[source:${tag.value}] — ${check.reason}`,
              text: bullet.text,
            });
          }
        }

        // Structural tag + concrete value → suspicious
        if (STRUCTURAL_SOURCES.has(sourceType) && hasConcreteValue(bullet.text)) {
          issues.push({
            severity: 'warning',
            field: section.field,
            bulletIndex: i,
            line: bullet.lineNumber,
            reason: `[source:${tag.value}] 인데 구체값 포함 — retrieval 태그(user/#NNN/sub-research/file:*/target) 필요 의심`,
            text: bullet.text,
          });
        }
      }
    }
  }

  return {
    file: filePath,
    totalBullets,
    taggedBullets,
    untaggedBullets: totalBullets - taggedBullets,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatReportText(result) {
  const rel = path.relative(process.cwd(), result.file) || result.file;
  const lines = [];
  lines.push(`source-tag-parser: ${rel}`);
  lines.push('');
  lines.push('Summary:');
  lines.push(`  Total bullets: ${result.totalBullets}`);
  lines.push(`  Tagged:        ${result.taggedBullets}`);
  lines.push(`  Untagged:      ${result.untaggedBullets}`);
  lines.push(`  Errors:        ${result.errorCount}`);
  lines.push(`  Warnings:      ${result.warningCount}`);

  if (result.issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '🔴' : '⚠️ ';
      lines.push(
        `  ${icon} [${issue.field}:${issue.bulletIndex}] line ${issue.line} — ${issue.reason}`
      );
      const preview = issue.text.length > 80
        ? issue.text.slice(0, 77) + '...'
        : issue.text;
      lines.push(`     > ${preview}`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { mode: null, target: null, project: null, json: false, all: false, strict: false };
  args.mode = argv[0] || null;

  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--all') args.all = true;
    else if (a === '--strict') args.strict = true;
    else if (a === '--project') { args.project = argv[++i]; }
    else if (!args.target) args.target = a;
  }
  return args;
}

function usage() {
  console.error(`Usage:
  node .claude/sowhat-core/bin/source-tag-parser.js validate <file.md> [--project <root>] [--json] [--strict]
  node .claude/sowhat-core/bin/source-tag-parser.js validate --all <dir> [--project <root>] [--json] [--strict]

Modes:
  validate  Check source tag existence, whitelist, and retrieval-path reality.

Flags:
  --all       Recursively process every .md under <dir>.
  --json      Emit machine-readable JSON instead of text report.
  --strict    Warnings count as failure (exit 1).
  --project   Directory root for resolving #NNN (research/) and file: paths.
              Defaults to the current working directory.

Exit codes:
  0  no issues
  1  errors found (or warnings with --strict)
  2  usage error`);
  process.exit(2);
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];

  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
    }
  }
  walk(target);
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.mode !== 'validate') usage();
  if (!args.target) usage();
  if (!fs.existsSync(args.target)) {
    console.error(`Target not found: ${args.target}`);
    process.exit(2);
  }

  const projectRoot = args.project
    ? path.resolve(args.project)
    : process.cwd();

  const files = args.all
    ? collectFiles(args.target)
    : [args.target];

  const results = files.map((f) => validateFile(f, projectRoot));

  if (args.json) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
  } else {
    for (const r of results) {
      console.log(formatReportText(r));
      console.log('');
    }
  }

  const hasErrors = results.some((r) => r.errorCount > 0);
  const hasWarnings = results.some((r) => r.warningCount > 0);
  if (hasErrors || (args.strict && hasWarnings)) process.exit(1);
  process.exit(0);
}

if (require.main === module) main();

module.exports = {
  extractSourceTags,
  classifySource,
  hasConcreteValue,
  validateFile,
  parseFile,
  extractFieldBullets,
};
