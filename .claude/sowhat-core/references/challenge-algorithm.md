# Challenge Algorithm — 7단계 판정 명세

각 스테이지의 판정 알고리즘, pass/fail 기준, severity 분류를 정의한다.
challenge-agent와 challenge 워크플로우가 이 문서를 단일 진실 소스로 참조한다.

---

## 공통 규칙

### Severity 등급

| 등급 | 의미 | 후속 조치 |
|------|------|-----------|
| 🔴 `critical` | 논증 구조 붕괴. 이 문제가 해결되지 않으면 섹션 settle 불가 | 필수 수정 (`needs-revision`) |
| ⚠️ `major` | 논증 약화. settle 가능하나 공격에 취약 | 수정 권고 (settle 전 해결 권장) |
| 💡 `minor` | 개선 여지. 논증 유효성에 영향 없음 | 선택적 개선 |

### 판정 원칙

1. **의심스러우면 공격** — 약한 논증을 통과시키는 것보다 강한 논증을 한 번 더 검증하는 것이 낫다
2. **구체적으로 공격** — "약하다"가 아니라 "왜, 어디가, 어떻게 약한지" 명시
3. **수정 방향 제시** — 문제만 지적하지 말고 해결 경로도 함께 제시
4. **독립 판정** — 각 스테이지는 이전 스테이지 결과에 영향받지 않고 독립 판정

---

## Stage 0: Grounds 사실 검증 (Factual Verification)

**질문**: Grounds에 포함된 수치·통계·사실 주장·사례가 실제와 일치하는가?

> **위치**: 모든 논리 검증(Stage 1-7) **이전에** 실행한다. 논리 구조가 아무리 완벽해도 사실이 틀리면 논증은 무효다.
> **도구**: 이 스테이지는 WebSearch/WebFetch를 사용하는 sowhat-research-agent를 스폰하여 실행한다. challenge-agent(Read/Glob/Grep만 보유)가 아닌 research-agent가 담당한다.

### 알고리즘

```
FOR EACH section:
  claims = extract_verifiable_claims(section.grounds, section.backing)
  # 추출 대상:
  #   - 정량 데이터: 수치, %, 건수, 금액, 비율
  #   - 시점 주장: "2024년 기준", "전년 대비"
  #   - 사실 주장: "정부가 X를 시행했다", "Y 기관이 Z를 발표했다"
  #   - 사례 인용: 특정 거래, 사건, 판례, 기업 사례

  FOR EACH claim IN claims:

    ── A. 출처 존재 여부 ──
    IF claim에 출처(URL/인용) 없음:
      claim_tier = section.claim_tier OR "A"  # 미설정 시 보수적으로 A 처리
      IF claim_tier == "A":
        → ⚠️ major: 출처 미명시 (핵심 주장 근거 — 검증 불가)
      ELSE IF claim_tier == "B" AND section.qualifier IN ["presumably", "possibly"]:
        → 💡 minor: 출처 미명시 (보조 주장 + qualifier 약화로 허용)
      ELSE:  # Tier-B but qualifier is strong
        → ⚠️ major: 출처 미명시 (보조 주장이나 qualifier가 강함 — qualifier 완화 또는 출처 추가 필요)
      CONTINUE

    ── B. 1차 출처 역추적 ──
    source_layer = classify_source_layer(claim.source)
    # Primary: 데이터 원본 생산자 (통계청, 실거래가 시스템, 한국은행 등)
    # Secondary: 원본 가공/보도 (뉴스 기사, 분석 리포트 등)

    IF source_layer == "Secondary" AND claim.type IN [정량, 사례]:
      → 1차 출처 역추적 시도
      primary = trace_to_primary(claim.source)
      IF primary 발견:
        claim.primary_source = primary
      ELSE:
        → 💡 minor: 1차 출처 미확인 (2차 출처만 존재)

    ── C. 수치·사실 대조 ──
    reference_source = claim.primary_source OR claim.source
    verification = cross_check(claim.value, reference_source)

    CASE verification:
      일치 → ✅ 검증됨
      불일치 → 🔴 critical: 사실 오류
        report: "섹션 값: {claim.value}, 출처 원문: {reference_value}"
      확인 불가 → ⚠️ major: 검증 실패 (출처 접근 불가 또는 해당 수치 미발견)

    ── D. 단위·방향·맥락 검증 ──
    IF claim.type == 정량:
      단위 확인: 상한/하한, 증가/감소, 전년비/기준년비, 명목/실질
      IF 단위·방향 혼동 감지:
        → 🔴 critical: 단위/방향 오류
          report: "섹션: '{claim.text}', 원문: '{원문 표현}'"

    ── E. 해석 정합성 ──
    IF claim에 해석이 포함됨 (추세 판단, 인과 서술 등):
      원본 데이터가 해당 해석을 지지하는지 확인
      IF 데이터가 해석과 불일치:
        → ⚠️ major: 해석 왜곡
          report: "데이터: {실제 추세}, 섹션 해석: {섹션 서술}"
      IF 데이터가 해석을 부분적으로만 지지:
        → 💡 minor: 해석 과잉 (표현 완화 권고)

    ── F. 사례 대표성 (사례 인용인 경우) ──
    IF claim.type == 사례:
      특수 거래 여부 확인 (증여, 직거래, 경매, 공매 등)
      IF 특수 거래:
        → 🔴 critical: 비대표적 사례 (특수 거래를 일반 사례로 인용)
      일반화 가능성 확인
      IF 단일 사례로 추세 주장:
        → ⚠️ major: 과잉 일반화

  ── G. Cross-Section 정합성 (전체 검증) ──
  FOR EACH data_point APPEARING IN multiple sections:
    IF 동일 데이터가 다른 값으로 인용됨:
      → 🔴 critical: 섹션 간 수치 불일치
        report: "{data_point}: 섹션 {A}에서 {value_A}, 섹션 {B}에서 {value_B}"
```

