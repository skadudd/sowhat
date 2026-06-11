# Draft — PRD 템플릿

산출물이 PRD(`prd`)일 때의 전체 구조 템플릿. draft.md Step 5(구조화 산출물)에서 읽고 렌더한다.

---

#### PRD (`prd`)

`export/generated/{profile-id}/PRD.md` 생성:

```markdown
# {project} — Product Requirements Document

<!-- 프로파일: {profile-id} | 생성: {현재 datetime} | 레이어: {layer} -->

## Overview

{00-thesis.md의 Answer — 2-3문장}

{Situation을 1문장으로 압축한 맥락}

## Problem Statement

**Situation**: {Situation 전체}

**Complication**: {Complication 전체}

**Question**: {Question}

## Goals & Success Metrics

{각 Key Argument를 목표로, 해당 섹션의 Acceptance Criteria를 측정 지표로}

| Goal | Success Metric |
|------|----------------|
| {KA 1} | {AC from 섹션} |
| {KA 2} | {AC from 섹션} |

## Users & Stakeholders

{04-actors.md 내용 — actors, roles, needs}

(04-actors.md 없는 경우: "명세 레이어 완료 후 작성 예정")

## Features & Requirements

{05-functional-requirements.md 내용 — 우선순위별 기능 목록}

(없는 경우: 기획 섹션 Key Arguments에서 기능 요구사항 추론하여 기술)

## Data Model

{06-data-model.md 내용}

(없는 경우: 생략 또는 "TBD — 명세 레이어에서 정의 예정")

## API Contract

{07-api-contract.md 내용}

(없는 경우: 생략 또는 "TBD")

## Edge Cases & Constraints

{08-edge-cases.md 내용}

(없는 경우: 각 섹션의 미충족 CQ에서 제약 조건 추출)

## Acceptance Criteria

{09-acceptance-criteria.md 내용 — Given/When/Then 형식}

(없는 경우: 각 섹션의 Acceptance Criteria를 통합)

## Out of Scope

{모든 섹션의 Scope.Out 항목 통합}

## Open Questions

{모든 섹션의 Open Questions 중 미해결 항목}

| 질문 | 섹션 | 우선순위 |
|------|------|---------|
| {질문} | {섹션} | High/Medium/Low |
```
