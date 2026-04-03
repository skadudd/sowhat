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
    when: "qualifier 자동 추정과 다를 때 (Step 6)"
  - type: decision
    when: "rebuttal 후보 중 선택 (Step 8)"
config_reads: [layer, sections, features]
config_writes: [sections]
continuation:
  primary: "/sowhat:settle {section}"
  alternatives: ["/sowhat:debate {section}", "/sowhat:challenge"]
status_transitions: ["draft → discussing", "needs-revision → discussing"]
-->

이 커맨드는 기획 섹션을 핑퐁 방식으로 전개한다. Toulmin Model 전체 구조(Claim/Grounds/Warrant/Backing/Qualifier/Rebuttal)를 구축한다. `$ARGUMENTS`에 섹션 이름 또는 번호가 전달된다.

## 사전 검증 (1회만 실행 — 이후 재로드 금지)

**세션 시작 시 아래 파일들을 한 번만 로드하고 이후 모든 스텝에서 메모리 값을 재사용한다.**

1. `planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"spec"` 또는 `"finalized"`이면: `❌ 이미 명세/완료 레이어입니다. 기획 섹션 전개 불가.`
2. `00-thesis.md` 로드 → `thesis_answer`(Answer 40자), `key_arguments` 목록 추출 후 변수 저장
3. 대상 섹션 파일 확인:
   - `$ARGUMENTS`가 숫자면 → `{N}-*.md` 패턴으로 검색
   - `$ARGUMENTS`가 이름이면 → `*-{name}.md` 패턴으로 검색
   - 없으면 → 새 섹션 파일 생성 (다음 번호 자동 부여)
   - 섹션 파일 전체를 로드하고 **모든 필드를 변수로 추출**: `thesis_argument`, `stasis`, `scheme`, `claim`, `grounds`, `warrant`, `backing`, `qualifier`, `rebuttal`
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
> [expand 01-market > 스텝 4/9 Grounds]
> Claim: "국내 SaaS 시장은 연 28% 성장 중이다"
```

스텝 진행에 따라 직전 확정 필드를 1줄 추가할 수 있음:
```
> [expand 01-market > 스텝 5/9 Warrant]
> Claim: "국내 SaaS 시장은 연 28% 성장 중이다"
> Grounds: IDC 2024, CAGR 27.8%
```

### 질문 출력 패턴

```
> [expand 01-market > 스텝 4/9 Grounds]
> Claim: "국내 SaaS 시장은 연 28% 성장 중이다"

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
✓ Grounds 기록됨: IDC 2024 리포트, CAGR 27.8%

> [expand 01-market > 스텝 5/9 Warrant]
> Claim: "국내 SaaS 시장은 연 28% 성장 중이다"
> Grounds: IDC 2024, CAGR 27.8%

❓ Grounds가 Claim을 왜 지지하는지?
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

**각 스텝 완료 후 즉시 커밋:**
- `wip({section}): add stasis+scheme`
- `wip({section}): add claim`
- `wip({section}): add grounds`
- `wip({section}): add warrant`
- `wip({section}): add backing`
- `wip({section}): add qualifier`
- `wip({section}): add rebuttal`

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
> [expand {section} > 스텝 1/9 IBIS 프레이밍]
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
> [expand {section} > 스텝 1.5/9 Stasis 유형]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"

❓ 이 섹션에서 증명하려는 것은 어떤 종류의 주장입니까?

  예) 사실 주장: "국내 SaaS 이탈률은 연 35%다" → 측정값, 데이터가 핵심
      정의 주장: "이것이 PMF다"              → 정의 기준과 분류 논리가 핵심
      가치 주장: "이 문제가 가장 중요하다"     → 비교 기준과 우선순위가 핵심
      행동 주장: "지금 진입해야 한다"          → 사실+가치+실행가능성 모두 필요

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

인간 선택 → `stasis` 필드에 저장 → `wip({section}): add stasis+scheme` 커밋 (스텝 2 완료 후 함께).

---

### 스텝 2: Argument Scheme 선택

섹션의 `scheme` 필드가 이미 설정돼 있으면 이 스텝 건너뜀.

