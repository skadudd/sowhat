# /sowhat:debate — 변증법적 논증 루프

<!--
@metadata
checkpoints:
  - type: verify-argument
    when: "각 라운드 판정 후"
  - type: decision
    when: "thesis-threatened 에스컬레이션"
  - type: decision
    when: "Post-debate merge/cherry-pick/보류/삭제"
config_reads: [layer, sections, mode, source]
config_writes: []
continuation:
  primary: "/sowhat:settle {section}"
  alternatives: ["/sowhat:expand {section}", "/sowhat:challenge"]
status_transitions: []
-->

이 커맨드는 3-에이전트 변증법 구조로 섹션(또는 전체 트리)을 공격·방어한다. `$ARGUMENTS`를 파싱하여 대상과 종료 조건을 결정한다.

Thesis가 위협받을 수 있으며, 그것이 논리적으로 정당하면 **무너뜨리는 것이 올바른 결과다.**

## L1 Fabrication 차단 (필수)

Con/Pro/Research 에이전트가 **자체 생성하는** 공격·방어 근거에는 구체 수치·기관명·연도·인물명·URL 같은 fabrication 가능 고유값을 포함하지 않는다.

구체 내용은 오직 3가지 경로에서만 들어온다:
1. 사용자 직접 입력 (섹션 파일 또는 이전 라운드 결과)
2. Research-Agent가 실제 retrieval로 가져온 데이터 (`<research_findings>` 태그)
3. `research/` 파인딩 매핑

오케스트레이터가 Con/Pro 에이전트를 스폰할 때, Phase 1·2 프롬프트에 이 규칙을 주입한다 (에이전트 `<principles>` 블록이 상시 준수). 상세: `references/fabrication-prevention.md`.

### L0 AI-엄격 실행 조건 (cycle 5 신설 — AU4 해소)

에이전트 스폰 프롬프트에 IF-ELSE 조건 명시:

```
Con-Agent / Pro-Agent 프롬프트 생성 시:
  <research_findings> 태그 내용 확인:
    
  IF research_findings 태그 비어있거나 없음:
    프롬프트에 명시:
      "이 라운드에서는 구체값(수치·기관명·연도)으로 공격/방어하지 말라.
       논리적 취약점(Warrant non-sequitur, Qualifier overclaiming,
       scheme CQ)으로만 공격/방어할 것."
  
  ELSE:
    프롬프트에 명시:
      "구체값 인용 시 반드시 <research_findings> 태그 내 정보만 사용.
       태그 밖에서 기관명·수치 창작 금지."
```

Round 1에서 Research-Agent 자동 스폰 기본값을 유지하여 `<research_findings>`를 먼저 채우고 Con/Pro로 전달. Research 불가 상황에서는 논리적 공격만 허용.

## 인자 파싱

```
/sowhat:debate [section|--global] [--rounds N|--until-stable|--until-broken] [--stance persuade|consensus|critique]
```

| 인자 | 의미 |
|------|------|
| `{section}` (번호 또는 이름) | 단일 섹션 debate |
| `--global` 또는 인자 없음 | 전체 트리 debate |
| `--rounds N` | N라운드 후 종료 (기본값: 3) |
| `--until-stable` | 연속 2라운드 결과 변화 없으면 종료 |
| `--until-broken` | Claim 또는 Thesis 무너지면 즉시 종료 |
| `--stance persuade` | 설득 모드 — 기존 debate + 대상 콘텐츠를 Con/Pro의 참고 소재로 제공 |
| `--stance consensus` | 합의 모드 — Pro가 양측 통합 제안, Con이 피상성 공격 |

**Stance 기본값:**
- `config.mode === "content-critique"` && `--stance` 없음 → `persuade`
- `config.mode === "idea"` (또는 mode 없음) && `--stance` 있음 → `❌ --stance는 content-critique 모드에서만 사용 가능합니다.`
- `config.mode === "idea"` && `--stance` 없음 → 기존 동작 (stance 없음)

## 사전 검증 (1회만 실행 — 라운드 중 재로드 금지)

**섹션 파일을 한 번만 로드하고 모든 라운드에서 메모리 값을 재사용한다. 파일 재로드는 Step 5 커밋 직후 변경 확인 시에만 허용.**

1. `planning/config.json` 로드 → sowhat 프로젝트 확인
   - `--stance` 지정 시: `mode` 필드 확인. `mode !== "content-critique"` → `❌ --stance는 content-critique 모드에서만 사용 가능합니다.`
   - `mode === "content-critique"` && `--stance` 없음 → 기본값 `persuade` 적용
2. `00-thesis.md` 로드 → `thesis_answer`, `key_arguments` 추출
   - stance 모드 시: `## Source Content` 섹션에서 `target_toulmin` 추출 (에이전트 프롬프트에 전달용)
3. **작업 트리 확인**:
   ```bash
   git status --porcelain
   ```
   uncommitted 변경이 있으면:
   ```
   ❌ 작업 트리가 깨끗하지 않습니다. debate 브랜치 생성 전 커밋하세요.
     미커밋 파일: {list}
     다음: git add -A && git commit -m "wip: before debate"
   ```
