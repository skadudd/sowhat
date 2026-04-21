# /sowhat:autonomous — 자율 파이프라인

<!--
@metadata
checkpoints:
  - type: decision
    when: "Thesis 방향 변경 필요 시"
  - type: decision
    when: "Critical issue 발견 시"
  - type: decision
    when: "Claim 완전 뒤집힘 (debate broken)"
  - type: decision
    when: "3회 연속 settle 실패"
config_reads: [layer, sections, research, features, credibility]
config_writes: [sections, research]
continuation:
  primary: "/sowhat:challenge (자동 실행)"
  alternatives: ["/sowhat:draft"]
status_transitions: ["draft → discussing → settled (자동 순환)"]
-->

이 커맨드는 모든 미완성 섹션을 자동으로 전개·검증·확정한다. GSD의 `/gsd:autonomous`와 같은 역할이지만, 논증(argumentation) 구조에 특화되어 있다. `$ARGUMENTS`에 옵션이 전달된다.

## 인자 파싱

```
/sowhat:autonomous [--skip-debate] [--max-rounds N]
```

| 인자 | 의미 |
|------|------|
| `--skip-debate` | mini-debate 단계 생략 (expand + settle만 실행) |
| `--max-rounds N` | strength-check 실패 시 추가 debate 최대 라운드 수 (기본값: 2) |

---

## 사전 검증 (1회만 실행 — 이후 재로드 금지)

**세션 시작 시 아래 파일들을 한 번만 로드하고 파이프라인 전체에서 메모리 값을 재사용한다.**

1. `planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"finalized"`이면: `❌ 이미 완료된 프로젝트입니다.`
2. `00-thesis.md` 로드 → `thesis_answer`, `key_arguments` 추출
   - thesis가 `settled` 상태가 아니면: `❌ thesis가 settled 상태가 아닙니다. /sowhat:settle thesis 먼저 실행하세요.`
3. 모든 섹션 파일을 **한 번에** 로드 (숫자 순서대로)
   - 각 섹션에서 추출: `status`, `thesis_argument`, `scheme`, `claim`, `grounds`, `warrant`, `backing`, `qualifier`, `rebuttal`
4. 대상 섹션 필터링:
   - `draft`, `needs-revision`, `discussing` 상태 섹션만 대상
   - `settled`, `invalidated` 섹션은 건너뜀
   - 대상 섹션이 0개이면: `✅ 모든 섹션이 이미 settled 상태입니다.`
5. 로그 디렉터리 확인:
   ```bash
   mkdir -p logs
   ```
6. `logs/session.md` 저장:
   ```markdown
   ---
   command: autonomous
   step: pipeline-start
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   autonomous 시작 — {N}개 섹션 자동 전개 예정

   ## 재개 시 첫 질문
   /sowhat:autonomous 재실행 — 중단된 섹션부터 계속
   ```

> **로드 원칙**: 파이프라인 실행 중 섹션 파일 재로드는 **각 섹션의 expand/settle 완료 후 결과 확인 시에만** 허용한다.

---

## 진행 대시보드

**모든 섹션 처리 시작 전과 각 섹션 완료 후 다음 대시보드를 출력한다.**

```
----------------------------------------
Autonomous Mode
[██████░░░░] 6/10 섹션

✅ 01-problem    settled  (82/100)
✅ 02-solution   settled  (71/100)
🔄 03-market     expanding... (Step 4/9 Grounds)
⬜ 04-actors     대기 중

경과: 12분 | 예상 잔여: 8분
----------------------------------------
```

대시보드 구성:
- 진행률 바: `[████░░░░░░] {완료}/{전체} 섹션`
- 각 섹션 상태: `✅` settled / `🔄` 진행 중 / `❌` 실패 / `⬜` 대기 중
- settled 섹션은 강도 점수 표시 (`references/strength-scoring.md` 기준)
- 경과 시간 및 예상 잔여 시간

---

## 자율 파이프라인 (메인 루프)