```
> [expand {section} > 스텝 2/9 Argument Scheme]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {선택된 stasis}

❓ 이 섹션은 어떤 방식으로 논증합니까?

  예) "전문가들이 이것이 맞다고 한다"   → authority
      "A가 성공했으니 B도 성공할 것이다" → analogy
      "X 때문에 Y가 발생한다"          → cause-effect
      "데이터가 이것을 증명한다"        → statistics

  [1] authority    — 전문가/권위자의 의견으로 주장
  [2] analogy      — 유사 사례 비교로 주장
  [3] cause-effect — 인과관계로 주장
  [4] statistics   — 데이터/수치로 주장
  [5] example      — 대표적 사례로 주장
  [6] sign         — 신호/징후로 주장
  [7] principle    — 원칙/규칙으로 주장
  [8] consequence  — 결과/영향으로 주장
```

인간 선택 → `scheme` 필드에 저장 → `wip({section}): add stasis+scheme` 커밋.

---

### 스텝 3: Claim 핑퐁

섹션 제목, thesis Answer, thesis_argument, stasis, scheme을 함께 고려하여 Claim에 대한 구체적 제안 3개를 생성한다. **제안은 인간의 실제 맥락에서 파생한다** — generic 예시 사용 금지.

```
> [expand {section} > 스텝 3/9 Claim]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {stasis} | Scheme: {scheme}

❓ 이 섹션의 핵심 주장(Claim)은 무엇입니까?
   ({stasis} / {scheme} 방식 논증 / "{thesis_argument}" 지지)

**좋은 Claim vs 나쁜 Claim:**
  너무 넓음: "시장이 중요하다"          → Claim이 아니라 토픽
  적절함:   "국내 SaaS 시장은 연 28%
             성장 중이며 진입 시점은 지금이다"

  [1] {thesis_argument와 stasis를 조합한 구체적 Claim 제안 1}
  [2] {구체적 Claim 제안 2}
  [3] {구체적 Claim 제안 3}
  [4] 직접 작성
  [5] 잘 모르겠다 → Open Question 등록
```

인간 답변 → `## Claim` 필드에 저장 → `wip({section}): add claim` 커밋.

---

### 스텝 4: Grounds 핑퐁

**이 스텝은 SUB-RESEARCH 트리거 시 Semi-Async로 전환될 수 있다.**

**Research 모드 프로젝트** (`mapped_findings[]`가 비어있지 않으면):
스텝 4 시작 시 매핑된 파인딩을 먼저 제시한다:

```
> [expand {section} > 스텝 4/9 Grounds — Research 모드]
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
- [2] 선택: 선택된 파인딩만 Grounds에 포함, 나머지는 Backing 또는 버림.
- [3] 선택: 파인딩 무시, 아래 일반 Grounds 핑퐁으로 진행.
- [4] 선택: 파인딩 + 직접 작성을 결합. 파인딩 먼저 Grounds에 배치 후 추가 근거 요청.

파인딩 활용 시: 파인딩 파일의 `status`를 `applied`로 변경, `applied_to` 필드 업데이트.

파인딩이 없으면 (idea 모드 또는 미매핑) 아래 일반 흐름으로 진행:

scheme에 따라 다른 근거 유형을 안내한다.

**scheme별 증거 요건:**
- `statistics`: 수치/데이터 필수
- `cause-effect`: 인과 메커니즘 설명 필수 (수치 있으면 강함)
- `authority`: 전문가 이름/출처 (수치 불필요)
- `analogy`: 유사 사례와 유사성 설명 (수치 불필요)
- `example`: 대표적 사례와 대표성 설명 (수치 불필요)
- `sign`: 패턴 관찰 (수치 있으면 좋음)
- `principle`: 원칙 출처/적용 조건 (수치 불필요)
- `consequence`: 결과 흐름 설명 (수치 있으면 강함)

#### 4-1. 근거 유형 선택 (서브질문 트리)

```
> [expand {section} > 스텝 4/9 Grounds]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {stasis} | Scheme: {scheme}
> Claim: "{Claim 40자}"

❓ 이 주장을 지지하는 근거의 유형은?
   (scheme: {scheme} — 아래 유형에 따라 세부 질문이 달라집니다)

  [1] 수치/데이터     → 출처, 규모, 시기를 묻겠습니다
  [2] 인터뷰/설문     → 대상, 샘플 수, 핵심 응답을 묻겠습니다
  [3] 사례/비교       → 어떤 회사/상황, 어떤 유사성인지 묻겠습니다
  [4] 전문가 의견     → 누구, 어떤 발언인지 묻겠습니다
  [5] 직접 서술       → 자유 형식으로 입력
  [6] 🔍 Sub-Research → agent-browser로 인라인 검색 (Semi-Async 전환)
