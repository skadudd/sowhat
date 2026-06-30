# /sowhat:expand — 섹션 Bottom-Up 전개

<!--
@metadata
checkpoints:
  - type: decision
    when: "stasis 유형 선택 (Step 1.5)"
  - type: decision
    when: "scheme 선택 (Step 2)"
  - type: decision
    when: "claim 후보 중 선택 (Step 3)"
  - type: human-input
    when: "내부 데이터 요청 가능 (Step 4 Grounds)"
  - type: decision
    when: "confidence 자동 추정과 다를 때 (Step 6)"
  - type: decision
    when: "미충족 CQ 처리 선택 (Step 5)"
config_reads: [layer, sections, features]
config_writes: [sections]
continuation:
  primary: "/sowhat:settle {section}"
  alternatives: ["/sowhat:debate {section}", "/sowhat:challenge"]
status_transitions: ["draft → discussing", "needs-revision → discussing"]
-->

이 커맨드는 기획 섹션을 핑퐁 방식으로 전개한다. Walton Argumentation Schemes 기반으로 논증 구조(Claim/Grounds/Scheme+CQs/Confidence Band)를 구축한다. `$ARGUMENTS`에 섹션 이름 또는 번호가 전달된다.

## AI Content Boundary (cycle 7 — Plan A+G)

AI는 **구조만 제안**한다. **내용은 제안하지 않는다**.

- **구조**: Claim 형식, scheme 논리 연결, Scheme 선택, Confidence 추정, Stasis 유형 — **AI 자유**
- **내용**: 구체 수치, 기관명, 인물명, 보고서명, URL — **AI 금지**

내용은 오직 4가지 경로로만 들어온다:
1. 사용자 직접 입력 → `[source:user]`
2. research/ 파인딩 매핑 → `[source:#NNN]`
3. Sub-Research 실행 결과 → `[source:sub-research]`
4. file:/dir: 자료 (inject로 주입) → `[source:file:path]`

AI가 Step 3/5/7/8에서 선택지를 제시할 때 **구체값 포함 선택지 자체를 만들지 않는다**. 상세: `references/ai-content-boundary.md`.

### Source Tag 강제 (Plan G)

AI 생성물 각 항목 끝에 `[source:...]` 태그 필수. 태그 없는 항목은 parser가 drop.

AI가 자유롭게 사용할 수 있는 source:
- `placeholder` — `{기관} {연도}: {수치}` 같은 구체값 없는 플레이스홀더
- `inference` — 구조·논리 추론 (구체값 없음)

AI가 직접 붙일 수 없는 source (workflow가 자동 부착):
- `user`, `#NNN`, `sub-research`, `file:...`

---

## 사전 검증 (1회만 실행 — 이후 재로드 금지)

**세션 시작 시 아래 파일들을 한 번만 로드하고 이후 모든 스텝에서 메모리 값을 재사용한다.**

1. `planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"spec"` 또는 `"finalized"`이면: `❌ 이미 명세/완료 레이어입니다. 기획 섹션 전개 불가.`
2. `00-thesis.md` 로드 → `thesis_answer`(Answer 40자), `key_arguments` 목록 추출 후 변수 저장
3. 대상 섹션 파일 확인:
   - `$ARGUMENTS`가 숫자면 → `{N}-*.md` 패턴으로 검색
   - `$ARGUMENTS`가 이름이면 → `*-{name}.md` 패턴으로 검색
   - 없으면 → 새 섹션 파일 생성 (다음 번호 자동 부여)
   - 섹션 파일 전체를 로드하고 **모든 필드를 변수로 추출**: `thesis_argument`, `stasis`, `scheme`, `claim`, `grounds`, `cq_responses`, `confidence`
4. 섹션 status 확인:
   - `settled` → `❌ 이미 settled된 섹션입니다. /sowhat:challenge로 재검토하세요.`
   - `invalidated` → `❌ invalidated 상태입니다. 상위 논거가 먼저 revision되어야 합니다.`
   - `draft` 또는 `discussing` 또는 `needs-revision` → 진행
5. `research/` 디렉터리 확인:
   - 해당 섹션과 관련된 `status: unreviewed` 파인딩이 있으면:
     `ℹ️ 이 섹션과 관련된 미검토 리서치가 {N}건 있습니다. /sowhat:research review {section}`
   - **research 모드 프로젝트** (`config.json`의 `mode === "research"`): 해당 섹션에 매핑된 `accepted` 파인딩을 로드하여 `mapped_findings[]` 변수에 저장. 스텝 4(Grounds)에서 자동 제시에 사용.
6. 로그 디렉터리 확인:
   ```bash
   mkdir -p logs maps/local
   ```
7. `logs/session.md` 저장:
   ```markdown
   ---
   command: expand
   section: {N}-{section}
   step: stasis
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   expand 시작 — {N}-{section} 전개 중. 현재 스텝: stasis+scheme 정의.

   ## 재개 시 첫 질문
   이 섹션이 다루는 논쟁의 유형(stasis)은 무엇입니까?
   ```

> **로드 원칙**: 이후 스텝에서 배너·질문·판단에 필요한 값은 모두 위에서 추출한 변수를 사용한다.
> 섹션 파일 재로드는 **사용자가 필드를 수정한 직후 저장 확인 시에만** 허용한다.