4. **단일 섹션 모드**: 대상 섹션 파일 확인 후 **전체 필드를 변수로 추출**
   - 번호면 → `{N}-*.md` 패턴 검색
   - 이름이면 → `*-{name}.md` 패턴 검색
   - 없으면 → `❌ 섹션을 찾을 수 없습니다: {section}`
   - status가 `invalidated` → `❌ 이미 invalidated 상태입니다. debate 불필요.`
   - status가 `draft` → `❌ draft 상태입니다. /sowhat:expand로 먼저 전개하세요.`
   - 로드 후 추출: `scheme`, `claim`, `grounds`, `warrant`, `qualifier`, `rebuttal` → 라운드 전체에서 재사용
5. **전체 모드**: settled 또는 discussing 상태 섹션 수 확인
   - 0개이면 → `❌ debate 가능한 섹션이 없습니다. /sowhat:expand로 섹션을 전개하세요.`
6. `logs/` 및 `logs/debate/` 디렉터리 생성:
   ```bash
   mkdir -p logs/debate
   ```
7. `argument-log.md` 생성 (없으면):
   ```bash
   # 없으면 생성
   echo "# Argument Log" > logs/argument-log.md
   ```

## Debate 브랜치 생성

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```bash
# 단일 섹션
BRANCH="debate/{section}-{YYYYMMDD-HHMM}"

# 전체 모드
BRANCH="debate/global-{YYYYMMDD-HHMM}"

git checkout -b "$BRANCH"
```

브랜치 생성 실패 시:
```
❌ 브랜치 생성 실패: {error}
  이미 존재하면: git branch -D {BRANCH} 후 재실행
```

## Qualifier 서열 척도 (공유 기준)

모든 판정에서 아래 척도를 사용한다. 단계는 정수로 표현.

| 단계 | Qualifier | 의미 |
|------|-----------|------|
| 0 | `definitely` | 예외 없이 참 |
| 1 | `usually` | 대부분의 경우 참 |
| 2 | `in most cases` | 많은 경우 참 |
| 3 | `presumably` | 가정적으로 참 |
| 4 | `possibly` | 가능성 있음 |

- **2단계 이상 하락** = 예: definitely(0) → presumably(3) = 3단계 하락 → `broken`
- **1단계 하락** = `modified` 허용 범위

---

## 3-에이전트 역할

### Con-Agent (claude-opus-4-6)
- 역할: 섹션을 다층 분석 후 **가장 치명적인 약점 하나**만 골라 공격
- 공격 전 분석 순서 (이 순서대로 점검, 첫 발견 시 우선 공격):
  1. **Warrant 취약점 먼저**: Non-sequitur / Missing link / Circular 중 해당되는가?
  2. **Qualifier Overclaiming**: `definitely` + 약한 근거 / `definitely` + 반론 없음?
  3. **Scheme CQ**: 해당 scheme의 Critical Questions 중 가장 치명적 질문 하나
  4. **Steelman**: 위 세 가지로 공격이 없으면, 섹션에 대한 최강 반론을 독립 생성

- scheme별 Critical Questions:

  | Scheme | Critical Questions |
  |--------|-------------------|
  | authority | 이 권위자가 이 도메인의 진짜 전문가인가? 이해충돌은 없는가? 반대 권위는? |
  | analogy | 두 케이스가 논증의 핵심 측면에서 충분히 유사한가? 차이점이 결정적인가? |
  | cause-effect | 인과 메커니즘이 타당한가? 역인과 가능성은? Confounding variable은? |
  | statistics | 표본이 대표성 있는가? 방법론이 건전한가? 데이터가 현재 시점에 유효한가? |
  | example | 대표 사례인가? 체리피킹이 아닌가? 일반화가 가능한가? |
  | sign | 이 신호가 신뢰할 수 있는 지표인가? 동일 신호에 대한 다른 해석은? |
  | principle | 이 원칙이 이 상황에 적용되는가? 관련 예외 조건은? |
  | consequence | 결과가 현실적인가? 의도치 않은 부작용은? 적용 시간대는? |

- 에스컬레이션: Claim `broken` → Key Argument 도전 → Key Argument `broken` → Thesis 도전
- **공격은 하나만**: 여러 약점을 나열하지 않는다. 가장 치명적인 것 하나에 집중.

### Pro-Agent (claude-sonnet-4-6)
- 역할: Con-Agent의 공격에 **공격의 논리적 약점을 직접 해소하는 방식**으로만 방어
- 방어 성공 기준: 공격이 지적한 구체적 논리 취약점을 직접 해소했는가?
- 방어 순서: Grounds 보강 → Warrant 명시화 → Qualifier 조정 → Scope 제한
- 금지: 단순 재주장 (Claim을 반복하는 것), 주제 전환, 감정적 호소
- 양보 조건 (다음 중 하나라도 해당되면 즉시 양보):
  1. Qualifier가 원래보다 2단계 이상 하락 (definitely → probably 이상) → `broken`
  2. Scope 제한이 원래 Claim의 적용 대상을 절반 이하로 축소 → `broken`
  3. 위 조건 미해당 시에만 방어 순서(Grounds → Warrant → Qualifier → Scope) 진행, 전체 소진 시 양보