```

**[1] 수치/데이터 선택 시 세부 질문:**
```
  ❓ 출처는?
    [1] 공개 리포트 (IDC, Gartner, CB Insights 등)
    [2] 정부/기관 통계 (KOSIS, 소프트웨어산업협회 등)
    [3] 자체 조사/실험 데이터
    [4] 기타 (직접 입력)

  → 선택 후: "구체적으로 어떤 수치입니까? (예: IDC 2024: $12.3B, CAGR 27.8%)"
```

**[2] 인터뷰/설문 선택 시 세부 질문:**
```
  ❓ 조사 규모와 대상은?
    [1] 소규모 (n < 30) — 심층 인터뷰
    [2] 중규모 (n = 30~200) — 설문
    [3] 대규모 (n > 200) — 통계적 유의성 있음
    [4] 직접 입력

  → 선택 후: "핵심 발견은 무엇입니까? (예: 78%가 통합 비용을 이탈 이유로 언급)"
```

**[3] 사례/비교 선택 시 세부 질문:**
```
  ❓ 어떤 사례입니까?
    [1] 국내 유사 기업/상황
    [2] 해외 유사 기업/상황
    [3] 직접 입력

  → 선택 후: "우리 Claim과 이 사례의 유사성은 무엇입니까?"
```

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

인간 답변 → `## Grounds` 필드에 저장 → `wip({section}): add grounds` 커밋.

---

### 스텝 4 SUB-RESEARCH: Semi-Async 전환

**[6] Sub-Research 선택 시 이 흐름으로 전환된다.**

#### Deep Research 선택 UX

[6] 선택 직후, `planning/config.json`의 `features.deep_research` 값을 확인한다.

> **API 키 탐색 순서** (환경변수가 세션 시작 후 설정된 경우를 대비):
> `$PERPLEXITY_API_KEY` → `.claude/settings.local.json` → `~/.claude/settings.local.json`
> (`/sowhat:research` 워크플로우의 "API 키 탐색 순서" 참조)

**Case 1: `deep_research` == `"disabled"` 또는 config에 features 없음**
→ UX 없이 기본 agent-browser 검색으로 바로 진행.

**Case 2: `deep_research` == `"enabled"` 또는 (`"auto"` && API 키 존재)**
→ 다음 선택지를 제시:

```
> [expand {section} > 스텝 4/9 Grounds > Sub-Research]
> Claim: "{Claim 40자}"

🔍 리서치 방식을 선택하세요:

  [1] 기본 웹 검색 — agent-browser 인라인 검색 (빠름, 표면 수준)
  [2] 🔬 Deep Research — Perplexity {모델명} 심층 조사 (느림, 다단계 분석)

💡 Deep Research는 학술·통계·산업 리포트 등 깊은 근거가 필요할 때 유용합니다.
```

**Case 3: `deep_research` == `"auto"` && `PERPLEXITY_API_KEY` 미설정**
→ 다음 안내를 제시:

```
> [expand {section} > 스텝 4/9 Grounds > Sub-Research]
> Claim: "{Claim 40자}"

🔍 기본 웹 검색으로 진행합니다.

💡 Deep Research를 사용하려면: /sowhat:config api-key perplexity
```

→ 안내 후 기본 agent-browser 검색으로 바로 진행.

**[1] 기본 웹 검색 선택 시**: 아래 Semi-Async 흐름 그대로 진행.

**[2] Deep Research 선택 시**: `/sowhat:research --deep` 워크플로우의 Deep Research 실행 섹션을 따른다. 단, 다음 차이점이 있다:
- 검색 쿼리를 현재 Claim + Stasis + Scheme 기반으로 자동 구성 (인간 입력 불필요)
- 결과는 아래 "Sub-Research 결과 제시" 형식으로 표시하되, `🔬 Deep Research` 표시를 추가
- Semi-Async 전환은 동일하게 적용 (Qualifier → Scope → AC 먼저 진행)
- Finding 파일 생성은 `/sowhat:research` 워크플로우와 동일한 형식

#### Semi-Async 실행 원칙

Warrant는 Grounds에 의존한다. Grounds가 확정되지 않은 채 Warrant를 작성하면 Grounds 변경 시 Warrant도 다시 써야 한다. 따라서:

- **Grounds 의존 스텝 (Warrant)**: Grounds 완료 후에만 진행
- **Grounds 무관 스텝 (Qualifier, Scope, AC)**: Sub-Research 실행 중 먼저 진행