---

## 컨텍스트 배너 (ux-standards.md §5 준수)

**3-블록 분리 원칙:** 배너 → (빈줄) → 질문+예시 → (빈줄) → 선택지

### 배너 규칙

- **2줄 이하**: 브레드크럼 + 현재 집중 필드값만
- **Thesis는 첫 질문(스텝 1)에서만 1회 표시** — 이후 생략
- **Claim은 매 질문마다 반복** (스텝 3 이후) — 맥락 유지의 핵심
- Stasis/Scheme/논거 등 이미 확정된 정보는 표시하지 않음

```
> [expand {N}-{섹션} > 스텝 4/7 Grounds]
> Claim: "{섹션 주장 40자}"
```

스텝 진행에 따라 직전 확정 필드를 1줄 추가할 수 있음:
```
> [expand {N}-{섹션} > 스텝 5/7 CQ 응답]
> Claim: "{섹션 주장 40자}"
> Grounds: {근거 요약 40자}
```

### 질문 출력 패턴

```
> [expand {N}-{섹션} > 스텝 4/7 Grounds]
> Claim: "{섹션 주장 40자}"

❓ 이 주장을 지지하는 근거의 유형은?

  예) 수치/데이터 → 출처, 규모, 시기를 묻겠습니다

[1] 수치/데이터
[2] 인터뷰/설문
[3] 사례/비교
[4] 전문가 의견
[5] 직접 서술
[6] Sub-Research (인라인 검색)
```

### 답변 확인 패턴

```
✓ Grounds 기록됨: {사용자 입력 또는 Sub-Research 결과 요약}

> [expand {N}-{섹션} > 스텝 5/7 CQ 응답]
> Claim: "{섹션 주장 40자}"
> Grounds: {근거 요약 40자}

❓ scheme CQs에 답하세요.
  ...
```

### 금지 (CRITICAL — 워크플로우 템플릿을 그대로 따를 것)

- **알파벳 선택지 A/B/C/D 절대 금지** — 반드시 [1] [2] [3] [4] 숫자만
- **테이블/표 형식 금지** — `┌─┐│└┘├┤┬┴┼` 및 markdown 테이블로 선택지 나열 금지
- **워크플로우 템플릿 재구성 금지** — 아래 스텝별 템플릿의 포맷을 "더 나은" 형식으로 바꾸지 않음
- `**예시:**` `**선택:**` `**제안:**` `**기타:**` 볼드 라벨 금지
- 배너 3줄 이상 (Thesis + 논거 + Stasis + Scheme + Claim 등 나열) 금지
- 질문과 선택지 사이 빈 줄 없이 붙이기 금지

---

## 핑퐁 절차

핑퐁 진행 중 언제든 인간이 `map`을 입력하면:
- `/sowhat:map {section} --field {현재 진행 중인 필드}` 트리거
- 맵 출력 후 핑퐁 재개

**커밋 정책 (context 보호 — batching):**
- 각 필드는 완료 즉시 **섹션 `.md`에 저장**(Write/Edit)하되 **필드별 커밋은 하지 않는다.**
- 섹션의 모든 필드(stasis→scheme→claim→grounds→cq→confidence→scope/AC)가 끝나면 **종료 시 1회만 커밋**(`expand({section}): complete walton structure`).
- 중단해도 필드는 `.md`에 저장돼 있고 session.md `step:`가 위치를 추적하므로 작업 손실 없음(미커밋은 resume이 `git status`로 감지).

---

### 스텝 0: 기존 섹션 상태 파악 (needs-revision일 때)

`needs-revision` 상태면: 어떤 필드가 문제였는지 확인하고 해당 필드부터 재개.
`draft` 또는 신규 섹션이면 스텝 0.5로.

---

### 스텝 0.5: Thesis Drift 감지

expand 시작 시 기존 논증과 thesis Answer 간 drift를 검사한다:

1. 현재 섹션의 Claim (있으면)과 thesis Answer의 semantic distance 측정:
   - Claim의 키워드가 Answer에 포함되는가?
   - Claim이 Answer를 지지하는 방향인가?

2. 모든 settled 섹션의 Claim 합산이 Answer를 완전히 커버하는지 확인:
   - 커버되지 않는 영역이 있으면 → 경고

3. drift 감지 시:
   ```
   ⚠️ Thesis Drift 감지

   현재 논증 방향이 Thesis와 멀어지고 있습니다.

   Thesis Answer: "{answer}"
   이 섹션의 방향: "{claim 또는 thesis_argument}"

   [1] 계속 진행 (drift 무시)
   [2] Thesis 수정 필요 (/sowhat:revise thesis)
   [3] 이 섹션의 방향 조정
   ```

drift가 감지되지 않으면 조용히 통과하고 스텝 1로 진행한다.

---

### 스텝 1: IBIS 프레이밍 (새 섹션일 때만)

기존 섹션이면 이 스텝 건너뜀.

`00-thesis.md`에서 Key Arguments 목록을 로드하여 다음을 출력:

