# /sowhat:challenge — 논증 트리 공격 (전체 / 부분)

<!--
@metadata
checkpoints:
  - type: decision
    when: "각 공격에 대한 반박/수용"
  - type: decision
    when: "역전파 범위 결정"
config_reads: [layer, sections]
config_writes: [sections]
continuation:
  primary: "/sowhat:finalize-planning (통과 시)"
  alternatives: ["/sowhat:revise {section}", "/sowhat:expand {section}"]
status_transitions: ["settled → needs-revision", "discussing → needs-revision"]
-->

이 커맨드는 문서 트리를 8단계(Stage 0-7) 검증으로 공격한다. Stage 0은 사실 검증(Factual Verification), Stage 1-7은 논리 검증(Toulmin Model, Walton Argument Schemes, Pragma-Dialectics)을 적용한다. **두 가지 모드**를 지원한다:

- **전체 모드 (full mode)**: `$ARGUMENTS`가 비어있거나 `--force`만 포함 → 전체 트리를 대상으로 공격
- **부분 모드 (section mode)**: `$ARGUMENTS`에 섹션명/번호 포함 (예: `02-solution`, `03-market`) → 해당 섹션만 집중 공격

## 사전 준비 (1회만 실행 — 이후 재로드 금지)

**모든 섹션 파일을 한 번만 로드하고 7단계 전체에서 메모리 값을 재사용한다.**

1. `planning/config.json` 로드
2. `00-thesis.md` 로드 → `thesis_answer`, `key_arguments` 추출
3. 모든 섹션 파일을 **한 번에** 로드 (숫자 순서대로)
   - `settled` 또는 `discussing` 상태 섹션만 대상
   - `draft`, `invalidated` 섹션은 건너뜀
   - 각 섹션에서 추출: `status`, `thesis_argument`, `scheme`, `claim`, `grounds`, `warrant`, `qualifier`, `rebuttal`
4. 현재 layer가 `"spec"`이면 기획 + 명세 전체를 대상으로 함
5. 로그 디렉터리 확인:
   ```bash
   mkdir -p logs
   ```

6. `logs/session.md` 저장:
   ```markdown
   ---
   command: challenge
   step: verification
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   challenge 시작 — 7단계 검증 진행 중
   ```

> **로드 원칙**: 이후 [1단계]~[7단계] 검증은 모두 위에서 추출한 메모리 값을 참조한다. 섹션 파일 재로드 금지.

---

## 모드 판정

`$ARGUMENTS`를 파싱하여 실행 모드를 결정한다.

### 전체 모드 (full mode)
- **조건**: `$ARGUMENTS`가 비어있거나 `--force`만 포함
- **대상**: 모든 `settled` / `discussing` 섹션
- **동작**: 7단계 전체를 모든 섹션에 적용 (기존 동작과 동일)

### 부분 모드 (section mode)
- **조건**: `$ARGUMENTS`에 섹션명/번호 포함 (예: `02-solution`, `03-market`)
- **대상 섹션 식별**: `$ARGUMENTS`에서 섹션 식별자를 추출하고 해당 섹션 파일 존재 여부를 확인
- **연결 섹션 식별**: 대상 섹션과 직접 연결된 섹션을 파악 (같은 key_argument를 공유하거나, thesis_argument가 상호 의존하는 섹션)
- **스테이지별 적용 범위**:

| 스테이지 | 적용 범위 | 이유 |
|----------|-----------|------|
| 0단계 사실 검증 | 대상 섹션만 | 사실 대조는 섹션 내부 완결 (단, cross-section은 연결 섹션까지) |
| 1단계 Thesis 정합성 | 대상 + 연결 섹션 | thesis 충분성은 다른 섹션과의 관계에서 판정 |
| 2단계 Scheme 유효성 | 대상 섹션만 | scheme CQ는 섹션 내부 완결 |
| 3단계 Warrant 유효성 | 대상 섹션만 | warrant 검증은 섹션 내부 완결 |
| 4단계 So What | 대상 + 연결 섹션 | claim→key argument 연결선은 상위 구조 참조 |
| 5단계 Why So | 대상 섹션만 | grounds→claim 충분성은 섹션 내부 완결 |
| 6단계 Qualifier 보정 | 대상 섹션만 | qualifier 균형은 섹션 내부 완결 |
| 7단계 MECE+Steelman | 대상 + 연결 섹션 | MECE 중복/누락은 다른 섹션과 비교 필요 |

- **출력**: 리포트 형식은 동일하되, 헤더에 `(부분: {섹션명})` 표기
- **로그 파일명**: `logs/challenge-{YYYYMMDD-HHMM}-{섹션명}.md`