```
target_sections = [draft, needs-revision, discussing 상태 섹션] (번호 순서대로)

FOR EACH section IN target_sections:
  dashboard_update(section, "expanding...")

  > Step 1: expand(section)
  > Step 2: mini-debate(section)
  > Step 3: settle-attempt(section)
  > Step 4: strength-check(section)

  IF human_checkpoint_triggered:
    PAUSE → 사용자 개입 대기

  dashboard_update(section, result)
```

---

### Step 1: expand(section) — AI 자동 Toulmin 전개

expand 워크플로우(`workflows/expand.md`)의 9단계를 **AI가 자동으로** 실행한다. 인간 핑퐁 없이 AI가 모든 필드를 채운다.

```
Task(sowhat-expand-agent,
  prompt = """
  <mode>autonomous — 인간 핑퐁 없이 AI가 모든 결정을 내린다</mode>
  <thesis>{thesis_answer, key_arguments}</thesis>
  <section>{섹션 전체 데이터}</section>
  <instructions>
    Toulmin 9단계를 순서대로 자동 전개:
    1. Stasis: thesis context 기반으로 자동 선택
    2. Scheme: claim 유형에 가장 적합한 scheme 자동 선택
    3. Claim: thesis_argument에서 도출
    4. Grounds: research/ findings만 사용. 부족하면 Research-Agent 스폰 필수. AI 자체 수치 생성 절대 금지.
    5. Warrant: Grounds → Claim 연결 논리 명시. 수치/통계 포함 금지 — 논리적 원칙만 기술.
    6. Backing: research findings 또는 Research-Agent 결과만 사용. AI 자체 수치 생성 절대 금지.
    7. Qualifier: 근거 강도에 맞는 수준 설정
    8. Rebuttal: 가장 강한 반론과 대응 구성
    9. Scope: In/Out 경계 명시

    각 필드를 섹션 파일에 직접 작성.
    모든 필드 작성 후 status → discussing으로 변경.
  </instructions>
  """)
```

**자동 전개 원칙:**
- Stasis/Scheme: thesis_argument의 성격에 따라 AI가 자동 선택 (사실 주장 → statistics/cause-effect, 가치 주장 → principle/consequence 등)
- Claim: thesis_argument를 검증 가능한 명제로 변환
- **Grounds: `research/` 디렉터리의 기존 findings만 사용. findings가 부족하면 Research-Agent를 스폰하여 외부 검색 후 사용. AI가 수치·통계·출처를 자체 생성하는 것은 절대 금지.**
- **Warrant: Grounds → Claim 연결 논리를 작성하되, 수치·통계를 포함하지 않는다. Warrant는 "왜 이 근거가 이 주장을 지지하는가"의 논리적 원칙만 기술한다.**
- **Backing: Warrant를 지지하는 추가 근거. Grounds와 마찬가지로 research findings 또는 Research-Agent 결과만 사용. AI 자체 생성 수치 금지.**
- Qualifier: 근거 강도에 맞게 `definitely` ~ `possibly` 중 선택
- Rebuttal: AI가 독립적으로 최강 반론을 생성하고 대응

**수치·출처 할루시네이션 방지 (CRITICAL):**

> 이 규칙은 `references/fabrication-prevention.md`의 중앙 정의를 따른다. autonomous 모드는 인간 개입이 없기 때문에 가장 엄격한 적용 구간이다.

autonomous 모드에서 AI가 Toulmin 필드를 자동 전개할 때, **구체적 수치(%, 배수, 금액, 건수)와 출처(기관명, 보고서명, 연도)**를 AI가 자체 생성하면 할루시네이션이 발생한다. 반드시 다음 규칙을 따른다:

```
허용:
  - research/ 디렉터리에 이미 있는 findings의 수치·출처 인용
  - Research-Agent가 WebSearch/WebFetch로 확인한 수치·출처
  - 사용자가 직접 입력한 데이터

금지:
  - AI가 기억/추론으로 생성한 수치 (예: "시장 규모 3.2조원")
  - AI가 기억으로 구성한 출처 (예: "McKinsey 2024 보고서에 따르면")
  - 존재 여부가 불확실한 통계 (예: "HubSpot에 따르면 3.5배 증가")
```