### Pass 기준
- 모든 정량 데이터의 출처 대조 일치
- 단위/방향 오류 없음
- 해석이 원본 데이터와 정합
- 섹션 간 동일 데이터 일관성

### Research-Agent 스폰 패턴

```
FOR EACH section:
  claims = extract_verifiable_claims(section)
  IF claims.length > 0:
    result = Task(sowhat-research-agent,
      prompt = """
      <mode>fact-check</mode>
      <section>{section}</section>
      <claims>{claims — 각 claim의 값, 출처, 맥락}</claims>
      <instructions>
        각 claim에 대해:
        1. 출처가 있으면 → 출처 원문에서 수치/사실 대조
        2. 2차 출처이면 → 1차 출처 역추적 시도
        3. 출처가 없으면 → 독립 검색으로 사실 확인
        4. 사례이면 → 원본 데이터에서 거래 유형/맥락 확인
        각 claim에 대해 [정확/부정확/부분정확/확인불가] 판정
      </instructions>
      """)
```

---

## Stage 1: Thesis 정합성

**질문**: 각 섹션의 thesis_argument가 thesis Answer를 실제로 지지하는가?

### 알고리즘

```
FOR EACH section:
  1. section.thesis_argument를 thesis.Answer와 대조
  2. 필요성 테스트: "이 섹션의 Claim이 제거되면 Answer가 흔들리는가?"
     - YES → 필요한 섹션
     - NO → ⚠️ major: 불필요한 섹션 (Answer에 기여하지 않음)
  3. 지지 방향 테스트: "이 섹션의 Claim이 참이면 Answer가 더 강해지는가?"
     - NO → 🔴 critical: 방향 불일치 (Claim이 Answer를 약화시키거나 무관)

THEN (전체 검증):
  4. 충분성 테스트: 모든 settled+discussing 섹션의 Claim을 합치면 Answer를 완전히 커버하는가?
     - 빠진 논거 있음 → ⚠️ major: 커버리지 갭 (누락된 Key Argument 명시)
  5. IBIS Position 명확성: 각 섹션이 어떤 Issue에 대한 Position인지 추론 가능한가?
     - 불명확 → 💡 minor: Position 명시화 권고

  6. Drift Score 계산:
     FOR EACH section:
       drift = semantic_distance(section.Claim, thesis.Answer)
       IF drift > threshold:
         ⚠️ major: Thesis drift 감지 — 섹션이 Answer에서 멀어지고 있음
```

### Pass 기준
- 모든 섹션이 필요성 + 지지 방향 테스트 통과
- 충분성 테스트에서 갭 없음

---

## Stage 2: Argument Scheme 유효성

**질문**: 각 섹션의 scheme이 설정되어 있고, 해당 scheme의 Critical Questions에 답할 수 있는가?

### 알고리즘