> **부분 모드 제약**: 부분 모드는 빠른 피드백용이다. finalize 전 최종 검증은 반드시 전체 모드로 실행해야 한다.

---

## 검증 실행

스테이지 0-7을 순차적으로 실행한다. Stage 0은 사실 검증(research-agent 사용), Stage 1-7은 논리 검증(challenge-agent 사용).

> **판정 알고리즘**: 각 스테이지의 pass/fail 기준, severity 분류, 구체적 판정 로직은 `references/challenge-algorithm.md`에 정의되어 있다. agent 스폰 시 해당 스테이지의 algorithm 섹션을 함께 전달한다.

### 리서치 엔진 선택 (Stage 0 스폰 전)

Stage 0 에이전트 스폰 전에 리서치 엔진 선택 프롬프트를 표시한다.
UX는 `research.md`의 "리서치 엔진 선택" 섹션과 동일하다 (1단계: 엔진 3종, 2단계: Perplexity preset 또는 Gemini agent 확인).

선택 결과에 따라 Stage 0 프롬프트의 태그를 설정:
- `engine == "web"` → `<mode>fact-check</mode>` (WebSearch/WebFetch만 사용)
- `engine == "perplexity"` → `<mode>deep-research</mode>` + `<perplexity_result>{영수증 JSON}</perplexity_result>` + `<receipt_path>...</receipt_path>`
- `engine == "gemini"` → `<mode>deep-research</mode>` + `<gemini_result>{영수증 JSON}</gemini_result>` + `<receipt_path>...</receipt_path>`

호출 패턴·영수증 검증·응답 파싱의 세부는 `references/deep-research-adapters.md`에 위임한다.

> **시간 절약**: 엔진 선택은 Stage 0 스폰 전에만 1회 묻는다. Stage 1-7은 엔진 선택과 무관하므로 병렬 스폰에 영향 없다.

### 에이전트 스폰 패턴

**Stage 0 — 사실 검증 (sowhat-research-agent 사용)**

Stage 0은 외부 데이터 접근이 필요하므로 sowhat-research-agent를 사용한다.
**Deep Research 선택 시, 오케스트레이터가 선택된 엔진(Perplexity 또는 Gemini)의 API를 직접 호출하고 영수증 검증 게이트를 통과한 결과만 agent 프롬프트에 주입한다.** 호출 시퀀스는 `references/deep-research-adapters.md`의 해당 어댑터 명세를 그대로 따른다.

> **Silent fallback 금지**: 영수증 검증 게이트를 통과하지 못하면 deep-research mode로 절대 스폰하지 않는다. 사용자 명시적 동의 없이 Web Research로 다운그레이드되는 일은 없어야 한다.

