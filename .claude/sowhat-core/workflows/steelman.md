# /sowhat:steelman — Counter-Narrative Generation

<!--
@metadata
checkpoints:
  - type: verify-argument
    when: "Counter-narrative 생성 후 결과 확인"
config_reads: [layer, sections]
config_writes: []
continuation:
  primary: "/sowhat:revise {weakest_section}"
  alternatives: ["/sowhat:debate {section}", "/sowhat:challenge"]
status_transitions: []
-->

이 워크플로우는 현재 thesis에 대한 최강 반대 논증 트리를 자동 생성한다. 논증의 근본적 강도를 스트레스 테스트하는 것이 목적이다.

---

## 사전 검증

1. `planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"spec"` 또는 `"finalized"`이면: `❌ 이미 명세/완료 레이어입니다.`
2. `00-thesis.md` 로드 → `thesis_answer`(Answer), `key_arguments` 목록 추출
3. 최소 1개 settled 또는 discussing 섹션이 있어야 함
   - 없으면: `❌ 반대 논증을 생성할 섹션이 없습니다. /sowhat:expand로 먼저 섹션을 전개하세요.`
4. `--section` 인자가 있으면 해당 섹션만 대상, 없으면 전체 섹션 대상
5. `counter/` 디렉터리 생성:
   ```bash
   mkdir -p counter
   ```

---

## L1 Fabrication 차단 (필수)

이 워크플로우가 **AI가 생성하는** Anti-Thesis, Counter-Grounds, Counter-Warrant, Counter-Claim에는 구체 수치·기관명·연도·인물명·URL 같은 fabrication 가능 고유값을 포함하지 않는다.

구체 내용은 오직 3가지 경로에서만 들어온다:
1. 사용자 직접 입력
2. Sub-Research 결과 (영수증 검증 통과)
3. `research/` 파인딩 매핑

AI가 스텝 2·3에서 "구체적 근거"를 생성하라는 지시를 받더라도, **retrieval 없이 기관명·수치를 만들어내지 말 것**. 근거 유형(예: `"업계 벤치마크를 반박하는 규모 가설"`)과 논리 구조만 제시하고, 구체 값이 필요하면 research-agent를 스폰하거나 사용자에게 명시 요청.

상세: `references/fabrication-prevention.md`.

### L0 AI-엄격 실행 조건 (cycle 5 신설 — AU4 해소)

Anti-Thesis, Counter-Grounds, Counter-Warrant 생성 시 IF-ELSE:

```
FOR EACH generation [Anti-Claim, Anti-Grounds, Anti-Warrant,
                     Counter-Claim, Counter-Grounds, Counter-Warrant]:

  counter_research_available =
    (research/ 디렉토리에 원본 주장에 대한 반증 finding 존재)
    OR
    (Research-Agent 스폰 후 반증 발견)

  IF counter_research_available:
    생성 내용: finding 기반 구체적 counter-evidence (원문 인용 + #NNN)

  ELSE:
    생성 내용: 논리적 반론만 (수치·기관명·연도 조합 금지)
      · Warrant 약점 지적
      · Scheme Critical Questions 적용
      · Qualifier overclaiming 공격
    메타: unverified: true (settle은 되지만 L4가 추적)
    
    사용자에게 알림:
      "ℹ️ 구체적 반증 데이터 없이 논리 기반 counter 생성.
       강화를 원하면 /sowhat:research로 반증 자료 수집 후 재실행."
```

steelman은 공격을 위해 존재하지만 공격 자체가 fabrication이면 안 됨. 논리 기반 counter는 **정당한 L2 통과 경로**.

---

## 스텝 1: Thesis Answer 및 Key Arguments 로드

1. `00-thesis.md`에서 Answer와 모든 Key Arguments를 추출
2. 각 섹션 파일에서 Toulmin 필드 전체를 로드:
   - Claim, Grounds, Warrant, Backing, Qualifier, Rebuttal, Scheme

---

## 스텝 2: Anti-Thesis 생성

thesis Answer에 대한 **가장 강력한 반대 입장**을 생성한다:

1. Answer의 핵심 주장을 부정하는 방향으로 Anti-Thesis 구성
2. Anti-Thesis는 단순 부정이 아니라, 독립적으로 설득력 있는 대안적 입장이어야 함
3. Anti-Thesis에 대한 Toulmin 구조 생성:
   - Anti-Claim: Answer의 정반대 또는 대안적 주장
   - Anti-Grounds: Anti-Claim을 지지하는 근거
   - Anti-Warrant: Anti-Grounds → Anti-Claim 연결 논리