### Research-Agent (claude-sonnet-4-6)
- 역할: 외부 근거 수집. **요청 시 + 자동 트리거 조건 충족 시** 활성화
- 도구: WebSearch, WebFetch
- 출력: Grounds 또는 Backing에 삽입 가능한 형식으로 정리
- 한도: 라운드당 최대 3회 검색 (Deep Research 모드에서는 엔진 API 1회 호출로 대체)
- Deep Research:
  - 활성 엔진의 API 키(`PERPLEXITY_API_KEY` 또는 `GEMINI_API_KEY`)가 존재하고 `features.deep_research`가 `"disabled"`가 아니면 활성화
  - 엔진 선택은 Round 1에서 1회 결정(`deep_session_engine`)하여 이후 라운드 재사용
  - 호출/검증/파싱은 `references/deep-research-adapters.md`의 어댑터 명세를 그대로 따름
  - 영수증 검증 실패 시 silent fallback 금지 — 세션 단위 사용자 동의(`deep_session_decision`)로 처리

#### 자동 트리거 조건 (요청 없어도 활성화)

다음 조건 중 하나라도 해당되면 Research-Agent를 자동으로 활성화한다:

| 조건 | 트리거 | 리서치 방향 |
|------|--------|------------|
| Con이 "근거 불충분" 공격 | ✅ 자동 | Claim을 지지하는 추가 증거 탐색 |
| Con이 "데이터 오래됨" 공격 | ✅ 자동 | 최신 데이터/통계 탐색 |
| Pro가 Backing 없이 Warrant 방어 | ✅ 자동 | Warrant를 지지하는 외부 근거 탐색 |
| Qualifier 분쟁 (Con: overclaiming) | ✅ 자동 | 정량적 데이터로 적정 수준 탐색 |
| Con이 Steelman 공격 (독립 반론) | ✅ 자동 | 반론을 지지/반박하는 양쪽 증거 탐색 |
| 단순 논리 구조 공격 (Non-sequitur 등) | ❌ 불필요 | 리서치로 해결 불가 |

#### 리서치 결과 주입

Research-Agent 결과는 다음 라운드의 Con/Pro 양쪽에 동시 전달한다:
- **Pro에게**: 방어에 사용할 수 있는 지지 근거
- **Con에게**: 공격을 강화할 수 있는 반박 근거
- 중립적 입장 — 어느 쪽에도 편향하지 않음

## Stance별 에이전트 역할 변형 (content-critique 모드 전용)

stance가 지정되면 에이전트 프롬프트에 `<target_content>`와 `<stance_instruction>`을 추가한다. stance 없으면 이 섹션 전체를 건너뛴다.

### persuade (설득) — 기본값

| Agent | 역할 변경 |
|-------|----------|
| Con-Agent | 대상 콘텐츠 저자의 입장을 대변하여 사용자 논증을 공격. 대상의 Grounds와 Warrant를 활용하여 반론 |
| Pro-Agent | 사용자의 Thesis를 적극 옹호. 대상 콘텐츠의 약점을 방어에 활용 |
| Research-Agent | 사용자 입장을 지지하는 근거 우선 탐색 |

Con-Agent 추가 프롬프트:
```
<target_content>{Source Content Toulmin 분석}</target_content>
<stance_instruction>대상 콘텐츠의 저자 입장에서 사용자의 논증을 공격하라. 대상의 Grounds와 Warrant를 사용하여 반론하라.</stance_instruction>
```

Pro-Agent 추가 프롬프트:
```
<target_weaknesses>{critic report 약점 — 있으면}</target_weaknesses>
<stance_instruction>대상 콘텐츠의 약점을 활용하여 방어를 강화하라.</stance_instruction>
```

### consensus (합의)

| Agent | 역할 변경 |
|-------|----------|
| Con-Agent | 합의가 피상적이거나 양쪽 논리를 왜곡하는 부분을 공격 |
| Pro-Agent | 사용자 Thesis와 대상 콘텐츠의 진정한 공통점을 찾아 종합 제안 |
| Research-Agent | 양측 입장을 통합하는 프레임워크나 사례 탐색 |

**새 outcome 추가**: `synthesized` — Pro가 양측을 왜곡 없이 통합하는 제안을 제시하고 Con이 피상성 공격에 실패.

| 결과 | 판정 기준 | 섹션 status 변경 |
|------|-----------|------------------|
| `synthesized` | Pro가 양측 핵심 논리를 보존한 통합 제안을 제시하고 Con이 피상성 반박에 실패 | 유지 (내용 수정) |

Pro-Agent 추가 프롬프트:
```
<target_content>{Source Content Toulmin 분석}</target_content>
<stance_instruction>사용자 Thesis와 대상 콘텐츠 사이의 진정한 공통점을 찾아 종합 제안하라. 피상적 타협이 아닌 양측 논리를 모두 보존하는 통합을 목표로 하라.</stance_instruction>
```

