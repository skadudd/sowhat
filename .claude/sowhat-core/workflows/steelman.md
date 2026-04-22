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

## AI Content Boundary (cycle 7)

Anti-Thesis, Counter-Claim, Counter-Warrant는 AI가 **논리 구조 기반**으로만 생성한다. Counter-Grounds의 구체값(수치·기관명·연도·인물명·URL)은 AI가 자동 생성하지 않는다. 상세: `references/ai-content-boundary.md`.

Counter-Grounds 구체값 유입 경로:

1. `research/` 디렉터리에 원본 Claim을 반박하는 #NNN finding 존재
2. Research-Agent 스폰 후 반증 발견 (영수증 검증 통과)
3. 사용자가 inject로 주입한 반증 자료 (file:/dir:)

**반증 retrieval이 없으면 Counter-Grounds는 `[source:placeholder]` 유형 기술만 수행**. 예:
- 허용: `"원본 Grounds의 표본이 특정 세그먼트에 편향됐을 가능성 [source:placeholder]"`
- 금지: `"McKinsey 2024 보고서 기준 실제 이탈률은 12% [source:...]"` ← retrieval 없이 생성 불가

Anti-Warrant, Counter-Warrant는 논리 취약점(Warrant non-sequitur, Qualifier overclaiming, Scheme CQ 미충족)으로 구성. `[source:inference]` 태그.

retrieval 없이 생성된 steelman은 **논리 기반 stress test**로서 유효하며, 구체적 반증 데이터를 원하면 사용자에게 다음을 안내:

```
ℹ️  구체적 반증 데이터 없이 논리 기반 counter 생성.
   강화를 원하면 /sowhat:research 또는 /sowhat:inject 로 반증 자료 수집 후 재실행.
```

---

## 스텝 1: Thesis Answer 및 Key Arguments 로드

1. `00-thesis.md`에서 Answer와 모든 Key Arguments를 추출
2. 각 섹션 파일에서 Toulmin 필드 전체를 로드:
   - Claim, Grounds, Warrant, Backing, Qualifier, Rebuttal, Scheme

---

## 스텝 2: Anti-Thesis 생성

thesis Answer에 대한 **가장 강력한 반대 입장**을 논리 구조로 생성한다:

1. Anti-Claim: Answer의 대안적 입장 — AI 자동 생성 가능 (`[source:inference]`)
2. Anti-Warrant: Anti-Claim을 정당화하는 논리 원칙 — AI 자동 생성 가능 (`[source:inference]`)
3. Anti-Grounds:
   - `research/`에 매핑된 반증 finding 존재 → 원문 인용 (`[source:#NNN]`)
   - inject 자료 존재 → 인용 (`[source:file:path]`)
   - 둘 다 없음 → 유형 기술만 (`"원본 표본의 지역 편향 가능성 [source:placeholder]"`). 구체 수치·기관명 자동 생성 금지.

4. `counter/anti-thesis.md`에 저장:
   ```markdown
   # Anti-Thesis

   ## Thesis Answer (원본)
   "{thesis_answer}"

   ## Anti-Thesis (최강 반대 입장)
   "{anti_thesis} [source:inference]"

   ## Anti-Grounds
   {anti_grounds_with_source_tags}

   ## Anti-Warrant
   {anti_warrant} [source:inference]

   ## 생성 근거
   {왜 이것이 가장 강력한 반대 입장인지 — 논리 구조 기반}
   ```

---

## 스텝 3: 섹션별 Counter-Argument 생성

각 Key Argument(섹션)에 대해 counter-argument를 생성한다:

```
FOR EACH section:
  1. Counter-Claim 생성 — AI 자동 (`[source:inference]`):
     - 원본 Claim의 대안적 시각에서의 주장
     - 단순 부정이 아닌, 독립 설득력 있는 대안

  2. Counter-Grounds 생성 — retrieval 우선:
     - research/ 매핑 반증 finding → 원문 인용 (`[source:#NNN]`)
     - inject 반증 자료 → 인용 (`[source:file:path]`)
     - 둘 다 없음 → 유형 기술만 (`[source:placeholder]`)
       예: "원본 grounds의 시계열이 경기 확장기에 치우쳤을 가능성 [source:placeholder]"
     - 구체 수치·기관명·연도 자동 생성 금지

  3. Counter-Warrant 생성 — AI 자동 (`[source:inference]`):
     - 원본 Warrant의 non-sequitur / missing link / circular 중 어디가 취약한지
     - Scheme Critical Questions 중 원본이 답하지 못한 것
     - Qualifier overclaiming 지점

  4. counter/counter-{section}.md에 저장:
     # Counter: {section_name}

     ## 원본 Claim
     "{original_claim}"

     ## Counter-Claim
     "{counter_claim} [source:inference]"

     ## Counter-Grounds
     {counter_grounds_with_source_tags}

     ## Counter-Warrant
     {counter_warrant} [source:inference]

     ## 원본 Warrant 약점
     {원본 Warrant의 논리 취약점 — non-sequitur / missing link / circular 중 어떤 것인가}
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

- **Counter는 논리 구조 중심** — Counter-Claim/Counter-Warrant는 AI가 자동 생성 가능 (`[source:inference]`). Counter-Grounds의 구체값은 retrieval만 인용 (`references/ai-content-boundary.md`)
- **Source tag 강제** — 모든 counter 항목에 `[source:...]`. 태그 없거나 AI가 임의 부착한 retrieval 태그는 drop
- **reretrieval 부재 시 placeholder 허용** — `[source:placeholder]` 로 유형 기술만 하여도 유효한 논리 기반 steelman. 사용자에게 research/inject 안내
- **진정한 steelman** — 허수아비(strawman)가 아닌, 실제로 설득력 있는 반대 논증을 생성해야 한다
- **Toulmin 기반** — counter도 Claim/Grounds/Warrant 구조를 갖춰야 한다
- **건설적 목적** — 파괴가 아닌, 원본 논증 강화를 위한 스트레스 테스트
- **취약점 = 개선 기회** — 반론이 이기는 곳이 가장 보강이 필요한 곳