```
> [expand {section} > 스텝 1/7 IBIS 프레이밍]
> Thesis: "{Answer 40자}"

❓ 이 섹션은 thesis의 어떤 Key Argument를 지지합니까?

  [1] {key argument 1}
  [2] {key argument 2}
  [3] {key argument 3}
  (00-thesis.md의 Key Arguments 전부 나열)
  [N+1] 직접 입력 (새 논거)
```

인간 선택 → `thesis_argument` 필드에 저장.

---

### 스텝 1.5: Stasis 유형 선택 (NEW)

논쟁의 유형을 먼저 확정한다. **이 섹션에서 무엇을 증명하려 하는가**에 따라 필요한 근거 유형이 달라진다.

```
> [expand {section} > 스텝 1.5/7 Stasis 유형]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"

❓ 이 섹션에서 증명하려는 것은 어떤 종류의 주장입니까?

  예) 사실 주장: "X 지표가 Y 수준이다"         → 측정값, 데이터가 핵심
      정의 주장: "A는 B에 해당한다"             → 정의 기준과 분류 논리가 핵심
      가치 주장: "X가 가장 중요하다"             → 비교 기준과 우선순위가 핵심
      행동 주장: "X를 해야 한다"                → 사실+가치+실행가능성 모두 필요

  [1] 사실 주장 — "X가 존재한다 / 측정됐다 / 일어났다"
  [2] 정의 주장 — "X는 Y에 해당한다 / Y이다"
  [3] 가치 주장 — "X는 중요하다 / 좋다 / 필요하다"
  [4] 행동 주장 — "X를 해야 한다" (복합)
```

| Stasis | 인정되는 근거 | 인정 안 되는 근거 |
|--------|-------------|----------------|
| 사실 | 측정값, 관찰, 데이터 | 의견, 가치 판단 |
| 정의 | 정의 기준, 분류 논리 | 단순 수치 |
| 가치 | 비교 대상, 우선순위 기준 | 사실 나열만 |
| 행동 | 사실+가치+실행가능성 조합 | 어느 하나만 |

인간 선택 → `stasis` 필드에 섹션 `.md` 저장. (커밋은 섹션 종료 시 1회 — 필드별 커밋 안 함.)

---

### 스텝 2: Walton Scheme 선택 (D1 — 하이브리드)

섹션의 `scheme` 필드가 이미 설정돼 있으면 이 스텝 건너뜀.

**D1 하이브리드 원칙**: Writer가 1차 scheme을 선택하고, LLM이 복합 scheme 가능성을 보조 제안한다. 최종 확정은 Writer가 한다.

```
> [expand {section} > 스텝 2/7 Walton Scheme]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {선택된 stasis}

❓ 이 주장은 어떤 종류의 추론인가? (Walton Argumentation Schemes)

  [1]  Expert Opinion       — 전문가·권위자 인용으로 주장
  [2]  Sample to Population — 통계·데이터로 일반화
  [3]  Cause to Effect      — 인과 추론 (X이면 Y가 생긴다)
  [4]  Effect to Cause      — 역 인과·진단 (Y가 보이므로 X가 있었다)
  [5]  Analogy              — 유사 사례 비교로 주장
  [6]  Sign                 — 정황 증거로 주장
  [7]  Classification       — 정의·분류로 주장
  [8]  Practical Reasoning  — 목표 → 수단으로 주장
  [9]  Position to Know     — 목격·내부자 증언으로 주장
  [10] Popular Opinion      — 사회 통념으로 주장
  [11] Custom               — 직접 CQ 작성

  복합 선택: 번호를 여러 개 입력 (예: 1 3 → Expert Opinion + Cause to Effect)
```

**[Phase 2 — sowhat-scheme-agent Task A 스폰] Writer 선택 직후**:
- 선택된 scheme으로 sowhat-scheme-agent를 Task A 모드로 스폰한다:
  ```
  task_a = Task(sowhat-scheme-agent,
    prompt = """
    <task>compound_analysis</task>
    <selected_scheme>{사용자가 선택한 scheme 이름}</selected_scheme>
    <stasis>{stasis}</stasis>
    <thesis_argument>{thesis_argument}</thesis_argument>
    """)
  ```
  - task_a.needs_compound=true → 복합 scheme 확인 UI 표시:
    ```
    ℹ️ 복합 scheme 확인:
      선택: {selected_scheme}
      {task_a.rationale}
      추가 제안: {task_a.suggested 목록}

    [1] 단일 scheme 유지
    [2] 복합 scheme으로 확장 ({task_a.suggested} 추가)
    [3] 다른 scheme 직접 선택
    ```
  - task_a.needs_compound=false → 단일 scheme으로 바로 진행
  - 에이전트 오류(빈 객체 반환 등) → fallback: `.claude/sowhat-core/references/walton-pitfalls.md` Read 후 LLM이 직접 복합 가능성 판단
- 복합 scheme이 확정되면 → 모든 scheme의 CQs를 스텝 5에서 다 적용

인간 선택 → `scheme` 필드에 저장 (복합이면 쉼표 구분: `Expert Opinion, Cause to Effect`). (커밋은 섹션 종료 시 1회.)

---

### 스텝 2.5: Confidence 설정 (구 Claim Tier)

`confidence` 필드가 이미 설정돼 있으면 이 스텝 건너뜀.

