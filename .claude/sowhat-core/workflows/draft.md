# /sowhat:draft — 문서 초안 생성

이 커맨드는 settled된 섹션들을 종합하여 실제 인간이 읽을 수 있는 문서를 생성한다.
`$ARGUMENTS`에 `--format N`과 `--output all|document|prd|argument-map`이 전달될 수 있다.

## 사전 검증

1. `planning/config.json` 로드
   - 파일 없으면: `❌ sowhat 프로젝트가 아닙니다. /sowhat:init으로 초기화하세요.`

2. `layer` 확인:
   - `"planning"` → 경고 후 진행 여부 질문:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ⚠️  현재 레이어: planning

     명세 레이어가 아직 완성되지 않았습니다.
     기획 논거만으로 초안을 생성하면 PRD의 상세 명세 섹션이 누락됩니다.

     ──── 제안 ────
       [1] 기획 레이어만으로 초안 생성 (실험적 — DOCUMENT.md, ARGUMENT-MAP.md만)
       [2] 취소 (/sowhat:finalize-planning 먼저 실행)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```
     - [2] 선택 시 종료
     - [1] 선택 시: `--output` 강제로 `document,argument-map`으로 제한 (PRD 생략)

   - `"spec"` 또는 `"finalized"` → 명세 섹션(04~09) 상태 확인:
     - unsettled 섹션이 하나라도 있으면:
       ```
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⚠️  미완성 명세 섹션 발견

       다음 섹션이 settled 상태가 아닙니다:
         - {section}: {status}
         - {section}: {status}

       ──── 제안 ────
         [1] unsettled 섹션 포함하여 초안 생성 (불완전할 수 있음)
         [2] settled 섹션만으로 초안 생성
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ```

3. 섹션 파일 로드:
   - `00-thesis.md` (필수)
   - `planning/` 디렉터리의 모든 `*.md` 파일 (01-*.md, 02-*.md, …)
   - layer가 spec/finalized이면: `04-actors.md` ~ `09-acceptance-criteria.md`
   - status가 `invalidated`인 섹션은 제외
   - [2] 선택 시 `draft`, `discussing`, `needs-revision` 상태인 섹션도 제외

## session.md 저장 (사전 검증 완료 후)

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: draft
section: export
step: format-selection
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
draft 시작 — 사전 검증 완료. 형식 선택 대기 중.

## 재개 시 첫 질문
/sowhat:draft → 형식 선택부터 재시작
```

## Step 1: 형식 선택

`--format N` 인수가 없을 경우 질문:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 어떤 형식의 문서를 생성합니까?

──── 예시 ────
  비즈니스 제안서: 임원이 10분 안에 읽는 문서
  연구 기획서: 근거와 방법론이 상세히 기술된 문서

──── 제안 ────
  [1] 임원 요약 (Executive Summary) — 2-3페이지, 핵심만
  [2] 상세 제안서 — 전체 논증 + 근거 포함, 10-15페이지
  [3] 투자/펀딩 제안서 — 문제-시장-솔루션-팀-요청 구조
  [4] 연구/학술 기획서 — 문헌 기반, 방법론 중심
  [5] 내부 결정 문서 — 의사결정 배경 + 옵션 비교 + 결론

──── 기타 ────
  [6] 직접 포맷 지정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[6] 선택 시: 사용자가 직접 포맷을 서술하도록 요청 후 자유 형식으로 생성.

선택된 형식을 `SELECTED_FORMAT`으로 기억한다.

## Step 2: 독자 설정

(형식 선택 직후 한 번만 질문)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 주요 독자는 누구입니까?

──── 제안 ────
  [1] 경영진/의사결정자 (기술 배경 없음, 결론 우선)
  [2] 투자자 (ROI, 시장 크기, 팀 역량 중심)
  [3] 개발팀 (기술 상세, 구현 가능성 중심)
  [4] 일반 이해관계자 (균형 잡힌 전달)
  [5] 직접 입력
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[5] 선택 시: 사용자 입력을 `TARGET_AUDIENCE`로 기억한다.

## Step 3: 출력 대상 결정

`--output` 인수 파싱:
- `all` (기본값, 인수 없을 때): DOCUMENT.md + PRD.md + ARGUMENT-MAP.md
- `document`: DOCUMENT.md만
- `prd`: PRD.md만
- `argument-map`: ARGUMENT-MAP.md만
- 쉼표 구분으로 복수 지정 가능: `--output document,prd`

