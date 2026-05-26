# Toulmin Model — sowhat Field Definitions [ARCHIVED]

**⚠️ ARCHIVED as of sowhat v3.0.0**

Replaced by **Walton Argumentation Schemes** (`@.claude/sowhat-core/references/walton-schemes.md`).

---

## Breaking Changes (v2.x → v3.0.0)

| v2.x 필드 | v3.0.0 대체 | 메모 |
|---|---|---|
| `scheme` (8 Toulmin schemes) | `scheme` (10 Walton schemes) | scheme 이름 변경. `migrate-toulmin-to-walton.js` 참조 |
| `warrant` | 삭제 — scheme 선택으로 흡수 | Writer가 scheme을 선택함으로써 warrant 구조가 암묵적으로 정의됨 |
| `backing` | `cq_responses` 내 CQ 답변으로 흡수 | Backing은 해당 CQ의 confidence를 높이는 근거로 재분류 |
| `qualifier` (5-level: definitely/usually/...) | `confidence` (Tetlock band: virtually certain/very likely/...) | `calibration-guide.md` 참조 |
| `rebuttal` | 미충족 CQ로 흡수 | 어떤 CQ가 미충족인가 = 어떤 조건에서 claim이 약해지는가 |
| `claim_tier: A/B` | `confidence ≥60%` (Primary) / `<60%` (Supporting) | `calibration-guide.md` 참조 |

## Migration

기존 v2.x 섹션 파일 변환: `scripts/migrate-toulmin-to-walton.js`

```bash
node scripts/migrate-toulmin-to-walton.js --section planning/sections/01-*.md
```

---

*원본 내용은 이 파일 아래에 그대로 보존된다. 마이그레이션 참조용.*

---

# [원본] Toulmin Model — sowhat Field Definitions

All sowhat sections use the Toulmin Model with 6 mandatory fields.

## Fields

| Field | Korean | Definition | Example |
|-------|--------|------------|---------|
| **Claim** | 주장 | The assertion being made. What this section argues. | "{주제} 시장은 연 {N}% 성장 중이다" |
| **Grounds** | 근거 | Factual evidence supporting the Claim. Data, observations, facts. | "{연도} {기관} 보고서: TAM {금액}" |
| **Warrant** | 논리적 연결 | The reasoning that connects Grounds to Claim. Why the evidence matters. | "시장 성장률은 진입 타이밍의 적절성을 증명한다" |
| **Backing** | 보강 | Evidence supporting the Warrant itself. Meta-justification. | "{기관}: 성장기 시장 진입이 성숙기보다 {N}x 생존율" |
| **Qualifier** | 한정어 | Confidence level. How certain is the Claim. | "usually" (1등급) |
| **Rebuttal** | 반박 조건 | Conditions under which the Claim would be false. | "단, 규제 환경이 급변하지 않는 한" |
| **claim_tier** | 주장 등급 | `A` = thesis Key Argument에 직결. `B` = 보조/배경 주장. | `A` |

## Qualifier Scale (5-level)

| Level | Korean | English | Meaning |
|-------|--------|---------|---------|
| 0 | 확실히 | definitely | No meaningful counterargument exists |
| 1 | 대체로 | usually | Strong evidence, minor exceptions possible |
| 2 | 대부분의 경우 | in most cases | Reasonable inference, moderate uncertainty |
| 3 | 추정컨대 | presumably | Plausible but significant uncertainty |
| 4 | 그럴 수 있다 | possibly | Speculative, weak evidence |

## Scheme (v2.x values — DEPRECATED)

**유효한 scheme 값 (v2.x)**: authority, analogy, cause-effect, statistics, example, sign, principle, consequence

v3.0.0 Walton scheme 값 → `walton-schemes.md` 참조.