이 섹션 주장의 확신 수준을 결정한다. confidence에 따라 settle 시 요구되는 출처 수준이 달라진다 (`references/calibration-guide.md` 참조).

- **≥60% (likely 이상)** = Primary claim → T1/T2 source 필요
- **<60% (uncertain 이하)** = Supporting claim → T3/T4 허용

**자동 추론 시도**: Grounds 강도·수·출처 Tier를 기반으로 적정 confidence를 추정한다.

```
> [expand {section} > 스텝 2.5/7 Confidence]
> Claim: "{Claim 40자}"

이 주장의 확신 수준(confidence)은?

  [1] virtually certain (95%+) — 강한 empirical 증거 + 전문가 합의
  [2] very likely (80-95%)     — 충분한 증거, 반론 약함
  [3] likely (60-80%)          — 근거 있으나 불확실성 존재 [Primary claim 하한]
  [4] uncertain (40-60%)       — 증거 불충분 또는 상충    [Supporting claim 상한]
  [5] unlikely (20-40%)        — 반증이 더 강함
  [자동]                        — Grounds 기반 자동 추정
```

인간 선택(또는 자동 추론) → `confidence` 필드에 anchor 어휘 저장. `claim_tier` 필드는 v3.0.0부터 deprecated (confidence로 흡수). 별도 커밋 없이 다음 스텝 진행.

---

### 스텝 3: Claim 핑퐁

섹션 제목, thesis Answer, thesis_argument, stasis, scheme을 함께 고려하여 Claim에 대한 구체적 제안 3개를 생성한다. **제안은 인간의 실제 맥락에서 파생한다** — generic 예시 사용 금지.

```
> [expand {section} > 스텝 3/7 Claim]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {stasis} | Scheme: {scheme}

❓ 이 섹션의 핵심 주장(Claim)은 무엇입니까?
   ({stasis} / {scheme} 방식 논증 / "{thesis_argument}" 지지)

**좋은 Claim vs 나쁜 Claim:**
  너무 넓음: "{주제}가 중요하다"         → Claim이 아니라 토픽
  적절함:   "{주제}의 {측면}이 {속성}이며
             따라서 {행동/판단}이 정당하다"

  [1] {thesis_argument와 stasis를 조합한 구체적 Claim 제안 1}
  [2] {구체적 Claim 제안 2}
  [3] {구체적 Claim 제안 3}
  [4] 직접 작성
  [5] 잘 모르겠다 → Open Question 등록
```

인간 답변 → `## Claim` 필드에 저장. (커밋은 섹션 종료 시 1회.)

---

### 스텝 4: Grounds 핑퐁

**이 스텝은 SUB-RESEARCH 트리거 시 Semi-Async로 전환될 수 있다.**

**Research 모드 프로젝트** (`mapped_findings[]`가 비어있지 않으면):
스텝 4 시작 시 매핑된 파인딩을 먼저 제시한다:

```
> [expand {section} > 스텝 4/7 Grounds — Research 모드]
> Claim: "{Claim 40자}"

ℹ️ 이 섹션에 매핑된 리서치 파인딩 {N}건:

  [R1] #{NNN}: {핵심 발견 한 줄} (T{N}, {source})
  [R2] #{NNN}: {핵심 발견 한 줄} (T{N}, {source})
  [R3] #{NNN}: {핵심 발견 한 줄} (T{N}, {source})

이 파인딩을 Grounds에 활용하시겠습니까?

  [1] 전부 활용 — 위 파인딩을 Grounds로 구성
  [2] 선택적 활용 — 번호 선택 (예: R1 R3)
  [3] 직접 작성 (파인딩 무시) — 아래 일반 Grounds 핑퐁 진행
  [4] 파인딩 + 직접 작성 혼합
```

- [1] 선택: 모든 파인딩을 Grounds 항목으로 구성. 출처/Tier를 함께 기록.
- [2] 선택: 선택된 파인딩만 Grounds에 포함, 나머지는 CQ 응답 보완 참고 또는 버림.
- [3] 선택: 파인딩 무시, 아래 일반 Grounds 핑퐁으로 진행.
- [4] 선택: 파인딩 + 직접 작성을 결합. 파인딩 먼저 Grounds에 배치 후 추가 근거 요청.

파인딩 활용 시: 파인딩 파일의 `status`를 `applied`로 변경, `applied_to` 필드 업데이트.

파인딩이 없으면 (idea 모드 또는 미매핑) 아래 일반 흐름으로 진행.

#### 4-1. 근거 출처 선택 (cycle 7 — Plan A 3-choice)

```
> [expand {section} > 스텝 4/7 Grounds]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {stasis} | Scheme: {scheme}
> Claim: "{Claim 40자}"

❓ 근거 출처를 선택하세요.

  [1] 직접 입력 — 내가 가진 자료·경험·수치를 타이핑
  [2] 🔍 Sub-Research 실행 — AI가 외부 조사 수행 (영수증 검증 통과)
  [3] research/ 파인딩에서 선택 — 이미 수집한 자료 활용
  [4] 🗃️ file:/dir: 자료 주입 — /sowhat:inject 실행 후 돌아오기
```