```
# Stage 0: 각 섹션의 검증 가능한 주장을 추출하고 research-agent로 검증
FOR EACH section IN target_sections:
  claims = extract_verifiable_claims(section.grounds, section.backing)
  # 정량 데이터, 시점 주장, 사실 주장, 사례 인용 모두 추출

  IF claims.length > 0:

    # === Deep Research 선택 시: 어댑터 호출 + 영수증 검증 ===
    IF engine in ["perplexity", "gemini"]:
      ctx = "stage0-{section}"
      prompt = "다음 주장들을 검증해주세요. 각 주장에 대해 정확/부정확/부분정확을 판정하고, 출처 URL을 명시하세요.\n\n{claims 목록}"

      IF engine == "perplexity":
        receipt_path = "research/_receipts/perplexity-{ts}-{ctx}.json"
        # Adapter A.1 (preflight) → A.2 (본 호출, deep-research-adapters.md 참조)
        # 응답 전체를 receipt_path에 저장
        validation = validate_receipt_perplexity(receipt_path)  # A.3
        result_payload_tag = "<perplexity_result>{영수증 JSON}</perplexity_result>"

      IF engine == "gemini":
        create_receipt = "research/_receipts/gemini-{ts}-create-{ctx}.json"
        final_receipt = "research/_receipts/gemini-{ts}-final-{ctx}.json"
        # Adapter B.1 (preflight) → B.2 (create) → B.3 (폴링) → final_receipt 저장
        # 폴링 동안 진행 상황 표시: "🔬 Gemini Stage 0 진행 중... ({elapsed}s / {timeout}s)"
        validation = validate_receipt_gemini(final_receipt)  # B.4
        receipt_path = final_receipt
        result_payload_tag = "<gemini_result>{final_receipt JSON}</gemini_result>"

      IF validation.failed:
        # silent fallback 절대 금지. 사용자 명시적 동의 절차로 진입.
        prompt_user("""
          ❌ Deep Research 영수증 검증 실패 (Stage 0, section: {section})
            엔진: {engine}:{모델 또는 agent}
            사유: {validation.reason}
            영수증: {receipt_path}

          [1] Web Research로 fallback (이 섹션만, engine_for_section = "web")
          [2] 다른 Deep Research 엔진으로 재시도 (가용 시)
          [3] 이 섹션 Stage 0 skip (issue 기록 후 다음 섹션 진행)
          [4] 전체 challenge 중단
        """)
        IF user == 1: engine_for_section = "web"
        IF user == 2: 다른 엔진의 키 확인 후 어댑터 호출 재시도 (위 분기로 복귀)
        IF user == 3: stage_0_issues.append({section, status: "skipped-validation-failed", failed_engine: engine, failed_receipt: receipt_path}); continue
        IF user == 4: abort_challenge()

    # === agent 스폰 ===
    effective_engine = engine_for_section IF defined ELSE engine
    result_0_{section} = Task(sowhat-research-agent,
      prompt = """
      <mode>{effective_engine in ["perplexity","gemini"] ? "deep-research" : "fact-check"}</mode>
      <section>{section 전체 데이터}</section>
      <claims>{추출된 claims 목록 — 각 claim의 값, 출처 URL, 맥락}</claims>
      {result_payload_tag IF effective_engine in ["perplexity","gemini"]}
      {"<receipt_path>" + receipt_path + "</receipt_path>" IF effective_engine in ["perplexity","gemini"]}
      <instructions>
        {"Deep Research 결과를 기반으로 각 claim을 검증하고, 핵심 인용 2건을 WebFetch로 spot-check하라. 출력에 🔬 Engine / Tokens / Citations 메타데이터 헤더를 반드시 포함하라." IF effective_engine in ["perplexity","gemini"]}
        {"각 claim에 대해:" IF effective_engine == "web"}
        1. 출처가 있으면 → WebFetch로 출처 원문 확인, 수치/사실 대조
        2. 2차 출처(뉴스 등)이면 → 1차 출처(정부 통계, 공식 DB 등) 역추적 시도
        3. 출처가 없으면 → WebSearch로 독립 검색하여 사실 확인
        4. 사례(특정 거래/사건)이면 → 원본 데이터에서 거래 유형/맥락 확인

        각 claim에 대해 판정: [정확/부정확/부분정확/확인불가]
        부정확 시: 섹션 값 vs 출처 원문 값을 명시
        단위·방향(상한/하한, 증가/감소, 전년비/기준년비) 혼동 여부도 확인
      </instructions>
      """)

# Stage 0 결과 종합: Cross-Section 정합성 검증
cross_section_check:
  동일 데이터가 여러 섹션에서 다른 값으로 인용되었는지 확인
  불일치 발견 시 → 🔴 critical

accumulated_issues += stage_0_results
```

**Stage 1-7 — 논리 검증 (sowhat-challenge-agent 사용)**

```
FOR stage IN [1, 2, 3, 4, 5, 6, 7]:
  result_{stage} = Task(sowhat-challenge-agent,
    prompt = """
    <stage>{stage}: {stage_name}</stage>
    <algorithm>{challenge-algorithm.md의 해당 Stage 섹션 전문}</algorithm>
    <thesis>{thesis_answer, key_arguments}</thesis>
    <sections>{모든 섹션 데이터 (메모리 변수)}</sections>
    <stage_0_issues>{Stage 0에서 발견된 사실 오류 목록 — 논리 검증 시 참고}</stage_0_issues>
    """)

  # 중간 실패 처리: critical 이슈 발견 시에도 나머지 스테이지 계속 실행
  # (모든 문제를 한 번에 수집하여 보고)
  accumulated_issues += result_{stage}.issues
```

> **Stage 0 → Stage 1-7 연계**: Stage 0에서 사실 오류가 발견된 Grounds는 Stage 4(So What), Stage 5(Why So)에서 "오류 있는 근거"로 취급하여 더 엄격하게 검증한다.

### Stage 0 타임아웃 및 Fallback

Stage 0 research-agent가 응답하지 않는 경우의 방어 로직:

1. **병렬 실행**: Stage 0과 Stage 1-3을 동시에 스폰한다. Stage 1-3은 `stage_0_issues` 없이 먼저 완료 가능.
2. **Stuck 판정**: Stage 1-7 에이전트가 모두 완료되었는데 Stage 0만 미완료 → Stage 0을 `timeout`으로 처리.
3. **Fallback 처리**:
   - 리포트에 `⚠️ Stage 0 미완료 — 사실 검증 별도 실행 필요` 경고 포함
   - Stage 4-5는 `<stage_0_issues>unavailable — Stage 0 timed out</stage_0_issues>`로 진행
   - session.md에 `stage_0: timeout` 기록
4. **후속 안내**: challenge 완료 후 `다음 액션`에 `/sowhat:challenge --stage-0-only` 재실행 옵션 제시

> **원칙**: Stage 0 실패가 전체 challenge를 블로킹하지 않는다. 사실 검증은 중요하지만, 논리 검증과 독립적으로 재실행 가능하다.

### 부분 결과 보존

스테이지 실행 중 context reset이나 에러 발생 시:
- 완료된 스테이지 결과는 `logs/challenge-{datetime}-partial.md`에 즉시 저장
- 재개 시 완료된 스테이지는 건너뛰고 미완료 스테이지부터 계속
- session.md에 `step: stage-{N}` 으로 진행 상황 추적

## 검증 순서 (고정 — 순서 변경 불가)

### [0단계] Grounds 사실 검증 (Factual Verification)

Grounds/Backing에 포함된 수치·통계·사실 주장·사례가 실제와 일치하는지 검증한다.
**모든 논리 검증에 선행한다** — 사실이 틀리면 논리 구조는 의미가 없다.

검증 항목:
1. **수치·사실 대조**: 출처 원문과 섹션 값 비교 (정량 데이터, 정책 사실, 사건/사례)
2. **1차 출처 역추적**: 2차 출처(뉴스 등)에서 인용한 데이터의 원본 확인
3. **단위·방향 검증**: 상한/하한, 증가/감소, 전년비/기준년비 등 혼동 여부
4. **해석 정합성**: 원본 데이터가 섹션의 해석(추세 판단, 인과 서술)을 지지하는지
5. **사례 대표성**: 특정 거래/사건 인용 시 특수 거래(증여, 직거래 등) 여부
6. **Cross-Section 정합성**: 동일 데이터가 여러 섹션에서 일관되게 인용되는지

> **에이전트**: sowhat-research-agent (WebSearch/WebFetch 필요). challenge-algorithm.md Stage 0 참조.

---

### [1단계] Thesis 정합성

각 섹션의 thesis_argument가 thesis의 Answer를 **실제로** 지지하는지 검증한다.

검증 항목:
- 이 섹션의 Claim이 제거되면 thesis Answer가 흔들리는가? (필요성)
- settled + discussing 섹션들이 합쳐졌을 때 Answer를 **완전히** 커버하는가? (충분성)
- IBIS 관점: 어떤 Issue에 대한 Position인지 명확한가?
- 빠진 Key Argument가 있지 않은가?

---

### [2단계] Argument Scheme 유효성 (NEW)

각 섹션의 `scheme` 필드를 확인하고 해당 scheme의 Critical Questions를 적용한다.

**scheme이 없는 섹션**: scheme 미설정 → `⚠️ scheme 미설정 (공격 취약)`으로 기록하고 계속.

**scheme별 Critical Questions:**

| Scheme | Critical Questions |
|--------|-------------------|
| authority | 이 권위자가 이 도메인의 진짜 전문가인가? 관련 분야에 전문가 합의가 있는가? 이해충돌은 없는가? |
| analogy | 두 케이스가 이 논증에서 중요한 측면에서 충분히 유사한가? 차이점이 논증에 결정적인가? |
| cause-effect | 인과 메커니즘이 타당한가? 역인과(reverse causation) 가능성은? Confounding variable은? |
| statistics | 표본이 대표성 있는가? 방법론이 건전한가? 데이터가 현재 시점에 유효한가? |
| example | 대표적인 사례인가? 체리피킹이 아닌가? 일반화가 가능한가? |
| sign | 이 신호가 신뢰할 수 있는 지표인가? 동일한 신호를 설명하는 다른 해석은 없는가? |
| principle | 이 원칙이 이 상황에 적용되는가? 관련 예외 조건은 없는가? |
| consequence | 결과가 현실적인가? 의도치 않은 부작용은? 적용 시간대는 맞는가? |

scheme 미설정이거나 scheme의 Critical Questions에 취약점이 발견되면 공격 리포트에 포함.

---

### [3단계] Warrant 유효성 (NEW)

각 섹션의 Warrant를 검증한다. **이 단계가 논증 구조의 핵심 검증이다.**

