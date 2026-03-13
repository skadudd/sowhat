---
model: claude-sonnet-4-6
---
# /sowhat:finalize — GSD Export 생성

이 커맨드는 명세 레이어를 완료하고 GSD가 소비할 export 파일을 생성한다.

## 사전 검증

1. `.planning/config.json` 로드
2. `layer`가 `"spec"`인지 확인
   - `"planning"` → `❌ 아직 기획 레이어입니다. /sowhat:finalize-planning을 먼저 실행하세요.`
   - `"finalized"` → `❌ 이미 완료된 프로젝트입니다.`

3. 명세 레이어 전체 상태 확인 (04~09):
   - `settled`되지 않은 섹션 존재 → `❌ 실행 거부: {section}이 {status} 상태입니다.`

모든 명세 섹션이 `settled`여야만 진행한다.

## Challenge 자동 실행 (생략 불가)

`/sowhat:challenge`를 자동 실행한다 — **기획 + 명세 전체** 대상.

- 문제가 발견되면 → **즉시 중단**
- 문제가 없으면 → 다음 단계 진행

## Export 생성

```bash
mkdir -p export
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

### export/PROJECT.md

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

```markdown
# Requirements — {Project Name}

## Functional Requirements
{05-functional-requirements.md의 각 Claim/Supporting Argument를 requirement로 변환}

### FR-1: {requirement title}
- Description: {Claim}
- Details: {Supporting Arguments 요약}
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

## 완료 안내

```
✅ sowhat 완료 — GSD export 생성됨
  - export/PROJECT.md
  - export/REQUIREMENTS.md

GSD 인계: /gsd:new-project 에서 이 export를 소비합니다.
```

## 핵심 원칙

- **challenge 자동 실행은 생략 불가**
- **export는 기획+명세의 충실한 요약** — 새로운 내용을 추가하지 않는다
- **GSD가 소비하는 형식**에 맞춘다