AI는 **구체값을 포함한 선택지를 만들지 않는다**. 위 4개가 전부. 각 선택 후 source 태그가 자동 부착된다.

**[1] 직접 입력 선택 시:**

```
❓ 근거를 자유롭게 입력하세요. 수치·기관명·연도가 있으면 그대로 쓰세요.
   (예: "자체 조사 결과 이탈률 34%", "2024 사내 워크샵 의견" 등)

   [Enter 한 번 더 누르면 입력 완료]
```

사용자 입력 그대로 저장. Source tag: `[source:user]`.

구체값 포함 시 출처 표기는 **권장** (강제 아님):
```
ℹ️ 입력에 구체 수치·기관명이 있습니다. 가능하면 URL/파일 경로/DOI를 함께 적어주세요.
   외부 공유(draft) 시 출처가 사용자 입력임이 태그로 표시됩니다.
```

**[2] Sub-Research 선택 시:**

`workflows/research.md` Sub-Research 흐름 호출. 결과는 `[source:sub-research]` 태그로 저장. 영수증 검증 실패 시 결과 drop (사용자에게 Web Research fallback 선택 제시).

**[3] research/ 파인딩 선택 시:**

해당 섹션 매핑 여부 확인 후:
- 매핑된 finding 있음 → finding 목록 제시 → 사용자 선택 → `[source:#NNN]` 태그
- 매핑 없음 → 전체 `research/` 파인딩 목록 → 사용자 선택 → 매핑 생성 + 태그

**[4] file:/dir: 주입 선택 시:**

`/sowhat:inject {section}` 흐름으로 전환. 주입 완료 후 expand Step 4로 돌아와 source tag `[source:file:path]` 부착.

---

**scheme별 증거 요건** (참고 — 사용자 입력에 대한 가이드라인):
- `Sample to Population`: 수치/데이터 권장
- `Cause to Effect`: 인과 메커니즘 설명 권장
- `Expert Opinion`: 전문가 이름/출처
- `Analogy`: 유사 사례와 유사성 설명 (사례 논증 포함)
- `Sign`: 패턴 관찰
- `Classification`: 원칙 출처/적용 조건
- `Practical Reasoning`: 결과 흐름 설명

AI가 이 요건을 채우는 게 아니다. 사용자 입력이 채운다.

#### 4-2. 즉시 기록 확인

근거 입력 후 즉시 표시:

```
✓ Grounds 기록됨:
  • {입력한 근거 요약}

  [+] 근거 추가
  [?] 이 근거가 충분한지 검토 (scheme 기준)
  [→] 근거 입력 완료 — 결합 방식 선택으로
```

`[?]` 선택 시 scheme의 증거 요건 기준으로 즉시 피드백:
```
  현재 근거 평가 ({scheme} scheme 기준):
  ✅ {통과 항목}
  ⚠️  {보완 권장 항목}
```

#### 4-3. Grounds 결합 방식 선언 (NEW)

근거가 2개 이상 있을 때:

```
❓ 이 근거들의 결합 방식은?

  예) Linked:     "시장이 크다" AND "우리가 진입할 역량이 있다"
                   → 둘 다 있어야 Claim 성립. 하나가 무너지면 Claim도 무너짐.
      Convergent: "인터뷰 결과" OR "시장 데이터" OR "경쟁사 사례"
                   → 각각이 독립적으로 Claim을 지지. 하나가 약해도 나머지가 지지.

  [1] Linked     — 모두 있어야 Claim 성립 (하나가 빠지면 전체가 약해짐)
  [2] Convergent — 각각이 독립 지지 (하나가 빠져도 나머지가 유지)
  [3] Mixed      — 일부는 Linked, 일부는 Convergent
```

`grounds_structure` 필드에 저장. challenge/debate의 공격 전략이 이에 따라 달라진다.

인간 답변 → `## Grounds` 필드에 저장. (커밋은 섹션 종료 시 1회.)

---

### 스텝 4 SUB-RESEARCH: Semi-Async 전환 (조건부)

스텝 4 Grounds 핑퐁에서 근거 출처로 `[6] Sub-Research`(AI 외부 조사)를 선택한 경우에만 진입한다. Deep Research 엔진 선택 UX → Semi-Async 실행(Grounds 의존 스텝은 대기, 무관 스텝은 먼저 진행) → Sub-Research Agent 프롬프트 → 결과 제시·실패 처리 전체 절차는 **`references/expand-sub-research.md`를 읽고 그대로 따른다.** 일반 출처([1]~[5]) 선택 시에는 이 단계 없이 스텝 5로 진행한다.

---

### 스텝 5: CQ 응답 (Walton Critical Questions)

**SUB-RESEARCH Semi-Async 중이었다면: 여기서 Grounds 결과를 먼저 확인한다.**

> **[Phase 2 — sowhat-scheme-agent Task B 스폰]** 확정된 scheme(들)의 CQ 목록을 에이전트로 추출한다:
> ```
> task_b = Task(sowhat-scheme-agent,
>   prompt = """
>   <task>cq_extraction</task>
>   <schemes>{확정된 scheme 이름 목록 — 쉼표 구분}</schemes>
>   """)
> ```
> - task_b 결과의 cqs 목록을 아래 CQ 응답 UI에 사용한다.
> - 에이전트 오류(빈 배열 반환 등) → fallback: `.claude/sowhat-core/references/walton-schemes.md` Read 후 직접 CQ 추출.
> - 또한 `.claude/sowhat-core/references/calibration-guide.md`를 Read 도구로 로드한다 (미충족 CQ 허용 상한 확인용).