planning 레이어에서 [1] 선택 시: PRD.md 출력 제외 (자동 적용, 사용자에게 알림)

## Step 4: 문서 생성

`export/` 디렉터리가 없으면 생성:
```bash
mkdir -p export
```

### export/DOCUMENT.md 생성

형식 특성에 따른 문서 작성 지침:

**공통 원칙:**
- 불릿 포인트 나열이 아닌, 읽히는 서술형 문서
- `00-thesis.md`의 Answer를 도입부 핵심 테제로 사용
- Situation + Complication을 배경/맥락 단락으로 자연스럽게 서술
- Key Arguments를 각 논증 단락의 주제로 사용
- 각 섹션의 Grounds를 증거로 본문에 자연스럽게 녹임
  - 예: "실제로 …" / "데이터에 따르면 …" / "사례로 보면 …"
- Qualifier 언어를 적절히 사용
  - "대부분의 경우", "일반적으로", "가능성이 높은", "확실히"
- Rebuttal을 반론 대응 단락으로 포함
  - 예: "물론 …라는 우려도 있다. 그러나 …"
- 마지막 단락: thesis의 Answer에 기반한 명확한 행동 촉구(call-to-action) 또는 결론

**형식별 구조:**

[1] 임원 요약 (Executive Summary):
```
# {제목}

## 핵심 결론
{Answer 1-2문장}

## 상황과 문제
{Situation + Complication — 3-5문장}

## 권고 사항
{Key Arguments를 행동 중심으로 재서술}

## 기대 효과
{Acceptance Criteria 기반}

## 결론
{Call-to-action}
```

[2] 상세 제안서:
```
# {제목}

## 서론
## 문제 분석
## 논거 {N}: {섹션 제목}
   (각 섹션별 Grounds + Warrant + Rebuttal 포함)
## 종합 및 결론
## 부록: 열린 질문들
```

[3] 투자/펀딩 제안서:
```
# {제목}

## 문제 (Problem)
## 시장 기회 (Market Opportunity)
## 솔루션 (Solution)
## 팀 / 실행 역량 (Team)
## 요청 사항 (Ask)
```

[4] 연구/학술 기획서:
```
# {제목}

## 연구 배경 및 필요성
## 선행 연구 / 이론적 근거
## 연구 질문 및 가설
## 연구 방법론
## 기대 결과
## 한계 및 대안
## 참고문헌 (리서치 파인딩 기반)
```

[5] 내부 결정 문서:
```
# {제목}: 의사결정 문서

## 배경 및 맥락
## 검토한 옵션들
## 결정 사항 및 근거
## 반론 및 대응
## 후속 조치
## 미결 사항
```

파일 상단에 메타데이터 주석 추가:
```markdown
<!--
  생성: {현재 datetime}
  형식: {SELECTED_FORMAT}
  독자: {TARGET_AUDIENCE}
  레이어: {layer}
  Settled 섹션: {N}개
-->
```

### export/PRD.md 생성

(planning 레이어 [1] 선택 시 생략)

```markdown
# {project} — Product Requirements Document

<!-- 생성: {현재 datetime} | 레이어: {layer} -->

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

(없는 경우: 각 섹션의 Rebuttal에서 제약 조건 추출)

## Acceptance Criteria

{09-acceptance-criteria.md 내용 — Given/When/Then 형식}

(없는 경우: 각 섹션의 Acceptance Criteria를 통합)

## Out of Scope

{모든 섹션의 Scope.Out 항목 통합}
- {항목 1}
- {항목 2}

## Open Questions

{모든 섹션의 Open Questions 중 미해결 항목}

| 질문 | 섹션 | 우선순위 |
|------|------|---------|
| {질문} | {섹션} | High/Medium/Low |
```

### export/ARGUMENT-MAP.md 생성