```
🔍 Sub-Research 시작 ({기본 웹 검색|🔬 Deep Research})
   {agent-browser|Perplexity}가 백그라운드에서 검색 중입니다.
   Grounds와 무관한 스텝을 먼저 진행합니다.

   진행 순서: Qualifier → Scope → AC → [Grounds 완료 대기] → Warrant
```

Qualifier (스텝 6) → Scope (스텝 9 일부) → AC (스텝 9 일부) 순서로 먼저 진행한다.
Warrant 진입 직전에 Sub-Research 결과를 대기하고 확인한다.

#### Sub-Research Agent 프롬프트 (자동 생성)

```
다음 주장에 대한 근거를 리서치하세요.

Claim: "{현재 Claim}"
Stasis: {stasis}
Scheme: {scheme}
필요 근거 유형: {scheme 기반 증거 요건}

요구사항:
- 한국어 + 영어 병렬 검색 (WebSearch)
- 접근 가능한 페이지는 agent-browser로 본문 추출
- 최소 2개 이상의 독립 출처 확보 시도
- 수치/출처/연도가 있는 것만 채택
- 접근 불가 사이트는 스니펫으로 대체하고 명시할 것

반환 형식 (JSON):
[
  {
    "content": "...",
    "source": "...",
    "year": 2024,
    "credibility": "high|medium|low",
    "access": "full|snippet",
    "note": "접근 제한 등 특이사항"
  }
]
```

#### Sub-Research 결과 제시

**기본 웹 검색 결과:**
```
> [expand {section} > 스텝 4/9 Grounds > Sub-Research 완료]
> Claim: "{Claim 40자}"
> 검색: {검색어} (한국어 + 영어)

🔍 검색 결과 ({N}건)

  [1] {출처명} {연도}
      "{핵심 내용}"
      신뢰도: ★★★★★  접근: {full|snippet}
      Scheme 적합도: ✅ {이유}

  [2] {출처명} {연도}
      "{핵심 내용}"
      신뢰도: ★★★☆☆  접근: snippet ⚠️ 원문 미확인
      Scheme 적합도: ✅ {이유}

Grounds에 추가할 항목을 선택하세요:
  [1]  [2]  [3]  [12]  [13]  [23]  [123]
  [0] 결과 기각 — 직접 작성으로 돌아가기
```

**🔬 Deep Research 결과:**
```
> [expand {section} > 스텝 4/9 Grounds > 🔬 Deep Research 완료]
> Claim: "{Claim 40자}"

🔬 Deep Research 완료 ({N}건 발견, Perplexity {모델명})
   인용 출처: {M}개 URL

  [1] {출처명} {연도}
      "{핵심 내용}"
      📊 신뢰도: {Tier} ({tier_reason})
      Scheme 적합도: ✅ {이유}

  [2] {출처명} {연도}
      "{핵심 내용}"
      📊 신뢰도: {Tier} ({tier_reason}) — ⚠️ 교차검증 필요
      Scheme 적합도: ✅ {이유}

Grounds에 추가할 항목을 선택하세요:
  [1]  [2]  [3]  [12]  [13]  [23]  [123]
  [0] 결과 기각 — 직접 작성으로 돌아가기
```

Deep Research 결과의 신뢰도는 `references/source-credibility.md` Tier 시스템(T1-T4)을 사용한다. T4 출처는 자동으로 `Backing 전용` 태그가 붙는다.

#### Sub-Research 실패 처리

```
⚠️  Sub-Research 결과 불충분
    (검색 결과 없음 또는 Scheme 적합도 낮음)

  [1] 검색어 수정 후 재시도 → 직접 검색어 입력
  [2] Open Question으로 등록 후 나중에 직접 리서치
  [3] 근거 없이 진행 → Qualifier를 "presumably" 이하로 자동 제안
```

[3] 선택 시: `⚠️ Grounds 없이 진행합니다. Qualifier는 "presumably" 이하를 강력 권장합니다.`

---

### 스텝 5: Warrant 핑퐁

**SUB-RESEARCH Semi-Async 중이었다면: 여기서 Grounds 결과를 먼저 확인한다.**

Warrant는 Grounds와 Claim 사이의 논리적 연결고리다. **이 스텝이 논증의 핵심이다.**

