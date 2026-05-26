# Toulmin Model — sowhat Field Definitions

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
| **claim_tier** | 주장 등급 | `A` = thesis Key Argument에 직결. `B` = 보조/배경 주장. default: thesis KA에 직결이면 A, 아니면 B. | `A` |

> 예시의 `{중괄호}` 플레이스홀더는 실제 값이 retrieval(사용자 입력, Sub-Research, `research/` finding)을 통해서만 채워져야 함을 의미한다. AI가 이 자리를 구체 고유값으로 자체 생성하면 **fabrication**이다. 상세: `references/ai-content-boundary.md`.

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

### Claim Tier gating (settle 전 적용)

| claim_tier | Backing 요구 수준 | Qualifier 요건 | settle 허용 조건 |
|-----------|:---:|:---:|---|
| **A** (핵심) | T1-T2 Grounds 최소 1개 | 모든 Qualifier 허용 | Grounds에 T1/T2 출처 없으면 settle 거부 |
| **B** (보조) | T3-T4 + qualifier 약화 허용 | `presumably`/`possibly` 시 출처 미명시도 허용 | qualifier가 강한데 출처 약하면 경고 |

- `claim_tier`가 미설정이면 thesis KA 직결 여부로 자동 추론한다 (확신 없으면 A로 처리).
- Tier-A 섹션에 T1/T2 Grounds가 없으면 settle 시 `❌ Tier-A 섹션은 T1/T2 수준 출처가 필요합니다` 오류를 출력하고 거부한다.

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