Con-Agent 추가 프롬프트:
```
<stance_instruction>제안된 합의가 피상적이지 않은지, 어느 한쪽의 핵심 논리를 왜곡하지 않았는지 공격하라.</stance_instruction>
```

---

## 에이전트 스폰 (2단계 실행)

### Phase 1: Con + Research 병렬 스폰

```
# Con과 Research를 동시에 스폰
con_result = Task(sowhat-con-agent,
  prompt = """
  <thesis>{thesis}</thesis>
  <section>{섹션 전체 내용}</section>
  <depth>{depth}</depth>
  <previous_rounds>{이전 라운드 결과 요약 (있으면)}</previous_rounds>
  <research_findings>{이전 라운드 리서치 결과 (있으면)}</research_findings>
  {stance가 있으면: <target_content>{source content toulmin}</target_content>}
  {stance가 있으면: <stance_instruction>{stance별 Con 지시}</stance_instruction>}
  """)

# === Deep Research 자동 트리거 판단 ===
# silent fallback 금지: Deep Research 모드로 스폰하려면 영수증 검증 게이트를 통과해야 함
# 호출/검증 세부는 references/deep-research-adapters.md 참조

# Round 1에서 엔진 선택을 1회 결정하여 deep_session_engine에 저장 (이후 라운드 재사용)
IF round == 1 AND deep_session_engine is unset:
  deep_session_engine = resolve_engine(features.deep_research_engine, PERPLEXITY_API_KEY, GEMINI_API_KEY)
  # "perplexity" | "gemini" | "web" | None (사용 불가)
  # features.deep_research == "disabled"면 None

IF deep_session_engine in ["perplexity", "gemini"]:
  ctx = "debate-r{round}-{section}"

  IF deep_session_engine == "perplexity":
    # Adapter A.1 → A.2 → A.3 (deep-research-adapters.md 참조)
    receipt_path = "research/_receipts/perplexity-{ts}-{ctx}.json"
    validation = validate_receipt_perplexity(receipt_path)
    result_payload_tag = "<perplexity_result>{영수증 JSON}</perplexity_result>"

  IF deep_session_engine == "gemini":
    # Adapter B.1 → B.2 → B.3 (폴링) → B.4
    final_receipt = "research/_receipts/gemini-{ts}-final-{ctx}.json"
    receipt_path = final_receipt
    validation = validate_receipt_gemini(final_receipt)
    result_payload_tag = "<gemini_result>{영수증 JSON}</gemini_result>"

  IF validation.failed:
    # debate는 라운드가 빠르게 돌아가므로 매 라운드 사용자 프롬프트는 흐름을 끊는다.
    # → 세션 단위 결정(deep_session_decision)을 한 번만 받고 재사용한다.
    IF deep_session_decision is unset:
      prompt_user("""
        ❌ Deep Research 영수증 검증 실패 (debate Round {round}, section {section})
          엔진: {deep_session_engine}:{모델 또는 agent}
          사유: {validation.reason}
          영수증: {receipt_path}

        이 debate 세션에서 Deep Research를 어떻게 처리할까요?
          [1] 이 세션은 fact-check(WebSearch) 모드로 진행 (남은 라운드 모두 적용)
          [2] 다른 Deep Research 엔진으로 세션 전환 (가용 시)
          [3] 이 라운드만 fact-check, 다음 라운드부터 동일 엔진 재시도
          [4] debate 세션 종료
      """)
      deep_session_decision = user_choice
      IF user == 2: deep_session_engine = 다른 엔진으로 전환 후 위 분기 재시도
      IF user == 4: abort_debate()

    effective_mode = "fact-check" (이 라운드)
    payload_tag_for_round = none

  ELSE:
    effective_mode = "deep-research"
    payload_tag_for_round = result_payload_tag

ELSE:
  effective_mode = "(default fact-check or web-search)"
  payload_tag_for_round = none

research_result = Task(sowhat-research-agent,
  prompt = """
  <thesis>{thesis}</thesis>
  <section>{섹션 내용}</section>
  <search_focus>{현재 섹션의 가장 약한 Grounds + Open Questions}</search_focus>
  <previous_findings>{이전 라운드에서 이미 찾은 것 — 중복 검색 방지}</previous_findings>
  {effective_mode == "deep-research" ? "<mode>deep-research</mode>" : ""}
  {effective_mode == "deep-research" ? payload_tag_for_round : ""}
  {effective_mode == "deep-research" ? "<receipt_path>" + receipt_path + "</receipt_path>" : ""}
  """)

# 두 에이전트 완료 대기
```

> **자동 트리거 판단**: 위 "자동 트리거 조건"에 해당하지 않으면 Research-Agent 스폰을 건너뛴다. 단, Round 1에서는 항상 스폰한다 (초기 근거 수집).
>
> **silent fallback 금지 원칙**: research-agent에 `<mode>deep-research</mode>` 태그를 다는 모든 경로는 사전에 영수증 검증을 통과해야 한다. 검증 없이 deep-research 태그만 다는 단순화는 사용자가 deep research를 받았다고 오인하게 만들므로 절대 금지.