검증 항목:
1. **Warrant 명시성**: Warrant 필드가 비어있거나 "Implicit"이면 → 약점 플래그
2. **연결 타당성**: Warrant가 Grounds → Claim을 실제로 연결하는가?
   - Non-sequitur: Grounds가 Claim을 도출하지 않음
   - Missing link: A에서 C로 점프, B 설명 없음
   - Circular: Warrant가 Claim을 그대로 반복
3. **Backing 지지**: Warrant가 Backing으로 강화되어 있는가? (없으면 취약으로 기록, 필수 아님)

일반적인 Warrant 실패 패턴:
- "큰 시장 → 우리 성공" (논증 누락: 우리가 그 시장을 잡는다는 연결 없음)
- "고통이 크다 → 우리 솔루션이 필요하다" (경쟁사도 같은 고통을 해결할 수 있음)
- "데이터가 있다 → Claim이 맞다" (데이터 해석 논리 없음)

---

### [4단계] So What

각 Grounds가 해당 Claim을 지지하는지 검증한다. Warrant를 경유하여 확인.

검증 항목:
- 이 Grounds + Warrant → Claim의 흐름이 자연스러운가?
- "So What?"에 답할 수 있는가? (Grounds가 있으면 Claim이 따라오는가)
- Claim이 상위 Key Argument를 지지하는가? (thesis까지 연결선 확인)

---

### [5단계] Why So

각 Claim이 충분하고 필요한 근거를 가지는지 검증한다.

검증 항목:
- **충분성**: Grounds가 Claim을 지지하기에 충분한가? (근거가 너무 약하거나 적지 않은가)
- **필요성**: 각 Ground를 제거했을 때 Claim이 약해지는가? (불필요한 근거는 없는가)
- **중복성**: 여러 Grounds가 동일한 내용을 반복하지 않는가?
- **비약**: Grounds에서 Claim으로의 논리적 비약이 있는가?

---

### [6단계] Qualifier 보정 (NEW)

각 섹션의 Qualifier와 근거 강도의 균형을 검증한다.

**Qualifier 서열 척도 (debate.md와 공유):**

| 단계 | Qualifier |
|------|-----------|
| 0 | `definitely` |
| 1 | `usually` |
| 2 | `in most cases` |
| 3 | `presumably` |
| 4 | `possibly` |

검증 기준:

| 상황 | 판정 |
|------|------|
| `definitely` + 근거 약함 (인터뷰 1-3건, 사례 1-2개) | Overclaiming — qualifier 하향 권장 |
| `definitely` + 반론 없음 | Overclaiming — `usually` 또는 `in most cases` 권장 |
| `possibly` + 강한 데이터 (대규모 연구, 강한 인과) | Underclaiming — 약한 포지션 |
| `presumably` + Backing 없음 | qualifier 수준과 근거 불균형 |
| `in most cases` + Backing 있음 | 균형 — 통과 |

---

### [7단계] MECE + Steelman

**MECE 검증:**
- Key Arguments 간 중복이 있는가? (같은 논거를 두 섹션이 다루는가)
- 빠진 논거가 있는가? (thesis Answer 달성에 필요한데 어떤 섹션도 다루지 않는 것)
- 섹션 간 Scope 충돌이 있는가? (같은 영역을 두 섹션이 In으로 주장하는가)

**Steelman 검증 (NEW):**
각 섹션에 대해 가장 강한 반론을 독립적으로 생성하고, 섹션의 Rebuttal이 이를 대응하는지 확인:
1. Claude가 scheme의 Critical Questions를 기반으로 해당 섹션에 대한 최강 반론을 직접 생성
2. 섹션의 `## Rebuttal` 필드 확인
3. Rebuttal이 비어있거나 생성된 반론을 대응하지 못하면 → 플래그

---

### [참고] 리서치 교차검증

`research/` 내 `status: accepted` 파인딩이 있으면, 발견된 갭과 교차검증:
- 리서치 파인딩이 동일한 갭을 식별했으면 함께 보고: `리서치 #{NNN}에서도 이 갭을 확인함: {요약}`
- 관련 없으면 건너뜀

### [참고] 근거 검증 리서치 (Sub-Agent 활용)

Stage 4 (So What) 또는 Stage 5 (Why So)에서 Grounds가 **주장만 있고 외부 증거가 없는** 섹션을 발견하면, Research-Agent를 스폰하여 근거를 검증한다.

#### 트리거 조건