```markdown
# Argument Map: {project}

<!-- 생성: {현재 datetime} -->

## Thesis

**Answer**: {00-thesis.md Answer}

**Qualifier**: {00-thesis.md qualifier 또는 섹션별 qualifier 종합}

**SCQ**:
- Situation: {Situation}
- Complication: {Complication}
- Question: {Question}

## Logic Tree

{각 섹션을 번호 순서대로:}

### {N}-{section-name} [{status}]

- **Scheme**: {scheme}
- **Qualifier**: {qualifier}
- **Claim**: {Claim 내용}
- **Grounds**: {Grounds 핵심 요약 — 1-2문장}
- **Warrant**: {Warrant 내용}
- **Backing**: {Backing 있을 경우}
- **Rebuttal addressed**: {Rebuttal 내용이 있으면 "예 — {요약}", 없으면 "아니오"}
- **GitHub Issue**: {github_issue 있으면 #N, 없으면 —}

---

{반복}

## Invalidated Arguments

{status가 invalidated인 섹션 목록}
- {N}-{section}: {무효화 사유 — Decision Log에서 추출}

(없으면 이 섹션 생략)

## Debate History

{logs/debate/ 디렉터리가 존재하고 파일이 있으면:}
{각 debate 파일의 핵심 결론 요약}

(logs/debate/ 없거나 비어있으면 이 섹션 생략)

## Research Used

{research/ 디렉터리에서 status가 accepted인 파인딩:}
- [{파일명}] {finding 핵심 — 1문장} → {관련 섹션}

(없으면: "리서치 파인딩 없음")
```

## Step 5: Git 커밋

생성된 파일별로 개별 커밋:

```bash
# DOCUMENT.md
git add export/DOCUMENT.md
git commit -m "draft: generate {SELECTED_FORMAT} document for {TARGET_AUDIENCE}"

# PRD.md (생성된 경우)
git add export/PRD.md
git commit -m "draft: generate PRD"

# ARGUMENT-MAP.md
git add export/ARGUMENT-MAP.md
git commit -m "draft: generate argument map"
```

커밋 실패 시:
```
⚠️  git 커밋 실패: {오류 메시지}
파일은 export/ 디렉터리에 저장되었습니다. 수동으로 커밋하세요.
```

## logs/argument-log.md 추가

```markdown
## [{current_datetime}] draft
  Format: {SELECTED_FORMAT}
  Audience: {TARGET_AUDIENCE}
  Sections: {N}개 settled 반영
  Output: export/DOCUMENT.md
```

## logs/session.md 업데이트

```markdown
---
command: draft
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
draft 완료 — {SELECTED_FORMAT} 형식으로 {TARGET_AUDIENCE} 대상 문서 생성. export/DOCUMENT.md 저장.

## 재개 시 첫 질문
/sowhat:finalize → GSD export 생성
```

## 완료 출력

```
✅ 문서 생성 완료

  export/DOCUMENT.md     ({SELECTED_FORMAT} 형식, {TARGET_AUDIENCE} 대상)
  export/PRD.md          (Product Requirements Document)
  export/ARGUMENT-MAP.md (논증 구조 맵)

  Settled 섹션 반영: {N}개
  미반영 섹션: {M}개 ({status 이유})

---

## ▶ 다음

**GSD export** — GSD export 생성 + 최종 완료

`/sowhat:finalize`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---

**또한 가능:**
- `/sowhat:debate {section}` — 논증 추가 강화

---
```

PRD.md가 생략된 경우: 해당 줄에 "(생략 — planning 레이어)" 표시.

## 엣지 케이스

- `00-thesis.md` 없음 → `❌ 00-thesis.md가 없습니다. /sowhat:init을 먼저 실행하세요.`
- settled 섹션이 0개 → `❌ settled된 섹션이 없습니다. /sowhat:expand 또는 /sowhat:settle로 섹션을 완성하세요.`
- `export/DOCUMENT.md`가 이미 존재 → 덮어쓰기 전 확인:
  ```
  ⚠️  export/DOCUMENT.md가 이미 존재합니다.
    [1] 덮어쓰기
    [2] 백업 후 덮어쓰기 (export/DOCUMENT.md.bak)
    [3] 취소
  ```
- research 디렉터리에 `status: unreviewed` 파인딩이 있으면, 생성 전 알림:
  ```
  ℹ️  미검토 리서치 {N}건이 있습니다. 반영되지 않을 수 있습니다.
  /sowhat:research review 로 먼저 검토하거나, 계속 진행할 수 있습니다.
    [1] 계속 진행
    [2] 취소 (리서치 먼저 검토)
  ```