```
FOR EACH section:
  1. scheme 필드 확인
     - 없음 → ⚠️ major: scheme 미설정 (공격 방어 불가)
     - 있음 → Step 2

  2. scheme별 Critical Questions 적용:

     authority:
       CQ1: 이 권위자가 해당 도메인의 전문가인가?
         - Grounds에 전문가 자격/소속/실적 없음 → 🔴 critical
       CQ2: 해당 분야에 전문가 합의가 있는가?
         - 반대 의견 존재 미언급 → ⚠️ major
       CQ3: 이해충돌 가능성?
         - 미검토 → 💡 minor

     analogy:
       CQ1: 두 사례가 핵심 측면에서 유사한가?
         - 유사성 논거 없음 → 🔴 critical
       CQ2: 차이점이 결론에 결정적인가?
         - 차이점 미검토 → ⚠️ major

     cause-effect:
       CQ1: 인과 메커니즘이 설명되어 있는가?
         - 상관관계만 제시 → 🔴 critical
       CQ2: 역인과/혼재변수 가능성?
         - 미검토 → ⚠️ major
       CQ3: 시간 순서가 맞는가?
         - 역순 또는 불명확 → ⚠️ major

     statistics:
       CQ1: 표본 크기와 대표성?
         - N 미명시 또는 N<30 → ⚠️ major
       CQ2: 방법론 기술 여부?
         - 방법론 없음 → 🔴 critical (검증 불가)
       CQ3: 데이터 시점?
         - 3년 이상 경과 → ⚠️ major

     example:
       CQ1: 사례가 대표적인가?
         - 1개만 제시 → ⚠️ major
       CQ2: 선택 편향?
         - 성공 사례만 → 🔴 critical
       CQ3: 일반화 가능한가?
         - 특수 상황 → ⚠️ major

     sign:
       CQ1: 신호-결과 관계의 신뢰성?
         - 신뢰도 미검증 → ⚠️ major
       CQ2: 대안 설명 가능성?
         - 미검토 → ⚠️ major

     principle:
       CQ1: 원칙이 이 상황에 적용 가능한가?
         - 적용 조건 불명확 → ⚠️ major
       CQ2: 예외 조건?
         - 미검토 → 💡 minor

     consequence:
       CQ1: 결과 예측이 현실적인가?
         - 낙관 편향 → ⚠️ major
       CQ2: 부작용 검토?
         - 미검토 → ⚠️ major
       CQ3: 시간대 적절성?
         - 미명시 → 💡 minor
```

### Pass 기준
- scheme 설정됨
- 해당 scheme의 CQ 중 🔴 critical 없음

---

## Stage 3: Warrant 유효성

**질문**: Warrant가 Grounds → Claim을 논리적으로 연결하는가?

### 알고리즘

```
FOR EACH section:
  1. Warrant 존재 확인
     - 비어있음 or "Implicit" → 🔴 critical: Warrant 부재

  2. 연결 타당성 3중 테스트:

     Non-sequitur 테스트:
       "Grounds를 읽고 → Warrant를 적용하면 → Claim이 도출되는가?"
       - Grounds가 다른 결론도 동등하게 지지 → 🔴 critical
       - 판정법: Grounds + Warrant로 Claim의 부정도 동등하게 도출 가능하면 Non-sequitur

     Missing-link 테스트:
       "Grounds에서 Claim까지 Warrant가 메우는 논리적 단계가 1개인가?"
       - 2개 이상의 중간 단계가 숨어있음 → ⚠️ major
       - 판정법: Warrant를 A→C로 요약했을 때, 명시되지 않은 B가 필요하면 Missing-link

     Circular 테스트:
       "Warrant가 Claim을 다른 말로 반복하고 있는가?"
       - Warrant ≈ Claim (의미적 동치) → 🔴 critical
       - 판정법: Warrant에서 Claim 특유의 키워드를 제거하면 빈 문장이 되는가?

  3. Backing 강화 확인 (선택적)
     - Backing 없음 → 💡 minor: Warrant 근거 보강 권고
     - Backing 있음 → Backing이 Warrant를 실제로 지지하는지 확인
```

### Pass 기준
- Warrant 존재
- Non-sequitur, Circular 테스트 모두 통과
- Missing-link가 있더라도 major 이하면 pass (단, 권고 포함)

---

## Stage 4: So What (Grounds → Claim 흐름)

**질문**: Grounds가 실제로 Claim을 지지하는가?

### 알고리즘