```
FOR EACH section WITH issue in Stage 4 or Stage 5:
  IF grounds_contain_only_assertions(section):
    # Grounds가 "~이다", "~것으로 보인다" 등 주장만 포함하고
    # URL, 수치, 출처 인용이 없으면 → 리서치 트리거
    research_result = Task(sowhat-research-agent,
      prompt = """
      <section>{section}</section>
      <search_focus>
        다음 주장의 외부 증거를 탐색:
        {assertion_list}
      </search_focus>
      """)
```

#### 결과 반영

- 지지 증거 발견 → severity 유지 또는 하향 (major → minor)
- 반증 발견 → severity 상향 (major → critical) + 반증 내용을 리포트에 포함
- 증거 없음 → severity 유지, "외부 증거 미발견" 기록

> **원칙**: 리서치는 공격을 강화하기 위한 것이지 방어하기 위한 것이 아니다. 반증이 발견되면 반드시 보고한다.

---

## 공격 리포트 출력

**상세 리포트는 파일로 저장하고, 응답에는 요약만 출력한다.**

### 1. 파일 저장

```bash
date -u +"%Y%m%d-%H%M"
```

전체 상세 리포트를 `logs/challenge-{YYYYMMDD-HHMM}.md`에 저장:

> **이슈 ID 형식**: `{섹션번호}.{필드약어}.{severity}{순번}`
> - 섹션번호: `02`, `03` 등
> - 필드약어: `G`(Grounds), `W`(Warrant), `C`(Claim), `Q`(Qualifier), `R`(Rebuttal), `B`(Backing), `T`(Thesis정합성), `S`(Scheme), `M`(MECE)
> - severity+순번: `c1`(critical 1번), `m1`(major 1번), `n1`(minor 1번)
> - 예: `02.G.c1` = 02섹션 Grounds의 critical 1번, `03.W.m2` = 03섹션 Warrant의 major 2번

```markdown
# Challenge Report — {datetime}

## 사실 오류 (Stage 0)
[{섹션번호}.G.c1] 수치 오류 — "{섹션 값}" 원문 불일치
  섹션 값: "{섹션에 쓰인 수치}"
  출처 원문: "{실제 출처 원문 수치}"
  1차 출처: {primary source 명}
  판정: 🔴 critical

## Scheme 문제 (Stage 2)
[02.S.m1] cause-effect CQ 미충족 — 부작용 미검토
  문제: ...
  Critical Question: ...
  영향: ...

## Warrant 문제 (Stage 3)
...

## Qualifier 문제 (Stage 6)
...

## Steelman 미대응 (Stage 7)
...

## 통과
...
```

### 2. 응답 출력 (요약만)

응답에는 Stage 0 엔진 메타데이터 헤더를 **반드시** 포함한다 (사용자가 사실 검증이 어떤 엔진으로 실행되었는지 섹션별로 검증 가능해야 함):

문제가 있을 때:
```
🔬 Stage 0 Engine 분포:
   - perplexity:{모델}: {N}개 섹션 (Tokens: {합계})
   - gemini:{agent}: {N}개 섹션 (Tokens: {합계})
   - web: {N}개 섹션
   영수증: research/_receipts/
   {fallback이 발생한 섹션이 있으면} ⚠️ Web Research fallback (사용자 동의): {섹션 목록 + 실패 사유}
   {validation skip된 섹션이 있으면} ⚠️ Stage 0 skipped: {섹션 목록 + 실패 영수증}

🔴 Challenge — {N}건 발견 (상세: logs/challenge-{datetime}.md)

  [Factual]   {N}건 — {섹션 목록 한 줄}
  [Scheme]    {N}건 — {섹션 목록 한 줄}
  [Warrant]   {N}건 — {섹션 목록 한 줄}
  [Qualifier] {N}건 — {섹션 목록 한 줄}
  [Steelman]  {N}건 — {섹션 목록 한 줄}
  [So What]   {N}건 — {섹션 목록 한 줄}
  [Why So]    {N}건 — {섹션 목록 한 줄}
  [MECE]      {N}건

가장 심각한 문제:
  [{이슈ID}] {한 줄 설명}
  [{이슈ID}] {한 줄 설명}
  [{이슈ID}] {한 줄 설명}
```

문제가 없을 때:
```
🔬 Stage 0 Engine 분포:
   - perplexity:{모델}: {N}개 섹션 (Tokens: {합계})
   - gemini:{agent}: {N}개 섹션 (Tokens: {합계})
   - web: {N}개 섹션
   영수증: research/_receipts/

✅ Challenge 통과 — 7단계 모두 통과
  논증 강도: [████████░░] {N}%
```

