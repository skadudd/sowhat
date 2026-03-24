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

이 커맨드는 문서 트리를 7단계 논리 검증으로 공격한다. Toulmin Model, Walton Argument Schemes, Pragma-Dialectics를 모두 적용한다. **두 가지 모드**를 지원한다:

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

각 스테이지는 sowhat-challenge-agent를 Task로 스폰하여 실행한다.
스테이지 1-7을 순차적으로 실행한다 (각 스테이지 결과가 다음 스테이지 컨텍스트에 영향을 미치므로 순차 실행).

> **판정 알고리즘**: 각 스테이지의 pass/fail 기준, severity 분류, 구체적 판정 로직은 `references/challenge-algorithm.md`에 정의되어 있다. agent 스폰 시 해당 스테이지의 algorithm 섹션을 함께 전달한다.

### 에이전트 스폰 패턴

```
FOR stage IN [1, 2, 3, 4, 5, 6, 7]:
  result_{stage} = Task(sowhat-challenge-agent,
    prompt = """
    <stage>{stage}: {stage_name}</stage>
    <algorithm>{challenge-algorithm.md의 해당 Stage 섹션 전문}</algorithm>
    <thesis>{thesis_answer, key_arguments}</thesis>
    <sections>{모든 섹션 데이터 (메모리 변수)}</sections>
    """)

  # 중간 실패 처리: critical 이슈 발견 시에도 나머지 스테이지 계속 실행
  # (모든 문제를 한 번에 수집하여 보고)
  accumulated_issues += result_{stage}.issues
```

### 부분 결과 보존

스테이지 실행 중 context reset이나 에러 발생 시:
- 완료된 스테이지 결과는 `logs/challenge-{datetime}-partial.md`에 즉시 저장
- 재개 시 완료된 스테이지는 건너뛰고 미완료 스테이지부터 계속
- session.md에 `step: stage-{N}` 으로 진행 상황 추적

## 검증 순서 (고정 — 순서 변경 불가)

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

```markdown
# Challenge Report — {datetime}

## Scheme 문제
[1] cause-effect 논증 취약 (02-market)
  문제: ...
  Critical Question: ...
  영향: ...

## Warrant 문제
...

## Qualifier 문제
...

## Steelman 미대응
...

## 통과
...
```

### 2. 응답 출력 (요약만)

문제가 있을 때:
```
🔴 Challenge — {N}건 발견 (상세: logs/challenge-{datetime}.md)

  [Scheme]    {N}건 — {섹션 목록 한 줄}
  [Warrant]   {N}건 — {섹션 목록 한 줄}
  [Qualifier] {N}건 — {섹션 목록 한 줄}
  [Steelman]  {N}건 — {섹션 목록 한 줄}
  [So What]   {N}건 — {섹션 목록 한 줄}
  [Why So]    {N}건 — {섹션 목록 한 줄}
  [MECE]      {N}건

가장 심각한 문제:
  [1] {유형} ({섹션}): {한 줄 설명}
  [2] {유형} ({섹션}): {한 줄 설명}
  [3] {유형} ({섹션}): {한 줄 설명}
```

문제가 없을 때:
```
✅ Challenge 통과 — 7단계 모두 통과
  논증 강도: [████████░░] {N}%
```

> **응답 원칙**: 섹션별 상세 내용은 로그 파일에만 저장한다. 응답에 각 공격의 전문을 출력하지 않는다.

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

  [Scheme]    {N}건 발견 / {M}건 철회 / {K}건 수용
  [Warrant]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Qualifier] {N}건 발견 / {M}건 철회 / {K}건 수용
  [Steelman]  {N}건 발견 / {M}건 철회 / {K}건 수용

  역전파: {영향받은 섹션 목록}

---

## 🔴 {N}건 발견

[1] {section} — {issue summary}
[2] {section} — {issue summary}

`/sowhat:revise {section}` 또는 `/sowhat:expand {section}`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---
```

이슈 없이 통과 시:
```
✅ Challenge 통과

  [Scheme]    {N}건 발견 / {M}건 철회 / {K}건 수용
  [Warrant]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Qualifier] {N}건 발견 / {M}건 철회 / {K}건 수용
  [Steelman]  {N}건 발견 / {M}건 철회 / {K}건 수용

  모든 섹션 검증 완료

---

## ✅ Challenge 통과

모든 섹션 검증 완료

`/sowhat:finalize-planning`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---

**또한 가능:**
- `/sowhat:debate {section}` — 추가 논증 강화

---
```

---

## 핵심 원칙

- **섹션 파일 1회 로드** — 사전 준비에서 한 번만 로드, 7단계 내내 메모리 값 재사용
- **리포트는 파일에, 요약만 응답에** — 응답에 각 공격의 전문을 출력하지 않는다
- **전체 모드 / 부분 모드** — 섹션 미지정 시 전체 트리 공격, 섹션 지정 시 해당 섹션 집중 공격 (finalize 전에는 반드시 전체 모드)
- **검증 순서 고정** — Thesis → Scheme → Warrant → So What → Why So → Qualifier → MECE+Steelman
- **인간의 반박을 무조건 수용하지 않는다** — 논리적 타당성 재검증
- **Warrant 공격 최우선** — Implicit Warrant는 모든 논증의 가장 큰 취약점
- **scheme 기반 공격** — 일반적 논리 오류보다 scheme 특정 취약점이 더 날카롭다
- **Steelman은 독립 생성** — 섹션의 Rebuttal을 먼저 보지 말고 반론 먼저 생성
- **품질 우선** — 타협하지 않는다
- **역전파는 즉시 실행** — 수용 시 하위 전체에 영향