```
FOR EACH section:
  1. Grounds 목록을 개별적으로 검토
  2. 각 Ground에 대해:
     "이 Ground가 참이면, Claim이 더 그럴듯해지는가?"
     - YES → 지지 관계 확인
     - NO → ⚠️ major: 무관한 근거 (Claim과 연결 없음)
     - 부분적 → 💡 minor: 간접 지지 (직접 연결 보강 필요)

  3. 전체 Grounds → Claim 흐름:
     "모든 Grounds를 합치면, Warrant를 경유하여 Claim이 자연스럽게 따라오는가?"
     - 흐름이 끊김 → 🔴 critical: 논증 체인 단절
     - 흐름은 있으나 비약 → ⚠️ major

  4. 상위 연결 확인:
     "이 섹션의 Claim이 상위 Key Argument를 지지하는가?"
     - 연결 불명확 → ⚠️ major: thesis까지의 연결선 단절
```

### Pass 기준
- 모든 Grounds가 Claim을 지지 (무관한 근거 없음)
- 전체 흐름이 끊기지 않음
- 상위 연결 확인됨

---

## Stage 5: Why So (근거 충분성·필요성)

**질문**: 근거가 충분하고, 각 근거가 필요한가?

> **출처 신뢰도 연동**: 이 스테이지는 `references/source-credibility.md`의 Tier 가중치를 사용한다.

### 알고리즘

```
FOR EACH section:
  0. 출처 신뢰도 검사 (source-credibility.md 참조):
     FOR EACH ground:
       - 출처 URL/인용이 있는가?
         - 없음 → ⚠️ major: 출처 미명시 (strength × 0.5)
       - 출처의 Tier 판정:
         - T4가 Grounds에 단독 사용됨 → 🔴 critical: T4 출처 Grounds 위반
         - T3가 단독 사용 + Qualifier ≤ 2 (in most cases) → ⚠️ major: 교차검증 필요

  1. 충분성 테스트:
     Qualifier별 최소 근거 기준:
     | Qualifier | 최소 근거 수 | 최소 근거 유형 | 최소 Tier |
     |-----------|-------------|---------------|-----------|
     | definitely (0) | 3+ | 최소 1개 정량적 데이터 필수 | T1 필수 1개 이상 |
     | usually (1) | 2+ | 정량 또는 복수 사례 | T1 또는 T2 |
     | in most cases (2) | 2+ | 유형 무관 | T2 이상 1개 |
     | presumably (3) | 1+ | 유형 무관 | Tier 무관 |
     | possibly (4) | 1+ | 유형 무관 | Tier 무관 |

     근거 수 < 최소 기준 → ⚠️ major: 근거 부족
     근거 유형 미충족 → ⚠️ major: 근거 유형 불일치
     Tier 미충족 → ⚠️ major: 출처 신뢰도 부족 (Tier 상향 또는 Qualifier 하향 권고)

  2. 필요성 테스트:
     FOR EACH ground:
       "이 ground를 제거하면 Claim이 약해지는가?"
       - NO → 💡 minor: 불필요한 근거 (제거 권고)
       - YES → 필요한 근거

  3. 중복성 테스트:
     FOR EACH pair (ground_i, ground_j):
       "두 근거가 동일한 논점을 다른 말로 반복하는가?"
       - YES → 💡 minor: 중복 근거 (통합 권고)

  4. 비약 테스트:
     "가장 약한 Ground에서 Claim까지의 논리적 거리가 얼마나 먼가?"
     - Ground가 Claim의 전제조건이 아닌 배경지식 수준 → ⚠️ major: 논리적 비약
```

### Pass 기준
- Qualifier 대비 근거 수/유형 충족
- critical 없음

---

## Stage 6: Qualifier 보정

**질문**: Qualifier가 근거 강도에 비례하는가?

### 알고리즘