> **응답 원칙**: 섹션별 상세 내용은 로그 파일에만 저장한다. 응답에 각 공격의 전문을 출력하지 않는다.
> **메타데이터 원칙**: 엔진 헤더는 절대 생략하지 않는다. 사용자가 silent fallback 여부를 즉시 확인할 수 있어야 한다.

---

## 인간 응답 처리

각 공격에 대해 인간이 응답한다.

### 반박하는 경우 (Pragma-Dialectics: defense move)

인간의 반박이 **논리적으로 타당한지** Claude가 재검증한다.

반박 수용 조건 (둘 다 충족해야 수용):
1. 반박이 공격이 지적한 Pragma-Dialectics 규칙 위반을 명시적으로 복원하는가?
   - 반박은 "Rule {N} — {위반 내용}을 다음 근거로 복원한다: {근거}" 형식으로 제시해야 함
   - 규칙 명시 없이 일반적 반론만 하는 경우 → 수용 불가
2. 반박이 새로운 Grounds 또는 Warrant를 제시하는가?
   - Claim 재주장, 단순 부정, 주제 전환 → 수용 불가

판정 결과:
- **수용** → 두 조건 모두 충족 시 해당 공격 **철회**, 리포트에서 제거
- **부분 수용** → 조건 1만 충족 (규칙 복원은 했으나 새 근거 없음) → 공격 약화, 남은 약점 재명시
- **거부** → 조건 미충족 → **재공격** (구체적 이유와 함께, 이전 공격보다 더 구체적으로)

**인간의 반박을 무조건 수용하지 않는다.** 품질이 최우선이다.

### 수용하는 경우 (Pragma-Dialectics: concession move)

역전파 전 반드시 확인한다:

```
⚠️  역전파 확인

  수정 대상: {섹션}
  영향받는 섹션: {하위 의존 섹션 목록}

  [1] 역전파 실행 (위 섹션들 needs-revision으로 강등)
  [2] 해당 섹션만 수정 (역전파 생략)
  [3] 취소
```

[1] 선택 시에만 역전파를 실행한다:

1. 해당 섹션 `status: needs-revision`
2. 하위 의존 섹션 (thesis_argument가 같은 섹션들 중 이 섹션에 의존하는 것) `status: needs-revision`
   - `invalidated`는 사용하지 않는다 — 재전개 여부는 사용자가 결정
3. GitHub Issue reopen + label 변경:
   ```bash
   gh issue reopen {issue_number}
   gh issue edit {issue_number} --add-label "needs-revision" --remove-label "settled"
   ```
4. `config.json` 업데이트
5. `00-thesis.md` Key Arguments 체크박스 해제 (해당되면)
6. Git commit:
   ```bash
   git add -A
   git commit -m "challenge: invalidate({sections}) - {이유 한 줄}"
   ```
7. `logs/argument-log.md` 업데이트:
   ```markdown
   ## [{datetime}] challenge
     Invalidated: {sections}
     Reason: {공격 유형 - 구체적 이유}
     Affected: {역전파된 섹션 목록}
   ```

---

## 섹션 frontmatter 업데이트 (cycle 6 신설 — AU12/AU16 해소)

challenge Stage 0-7 전체 통과 후 (또는 Stage 0만 부분 통과 후), 검증된 모든 섹션의 frontmatter를 업데이트한다. 이 step은 L4 게이트(draft.md / finalize.md)가 `last_challenged_at`과 `unverified_items` 상태를 정확히 판정할 수 있게 한다.

**절차**:

1. **검증 완료 섹션 식별**: 전체 모드면 `settled`/`discussing` 모든 섹션, 부분 모드면 대상 섹션만
2. **각 섹션 frontmatter 업데이트** (`references/config-schema.md` §섹션 파일 frontmatter 스키마 참조):

   ```yaml
   last_challenged_at: {current_datetime_ISO8601}   # Stage 0 통과 시각
   ```

3. **unverified_items 업데이트 로직**:
   - Stage 0에서 **해소된 항목** (사용자 수정 또는 outcome이 "철회"): 해당 엔트리 제거
   - Stage 0에서 **새로 발견된 사실 오류** (출처 미실존, 값 불일치): 기존 `unverified_items`에 append (또는 `detected_by` 배열에 `"L3-stage0"` 추가)
   - 중복 감지: 같은 `(field, bullet_index)`면 새 엔트리 대신 기존 엔트리의 `detected_by` 배열에 `"L3-stage0"` 추가

4. **인간 수용 시 (concession move)**: 공격이 수용되면 해당 섹션은 `needs-revision`으로 강등되고 `last_challenged_at`은 유지 (재수정 후 재challenge 필요). 수정 시 `updated` 갱신 → `last_challenged_at < updated` 상태가 되어 L4가 재검증 감지.