### Phase 2: Pro 스폰 (Con + Research 결과 포함)

```
pro_result = Task(sowhat-pro-agent,
  prompt = """
  <thesis>{thesis}</thesis>
  <section>{섹션 전체 내용}</section>
  <con_attacks>{con_result}</con_attacks>
  <research_findings>{research_result — 지지 근거만 필터링}</research_findings>
  {stance가 있으면: <target_content>{source content toulmin}</target_content>}
  {stance가 있으면: <stance_instruction>{stance별 Pro 지시}</stance_instruction>}
  """)
```

Pro에게는 Research 결과 중 **지지 근거만** 전달한다. 반박 근거는 Con의 다음 라운드에 전달.

### Phase 3: 오케스트레이터 종합

Con 공격 + Pro 방어 + Research 근거를 종합하여 판정한다.
Research가 찾은 반박 근거가 Pro의 방어를 약화시키면 판정에 반영한다.

## 라운드 구조

각 라운드는 다음 순서로 진행한다:

### Step 1: Con-Agent 공격

1. 섹션 파일의 Warrant, Qualifier, scheme, Grounds, Rebuttal 순서로 점검
2. **Warrant 취약점 우선 확인**:
   - Non-sequitur: Grounds → Claim이 논리적으로 연결되지 않음
   - Missing link: A → C 점프, 중간 단계 없음
   - Circular: Warrant가 Claim을 그대로 반복
3. Warrant 이상 없으면 **Qualifier Overclaiming** 확인:
   - `definitely` + 약한 근거 (인터뷰 1-3건, 사례 1-2개) → 공격
   - `definitely` + Rebuttal 없음 → 공격
4. 위 이상 없으면 **scheme CQ 적용**: scheme의 Critical Questions 중 현재 Grounds/Warrant를 가장 직접적으로 무력화하는 질문 선택
5. 위 이상 없으면 **Steelman**: 섹션의 Rebuttal을 먼저 보지 않고, 독립적으로 이 섹션에 대한 최강 반론 생성. Rebuttal 필드와 대조하여 대응 못한 부분 공격

출력 형식:
```
🔴 Con [라운드 N]
  공격 유형: {Warrant취약 | Qualifier과잉 | SchemesCQ | Steelman}
  공격: {구체적 논리 공격 — 단 하나, 명확하게}
  취약 지점: {Grounds/Warrant/Qualifier/Rebuttal 중 어디가 표적인가}
```

### Step 2: Pro-Agent 방어

Con-Agent의 공격에 응답한다. **공격이 지적한 논리적 약점을 직접 해소해야만 방어 성공**이다.

**방어 성공 (defense)**:
- 공격의 취약 지점을 Grounds 보강 / Warrant 명시화 / Backing 제시로 직접 해소
- 단순 재주장(Claim 반복) 불가
```
🟢 Pro — 방어 성공
  해소 방식: {어떻게 취약점을 직접 해소했는가}
  Rebuttal 업데이트: {섹션 파일 Rebuttal에 추가할 내용}
```

**수정 방어 (concession with modification)**:
- 취약점을 완전히 해소할 수 없으나, Qualifier 축소 또는 Scope 제한으로 공격 범위를 무력화
- Claim이 약화되지만 유효성 유지
```
🟡 Pro — 수정 방어
  수정: {Qualifier/Scope 조정 내용}
  이유: {왜 이 조정으로 공격 범위가 벗어나는가}
```

**완전 양보 (full concession)**:
- Grounds 보강, Warrant 명시화, Qualifier 조정 모두 시도했으나 취약점 해소 불가
```
🔴 Pro — 완전 양보
  소진한 방어: {시도했으나 불충분한 방어들}
  인정: {왜 방어 불가능한가}
```

### Step 3: Research-Agent (조건부)

Pro-Agent 또는 Con-Agent가 다음 표현을 사용할 때만 활성화:
- `"외부 근거 필요"`, `"데이터 필요"`, `"리서치 요청"`

```bash
# WebSearch 실행
# WebFetch로 상위 2개 소스 확인
```

```
🔍 Research — 외부 근거
  검색: {검색어}
  발견: {핵심 데이터 포인트}
  삽입 위치: Grounds 항목 {N} 또는 Backing
```

### Step 4: 오케스트레이터 판정 + verify-argument Checkpoint

Pro-Agent의 방어가 공격의 논리적 취약점을 **직접 해소했는가**를 기준으로 판정한다.

판정 후 인간에게 `verify-argument` checkpoint를 제시한다 (`references/checkpoints.md` 참조):

```
**[verify-argument]** round {N}

> Con 공격: {공격 요약 한 줄}
> Pro 방어: {방어 요약 한 줄}
> 판정: {outcome} — {이유 한 줄}

[1] 승인 — 판정 적용
[2] 판정 변경 — {다른 outcome 선택}
[3] 중단 — debate 보류
```

인간이 `[2]`를 선택하면 인간의 판정을 우선한다 (이유 기록 필수).