scheme(s)에 해당하는 CQs를 자동 호출한다. 각 CQ에 답변하고 confidence 0-4를 부여한다.
CQ 목록: sowhat-scheme-agent Task B 결과 사용 (fallback: walton-schemes.md 직접 Read)

**복합 scheme 처리**: 여러 scheme이 확정된 경우 모든 scheme의 CQs를 연달아 출력한다.

```
> [expand {section} > 스텝 5/7 CQ 응답]
> Claim: "{Claim 40자}"
> Scheme: {scheme(s)}
> Grounds: {근거 요약 40자}

CQ {N}/{총수} [{scheme명}]: {CQ 질문}

  ❓ 이 질문에 답하세요:

  답변 입력 후 → 답변의 근거 강도(confidence 0-4):
  [4] 강한 근거 — T1/T2 source 직접 인용
  [3] 적당 근거 — T3 source 또는 명확한 1차 데이터
  [2] 약한 근거 — T4 source 또는 정황
  [1] 추측     — 근거 없는 의견
  [0] 답할 수 없음
```

**Depth=2 cap (D3)**: CQ 답변(=새 주장)에 대해 후속 CQ는 최대 1회만 허용.

```
  → 후속 CQ (depth 2 — 최종):
    {CQ 답변에 대한 후속 CQ}
    [답변 + confidence 입력]

  → depth 3 시도 시: ⛔ depth limit 도달 — 자동 항복 선언 (confidence: 0)
```

**미충족 CQ 처리**: confidence ≤ 1인 CQ는 미충족으로 집계.
scheme별 미충족 허용 상한 초과 시 → settle 차단 (`@calibration-guide.md`).

완료 후 `## CQ Responses` 필드에 저장. (커밋은 섹션 종료 시 1회.)

---

> **[로딩 게이트 — 스텝 6 전]** calibration-guide.md는 스텝 5 게이트에서 로드됐으면 재사용. `.claude/sowhat-core/references/strength-scoring.md`를 Read 도구로 로드한다 (Grounds Tier·수 기반 confidence 자동 추정 기준).

### 스텝 6: Confidence Band

```
> [expand {section} > 스텝 6/7 Confidence Band]
> Claim: "{Claim 40자}"
> CQ 결과: 총 {N}개 CQ, 미충족 {M}개

❓ 이 주장의 최종 확신 수준(confidence)은?

  CQ 결과와 Grounds 강도를 종합하여 선택하세요.

  [1] virtually certain (95%+) — 강한 empirical 증거 + 전문가 합의
  [2] very likely (80-95%)     — 충분한 증거, CQ 전부 응답
  [3] likely (60-80%)          — 근거 있으나 일부 불확실성 [Primary claim 하한]
  [4] uncertain (40-60%)       — 일부 CQ 미응답 또는 증거 상충 [Supporting claim 상한]
  [5] unlikely (20-40%)        — 다수 CQ 미응답 또는 반증 강함
```

> **두 confidence 구분**: 여기의 `confidence`는 섹션 주장의 **Tetlock band**(virtually certain~unlikely)다. 스텝 5의 **CQ 응답 confidence(0-4 정수)**와 다른 차원이며, CQ confidence ≤1은 "미충족"(0=답 불가, 1=추측≈근거 부족)을 뜻한다. band 자동 추정 기준(Grounds Tier·수 + CQ 응답 강도 종합)은 `references/calibration-guide.md` + `references/strength-scoring.md` 참조.

**자동 경고** (challenge Stage 6와 동일 기준 — `references/challenge-algorithm.md` §Stage 6):
- 미충족 CQ ≥ 임계값인데 `very likely` 이상 선택 → `⚠️ Overclaiming: CQ 미충족과 confidence 불일치`
- 모든 CQ가 confidence 4인데 `uncertain` 이하 → `⚠️ Underclaiming: 더 강한 confidence 가능`

인간 답변 → `confidence` 필드에 anchor 어휘 저장. (커밋은 섹션 종료 시 1회.)

---

### 스텝 7: Scope + Acceptance Criteria

```
> [expand {section} > 스텝 7/7 Scope + AC]
> Thesis: "{Answer 40자}"
> Claim: "{Claim 40자}"
```

**Scope:**
```
❓ 이 섹션이 다루는 범위는?

**In (포함):**
  이 섹션에서 명시적으로 다루는 것:

**Out / Non-Goals (제외):**
  이 섹션에서 명시적으로 다루지 않는 것:

  [1] {이 Claim 맥락에 맞는 In/Out 제안}
  [2] 직접 작성
```

**Acceptance Criteria:**
```
❓ 이 섹션이 완료되었다고 판단하는 기준은?
   (검증 가능한 형태로)

  예) "Claim이 thesis reviewer에게 자명하게 납득됨"
      "핵심 반론에 대한 대응이 문서화됨"

  [1] {이 섹션 내용에 맞는 구체적 AC 제안 1}
  [2] {AC 제안 2}
  [3] {AC 제안 3}
  [4] 직접 작성
```

