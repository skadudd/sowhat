# /sowhat:finalize — GSD Export 생성

<!--
@metadata
checkpoints:
  - type: verify-argument
    when: "challenge 통과 확인 후 진행 승인"
  - type: decision
    when: "force export 시 알려진 문제 인지"
config_reads: [layer, sections]
config_writes: [layer]
continuation:
  primary: "(프로젝트 완료)"
  alternatives: ["/sowhat:draft --output all"]
status_transitions: ["layer: spec → finalized"]
-->

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

## Challenge 자동 실행 (L4 Fabrication 게이트)

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

> **Fabrication 방어선 역할**: 이 단계는 `references/fabrication-prevention.md` §"Layer 책임 분리"의 **L4 게이트키핑**이다. L2 settle은 출처 표기의 **형식적 존재**만 검증하므로, 가짜 URL·인물명·보고서명 fabrication은 이 단계의 L3(challenge Stage 0)에서 실제 fetch·semantic 대조로 탐지된다.
>
> **`--force` 주의**: `--force` 사용 시 L3를 건너뛰므로 fabrication 방어선 전부가 무너진다. L2를 통과한 가짜 URL이 최종 산출물에 남을 수 있다. 인지된 문제가 fabrication이 아닌 다른 경미한 이슈일 때만 사용.

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
----------------------------------------
❓ 인간이 읽는 문서도 생성하시겠습니까?
   (DOCUMENT.md, PRD.md)

  [1] 문서 생성 (draft 실행 — DOCUMENT.md + PRD.md)
  [2] 논증 맵도 함께 (draft + map --export)
  [3] 나중에 생성
----------------------------------------
```

- `[1]` 선택 시: `/sowhat:draft`를 호출한다. draft가 완료되면 finalize로 복귀.
- `[2]` 선택 시: 이 단계를 건너뛴다. 나중에 `/sowhat:draft`를 별도로 실행 가능.

## Argument Log 추가

`logs/argument-log.md`에 최종 요약을 append한다:

```markdown
## [{current_datetime}] finalize
  Action: export 생성 + layer → finalized
  Sections: {settled된 모든 섹션 목록}
  Export: PROJECT.md, REQUIREMENTS.md{, DOCUMENT.md, PRD.md (if drafted)}{, ARGUMENT-MAP.md (if map --export)}
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
  - export/ARGUMENT-MAP.md  (/sowhat:map --export 로 별도 생성)

----------------------------------------
다음 액션:

[1] GSD 프로젝트 시작 (/gsd:new-project)
[2] 최종 문서 재생성 (/sowhat:draft --output all)
[3] 최종 검증 재실행 (/sowhat:challenge)
----------------------------------------


```

## 핵심 원칙

- **challenge 자동 실행은 생략 불가**
- **export는 기획+명세의 충실한 요약** — 새로운 내용을 추가하지 않는다
- **GSD가 소비하는 형식**에 맞춘다
- **문서 생성은 /sowhat:draft에 위임** — finalize는 GSD artifacts만 직접 생성한다