| 결과 | 판정 기준 | 섹션 status 변경 |
|------|-----------|------------------|
| `strengthened` | Pro가 공격 취약점을 직접 해소 + Rebuttal 강화됨 | 유지 |
| `modified` | Qualifier/Scope 조정으로 공격 범위를 벗어남 (약화 수용) | 유지 (내용 수정) |
| `weakened` | Pro가 방어했으나 취약점 일부 잔존 — "방어는 했으나 논리 손상" | `needs-revision` |
| `broken` | Pro가 완전 양보 | `invalidated` |
| `synthesized` | (consensus 모드) Pro가 양측 핵심 논리를 보존한 통합 제안 + Con 피상성 반박 실패 | 유지 (내용 수정) |
| `thesis-threatened` | Thesis Answer까지 영향 | **즉시 PAUSE** |

**판정 기준 세부:**
- `strengthened` vs `weakened` 경계: Pro가 취약점을 **직접** 해소했는가 vs 다른 논거로 우회했는가
- 우회 방어는 `weakened`로 판정 (공격 지점이 해소되지 않았으므로)
- `modified`는 Pro가 Qualifier/Scope를 좁혀 "그 범위에서는 여전히 참"임을 보인 경우만 (1단계 하락 허용, 2단계 이상이면 `broken`)

**증명 책임(Burden of Proof) 추적:**
- Con 공격이 성립하면 → BoP가 Pro에게 이동 (Pro는 새 Grounds 또는 Warrant 제시 의무)
- Pro가 새 Grounds/Warrant를 제시하면 → BoP가 Con에게 이동
- Pro가 Claim 재주장만 하면 → BoP 이동 없음 → `weakened` 판정
- BoP가 2라운드 연속 Pro에게 머물면 → `broken` 판정

### Step 5: 라운드 파일 생성 및 커밋

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`logs/debate/{section}-round-{N}.md` 생성:

```markdown
---
section: {section}
round: {N}
datetime: {current_datetime}
outcome: {strengthened|modified|weakened|broken|thesis-threatened}
branch: {branch_name}
---

## Con-Agent 공격
{공격 내용}

## Pro-Agent 응답
{응답 내용}

## Research (있으면)
{리서치 결과}

## 오케스트레이터 판정
{outcome}: {이유}

## 섹션 변경 사항
- {변경된 필드}: {이전} → {이후}
```

`logs/argument-log.md`에 append:

```markdown
## [{current_datetime}] debate({section}) round-{N}
  Action: {outcome}
  Before: {주요 변경 전 상태}
  After: {주요 변경 후 상태}
```

섹션 파일 업데이트 후 커밋:

```bash
git add {section_file} logs/debate/{section}-round-{N}.md logs/argument-log.md
git commit -m "debate({section}): round-{N} - {outcome}"
```

## 세션 저장

각 라운드 시작 시 `logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: debate
section: {section}
step: round-{N}
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
{이번 라운드 Con-Agent 공격 요약 + 현재 판정 대기 중인지 여부. 예: "round-2 진행 중. Con: Warrant의 인과관계 약점 공격. Pro: 상관관계 데이터로 방어 중. 오케스트레이터 판정 대기"}

## 재개 시 첫 질문
{판정 결과를 적용하고 다음 라운드 시작할 것, 또는 Post-Debate 요약 제시할 것}
```

라운드 완료 후 `step: round-{N}-complete`으로 업데이트.

debate 완료 커밋 직전에 `status: complete`로 업데이트한다.

---

## 에스컬레이션 경로

```
섹션 Claim broken
  → Key Argument 도전 시작
      → Key Argument broken
          → Thesis Answer 도전
              → PAUSE + 인간 보고
```

### Thesis 위기 감지 시

```
⚠️  Thesis 위기 감지

  근거: {무엇이 무너졌고 왜}
  영향: {어떤 섹션들이 invalidated되는가}

  이 debate branch를 어떻게 처리하시겠습니까?
  [1] Thesis 수정 후 계속 (debate branch 유지)
  [2] 섹션만 수정 (에스컬레이션 거부)
  [3] Debate 중단 (branch 삭제)
```

인간의 선택을 기다린다. 응답 없이 진행하지 않는다.

- [1] 선택 → Thesis 핑퐁 시작, `/sowhat:expand` 방식으로 Answer 수정
- [2] 선택 → 에스컬레이션 취소, 섹션 status만 업데이트
- [3] 선택 → `git checkout main && git branch -D {branch}` 실행 후 종료

## 종료 조건 판단

각 라운드 후 종료 여부를 판단한다:

- `--rounds N`: 현재 라운드 수 >= N → 종료
- `--until-stable`: 최근 2라운드 연속으로 `strengthened` → 종료
- `--until-broken`: outcome이 `broken` 또는 `thesis-threatened` → 즉시 종료
- 기본값 (`--rounds 3`): 3라운드 후 종료

### Stagnation Detection (정체 감지)

라운드 간 실질적 진전이 없으면 자동으로 종료한다. 토큰 낭비를 방지한다.

**정체 판정 알고리즘:**

```
AFTER EACH round:
  progress = calculate_progress(current_round, previous_rounds)

  IF progress == "stagnant":
    자동 종료 + 정체 보고
```