5. **Git commit**:
   ```bash
   git add {수정된 섹션 파일들}
   git commit -m "challenge: update last_challenged_at + unverified_items for {N} sections"
   ```

> **왜 필요한가**: cycle 5에서 L4 draft 게이트가 `last_challenged_at` 비교를 spec으로 선언했으나 이 필드를 **기록하는 로직이 어디에도 없어** 실질 미작동이었다. cycle 6에서 challenge가 이 책임을 담당.

---

## logs/session.md 업데이트 (완료 시)

```markdown
---
command: challenge
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
challenge 완료 — 7단계 검증 종료. 역전파: {있음/없음}. 상세 리포트: logs/challenge-{datetime}.md

## 재개 시 첫 질문
/sowhat:expand {역전파된 섹션} → 역전파 섹션 재전개
```

---

## 완료 안내

모든 공격이 처리되면:

이슈 발견 시:
```
🔴 {N}건 발견

  [Factual]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Scheme]    {N}건 발견 / {M}건 철회 / {K}건 수용
  [Warrant]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Qualifier] {N}건 발견 / {M}건 철회 / {K}건 수용
  [Steelman]  {N}건 발견 / {M}건 철회 / {K}건 수용

  역전파: {영향받은 섹션 목록}

----------------------------------------
다음 액션:

[1] {section} 수정 (/sowhat:revise {section})
[2] {section} 재전개 (/sowhat:expand {section})


----------------------------------------
```

이슈 없이 통과 시:
```
✅ Challenge 통과

  [Factual]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Scheme]    {N}건 발견 / {M}건 철회 / {K}건 수용
  [Warrant]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Qualifier] {N}건 발견 / {M}건 철회 / {K}건 수용
  [Steelman]  {N}건 발견 / {M}건 철회 / {K}건 수용

  모든 섹션 검증 완료

----------------------------------------
다음 액션:

[1] 기획 확정 (/sowhat:finalize-planning)
[2] 추가 논증 강화 (/sowhat:debate {section})


----------------------------------------
```

---

## Decision ID 추적 (Challenge)

challenge 공격 리포트에서 관련 Decision ID를 명시하여 "어떤 결정이 취약점의 원인인가"를 추적한다.

### 동작

1. 공격 대상 섹션의 `## Decision Log`를 참조
2. 해당 공격이 지적하는 필드(Warrant, Qualifier 등)와 관련된 Decision ID를 식별
3. 공격 리포트에 Decision ID를 포함:

```markdown
## Warrant 문제 (Stage 3)
[02.W.c1] Non-sequitur — Grounds→Claim 연결 논리 부재 (Decision D-02-005)
  문제: Grounds→Claim 연결 논리 부재
  Decision context: "사용자가 Implicit Warrant 선택 (expand Step 5)"
  권장: Warrant를 명시적으로 작성
```

4. 인간이 반박/수용 결정 시에도 새 Decision ID를 부여:
   - `D-{section}-{seq}` (기존 시퀀스에서 이어서)
   - challenge 리포트 파일의 각 결정에 기록

---

## 핵심 원칙

- **섹션 파일 1회 로드** — 사전 준비에서 한 번만 로드, 7단계 내내 메모리 값 재사용
- **리포트는 파일에, 요약만 응답에** — 응답에 각 공격의 전문을 출력하지 않는다
- **전체 모드 / 부분 모드** — 섹션 미지정 시 전체 트리 공격, 섹션 지정 시 해당 섹션 집중 공격 (finalize 전에는 반드시 전체 모드)
- **검증 순서 고정** — Factual → Thesis → Scheme → Warrant → So What → Why So → Qualifier → MECE+Steelman
- **사실이 논리보다 선행** — Stage 0 사실 검증을 통과해야 Stage 1-7 논리 검증이 의미 있음
- **인간의 반박을 무조건 수용하지 않는다** — 논리적 타당성 재검증
- **Warrant 공격 최우선** — Implicit Warrant는 모든 논증의 가장 큰 취약점
- **scheme 기반 공격** — 일반적 논리 오류보다 scheme 특정 취약점이 더 날카롭다
- **Steelman은 독립 생성** — 섹션의 Rebuttal을 먼저 보지 말고 반론 먼저 생성
- **품질 우선** — 타협하지 않는다
- **역전파는 즉시 실행** — 수용 시 하위 전체에 영향
- **Decision ID 추적** — 공격이 어떤 결정에서 비롯되었는지 명시하여 근본 원인 식별