Grounds/Backing에 수치가 필요한데 research findings가 없으면:
1. **Research-Agent를 스폰**하여 외부 검색 실행
2. 검색 결과에서 확인된 수치만 사용
3. 검색으로도 확인 불가 시: **수치 없이 정성적으로 기술** + Qualifier를 `presumably` 이하로 설정

### L0 AI-엄격 실행 조건 (cycle 5 신설 — AU4 해소)

autonomous 모드는 인간 개입 없이 AI가 Toulmin 필드를 자동 생성하므로 L0가 가장 엄격하게 작동해야 한다. 각 필드 생성 시 IF-ELSE 조건:

```
FOR EACH field IN [Grounds, Backing, Warrant, Rebuttal]:
  retrieval_available = (매핑된 research/#NNN 파인딩 존재)

  IF retrieval_available:
    필드 내용: finding 원문 인용 + #NNN 참조 명시

  ELSE:
    1차 시도: Research-Agent 자동 스폰 (위 3단계)
    
    IF Research-Agent 결과 수치/출처 발견:
      필드 내용: 발견된 값 인용 + 생성된 #NNN 참조
    
    ELSE:
      필드 내용: 정성 기술만 (수치·기관명·연도 조합 금지)
      Qualifier: "presumably" 이하로 자동 하향
      메타: unverified: true (L4가 추적)
      
      **이 상태로 settle은 가능하지만 draft/finalize에서 L4 게이트가 차단**
```

autonomous는 배치로 여러 섹션을 처리하므로, 위 로직을 섹션마다 개별 적용. 전체 완료 후 unverified 항목 요약을 사용자에게 보고.

---

### Step 2: mini-debate(section) — 1라운드 Con/Pro

`--skip-debate` 옵션이 있으면 이 단계를 건너뛴다.

debate 워크플로우(`workflows/debate.md`)의 축소 버전을 실행한다. **1라운드만** 실행.

```
Task(sowhat-debate-agent,
  prompt = """
  <mode>mini-debate — 1라운드만 실행</mode>
  <section>{expand 완료된 섹션 데이터}</section>
  <instructions>
    1. Con-Agent: 가장 약한 점 1개를 식별하고 공격
       - Scheme의 Critical Questions 기반
       - Warrant 연결 논리 공격 우선
    2. Pro-Agent: 방어
       - 새로운 Grounds 추가 또는 Warrant 보강
    3. 결과 반영:
       - 방어 성공 → Grounds 또는 Warrant에 보강 내용 추가
       - 방어 실패 → Qualifier 1단계 하향 조정
       - Claim 위협 → rebuttal에 기록

    섹션 파일 업데이트 후 종료.
  </instructions>
  """)
```

---

### Step 3: settle-attempt(section) — 자동 settle 시도

settle 워크플로우(`workflows/settle.md`)의 자동 검증을 실행한다.

```
settle_result = Task(sowhat-settle-agent,
  prompt = """
  <mode>autonomous — 인간 승인 없이 자동 검증</mode>
  <section>{debate 완료된 섹션 데이터}</section>
  <instructions>
    settle 자동 검증 항목을 모두 확인:
    1. thesis_argument 필드 존재
    2. Claim ↔ thesis Answer 정합성
    3. Grounds 최소 1개 존재
    4. Warrant 존재 및 품질
    5. Qualifier 설정 여부
    6. Rebuttal 처리 여부
    7. Open Questions 없음
    8. scheme 필드 설정
    + scheme별 추가 검증
    9. **Stub detection + 할루시네이션 탐지** —
       a) Stub: Grounds에 구체적 출처/수치 없이 일반론만 있는지, Warrant가 Claim 동어반복인지, Rebuttal이 generic한지.
       b) 할루시네이션: Grounds/Backing의 수치·출처가 research/ findings에 존재하는지 대조. research/에 없는 수치·출처가 발견되면 검증 실패.
       autonomous 모드에서 AI가 자동 전개하면 stub과 할루시네이션이 생기기 쉬움.
       발견 시 검증 실패로 처리.
    10. **Cross-section regression** — 이 섹션 settle이 기존 settled 섹션과
        논리적으로 충돌하지 않는지 확인. 충돌 시 검증 실패로 처리.

    모든 검증 통과 → status: settled, 결과 반환
    검증 실패 → 실패 이유 목록 반환
  </instructions>
  """)

IF settle_result.passed:
  section.status = "settled"
  강도 점수 계산 (references/strength-scoring.md 기준)
ELSE:
  settle_failures[section] += 1
  실패 이유 기록
  IF settle_failures[section] >= 3:
    TRIGGER human_checkpoint("3회 연속 settle 실패")
```