4. `counter/anti-thesis.md`에 저장:
   ```markdown
   # Anti-Thesis

   ## Thesis Answer (원본)
   "{thesis_answer}"

   ## Anti-Thesis (최강 반대 입장)
   "{anti_thesis}"

   ## Anti-Grounds
   {anti_grounds}

   ## Anti-Warrant
   {anti_warrant}

   ## 생성 근거
   {왜 이것이 가장 강력한 반대 입장인지 설명}
   ```

---

## 스텝 3: 섹션별 Counter-Argument 생성

각 Key Argument(섹션)에 대해 counter-argument를 생성한다:

```
FOR EACH section:
  1. Counter-Claim 생성:
     - 원본 Claim의 직접적 반대 주장
     - 단순 부정이 아닌, 대안적 시각에서의 주장

  2. Counter-Grounds 생성:
     - Counter-Claim을 지지하는 구체적 근거
     - 가능하면 원본 Grounds를 재해석하거나 반박하는 근거
     - source-credibility.md Tier 기준 적용

  3. Counter-Warrant 생성:
     - Counter-Grounds → Counter-Claim 연결 논리
     - 원본 Warrant의 약점을 공략하는 방향

  4. counter/counter-{section}.md에 저장:
     # Counter: {section_name}

     ## 원본 Claim
     "{original_claim}"

     ## Counter-Claim
     "{counter_claim}"

     ## Counter-Grounds
     {counter_grounds}

     ## Counter-Warrant
     {counter_warrant}

     ## 원본 Warrant 약점
     {원본 Warrant가 왜 불충분한지}
```

---

## 스텝 4: 원본 vs Counter 비교 분석

각 섹션별로 원본과 counter를 비교한다:

```
FOR EACH section:
  1. Grounds 강도 비교:
     - strength-scoring.md 기준으로 양측 근거 강도 계산
     - 어느 쪽이 더 강한 근거를 가지고 있는가?

  2. Warrant 방어력 비교:
     - challenge-algorithm.md Stage 3 기준으로 양측 Warrant 유효성 판정
     - 어느 쪽의 논리 연결이 더 견고한가?

  3. 취약점 판정:
     - 🔴 반론이 더 강함: counter가 Grounds + Warrant 모두에서 우위
     - ⚠️ 대등: 양측 비슷한 수준, 추가 근거 필요
     - ✅ 원본이 더 강함: 원본이 Grounds 또는 Warrant에서 명확히 우위
```

---

## 스텝 5: Steelman Report 생성

`counter/STEELMAN-REPORT.md`에 종합 보고서를 생성한다:

```markdown
# Steelman Report

## Anti-Thesis
"{anti_thesis}"

## Anti-Thesis 강도 평가
{anti_thesis가 thesis answer를 얼마나 위협하는지 종합 평가}

---

## 섹션별 취약점 분석

### {section_name}
- 판정: {🔴|⚠️|✅}
- 원본 Grounds 강도: {점수}
- Counter Grounds 강도: {점수}
- 원본 Warrant 견고성: {high|medium|low}
- Counter Warrant 견고성: {high|medium|low}
- 상세: {구체적 분석}

{모든 섹션에 대해 반복}

---

## 가장 취약한 논거

**섹션**: {section_name}
**이유**: {왜 이 섹션이 가장 취약한지}
**권장 조치**: {어떻게 보강해야 하는지}

---

## Rebuttal 보강 권고

{각 취약 섹션에 대한 구체적 Rebuttal 보강 방향}

---

## 전체 논증 취약성 요약

- 전체 취약 섹션 수: {count}
- 가장 심각한 위협: {anti-thesis 또는 특정 counter}
- 권장 다음 단계: {/sowhat:revise 또는 /sowhat:expand 권고}
```

---

## 출력 형식

```
----------------------------------------
Steelman 완료

Anti-Thesis: "{strongest opposing position}"

섹션별 취약점:
  01-problem     🔴 반론이 더 강함 — {이유}
  02-solution    ✅ 원본이 더 강함
  03-market      ⚠️ 대등 — 추가 근거 필요

가장 취약한 논거: {section} — {why}

파일: counter/STEELMAN-REPORT.md

다음: /sowhat:revise {weakest section}
----------------------------------------
```

---

## 커밋

steelman 완료 후:
```bash
git add counter/
git commit -m "steelman({project}): generate counter-narrative"
```

---

## 핵심 원칙

- **진정한 steelman** — 허수아비(strawman)가 아닌, 실제로 설득력 있는 반대 논증을 생성해야 한다
- **Toulmin 기반** — counter도 Claim/Grounds/Warrant 구조를 갖춰야 한다
- **source-credibility 적용** — counter의 근거도 Tier 기준을 충족해야 한다
- **건설적 목적** — 파괴가 아닌, 원본 논증 강화를 위한 스트레스 테스트
- **취약점 = 개선 기회** — 반론이 이기는 곳이 가장 보강이 필요한 곳
