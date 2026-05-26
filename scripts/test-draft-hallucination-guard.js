#!/usr/bin/env node
/**
 * draft 환각 가드 회귀 테스트
 *
 * dogfood-cycle7에서 발견된 환각 패턴(H1·H2)이 강화된 5.5b 로직으로 차단되는지 검증.
 * LLM 2차 호출 없이 literal 1차 매칭만으로 오프라인 검증한다.
 *
 * 통과 조건:
 *   - H1 ("5%") → unmatched (anchor에 literal 없음)
 *   - H2 ("2025-Q1 경쟁사 X 런칭") → unmatched
 *   - N1 ("27개") → matched (03-mart G1에 literal 있음)
 *
 * Usage: node scripts/test-draft-hallucination-guard.js
 * Exit 0: pass, Exit 1: fail
 */

const fs = require('fs');
const path = require('path');

const FIXTURE_DIR = path.join(__dirname, '..', 'tests', 'fixtures', 'draft-hallucination-cycle7');

// --- anchor_corpus 구성 (Step 6.6 확장 로직 재현) ---

function buildAnchorCorpus(fixtureDir) {
  const parts = [];

  // 1. settled_bodies: planning/*.md 본문
  const planningDir = path.join(fixtureDir, 'planning');
  if (fs.existsSync(planningDir)) {
    for (const f of fs.readdirSync(planningDir)) {
      if (f.endsWith('.md')) {
        parts.push(fs.readFileSync(path.join(planningDir, f), 'utf8'));
      }
    }
  }

  // 2. raw_sources: config.json source.path
  const configPath = path.join(fixtureDir, 'planning', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const sourcePath = config?.source?.path;
      if (sourcePath) {
        const fullPath = path.join(fixtureDir, sourcePath);
        if (fs.existsSync(fullPath)) {
          parts.push(fs.readFileSync(fullPath, 'utf8'));
        }
      }
    } catch (_) {}
  }

  return parts.join('\n');
}

// --- 구체값 추출 (Step 5.5b 정규식 패턴 4종) ---

function extractConcreteCandidates(text) {
  const candidates = [];

  const patterns = [
    // 비율·배수·조건 수치
    /\d+\s*%\s*(이하|이상|미만|초과)?/g,
    /\d+\s*배/g,
    // 절대 수치 + 단위
    /\d+\s*(명|건|개|주|분|회|년|월)/g,
    // 고유 사례 명사구: 20XX-QN 패턴
    /20\d\d-Q\d/g,
    // 따옴표 안 고유 사례명 (한국어 포함)
    /"([^"]{4,40})"/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = (match[1] ?? match[0]).trim();
      if (value.length >= 2) candidates.push(value);
    }
  }

  return [...new Set(candidates)];
}

// --- literal 1차 매칭 ---

function literalMatch(value, corpus) {
  return corpus.includes(value);
}

// --- 테스트 실행 ---

function run() {
  const corpus = buildAnchorCorpus(FIXTURE_DIR);
  const document = fs.readFileSync(
    path.join(FIXTURE_DIR, 'DOCUMENT.hallucinated.md'),
    'utf8'
  );
  const expected = JSON.parse(
    fs.readFileSync(path.join(FIXTURE_DIR, 'expected.json'), 'utf8')
  );

  let failures = 0;

  // 환각 케이스: unmatched 기대
  for (const h of expected.hallucinations) {
    const matched = literalMatch(h.value, corpus);
    const verdict = matched ? 'matched' : 'unmatched';
    const pass = verdict === h.expected_verdict;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${h.id} ("${h.value}") → ${verdict} (expected: ${h.expected_verdict})`);
    if (!pass) {
      console.log(`       reason: ${h.reason}`);
      failures++;
    }
  }

  // 정상 케이스: matched 기대
  for (const n of expected.negative_cases) {
    const matched = literalMatch(n.value, corpus);
    const verdict = matched ? 'matched' : 'unmatched';
    const pass = verdict === n.expected_verdict;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${n.id} ("${n.value}") → ${verdict} (expected: ${n.expected_verdict})`);
    if (!pass) {
      console.log(`       reason: ${n.reason}`);
      failures++;
    }
  }

  console.log('');
  if (failures === 0) {
    console.log('✅ All tests passed.');
    process.exit(0);
  } else {
    console.log(`❌ ${failures} test(s) failed.`);
    process.exit(1);
  }
}

run();