**calculate_progress 기준:**

```
stagnant 조건 (하나라도 해당되면 정체):

1. 동일 공격 반복:
   - Con-Agent의 공격 유형이 이전 라운드와 동일
   - AND 공격 대상 필드(Grounds/Warrant/Qualifier)도 동일
   - → stagnant (Con이 새 약점을 찾지 못함)

2. 동일 방어 반복:
   - Pro-Agent의 방어 방식이 이전 라운드와 동일
   - AND 새로운 Grounds/Warrant/Backing 추가 없음
   - → stagnant (Pro가 새 근거를 제시하지 못함)

3. Qualifier 진동:
   - 최근 3라운드에서 Qualifier가 A→B→A로 진동
   - → stagnant (합의 불가능)

4. 연속 무변화:
   - 3라운드 연속 outcome이 동일 (예: modified × 3)
   - AND 섹션 파일의 실제 변경사항이 없음
   - → stagnant (형식적 라운드만 반복)
```

**정체 시 출력:**

```
⚠️  Debate 정체 감지 — 자동 종료

  라운드: {N}
  정체 유형: {동일 공격 반복 | 동일 방어 반복 | Qualifier 진동 | 연속 무변화}
  마지막 유의미한 변화: Round {M}

  [1] 추가 라운드 강제 진행 (최대 2라운드 더)
  [2] 종료 수용 — Post-Debate 요약으로 이동
  [3] 다른 섹션으로 debate 전환
```

**강제 진행 시:**
- 최대 2라운드까지만 허용
- Con-Agent에 `<force_new_angle>true</force_new_angle>` 전달 → 이전과 다른 공격 차원 강제
- 2라운드 후에도 정체면 무조건 종료

### 라운드 간 진전 추적

각 라운드 결과를 구조화하여 다음 라운드에 전달한다:

```
round_history = [
  { round: 1, attack_type: "Warrant", target_field: "Warrant", outcome: "modified", changes: ["Qualifier: definitely→usually"] },
  { round: 2, attack_type: "Warrant", target_field: "Warrant", outcome: "modified", changes: [] },
  { round: 3, ... }
]
```

이 히스토리를 기반으로 stagnation detection이 작동한다.

## --global 모드

전체 트리를 debate한다. 순서:

1. `needs-revision` 상태 섹션 먼저
2. `discussing` 상태 섹션
3. `settled` 상태 섹션 (공격 강도 낮춤 — Qualifier 검증 위주)
4. thesis 자체 (`--until-broken` 또는 모든 섹션 완료 후)

브랜치: `debate/global-{YYYYMMDD-HHMM}`

각 섹션마다 동일한 라운드 구조를 적용한다. 섹션 하나가 `broken` 되면:
- 해당 섹션의 하위 의존 섹션 `invalidated` 처리
- 다음 섹션으로 이동 (Thesis 위기가 아닌 한)

전체 완료 후 종합 요약 출력.

## Post-Debate 요약 및 인간 결정

```
----------------------------------------
📊 Debate 결과: {section}
  라운드: {N}
  결과: {strengthened | modified | weakened | broken}

  변경사항:
  {변경된 항목과 내용 목록}

  Branch: {branch_name}
  변경 diff:

  [1] main으로 merge (변경 수용)
  [2] cherry-pick (선택적 수용)
  [3] branch 보류 (나중에 결정)
  [4] branch 삭제 (debate 기각)
----------------------------------------
```

인간의 선택에 따라:

**[1] merge 선택**:
```bash
git checkout main
git merge {branch_name} --no-ff -m "debate({section}): merge round results"
```

merge 완료 후, 섹션 status를 `discussing`으로 복원한다 (needs-revision이었던 경우):

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

섹션 파일에서:
- `status: needs-revision` → `status: discussing`
- `updated: {current_datetime}`

```bash
git add {section_file}
git commit -m "debate({section}): restore status to discussing after merge"
```

그 다음, Open Questions 정리를 확인한다:

```
debate 중 추가된 Open Questions가 있습니까?

  ## Open Questions
  {현재 미해결 항목 목록}

  [1] 모두 해소됨 — settle로 진행
  [2] 아직 미해소 항목 있음 — /sowhat:expand {section} 으로 먼저 정리
```

인간이 [1]을 선택하면: Open Questions 체크박스를 모두 checked로 표시하고 커밋한 뒤 settle 안내.
인간이 [2]를 선택하면: expand 안내 후 종료.

**[2] cherry-pick 선택**:
인간이 커밋 해시를 지정하거나 라운드 번호를 선택하면:
```bash
git checkout main
git cherry-pick {commit_hash}
```

**[3] 보류 선택**:
```
⏸  Branch {branch_name} 보류됨
  나중에: git checkout {branch_name} 으로 재검토
  또는: /sowhat:debate {section} 으로 새 debate 시작
```

**[4] 삭제 선택**:
```bash
git checkout main
git branch -D {branch_name}
```

```
✅ Debate 완료 (섹션 변경 없음)
```

## 완료 안내