```
> [expand {section} > 스텝 5/9 Warrant]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Stasis: {stasis} | Scheme: {scheme}
> Claim: "{Claim 40자}"
> Grounds: {근거 요약 (40자)}

❓ Warrant: 이 근거가 주장을 어떻게 지지합니까?
   "{Grounds 핵심}" 이기 때문에 → "{Claim}" 이 성립하는 이유

  예) 귀하의 Grounds: "{Grounds 핵심 30자}"
      귀하의 Claim:   "{Claim 30자}"
      Warrant 예시:   "{Grounds → Claim 연결 논리를 Claude가 파생하여 제안}"

  [1] {이 Grounds-Claim 연결에 맞는 구체적 Warrant 제안 1}
  [2] {구체적 Warrant 제안 2}
  [3] {구체적 Warrant 제안 3}
  [4] 직접 작성
  [5] 이건 당연하다 (Implicit) — /sowhat:challenge 공격에 가장 취약
```

인간이 [5] Implicit을 선택하면: `⚠️ Implicit Warrant는 /sowhat:challenge에서 가장 먼저 공격받습니다. 계속하시겠습니까? [1] 계속  [2] Warrant 작성` 확인 후 진행.

인간 답변 → `## Warrant` 필드에 저장 → `wip({section}): add warrant` 커밋.

---

### 스텝 6: Qualifier 선택

```
> [expand {section} > 스텝 6/9 Qualifier]
> Thesis: "{Answer 40자}"
> 이 섹션 논거: "{thesis_argument}"
> Claim: "{Claim 40자}"
> Grounds: {근거 수}건 ({structure})

❓ 이 주장의 확신 수준은?

  예) "항상 그렇다 (definitely)" → 반례 하나에도 Claim 전체가 무너짐. 위험.
      "대부분의 경우 (in most cases)" → 현실적이고 방어하기 쉬움.

  [1] definitely    — 확실히, 예외 없음 (가장 공격받기 쉬움)
  [2] usually       — 대체로, 일반적으로
  [3] in most cases — 대부분의 경우 (권장)
  [4] presumably    — 추정컨대, 아마도
  [5] possibly      — 가능성 있음 (약한 주장)
```

**Grounds 강도와 Qualifier 균형 자동 체크:**
- `definitely` + 근거 1-2건 → `⚠️ Overclaiming 위험. "usually" 또는 "in most cases" 권장`
- `possibly` + 강한 데이터 → `⚠️ Underclaiming. 더 강한 qualifier도 방어 가능합니다`

인간 답변 → `## Qualifier` 필드에 저장 → `wip({section}): add qualifier` 커밋.

---

### 스텝 7: Backing 핑퐁 (선택적)

Backing은 Warrant 자체를 뒷받침하는 추가 근거다.

```
> [expand {section} > 스텝 7/9 Backing (선택적)]
> Thesis: "{Answer 40자}"
> Warrant: "{Warrant 40자}"

❓ Warrant를 뒷받침하는 추가 근거(Backing)가 있습니까?
   (Warrant "{Warrant 요약}"이 왜 일반적으로 성립하는가)

  [1] {이 Warrant를 뒷받침할 수 있는 구체적 Backing 제안 1}
  [2] {Backing 제안 2}
  [3] 생략 (Warrant가 자명함)
  [4] 직접 작성
  [5] 🔍 Sub-Research → Backing 근거 검색
```

**[5] Sub-Research 선택 시**: "스텝 4 SUB-RESEARCH"의 **Deep Research 선택 UX**와 동일한 흐름을 따른다. 단, Backing 검색이므로 Semi-Async 전환 없이 결과를 바로 대기한다.

인간 답변 → `## Backing` 필드에 저장 → `wip({section}): add backing` 커밋.

---

### 스텝 8: Rebuttal 핑퐁

scheme의 Critical Questions를 참고하여 가장 강력한 반론(Steelman)을 생성한다.

**scheme별 Critical Questions (Rebuttal 제안 생성 시 참고):**
- `authority`: 이 권위자가 이 도메인의 진짜 전문가인가? 해당 분야에 합의가 있는가?
- `analogy`: 두 케이스가 충분히 유사한가? 차이점이 논증에 결정적인가?
- `cause-effect`: 역인과(reverse causation) 가능성은? Confounding variable은?
- `statistics`: 표본이 대표성 있는가? 방법론이 건전한가? 데이터가 최신인가?
- `example`: 대표적인 사례인가? 체리피킹은 아닌가?
- `sign`: 이 신호가 신뢰할 수 있는 지표인가? 다른 설명은 없는가?
- `principle`: 이 원칙이 이 상황에 적용되는가? 관련 예외는 없는가?
- `consequence`: 결과가 현실적인가? 의도치 않은 효과는? 시간대는?