인간 답변 → `## Scope`, `## Acceptance Criteria` 필드 저장.

---

## 파일 생성/업데이트

핑퐁 중 인간이 답한 내용을 즉시 섹션 파일에 반영한다.

새 섹션 생성 시 datetime 취득:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

섹션 파일 구조:

```markdown
---
status: discussing
stasis: {사실|정의|가치|행동}
scheme: {Walton scheme(s) — 복합이면 쉼표 구분}
confidence: {Tetlock anchor 어휘 또는 %}
grounds_structure: {linked|convergent|mixed}
version: 1
section: {N}
title: {section-name}
thesis_argument: {thesis의 어떤 논거를 지지하는가}
github_issue: {issue number}
created: {current_datetime}
updated: {current_datetime}
---

## Claim
> {인간이 답한 내용}

## Grounds (근거)
- {근거 1}
- {근거 2}

> 결합 방식: {linked|convergent|mixed}

## CQ Responses
| CQ | 답변 요약 | confidence |
|---|---|---|
| {scheme}: {CQ 질문} | {답변 요약} | {0-4} |

> 미충족 CQ (confidence ≤ 1): {수}개

## Confidence
> 확신 수준: {virtually certain|very likely|likely|uncertain|unlikely|very unlikely}
> 근거: {CQ 결과 + Grounds 강도 요약}

## Scope
### In
- {인간이 답한 내용}
### Out (Non-Goals)
- {인간이 답한 내용}

## Acceptance Criteria
- [ ] {인간이 답한 내용}

## GitHub Edits
>

## Open Questions
- [ ]

## Argument Log
| round | datetime | move | agent | outcome |
|-------|---------|------|-------|---------|

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 | | {current_date} |
```

---

## 세션 저장

각 스텝 시작 시 `logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: expand
section: {section}
step: {현재 스텝 이름: stasis|scheme|claim|grounds|cq-responses|confidence|scope}
sub_research_pending: {true|false}
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
{직전 핑퐁 교환 내용을 2~3문장으로 요약}

## 재개 시 첫 질문
{다음에 물어볼 질문 그대로}
```

`expand({section}): complete` 커밋 직전에 `status: complete`로 업데이트하고, `logs/handoff.json`을 생성한다:

```json
{
  "last_command": "expand",
  "target_section": "{section}",
  "stopped_at": "complete",
  "completed_fields": ["stasis", "scheme", "claim", "grounds", "cq_responses", "confidence"],
  "pending_decisions": [],
  "active_research": [],
  "open_questions_count": 0,
  "verification_debt": {
    "challenge_unresolved": 0,
    "stub_suspects": 0,
    "debate_weakened": 0
  },
  "notes_pending": 0,
  "next_action": "/sowhat:settle {section}",
  "decision_ids": [],
  "saved": "{current_datetime_ISO8601}"
}
```

---

## Argument Log 업데이트

핑퐁 세션 완료 후 `logs/argument-log.md`에 추가:

```markdown
## [{datetime}] expand({section})
  Added: {완료된 필드 목록}
  Stasis: {stasis}
  Scheme: {scheme}
  Confidence: {confidence}
  Grounds Structure: {linked|convergent|mixed}
  Sub-Research: {used|not-used}
  Status: draft → discussing
```

---

## Discussion Audit Trail

expand 핑퐁 과정을 구조화된 로그로 남긴다. resume 정확도 향상과 revise 시 원래 논의 맥락 참조를 위함.

### 저장 위치

`logs/discussion/{section}-expand.md`

### 저장 시점

**각 스텝 완료 시** 해당 라운드를 append한다 (session.md와 달리 append 모드).

### 형식

```markdown
# Discussion Log: {section}

## Round {N}: {Step name} ({datetime})
- Claude 제안: {제안 내용 요약}
- 사용자 선택/수정: {선택한 옵션 또는 직접 입력 요약}
- 결정: {최종 반영 내용}
- Decision ID: D-{section_number}-{sequence}
```

### Decision ID 부여 규칙

expand 핑퐁에서 사용자가 내린 모든 결정에 고유 ID를 부여한다.

- 형식: `D-{section_number}-{3자리 시퀀스}` (예: `D-02-001`, `D-02-002`)
- 시퀀스는 해당 섹션 내에서 순차 증가
- Decision ID는 섹션 파일의 `## Decision Log` 테이블과 discussion log 양쪽에 기록

### 섹션 파일 Decision Log 업데이트

```markdown
## Decision Log
| v | Decision ID | 변경 내용 | 이유 | 날짜 |
|---|-------------|---------|------|------|
| 1 | D-02-001 | stasis: 사실 주장 | 시장 데이터 기반 논증 | {date} |
| 1 | D-02-002 | scheme: statistics | 수치 데이터 중심 | {date} |
| 1 | D-02-003 | claim: "SaaS 시장 28% 성장" | 사용자 직접 작성 | {date} |
```

### settle/challenge에서의 활용

