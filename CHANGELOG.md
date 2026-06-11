# Changelog

All notable changes to sowhat are documented here.

---

## [3.1.0] — 2026-06-11

### Changed
- **Context-rot 대폭 감소**: 5개 monolith 워크플로우(draft/init/research/expand/series)의 조건부 분기를 on-demand reference로 추출(워크플로우 본문 ~1,948L 경감). `ux-standards`·`draft` 템플릿도 선택 import/포인터로 분할.
- **런타임 출력 verbosity 감소**: parser 호출을 `--json-file`로 바꿔 대화 raw JSON 덤프 제거. `expand`/`spec`의 필드·항목별 커밋을 섹션당 1커밋으로 batching. 출력 규율(`ux-standards` §11) 표준화.
- `challenge` 스테이지 스펙 중복 제거 — 판정 로직은 `challenge-algorithm.md` 단일 소유.

### Added
- `source-tag-parser`에 `--json-file <path>` 플래그 — 전체 JSON은 파일 기록, stdout엔 간결 요약만.

### Removed
- Codex 멀티런타임 잔재(`AGENTS.md`/`.codex/`/`.agents/`) 제거 — **Claude Code 단일 런타임**으로 통일.

### Fixed
- dangling references(`draft-review-algorithm.md` 등) 해소, README 에이전트 카운트(5→6), confidence 네임스페이스·`grounds_structure`·Steelman 용어 정합.

---

## [3.0.0] — 2026-05-26

### Breaking Changes — Toulmin → Walton Argumentation Schemes

sowhat의 논증 검증 기반이 **Toulmin Model**에서 **Walton's Argumentation Schemes**로 전면 교체된다.
재정의된 목적: "rigorous writer가 N회 글을 써도 일관된 품질을 유지하기 위한 보조도구."

#### 섹션 파일 필드 변경

| 삭제 필드 | 대체 | 마이그레이션 |
|---|---|---|
| `scheme` (authority/analogy/cause-effect/statistics/example/sign/principle/consequence) | `scheme` (Walton 10 schemes: Expert Opinion/Analogy/Cause to Effect/…) | `migrate-toulmin-to-walton.js` |
| `qualifier` (definitely/usually/in most cases/presumably/possibly) | `confidence` (Tetlock band: virtually certain/very likely/likely/uncertain/unlikely) | `migrate-toulmin-to-walton.js` |
| `claim_tier: A/B` | `confidence ≥60%` = Primary; `<60%` = Supporting | `calibration-guide.md` |
| `## Warrant` | 삭제 — scheme 선택으로 흡수 | 아카이브 → `## CQ Responses` 주석에 보존 |
| `## Backing` | 해당 CQ 답변의 근거로 흡수 | 아카이브 → `## CQ Responses` 주석에 보존 |
| `## Rebuttal` | 미충족 CQ로 흡수 | 아카이브 → `## CQ Responses` 주석에 보존 |

#### 새 섹션 파일 필드 (필수)

```yaml
scheme: {Walton scheme — 복합이면 쉼표 구분}
confidence: {Tetlock anchor 어휘 또는 %}
```

```markdown
## CQ Responses

| CQ | Question | Answer | Confidence (0-4) |
|---|---|---|:---:|
| CQ1 | ... | ... | 3 |

## Confidence

likely (60-80%)
```

#### settle 게이트 변경

- 구 Claim Tier A/B 게이트 → 신 Confidence × Source Tier 매트릭스 (`source-credibility.md`)
- **신규**: CQ Confidence 게이트 — 미충족 CQ(confidence ≤1)가 scheme별 허용 상한 초과 시 settle 차단
  - Cause to Effect, Classification: 0개 허용 (엄격)
  - Expert Opinion, Analogy 등: 1개 허용
  - Sign, Position to Know, Popular Opinion: 2개 허용

#### challenge 알고리즘 변경

- Stage 3: Warrant 유효성 → CQ 응답 충분성 (depth=2 cap, 복합 scheme 완전성)
- Stage 5: Qualifier별 최소 기준 → Confidence별 최소 Tier 기준
- Stage 6: Qualifier 보정 → Confidence 보정 (Tetlock band + CQ confidence 평균)
- Issue ID: `W`(Warrant) → `CQ`, `Q`(Qualifier) → `CF`, `B`(Backing) → 삭제, `BS`(Blind Spot) 신규

