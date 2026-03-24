# /sowhat:finalize — GSD Export 생성

이 커맨드는 명세 레이어를 완료하고 GSD가 소비할 export 파일을 생성한다.

## 사전 검증

1. `planning/config.json` 로드
2. `layer`가 `"spec"`인지 확인
   - `"planning"` → `❌ 아직 기획 레이어입니다. /sowhat:finalize-planning을 먼저 실행하세요.`
   - `"finalized"` → `❌ 이미 완료된 프로젝트입니다.`

3. 명세 레이어 전체 상태 확인 (04~09):
   - `settled`되지 않은 섹션 존재 → `❌ 실행 거부: {section}이 {status} 상태입니다.`
   - 어떤 섹션이 누락되어 있으면 → `⚠️ {section}이 존재하지 않습니다. /sowhat:spec {section}을 먼저 실행하세요.`

모든 명세 섹션(04~09)이 `settled`여야만 진행한다.

## Session 저장

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`logs/session.md`를 저장한다:

```markdown
---
command: finalize
step: challenge
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
finalize 시작 — challenge 자동 실행 중
```

## Challenge 자동 실행

`$ARGUMENTS`에 `--force`가 있으면 challenge를 건너뛴다.

`--force` 없으면: `/sowhat:challenge`를 자동 실행한다 — **기획 + 명세 전체** 대상.

- 문제가 발견되면:
  ```
  🔴 Challenge에서 {N}건 발견 — export를 중단합니다.

  [1] 문제를 먼저 해결하고 재실행
  [2] --force로 강제 export (문제 있음을 인지한 상태로 진행)
  ```
  인간의 선택을 기다린다.
- 문제가 없으면 → 다음 단계 진행

## Export 생성

```bash
mkdir -p export
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

### export/PROJECT.md

GSD `/gsd:new-project`가 소비하는 프로젝트 컨텍스트 파일.

```markdown
# {Project Name}

## Vision
> {thesis Answer — 그대로 복사}

## Core Objectives
{thesis Key Arguments를 목표로 변환}

1. {Key Argument 1 — 한 줄 요약}
2. {Key Argument 2 — 한 줄 요약}
3. {Key Argument 3 — 한 줄 요약}

## Background
### Situation
> {thesis Situation}

### Problem
> {thesis Complication}

## Scope

### In Scope
{모든 기획 섹션의 Scope In 합산}
-

### Out of Scope
{모든 기획 섹션의 Scope Out 합산}
-

## Actors
{04-actors.md의 내용 요약}
-

## Generated
- Source: sowhat
- Date: {current_datetime}
```

### export/REQUIREMENTS.md

GSD `/gsd:new-project`가 소비하는 요구사항 파일.

```markdown
# Requirements — {Project Name}

## Functional Requirements
{05-functional-requirements.md의 각 Claim/Grounds를 requirement로 변환}

### FR-1: {requirement title}
- Description: {Claim}
- Details: {Grounds 요약}
- Priority: {있으면}

### FR-2: {requirement title}
...

## Data Model
{06-data-model.md 요약}

## API Contract
{07-api-contract.md 요약}

## Edge Cases & Constraints
{08-edge-cases.md의 각 항목}

- EC-1: {edge case}
  - Handling: {처리 방안}
- EC-2: {edge case}
  ...

## Acceptance Criteria
{09-acceptance-criteria.md의 각 항목}

- [ ] AC-1: {criteria}
- [ ] AC-2: {criteria}
...

## Generated
- Source: sowhat
- Date: {current_datetime}
```

## 문서 생성 여부 확인

PROJECT.md와 REQUIREMENTS.md 생성 후, 인간이 읽는 문서 생성 여부를 묻는다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 인간이 읽는 문서도 생성하시겠습니까?
   (DOCUMENT.md, PRD.md, ARGUMENT-MAP.md)

  [1] /sowhat:draft 실행 (추천 — DOCUMENT.md + PRD.md + ARGUMENT-MAP.md 생성)
  [2] 나중에 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- `[1]` 선택 시: `/sowhat:draft`를 호출한다. draft가 완료되면 finalize로 복귀.
- `[2]` 선택 시: 이 단계를 건너뛴다. 나중에 `/sowhat:draft`를 별도로 실행 가능.

## Argument Log 추가

`logs/argument-log.md`에 최종 요약을 append한다:

```markdown
## [{current_datetime}] finalize
  Action: export 생성 + layer → finalized
  Sections: {settled된 모든 섹션 목록}
  Export: PROJECT.md, REQUIREMENTS.md{, DOCUMENT.md, PRD.md, ARGUMENT-MAP.md (if drafted)}
```

## config.json 업데이트

```json
{
  "layer": "finalized"
}
```

## Git commit

```bash
git add -A
git commit -m "finalize: export GSD artifacts"
```

## GitHub

```bash
# Milestone close (있으면)
gh api repos/{owner}/{repo}/milestones/{milestone_number} -X PATCH -f state=closed 2>/dev/null || true
```

## logs/session.md 업데이트

```markdown
---
command: finalize
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
finalize 완료 — GSD export 생성됨. export/PROJECT.md + export/REQUIREMENTS.md.

## 재개 시 첫 질문
/gsd:new-project → export/PROJECT.md와 export/REQUIREMENTS.md로 GSD 프로젝트 시작
```

## 완료 안내

```
✅ sowhat 완료 — export 생성됨

  GSD용:
  - export/PROJECT.md
  - export/REQUIREMENTS.md

  {draft를 실행한 경우:}
  인간용:
  - export/DOCUMENT.md
  - export/PRD.md
  - export/ARGUMENT-MAP.md

---

## ▶ 다음

**GSD 인계** — export artifacts로 GSD 프로젝트 시작

`/gsd:new-project`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---

**또한 가능:**
- `/sowhat:draft --output all` — 최종 문서 재생성
- `/sowhat:challenge` — 최종 검증 재실행

---
```

## 핵심 원칙

- **challenge 자동 실행은 생략 불가**
- **export는 기획+명세의 충실한 요약** — 새로운 내용을 추가하지 않는다
- **GSD가 소비하는 형식**에 맞춘다
- **문서 생성은 /sowhat:draft에 위임** — finalize는 GSD artifacts만 직접 생성한다