```
FOR EACH section:
  1. 근거 강도 평가 (source-credibility.md Tier 보정 적용):
     기본 strength:
     - 정량 데이터 (통계, 수치, 연구결과) → strength +2
     - 복수 사례/비교 → strength +1
     - 단일 사례/인터뷰 → strength +0
     - 주장만 (근거 없는 assertion) → strength -1

     Tier 보정:
     - T1 출처 기반 → strength × 1.5 (올림)
     - T2 출처 기반 → strength × 1.0
     - T3 출처 기반 → strength × 0.7 (내림)
     - T4 출처 기반 → strength × 0.3 (내림)
     - 출처 미명시 → strength × 0.5

     total_strength = sum(각 ground의 Tier 보정 strength)

  2. Rebuttal 강도 평가:
     - 구체적 반론 + 대응 있음 → rebuttal_strength = strong
     - 반론 있으나 대응 미흡 → rebuttal_strength = moderate
     - 반론 없음 → rebuttal_strength = weak

  3. 적정 Qualifier 범위 추정:

     | total_strength | rebuttal_strength | 적정 범위 |
     |---------------|-------------------|-----------|
     | 5+ | strong | definitely ~ usually (0-1) |
     | 3-4 | strong | usually ~ in most cases (1-2) |
     | 3-4 | moderate | in most cases ~ presumably (2-3) |
     | 1-2 | any | presumably ~ possibly (3-4) |
     | 0 이하 | any | possibly (4) |

  4. 현재 Qualifier와 적정 범위 비교:
     - 현재 < 적정 하한 (예: definitely인데 적정은 presumably~possibly) → ⚠️ major: Overclaiming
     - 현재 > 적정 상한 (예: possibly인데 적정은 usually~in most cases) → 💡 minor: Underclaiming
     - 범위 내 → 통과

  특수 케이스:
  - definitely + Rebuttal 없음 → 🔴 critical: 무조건 Overclaiming
  - definitely + 근거 1개 → 🔴 critical: 무조건 Overclaiming
```

### Pass 기준
- Qualifier가 적정 범위 내
- 특수 케이스 해당 없음

---

## Stage 7: MECE + Steelman

**질문**: Key Arguments가 중복 없이 완전하고, 최강 반론에 대응하고 있는가?

### 알고리즘

```
MECE 검증:

  1. ME (Mutually Exclusive):
     FOR EACH pair (section_i, section_j):
       두 섹션의 Claim이 동일한 논점을 다루는가?
       - YES → ⚠️ major: 중복 (통합 또는 분리 필요)
       두 섹션의 Scope.In이 겹치는가?
       - YES → ⚠️ major: 영역 충돌

  2. CE (Collectively Exhaustive):
     thesis.Answer를 달성하기 위해 필요한 논거를 열거하고,
     현재 섹션들이 이를 모두 커버하는지 확인
     - 누락 있음 → ⚠️ major: 커버리지 갭 (누락 논거 명시)

Steelman 검증:

  3. FOR EACH section:
     a. 섹션의 Rebuttal 필드를 읽지 않고,
        scheme CQ + 일반 논리를 기반으로 최강 반론을 독립 생성
     b. 생성된 반론과 섹션의 Rebuttal 필드를 대조:
        - Rebuttal이 최강 반론을 커버 → 통과
        - Rebuttal이 더 약한 반론만 다룸 → ⚠️ major: Steelman 미대응
        - Rebuttal 비어있음 → 🔴 critical: 반론 부재

  4. 전체 논증 Steelman:
     thesis.Answer 자체에 대한 최강 반론 생성
     - 어떤 섹션의 Rebuttal도 이를 다루지 않음 → ⚠️ major: 전체 논증 취약점
```

### Pass 기준
- ME: 중복 없음
- CE: 커버리지 갭 없음
- Steelman: 모든 섹션이 최강 반론에 대응

---

## Tie-Breaking 규칙

동일 섹션에 여러 스테이지에서 문제가 발견될 때:

1. **severity 우선**: critical > major > minor
2. **동일 severity면 스테이지 순서 우선**: Stage 1 문제가 Stage 7보다 근본적
3. **수정 순서 권고**: Warrant(Stage 3) → Grounds(Stage 5) → Qualifier(Stage 6) → Rebuttal(Stage 7) → Scheme(Stage 2) → Thesis정합성(Stage 1)
   - 이유: Warrant 수정이 다른 문제를 연쇄적으로 해결할 가능성이 높음

---

## 전체 논증 강도 점수 (Challenge Score)

```
총 검증 항목 = 섹션 수 × 8 스테이지 (Stage 0 포함)
통과 항목 = critical/major 없는 항목 수

score = (통과 항목 / 총 검증 항목) × 100

  90-100%  →  [██████████] 매우 강함
  70-89%   →  [███████░░░] 강함 (minor 이슈 있음)
  50-69%   →  [█████░░░░░] 보통 (major 이슈 있음)
  30-49%   →  [███░░░░░░░] 약함 (critical 이슈 있음)
  0-29%    →  [█░░░░░░░░░] 매우 약함 (구조적 문제)
```
