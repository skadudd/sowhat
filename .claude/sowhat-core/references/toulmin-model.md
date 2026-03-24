# Toulmin Model — sowhat Field Definitions

All sowhat sections use the Toulmin Model with 6 mandatory fields.

## Fields

| Field | Korean | Definition | Example |
|-------|--------|------------|---------|
| **Claim** | 주장 | The assertion being made. What this section argues. | "이 시장은 연 30% 성장 중이다" |
| **Grounds** | 근거 | Factual evidence supporting the Claim. Data, observations, facts. | "2023 IDC 보고서: TAM $4.2B" |
| **Warrant** | 논리적 연결 | The reasoning that connects Grounds to Claim. Why the evidence matters. | "시장 성장률은 진입 타이밍의 적절성을 증명한다" |
| **Backing** | 보강 | Evidence supporting the Warrant itself. Meta-justification. | "McKinsey: 성장기 시장 진입이 성숙기보다 3x 생존율" |
| **Qualifier** | 한정어 | Confidence level. How certain is the Claim. | "usually" (1등급) |
| **Rebuttal** | 반박 조건 | Conditions under which the Claim would be false. | "단, 규제 환경이 급변하지 않는 한" |

## Qualifier Scale (5-level)

Used in both expand and challenge/debate to express argument strength:

| Level | Korean | English | Meaning |
|-------|--------|---------|---------|
| 0 | 확실히 | definitely | No meaningful counterargument exists |
| 1 | 대체로 | usually | Strong evidence, minor exceptions possible |
| 2 | 대부분의 경우 | in most cases | Reasonable inference, moderate uncertainty |
| 3 | 추정컨대 | presumably | Plausible but significant uncertainty |
| 4 | 그럴 수 있다 | possibly | Speculative, weak evidence |

## Scheme (Argument Scheme)

각 섹션은 **반드시** argument scheme을 설정해야 한다. scheme은 논증 유형을 결정하며, 어떤 종류의 근거와 공격이 유효한지를 규정한다.

**유효한 scheme 값**: authority, analogy, cause-effect, statistics, example, sign, principle, consequence

**강제 수준 (모든 워크플로우에서 동일):**

| 워크플로우 | 강제 수준 | 행동 |
|-----------|----------|------|
| expand | **필수** | Step 2에서 반드시 선택. 스킵 불가 |
| settle | **필수** | scheme 미설정 시 settle 거부 |
| challenge | **major** | scheme 미설정 → ⚠️ major (settle 전 설정 필요) |
| debate | **참조** | Con-Agent가 scheme CQ 기반으로 공격 |

## Settled Criteria

A section is eligible for `/sowhat:settle` when ALL of the following are true:
- Claim: non-empty, clear assertion
- Grounds: at least 1 concrete evidence item
- Warrant: explicit reasoning connecting Grounds → Claim
- Qualifier: set to a specific level (not blank)
- Rebuttal: at least 1 condition identified
- Scheme: set to a valid argument scheme
- Backing: optional but recommended

## Field Naming Convention

**정식 명칭만 사용한다.** 아래 별칭은 사용하지 않는다:

| 정식 명칭 | 사용 금지 별칭 |
|----------|--------------|
| Grounds | Supporting Arguments, 지지 논거, Evidence |
| Warrant | Logical Connection, 연결 |
| Backing | Meta-justification |
| Rebuttal | Counter, Counterargument |

모든 워크플로우, 에이전트, 레퍼런스에서 정식 명칭만 사용한다.

## MECE Check

Key Arguments in thesis should be:
- **Mutually Exclusive**: no overlap between sections
- **Collectively Exhaustive**: together they fully support the thesis Answer