- **settle**: verify-argument checkpoint에서 Decision ID 목록을 참조하여 각 결정의 근거 추적 가능
- **challenge**: 공격 리포트에서 관련 Decision ID를 명시하여 "어떤 결정이 취약점의 원인인가" 추적

  ```
  [challenge Stage 3: CQ 응답 충분성]
  ⚠️ D-02-005 (CQ 응답) 검토 결과:
    CQ 미충족으로 Grounds→Claim 연결 불충분
    Decision context: "사용자가 CQ 미응답 선택"
  ```

---

## Advisor Mode (expand 스텝 3 Claim 선택 시)

사용자가 Claim 방향을 결정해야 할 때, 병렬로 research agent를 돌려서 판단 근거를 미리 제공한다.

### 활성화 조건

- `research/` 디렉터리에 해당 섹션 관련 파인딩이 2건 미만일 때
- 또는 Claim 선택지가 2개 이상이고 방향이 크게 다를 때

### 동작

스텝 3 Claim 선택지를 구성할 때:

1. 각 Claim 후보에 대해 sowhat-research-agent를 병렬로 스폰 (WebSearch):
   ```
   Task(sowhat-research-agent,
     prompt = """
     <claim_candidate>{Claim 후보}</claim_candidate>
     <thesis>{thesis_answer}</thesis>
     <section_context>{thesis_argument, stasis, scheme}</section_context>
     <instructions>
       이 Claim을 지지하는 근거를 빠르게 검색하라.
       최대 2건의 핵심 근거만 반환.
       검색 시간 제한: 30초.
     </instructions>
     """)
   ```

2. 결과를 Claim 선택지에 인라인으로 표시:
   ```
   > [expand {section} > 스텝 3/7 Claim]
   > Thesis: "{Answer 40자}"

   ❓ 이 섹션의 핵심 주장(Claim)은 무엇입니까?

     [1] {Claim 후보 1}
         → 근거 발견: {research result 요약} (T2, 2024)

     [2] {Claim 후보 2}
         → 근거 발견: {research result 요약} (T1, 2023)

     [3] {Claim 후보 3}
         → 근거 미발견 ⚠️

     [4] 직접 작성
     [5] 잘 모르겠다 → Open Question 등록
   ```

### 비활성화

- `research/` 디렉터리에 해당 섹션 관련 파인딩이 이미 충분하면 (3건 이상) advisor 생략
- 사용자가 `--no-advisor` 옵션을 사용하면 생략

---

## 종료 조건

인간이 충분하다고 판단하면 핑퐁을 종료한다.

최종 커밋:
```bash
git add planning/{section}.md logs/argument-log.md
git commit -m "expand({section}): complete walton structure"
```

종료 안내:

```
✅ 섹션 {N}-{name} 전개 완료

  Claim:      {Claim 한 줄 요약}
  Stasis:     {stasis}
  Scheme:     {scheme(s)}
  Confidence: {Tetlock anchor}
  Grounds:    {N}건 ({structure})
  CQs:        총 {N}개, 미충족 {M}개

  status: discussing
  커밋: 1회 (섹션 종료 시점)

---

----------------------------------------

다음 단계:
  [1] /sowhat:settle {section} — 논증 검토 후 확정 (권장)
  [2] /sowhat:debate {section} — 변증법 검증으로 논거 강화
  [3] /sowhat:map {section} — 논증 시각화
  [4] /sowhat:challenge — 전체 트리 검증

(/clear 후 실행 권장)
```

---

## 핵심 원칙

- **컨텍스트 배너는 생략 불가** — 모든 핑퐁 질문 앞에 항상 표시
- **Stasis 먼저** — 논쟁 유형을 확정하지 않으면 근거 유형을 알 수 없다
- **서브질문으로 의사결정 나무** — 개방형 질문 대신 유형 선택 → 세부 확인 순서
- **Sub-Research는 Semi-Async** — Grounds 의존 스텝(CQ 응답)은 대기, 무관 스텝은 먼저
- **Grounds 결합 방식 명시** — Linked/Convergent에 따라 challenge 공격 전략이 달라짐
- **예시는 맥락 기반** — generic 예시 금지, 인간의 실제 Claim/Grounds에서 파생
- **즉시 기록 확인** — 각 답변 후 기록된 내용을 바로 보여주고 추가/계속 선택
- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다. 특히 **구체 수치·기관명·연도·인물명은 절대 AI가 생성하지 않는다** (`references/ai-content-boundary.md` 참조)
- **항상 thesis와의 연결을 확인한다** — 모든 필드는 thesis Answer로 거슬러 올라간다
- **CQ 응답은 생략 불가** — 미충족 CQ(confidence 0)는 경고 후 계속 가능하나 settle 차단 가능함을 고지
- **섹션 종료 시 1회 커밋** — 필드는 `.md`에 즉시 저장되어 작업 손실 방지 (필드별 커밋 안 함 — context 보호)
- **Discussion audit trail 필수** — 모든 핑퐁 라운드를 `logs/discussion/`에 기록
- **Decision ID 부여** — 사용자 결정마다 D-{section}-{seq} ID를 부여하여 settle/challenge에서 추적 가능
- **Advisor mode** — Claim 선택 시 병렬 리서치로 판단 근거를 미리 제공 (근거 부족할 때)
