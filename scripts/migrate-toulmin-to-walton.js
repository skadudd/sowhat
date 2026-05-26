#!/usr/bin/env node

/**
 * migrate-toulmin-to-walton — sowhat v2.x → v3.0.0 section migration
 *
 * What it does:
 *   - Maps v2.x scheme names → Walton 10-scheme names
 *   - Maps v2.x qualifier values → Tetlock confidence bands
 *   - Removes warrant/backing/rebuttal sections, archiving their content
 *     in a MIGRATION-TODO comment block inside the new ## CQ Responses stub
 *   - Adds ## CQ Responses and ## Confidence stubs for writer to fill in
 *   - Marks the output as suggested (status: draft) — writer must re-settle
 *
 * What it does NOT do:
 *   - Auto-fill CQ responses (fabrication risk — writer must do this)
 *   - Change Claim or Grounds content
 *   - Delete original file (writes to {file}.migrated.md by default)
 *
 * Usage:
 *   node scripts/migrate-toulmin-to-walton.js [--section] <file.md> [<file2.md> ...]
 *   node scripts/migrate-toulmin-to-walton.js --dir planning/sections/
 *   node scripts/migrate-toulmin-to-walton.js --inplace <file.md>   # overwrites original
 *
 * Flags:
 *   --inplace   Overwrite original file (USE WITH CAUTION — commit first)
 *   --dry-run   Print what would change without writing files
 *   --section   Alias for positional file argument (ignored)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Scheme name mapping ─────────────────────────────────────────────────────

const SCHEME_MAP = {
  // v2.x name          → Walton v3.0.0 name (writer must confirm)
  authority:            'Expert Opinion',
  analogy:              'Analogy',
  'cause-effect':       'Cause to Effect',
  statistics:           'Sample to Population',
  sign:                 'Sign',
  principle:            'Classification',       // or Practical Reasoning — writer confirm
  consequence:          'Practical Reasoning',  // or Cause to Effect — writer confirm
  example:              'Custom',               // no direct Walton match
};

// For schemes that may map to multiple options, add a note
const SCHEME_AMBIGUOUS = new Set(['principle', 'consequence', 'example']);

// ── Qualifier → Confidence band mapping ────────────────────────────────────

const QUALIFIER_MAP = {
  definitely:        'virtually certain (95%+)',
  usually:           'very likely (80-95%)',
  'in most cases':   'likely (60-80%)',
  presumably:        'uncertain (40-60%)',
  possibly:          'unlikely (20-40%)',
};

// ── Frontmatter parser (minimal — handles --- delimited YAML-like blocks) ──

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { fm: null, body: content };
  const fmText = match[1];
  const body = match[2];
  const fm = {};
  for (const line of fmText.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { fm, fmText, body };
}

function serializeFrontmatter(fm) {
  const lines = [];
  for (const [k, v] of Object.entries(fm)) {
    lines.push(`${k}: ${v}`);
  }
  return `---\n${lines.join('\n')}\n---\n`;
}

// ── Section extractor ───────────────────────────────────────────────────────

function extractSection(body, heading) {
  // Matches ## Heading\n...content until next ## or end
  const re = new RegExp(`(?:^|\\n)## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

function removeSection(body, heading) {
  const re = new RegExp(`\\n## ${heading}\\n[\\s\\S]*?(?=\\n## |$)`);
  return body.replace(re, '');
}

// ── CQ stubs per Walton scheme ───────────────────────────────────────────────

const CQ_STUBS = {
  'Expert Opinion': [
    'CQ1: E가 실제로 해당 분야의 전문가인가?',
    'CQ2: E가 이 분야에서 신뢰할 만한 전문가로 인정받는가?',
    'CQ3: E의 주장이 다른 전문가들과 일치하는가?',
    'CQ4: E의 주장에 이해충돌(conflict of interest)이 있는가?',
  ],
  'Sample to Population': [
    'CQ1: 표본이 모집단을 대표하는가?',
    'CQ2: 표본 크기가 충분한가?',
    'CQ3: 데이터 수집 방법에 편향이 없는가?',
    'CQ4: 통계적 유의성이 확인되었는가?',
  ],
  'Cause to Effect': [
    'CQ1: X와 Y 사이에 실제 인과 메커니즘이 있는가?',
    'CQ2: X가 실제로 발생했는가?',
    'CQ3: Y가 X 외 다른 원인으로 발생할 수 없는가?',
    'CQ4: X → Y 인과가 역전될 가능성은 없는가?',
  ],
  'Effect to Cause': [
    'CQ1: Y가 실제로 발생했는가?',
    'CQ2: X가 Y의 충분한 원인인가?',
    'CQ3: 다른 원인(X′)이 Y를 설명하지 않는가?',
  ],
  'Analogy': [
    'CQ1: A와 B가 충분히 유사한가?',
    'CQ2: 유사점이 결론에 관련된 속성에서 나타나는가?',
    'CQ3: 중요한 차이점이 결론을 무력화하지 않는가?',
  ],
  'Sign': [
    'CQ1: 사인(sign)이 실제로 관찰되었는가?',
    'CQ2: 사인이 이 결론의 신뢰할 만한 지표인가?',
    'CQ3: 다른 설명이 사인을 더 잘 설명하지 않는가?',
  ],
  'Classification': [
    'CQ1: 정의/분류 기준이 명시적으로 제시되었는가?',
    'CQ2: 대상이 정의의 모든 필요 조건을 만족하는가?',
    'CQ3: 경계 사례나 예외가 처리되었는가?',
  ],
  'Practical Reasoning': [
    'CQ1: 목표(goal)가 명시되었는가?',
    'CQ2: 수단(means)이 실제로 목표를 달성하는가?',
    'CQ3: 수단보다 더 나은 대안이 없는가?',
    'CQ4: 수단의 부작용이 목표 달성을 방해하지 않는가?',
  ],
  'Position to Know': [
    'CQ1: W가 실제로 이 정보에 접근 가능한 위치에 있는가?',
    'CQ2: W가 진술에 이해충돌이 없는가?',
    'CQ3: W의 기억/관찰이 신뢰할 만한가?',
  ],
  'Popular Opinion': [
    'CQ1: 실제로 대다수가 이 의견을 지지하는가?',
    'CQ2: 이 주제에서 대중의 의견이 진리의 지표가 되는가?',
    'CQ3: 지지자들이 충분한 정보를 갖고 있는가?',
  ],
  'Custom': [
    'CQ1: [WRITER: 직접 Critical Question을 작성하세요]',
    'CQ2: [WRITER: 직접 Critical Question을 작성하세요]',
  ],
};

// ── Core migration logic ─────────────────────────────────────────────────────

function migrateSection(content, filePath) {
  const { fm, fmText, body } = parseFrontmatter(content);
  const warnings = [];

  if (!fm) {
    return { output: content, warnings: ['No frontmatter found — skipping migration'] };
  }

  // 1. Map scheme
  const oldScheme = fm.scheme || '';
  const newScheme = SCHEME_MAP[oldScheme];
  if (!newScheme) {
    if (oldScheme) {
      warnings.push(`Unknown v2.x scheme "${oldScheme}" — defaulting to Custom. Set manually.`);
      fm.scheme = 'Custom';
    } else {
      warnings.push('No scheme set — defaulting to Custom. Set manually.');
      fm.scheme = 'Custom';
    }
  } else {
    fm.scheme = newScheme;
    if (SCHEME_AMBIGUOUS.has(oldScheme)) {
      warnings.push(
        `Scheme "${oldScheme}" mapped to "${newScheme}" — verify this is correct ` +
        `(alternatives: ${oldScheme === 'principle' ? 'Practical Reasoning' : oldScheme === 'consequence' ? 'Cause to Effect' : 'see walton-schemes.md'})`
      );
    }
  }

  // 2. Map qualifier → confidence
  const oldQualifier = fm.qualifier || '';
  const newConfidence = QUALIFIER_MAP[oldQualifier];
  if (newConfidence) {
    fm.confidence = newConfidence;
  } else if (oldQualifier) {
    warnings.push(`Unknown qualifier "${oldQualifier}" — set confidence manually (calibration-guide.md)`);
    fm.confidence = `[WRITER: set confidence from calibration-guide.md — was: ${oldQualifier}]`;
  } else {
    fm.confidence = '[WRITER: set confidence from calibration-guide.md]';
  }
  delete fm.qualifier;

  // 3. Remove claim_tier (absorbed into confidence)
  if (fm.claim_tier) {
    warnings.push(`claim_tier "${fm.claim_tier}" removed — confidence band now gates settle (calibration-guide.md)`);
    delete fm.claim_tier;
  }

  // 4. Downgrade status — writer must re-settle after filling CQ responses
  if (fm.status === 'settled') {
    fm.status = 'draft';
    warnings.push('status downgraded to "draft" — fill CQ Responses then re-settle');
  }

  // 5. Extract old Toulmin sections before removing them
  const oldWarrant = extractSection(body, 'Warrant');
  const oldBacking = extractSection(body, 'Backing');
  const oldRebuttal = extractSection(body, 'Rebuttal');

  // 6. Remove Toulmin sections from body
  let newBody = body;
  if (oldWarrant !== null) newBody = removeSection(newBody, 'Warrant');
  if (oldBacking !== null) newBody = removeSection(newBody, 'Backing');
  if (oldRebuttal !== null) newBody = removeSection(newBody, 'Rebuttal');

  // 7. Build ## CQ Responses stub
  const waltonScheme = fm.scheme;
  const cqList = CQ_STUBS[waltonScheme] || CQ_STUBS['Custom'];

  const archivedParts = [];
  if (oldWarrant) archivedParts.push(`[ARCHIVED Warrant]\n${oldWarrant}`);
  if (oldBacking) archivedParts.push(`[ARCHIVED Backing]\n${oldBacking}`);
  if (oldRebuttal) archivedParts.push(`[ARCHIVED Rebuttal — review which CQ this maps to]\n${oldRebuttal}`);

  const cqTableRows = cqList.map(cq => {
    const cqId = cq.match(/^(CQ\d+):/)?.[1] || 'CQ?';
    const cqText = cq.replace(/^CQ\d+:\s*/, '');
    return `| ${cqId} | ${cqText} | [WRITER: answer here] | [WRITER: 0-4] |`;
  });

  const cqSection = [
    '## CQ Responses',
    '',
    `<!-- MIGRATION-TODO: scheme = ${waltonScheme} -->`,
    `<!-- Fill each CQ answer and assign confidence 0-4 (calibration-guide.md D2 rule) -->`,
    `<!-- Unmet CQs (confidence ≤1): ${waltonScheme === 'Cause to Effect' || waltonScheme === 'Classification' ? '0 allowed (strict)' : waltonScheme === 'Sign' || waltonScheme === 'Position to Know' || waltonScheme === 'Popular Opinion' ? '2 allowed' : '1 allowed'} -->`,
    '',
    '| CQ | Question | Answer | Confidence (0-4) |',
    '|---|---|---|:---:|',
    ...cqTableRows,
    '',
  ];

  if (archivedParts.length > 0) {
    cqSection.push('<!-- MIGRATION: archived Toulmin fields for reference');
    for (const part of archivedParts) {
      cqSection.push('');
      cqSection.push(part);
    }
    cqSection.push('-->');
    cqSection.push('');
  }

  // 8. Build ## Confidence stub
  const confidenceSection = [
    '## Confidence',
    '',
    `${fm.confidence}`,
    '',
    '<!-- Adjust after filling CQ Responses above. See calibration-guide.md for Tetlock bands. -->',
    '',
  ];

  // 9. Assemble new body
  newBody = newBody.trimEnd() + '\n\n' + cqSection.join('\n') + confidenceSection.join('\n');

  // 10. Serialize
  const output = serializeFrontmatter(fm) + newBody;
  return { output, warnings };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const inplace = args.includes('--inplace');
  const dryRun = args.includes('--dry-run');
  const dirFlag = args.indexOf('--dir');

  let files = [];

  if (dirFlag !== -1) {
    const dir = args[dirFlag + 1];
    if (!dir) {
      console.error('--dir requires a directory path');
      process.exit(2);
    }
    files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dir, f));
  } else {
    files = args.filter(a => !a.startsWith('--') && a.endsWith('.md'));
  }

  if (files.length === 0) {
    console.log(`Usage: node scripts/migrate-toulmin-to-walton.js <file.md> [<file2.md> ...]
       node scripts/migrate-toulmin-to-walton.js --dir planning/sections/
       node scripts/migrate-toulmin-to-walton.js --inplace <file.md>
       node scripts/migrate-toulmin-to-walton.js --dry-run <file.md>`);
    process.exit(2);
  }

  let totalWarnings = 0;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      console.error(`  ERROR: file not found: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const { output, warnings } = migrateSection(content, filePath);

    console.log(`\n${filePath}`);
    for (const w of warnings) {
      console.log(`  ⚠️  ${w}`);
      totalWarnings++;
    }

    if (dryRun) {
      console.log('  [dry-run] no files written');
      continue;
    }

    const outPath = inplace ? filePath : filePath.replace(/\.md$/, '.migrated.md');
    fs.writeFileSync(outPath, output, 'utf8');
    console.log(`  ✅ written → ${outPath}`);
    if (!inplace) {
      console.log('     Review the MIGRATION-TODO blocks, then replace original if satisfied.');
    }
  }

  console.log(`\nDone. ${totalWarnings} warning(s). Review all MIGRATION-TODO blocks before re-settling.`);
}

main();
