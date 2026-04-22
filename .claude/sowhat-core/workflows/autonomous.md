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

### Step 1-a: Retrieval gate — research 부재 시 자동 전개 건너뛰기 (cycle 7 핵심)

AI는 **구조만 자동 생성**한다. 내용(수치·기관명·연도·URL 등 구체값)은 자동 생성 금지 (`references/ai-content-boundary.md` 참조).

따라서 각 섹션에 대해 retrieval 가능 여부를 먼저 확인한다:

```
FOR EACH section IN target_sections:
  retrieval_available =
       (research/ 디렉터리에 섹션과 매핑된 #NNN finding 존재)
    OR (섹션에 inject로 주입된 file:/dir: 자료 존재)
    OR (이전 세션에서 Sub-Research 결과가 섹션에 저장됨)

  IF NOT retrieval_available:
    # 자동 생성 중단 — 사용자 개입 요청
    섹션 status: draft 유지 (변경 없음)
    대시보드 메시지 누적:
      "⚠️ {section} — retrieval 없음, 자동 전개 skip.
         개입 경로: /sowhat:research {section}
                    또는 /sowhat:inject {section} {파일/URL}
                    또는 /sowhat:expand {section} (사용자 직접 입력)"
    CONTINUE  # 다음 섹션으로
```

이 gate가 cycle 1-6의 실패 원인 — "AI가 기억으로 Grounds 생성" — 을 구조적으로 차단한다. 자동 생성 경로 자체가 없으므로 fabrication 탐지·차단 로직이 불필요.

### Step 1: expand(section) — retrieval 확보된 섹션의 자동 Toulmin 전개

Step 1-a를 통과한 섹션에 대해 expand 워크플로우를 **AI가 자동으로** 실행한다. 인간 핑퐁 없이 AI가 구조를 채우고, 내용은 retrieval에서만 인용한다.

```
Task(sowhat-expand-agent,
  prompt = """
  <mode>autonomous — 인간 핑퐁 없이 AI가 구조 결정을 내린다</mode>
  <thesis>{thesis_answer, key_arguments}</thesis>
  <section>{섹션 전체 데이터}</section>
  <research_findings>{매핑된 #NNN finding 원문 + inject 자료}</research_findings>
  <instructions>
    Toulmin 9단계를 순서대로 자동 전개:
    1. Stasis / Scheme / Claim 형식: AI가 자동 결정 ([source:inference])
    2. Grounds:
       - research_findings 인용만 허용 → [source:#NNN] / [source:file:path]
       - 구체값 자체 생성 금지
    3. Warrant: Grounds → Claim 연결 논리 원칙만 ([source:inference])
       — 수치·통계·기관명 포함 금지
    4. Backing: research_findings 인용만 ([source:#NNN] / [source:file:*])
    5. Qualifier: Grounds 강도에 맞춰 자동 선택 ([source:inference])
    6. Rebuttal: 논리 구조만 ([source:inference])
    7. Scope: In/Out 경계 ([source:inference])

    각 항목 끝에 [source:...] 태그 필수. 태그 없는 항목은 parser가 drop.
    AI는 user/#NNN/sub-research/file:* 태그를 직접 부착할 수 없음 —
    workflow가 retrieval 기록과 대조하여 부착. AI가 임의 부착한 경우 drop.

    모든 필드 작성 후 status → discussing.
  </instructions>
  """)
```

**AI가 자유롭게 자동 생성 가능**: Stasis/Scheme/Claim 형식, Warrant 논리 원칙, Qualifier 수준, Rebuttal 구조, Scope 경계. Source tag는 `[source:inference]` 또는 `[source:placeholder]`.

**AI가 자동 생성 불가능**: 구체값(수치·기관명·연도·인물명·URL). 이 값은 Step 1-a에서 확보된 `<research_findings>` 태그 내용만 인용. 태그 밖 구체값은 drop.

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

- **retrieval 없는 섹션은 자동 전개하지 않는다** — Step 1-a gate가 차단. 사용자 개입(`/sowhat:research`/`/sowhat:inject`/`/sowhat:expand`) 없이는 draft 유지. AI 기억으로 내용을 만들지 않는다 (`references/ai-content-boundary.md`).
- **AI는 구조만, 내용은 retrieval만** — Stasis/Scheme/Claim 형식/Warrant 논리/Qualifier는 AI 자동. 수치·기관명·연도 등 구체값은 `<research_findings>` 인용만 허용.
- **Source tag 강제** — 모든 항목 끝에 `[source:...]` 태그. 태그 없거나 AI가 임의 부착한 retrieval 태그는 parser가 drop.
- **섹션 파일 1회 로드** — 사전 준비에서 한 번만 로드, 각 섹션 처리 완료 시에만 재로드 허용
- **리포트는 파일에, 대시보드만 응답에** — 상세 로그는 `logs/` 디렉터리에 저장
- **Human checkpoint는 최소화** — critical 이슈에서만 멈춤, 나머지는 AI가 자율 판단
- **품질 우선** — 속도보다 논증 품질. settle 검증은 생략하지 않음
- **Warrant 공격 최우선** — mini-debate에서 Warrant 연결 논리를 우선 공격
- **강도 60 이상 목표** — 60 미만이면 추가 debate로 보강 시도
- **Cross-section regression 검증** — settle 시 기존 섹션과의 일관성 자동 확인
- **진행 상황 항상 저장** — 중단 시에도 `logs/session.md`에 재개 정보 보존
- **Post-Autonomous challenge 필수** — 자율 전개 후 반드시 전체 검증 실행