---

### Step 4: strength-check(section) — 강도 점수 확인

settle 성공한 섹션에 대해 강도 점수를 확인한다 (`references/strength-scoring.md` 기준).

```
score = calculate_strength(section)

IF score < 60:
  # 추가 debate 라운드 실행 (최대 --max-rounds, 기본 2)
  FOR round IN range(max_rounds):
    Task(sowhat-debate-agent,
      prompt = "1라운드 debate — 점수 {score}/100, 60 이상 목표")

    # debate 후 re-settle
    re_settle_result = settle_attempt(section)
    IF re_settle_result.passed:
      new_score = calculate_strength(section)
      IF new_score >= 60:
        BREAK

  # max_rounds 소진 후에도 60 미만이면
  IF score < 60:
    ⚠️ 기록: "{section} — 강도 {score}/100, 추가 보강 권장"
    # 파이프라인은 계속 진행 (blocking하지 않음)

ELSE:
  ✅ 통과 → 다음 섹션으로
```

---

## Human Checkpoints (자율 모드에서도 멈추는 지점)

autonomous 모드에서도 다음 상황에서는 **반드시 일시정지**하고 사용자 개입을 요청한다 (`references/checkpoints.md` 참조):

| 트리거 | 상황 | 메시지 |
|--------|------|--------|
| **Thesis 방향 변경** | expand 중 thesis_argument가 thesis Answer와 정합하지 않음 발견 | `⚠️ CHECKPOINT: thesis 방향 변경이 필요합니다. 계속하시겠습니까?` |
| **Critical issue** | challenge 단계에서 severity: critical 이슈 발견 | `⚠️ CHECKPOINT: critical 이슈 발견 — {이슈 설명}` |
| **Claim broken** | mini-debate에서 Claim이 완전히 뒤집어짐 | `⚠️ CHECKPOINT: {section}의 Claim이 debate에서 무너졌습니다.` |
| **3회 연속 settle 실패** | 같은 섹션이 3번 연속 settle 검증 실패 | `⚠️ CHECKPOINT: {section}이 3회 연속 settle 실패 — 수동 개입 필요` |

### Checkpoint 발동 시 행동

```
⚠️  CHECKPOINT: {트리거 유형}

  섹션: {section}
  이유: {구체적 이유}
  현재 진행: {N}/{total} 섹션 완료

  [1] 계속 — 현재 상태 유지, 다음 섹션으로
  [2] 수정 후 계속 — 사용자가 수정, 이후 재개
  [3] 중단 — 파이프라인 종료, 진행 상황 저장
```

사용자 응답을 받은 후에만 파이프라인을 재개한다.

---

## 종료 조건

파이프라인은 다음 조건 중 하나에서 종료된다:

| 조건 | 종료 유형 | 후속 동작 |
|------|-----------|-----------|
| 모든 섹션 settled | 정상 완료 | Post-Autonomous 실행 |
| Human checkpoint 발동 + 사용자 "중단" 선택 | 사용자 중단 | 진행 상황 저장 |
| 3회 연속 settle 실패 + 사용자 "중단" 선택 | 실패 중단 | 실패 이유 리포트 |
| `Ctrl+C` 또는 사용자 인터럽트 | 강제 중단 | 진행 상황 저장 |

---