```
> [expand {section} > 스텝 8/9 Rebuttal]
> Thesis: "{Answer 40자}"
> Claim: "{Claim 40자}"
> Warrant: "{Warrant 40자}"
> Qualifier: {qualifier}

❓ 가장 강력한 반론(Rebuttal)은 무엇이며, 어떻게 대응합니까?
   (Steelman: 반론을 가장 강하게 표현한 뒤 대응)

  예) 반론: "시장이 크다고 우리가 그 시장을 잡을 수 있는 건 아니다"
      대응: "우리 GTM은 니치 세그먼트 선점에 집중하므로 전체 시장 점유율 불필요"

  [1] {scheme CQ에서 도출한 가장 강한 반론 + 대응 제안 1}
  [2] {반론 + 대응 제안 2}
  [3] {반론 + 대응 제안 3}
  [4] 직접 작성
  [5] 지금은 생략 → Open Question으로 남김
```

인간 답변 → `## Rebuttal` 필드에 저장 → `wip({section}): add rebuttal` 커밋.

---

### 스텝 9: Scope + Acceptance Criteria

```
> [expand {section} > 스텝 9/9 Scope + AC]
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
scheme: {선택된 scheme}
qualifier: {선택된 qualifier}
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

## Warrant (논거 연결)
> {Grounds가 Claim을 지지하는 이유}

## Backing (Warrant 강화)
- {Warrant 자체를 뒷받침하는 근거 (없으면 비워둠)}

## Qualifier
> 확신 수준: {definitely|usually|presumably|in most cases|possibly}
> 조건: {Qualifier가 적용되는 조건}

## Rebuttal (반론 대응)
> 가장 강력한 반론: {steelman}
> 대응: {왜 이 반론이 Claim을 무너뜨리지 못하는가}

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
step: {현재 스텝 이름: stasis|scheme|claim|grounds|warrant|backing|qualifier|rebuttal|scope}
sub_research_pending: {true|false}
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
{직전 핑퐁 교환 내용을 2~3문장으로 요약}

## 재개 시 첫 질문
{다음에 물어볼 질문 그대로}
```

`expand({section}): complete` 커밋 직전에 `status: complete`로 업데이트한다.

---

## Argument Log 업데이트

핑퐁 세션 완료 후 `logs/argument-log.md`에 추가:

```markdown
## [{datetime}] expand({section})
  Added: {완료된 필드 목록}
  Stasis: {stasis}
  Scheme: {scheme}
  Qualifier: {qualifier}
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
  [challenge Stage 3: Warrant 유효성]
  ⚠️ D-02-005 (Warrant 선택) 검토 결과:
    Warrant가 Grounds→Claim을 충분히 연결하지 못함
    Decision context: "사용자가 [5] Implicit 선택"
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
   > [expand {section} > 스텝 3/9 Claim]
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
git commit -m "expand({section}): complete toulmin structure"
```

종료 안내:

```
✅ 섹션 {N}-{name} 전개 완료

  Claim:     {Claim 한 줄 요약}
  Stasis:    {stasis}
  Scheme:    {scheme}
  Qualifier: {qualifier}
  Grounds:   {N}건 ({structure})
  Warrant:   {Warrant 한 줄 요약}
  Rebuttal:  {"addressed" 또는 "open question"}

  status: discussing
  커밋: {N}회

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
- **Sub-Research는 Semi-Async** — Grounds 의존 스텝(Warrant)은 대기, 무관 스텝은 먼저
- **Grounds 결합 방식 명시** — Linked/Convergent에 따라 challenge 공격 전략이 달라짐
- **예시는 맥락 기반** — generic 예시 금지, 인간의 실제 Claim/Grounds에서 파생
- **즉시 기록 확인** — 각 답변 후 기록된 내용을 바로 보여주고 추가/계속 선택
- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **항상 thesis와의 연결을 확인한다** — 모든 필드는 thesis Answer로 거슬러 올라간다
- **Warrant는 생략 불가** — Implicit Warrant는 경고 후 계속 가능하나 위험함을 고지
- **각 스텝 완료마다 커밋** — 작업 손실 방지
- **Discussion audit trail 필수** — 모든 핑퐁 라운드를 `logs/discussion/`에 기록
- **Decision ID 부여** — 사용자 결정마다 D-{section}-{seq} ID를 부여하여 settle/challenge에서 추적 가능
- **Advisor mode** — Claim 선택 시 병렬 리서치로 판단 근거를 미리 제공 (근거 부족할 때)