merge 또는 cherry-pick 완료 후:

```
✅ Debate 완료: {section}
  결과: {outcome}
  적용된 변경: {N}건
```

outcome에 따라 다음 안내를 표시한다:

**strengthened / modified** (섹션 유효):
```
----------------------------------------
다음 액션:

[1] 논증 확정 (settle {section})
[2] 전체 상태 확인 (progress)
----------------------------------------
```

**weakened** (needs-revision):
```
----------------------------------------
다음 액션:

[1] 논거 보강 — 재전개 (expand {section})
[2] 특정 필드만 수정 (revise {section})
[3] 전체 상태 확인 (progress)
----------------------------------------
```

**broken / invalidated**:
```
---

## 🔴 섹션 invalidated

**{section}: 상위 논거 수정 필요** — thesis 또는 Key Argument revision 후 재전개

`/sowhat:expand {section}` 또는 `/sowhat:init` (thesis 수정)


---
```

## Debate 브랜치 Lifecycle

### 생성
- debate 시작 시 `debate/{section}-{YYYYMMDD-HHMM}` 브랜치 생성
- 작업 트리가 깨끗해야 함 (uncommitted 변경 거부)

### 라운드 중
- 각 라운드 결과를 브랜치에 커밋
- `logs/debate/{section}-round-{N}.md` 파일 생성
- 섹션 파일 직접 수정 (Grounds, Warrant, Qualifier 등)

### 종료 시 인간 결정 (decision checkpoint)
- `[1] merge` → main에 merge, 섹션 status를 discussing으로 복원
- `[2] cherry-pick` → 특정 라운드만 선택적 적용
- `[3] 보류` → 브랜치 유지, 나중에 결정
- `[4] 삭제` → 브랜치 삭제, 변경사항 폐기

### 고아 브랜치 정리

`/sowhat:resume` 또는 `/sowhat:progress` 실행 시 고아 브랜치를 감지한다:

```
고아 브랜치 판정 기준:
- debate/ 브랜치가 존재
- 해당 브랜치의 마지막 커밋이 7일 이상 경과
- main에 merge되지 않음

감지 시 출력:
⚠️  오래된 debate 브랜치 발견
  {branch_name} — 마지막 커밋: {date} ({N}일 전)

  [1] main으로 merge
  [2] 브랜치 삭제
  [3] 유지 (다음 세션에서 다시 확인)
```

### 동시 debate 방지

같은 섹션에 대한 debate 브랜치가 이미 존재하면:
```
❌ 이미 진행 중인 debate가 있습니다: {existing_branch}
  [1] 기존 debate 이어서 진행
  [2] 기존 debate 삭제 후 새로 시작
  [3] 취소
```

---

## Discussion Audit Trail (Debate)

debate 라운드 교환 내용을 구조화된 로그로 남긴다.

### 저장 위치

`logs/discussion/{section}-debate-{YYYYMMDD-HHMM}.md`

### 저장 시점

각 라운드 완료 후 append.

### 형식

```markdown
# Debate Discussion Log: {section}
Branch: {branch_name}

## Round {N} ({datetime})
- Con 공격: {공격 유형} — {공격 요약}
- Pro 방어: {방어 방식} — {방어 요약}
- Research: {리서치 결과 요약 | 미실행}
- 판정: {outcome}
- 인간 결정: {승인/판정 변경/중단} (Decision ID: D-{section}-{seq})
- 섹션 변경: {변경된 필드 목록}
```

### Decision ID

debate에서 인간이 내리는 결정에도 Decision ID를 부여한다:
- 라운드 판정 승인/변경 시
- Post-debate merge/cherry-pick/보류/삭제 결정 시
- thesis-threatened 에스컬레이션 결정 시

ID는 섹션 파일의 `## Decision Log`와 debate discussion log 양쪽에 기록한다.

---

## 핵심 원칙

- **Warrant 취약점 우선** — Con-Agent는 항상 Warrant Non-sequitur/Missing link/Circular 먼저 점검
- **Steelman 독립 생성** — Rebuttal을 먼저 보지 않고 최강 반론 생성 후 대조
- **공격은 하나만** — 여러 약점 나열 금지, 가장 치명적인 것 하나에 집중
- **우회 방어는 weakened** — 공격 지점을 직접 해소하지 않은 방어는 성공이 아님
- **Pro-Agent 단순 재주장 금지** — Claim 반복은 방어가 아님
- **Claim이 무너져야 한다면 무너뜨린다** — 방어를 위한 방어 없음
- **Research-Agent는 자동 트리거 + 요청 시 활성화** — 근거 불충분/데이터 오래됨/Qualifier 분쟁 시 자동 발동
- **브랜치는 인간이 결정한다** — 자동 merge 없음
- **Thesis 위기는 즉시 PAUSE** — 임의로 처리하지 않는다
- **에스컬레이션은 단계적** — Claim → Key Argument → Thesis 순서 준수
- **Discussion audit trail 필수** — 모든 라운드를 `logs/discussion/`에 기록
- **Decision ID 부여** — 인간 결정마다 ID를 부여하여 추적 가능