## Post-Autonomous (정상 완료 시)

모든 섹션이 settled되면 자동으로 다음을 실행한다:

### 1. 전체 트리 Challenge

```
Task(challenge 워크플로우,
  prompt = "전체 모드 — 7단계 검증 실행")
```

`workflows/challenge.md`의 전체 모드를 자동 실행한다.

### 2. Challenge 결과 리포트

```
----------------------------------------
Autonomous 완료 리포트

  총 섹션: {N}개
  settled: {M}개 (성공)
  실패/보류: {K}개

  평균 강도: {avg_score}/100
  최약 섹션: {section} ({min_score}/100)
  최강 섹션: {section} ({max_score}/100)

  Challenge 결과: {통과/N건 발견}

----------------------------------------
```

### 3. 추가 작업 제안

challenge 결과에 따라 다음 중 하나를 제안한다:

- **Challenge 통과**: `/sowhat:finalize-planning` 제안
- **이슈 발견**: `/sowhat:revise {섹션}` 또는 `/sowhat:debate {섹션}` 제안
- **강도 60 미만 섹션 존재**: `/sowhat:expand {섹션}` 추가 보강 제안

---

## logs/session.md 업데이트 (완료 시)

```markdown
---
command: autonomous
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
autonomous 완료 — {N}개 섹션 처리. settled: {M}개. challenge: {통과/N건}. 상세: logs/autonomous-{datetime}.md

## 재개 시 첫 질문
challenge 결과 확인 후 /sowhat:finalize-planning 또는 /sowhat:revise {섹션}
```

---

## 전체 진행 로그

파이프라인 완료 시 `logs/autonomous-{YYYYMMDD-HHMM}.md`에 전체 실행 로그를 저장한다:

```markdown
# Autonomous Pipeline Report — {datetime}

## 실행 요약
- 대상 섹션: {N}개
- 소요 시간: {M}분
- 옵션: --skip-debate={yes/no}, --max-rounds={N}

## 섹션별 결과

| 섹션 | 결과 | 강도 | expand | debate | settle | 비고 |
|------|------|:----:|:------:|:------:|:------:|------|
| 01-problem | ✅ settled | 82 | ✅ | ✅ | ✅ 1회 | — |
| 02-solution | ✅ settled | 71 | ✅ | ✅ | ✅ 1회 | — |
| 03-market | ✅ settled | 63 | ✅ | ✅ | ✅ 2회 | settle 1회 실패 후 재시도 |
| 04-actors | ❌ 보류 | 48 | ✅ | ✅ | ❌ 3회 | checkpoint 발동 |

## Human Checkpoints
- {datetime}: {섹션} — {이유} → 사용자 선택: {결과}

## Challenge 결과
{challenge 리포트 요약}
```

---

## 핵심 원칙

- **섹션 파일 1회 로드** — 사전 준비에서 한 번만 로드, 각 섹션 처리 완료 시에만 재로드 허용
- **리포트는 파일에, 대시보드만 응답에** — 상세 로그는 `logs/` 디렉터리에 저장
- **Human checkpoint는 최소화** — critical 이슈에서만 멈춤, 나머지는 AI가 자율 판단
- **품질 우선** — 속도보다 논증 품질. settle 검증은 생략하지 않음
- **수치·출처는 retrieval만** — AI 자체 생성 절대 금지 (`references/fabrication-prevention.md` 참조). 확인 불가 시 정성 기술 + Qualifier 하향.
- **Stub은 즉시 재전개** — AI 자동 전개에서 stub이 발견되면 해당 필드를 다시 채움
- **Warrant 공격 최우선** — mini-debate에서 Warrant 연결 논리를 우선 공격
- **강도 60 이상 목표** — 60 미만이면 추가 debate로 보강 시도
- **Cross-section regression 검증** — settle 시 기존 섹션과의 일관성 자동 확인
- **진행 상황 항상 저장** — 중단 시에도 `logs/session.md`에 재개 정보 보존
- **Post-Autonomous challenge 필수** — 자율 전개 후 반드시 전체 검증 실행