#### 폐기 참조 파일

- `references/toulmin-model.md` → breaking change stub으로 대체
- 원본 보존: `references/archive/toulmin-model.md`

### New Files

- `references/walton-schemes.md` — 10 scheme 카탈로그 + CQs (3-5개/scheme) + 복합 scheme 가이드
- `references/calibration-guide.md` — Tetlock probability bands + CQ confidence 0-4 + scheme별 settle 임계값
- `references/walton-pitfalls.md` — 함정 3가지(오분류/CQ진위/무한후퇴) + harness 대응 규칙 D1·D2·D3
- `references/archive/toulmin-model.md` — Toulmin model 원본 보존 (마이그레이션 참조용)
- `scripts/migrate-toulmin-to-walton.js` — v2.x → v3.0.0 섹션 파일 변환 도구
- `scripts/test-migrate-walton.js` — 마이그레이션 스크립트 회귀 테스트 (20 assertions)
- `scripts/fixtures/v2x-section.md` — 마이그레이션 테스트 fixture

### Modified Files

**워크플로우**: `expand.md`, `settle.md`
**알고리즘**: `challenge-algorithm.md`
**비평 기준**: `critique-dimensions.md`, `source-credibility.md`
**에이전트**: `sowhat-critic-agent.md`, `sowhat-self-critic-agent.md`, `sowhat-con-agent.md`, `sowhat-pro-agent.md`, `sowhat-challenge-agent.md`
**참조**: `ai-content-boundary.md`, `character-system.md`, `toulmin-model.md` (stub)

### Migration Guide

```bash
# 1. 단일 섹션 마이그레이션 (검토용 .migrated.md 생성)
node scripts/migrate-toulmin-to-walton.js planning/sections/01-*.md

# 2. 디렉토리 전체 마이그레이션
node scripts/migrate-toulmin-to-walton.js --dir planning/sections/

# 3. 확인 후 덮어쓰기
node scripts/migrate-toulmin-to-walton.js --inplace planning/sections/01-*.md
```

**MIGRATION-TODO 블록을 반드시 검토해야 한다**:
- scheme 선택이 올바른지 확인 (ambiguous scheme은 경고 포함)
- CQ Responses 테이블의 `[WRITER: answer here]`를 채워야 settle 가능
- confidence band를 grounds 강도 + CQ 점수에 맞게 조정

### Test

```
npm test
```
→ `test-source-tags.js` + `test-draft-hallucination-guard.js` + `test-migrate-walton.js` 모두 통과 확인.

### 설계 참조

- Walton, Reed, Macagno, *Argumentation Schemes* (Cambridge, 2008) — 60+ scheme 카탈로그
- Walton, *Methods of Argumentation* (Cambridge, 2013) — 적용 방법론
- Tetlock & Gardner, *Superforecasting* (Crown, 2015) — Calibration probability bands

---

## [2.3.1] — 2026-05-26

### Removed — cargo-cult retraction

- **`.claude/tests/eval/*.yaml` (5개)** — LLM 워크플로우는 unit-test-style eval로 검증 불가. eval YAML이 "command 실행 → output string 매칭"을 가정하지만, sowhat 명령은 LLM이 해석·실행하는 대화 워크플로우라 결정론적 output이 없음.
- **`.claude/sowhat-core/references/eval-protocol.md`** — 위와 동일 이유. eval runner(`scripts/eval-runner.js`)도 만들지 않음.

**도입 경위 및 회수 이유**: v2.3.0이 9-gate harness best practice 가이드를 따라 위 파일들을 도입했으나, 그 가이드는 코드 수정 skill(파일 편집 → 단위 테스트로 검증 가능)을 전제로 작성됨. 문서·논증 워크플로우인 sowhat에는 카테고리 부적용.

### 보존

- `scripts/test-source-tags.js`, `scripts/test-draft-hallucination-guard.js` — 결정론적 컴포넌트(파서, 환각 가드)는 단위 테스트 가능. 유지.
- `npm test` → 위 두 스크립트 실행.

---

## [2.3.0] — 2026-05-26

### Breaking Changes

- **`/sowhat:finalize` no longer generates files.** It is now a pure state terminator (challenge → layer:finalized → git commit only). All output documents are now generated exclusively by `/sowhat:draft`. Existing workflows that relied on `finalize → export/PROJECT.md` will need to switch to `/sowhat:draft --deliverable prd`.
- **`debate` default stance changed from `persuade` to `critique`.** Using `--stance persuade` now shows an explicit warning. This prevents Research-Agent from automatically favoring user-supporting evidence.
- **`gsd-export` deliverable removed.** The `prd` deliverable remains (targeting Jira/Linear/PM tools generally).

### New Features

- **`/sowhat:self-critic`** — New command and agent for analyzing the user's own argument structure (5-dimension critique). Distinct from `/sowhat:critic` which analyzes external content.
- **`critique-dimensions.md`** — Shared 5-dimension critique standard (Completeness, Validity, Evidence Quality, Qualifier Appropriateness, Rebuttal Coverage) used by both critic-agent and self-critic-agent.
- **Claim Tier A/B differentiation** — `claim_tier` field added to Toulmin model. Tier-A (core) requires T1/T2 sources; Tier-B (supporting) allows T3/T4 + qualifier weakening. Affects `settle` gating and `challenge` Stage 0 severity.
- **Preview gate** — `draft`, `finalize`, `finalize-planning` now show a file list + action preview before executing. `[1]` continue, `[2]` cancel, `[3]` revise. Skip with `--no-preview`.
- **Security hooks** — `.claude/hooks/pre-tool-security.js` (PreToolUse) blocks writes to build artifact directories and secret files. `.claude/hooks/post-tool-validate.js` (PostToolUse) runs source-tag-parser on changed `.md` files.
- **`settings.json`** — Team-shared permissions.deny (destructive commands blocked) + hook registration.
- **`anti-triggers.md`** — Shared anti-trigger pattern library for all 27 commands.
- **All 27 commands** — Added `license`, `compatibility`, `When to Apply`, `Anti-triggers`, `Methodology`, `Output Format` sections. Destructive commands (`revise`, `draft`, `finalize`, `finalize-planning`, `autonomous`) marked `disable-model-invocation: true`.
- **Eval infrastructure** — `.claude/tests/eval/*.yaml` regression suite: debate-sycophancy, preview-gate, tier-ab-backing, critic-vs-self-critic, challenge-stage0.
- **`eval-protocol.md`** — Formal eval spec (YAML format, check types, severity levels).
- **`skills/archive/`** — Retirement directory for deprecated commands.
- **`package.json`** — Added `os`, `peerDependencies`, `funding`, `scripts.audit:skills`, `scripts.lint`. Version bumped to 2.3.0.
- **README** — Added Security & Permissions, Hooks, Privacy & Data Flow, Contributing & Skill Audit, Troubleshooting sections.

### Improvements

- **`challenge.md`** — Pass menu now includes `[3] /sowhat:self-critic` for post-challenge structural diagnosis.
- **`source-credibility.md`** — Added Claim Tier × Source Tier compatibility matrix.
- **`session-protocol.md`** — Added `preview_event` field and preview gate event_types (preview_approved, preview_canceled, preview_revised).
- **`ux-standards.md`** — Added Section 8: Preview Gate pattern documentation.
- **`sowhat-critic-agent.md`** — 5-dimension definitions delegated to shared `critique-dimensions.md`.
- **`sowhat-research-agent.md`** — Added stance-gate: biased search only when `--stance persuade` is explicitly set.

### Security

- Removed plaintext `PERPLEXITY_API_KEY` from `.claude/settings.local.json`.
- Added `.env`, `.env.*`, `*.key`, `*.pem`, `*.p12` to `.gitignore`.
- **If you had API keys stored in settings.local.json before v2.3.0, rotate them** — the key was exposed in git history. Use `/sowhat:config` to re-set new keys.

### Migration from 2.2.x

```
# If you used: /sowhat:finalize (for export generation)
# Now use:     /sowhat:finalize → then /sowhat:draft

# If you used: /sowhat:debate --stance (default was persuade)
# Now:         default is critique; add --stance persuade to opt-in

# If you used: gsd-export deliverable
# Now use:     prd deliverable (/sowhat:draft --deliverable prd)
```
