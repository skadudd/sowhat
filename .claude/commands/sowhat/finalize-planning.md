---
model: claude-sonnet-4-6
description: 기획 레이어를 완료하고 명세 레이어(04~09 섹션)를 자동 생성한다. "기획 완료", "명세 시작", "스펙 생성", "planning 완료", "finalize-planning" 등 모든 기획 섹션이 settled 된 후 명세 작업으로 전환할 때 사용. challenge 실행 후 6개 명세 섹션 draft 자동 생성 + GitHub Issues 생성.
---
# /sowhat:finalize-planning — 기획 레이어 완료 + 명세 레이어 생성

이 커맨드는 기획 레이어의 게이트를 통과하고 명세 레이어 초안을 자동 생성한다.

## 사전 검증

1. `planning/config.json` 로드
2. `layer`가 `"planning"`인지 확인
   - `"spec"` → `❌ 이미 명세 레이어입니다.`
   - `"finalized"` → `❌ 이미 완료된 프로젝트입니다.`

3. 모든 섹션 상태 확인:
   - `settled`되지 않은 섹션 존재 → `❌ 실행 거부: {section}이 {status} 상태입니다.`
   - `invalidated` 섹션 존재 → `❌ 실행 거부: {section}이 invalidated 상태입니다.`
   - `needs-revision` 섹션 존재 → `❌ 실행 거부: {section}이 needs-revision 상태입니다.`

모든 섹션이 `settled`여야만 진행한다.

## Challenge 자동 실행 (생략 불가)

`/sowhat:challenge`를 자동 실행한다.

- 문제가 발견되면 → **즉시 중단**. 인간이 문제를 해결한 후 다시 실행해야 한다.
- 문제가 없으면 → 다음 단계 진행

## 디렉터리 준비

명세 레이어 진입 전, 필요한 디렉터리가 있는지 확인하고 없으면 생성한다:

```bash
mkdir -p logs maps/local maps/snapshots maps/debate research planning
```

(init에서 이미 생성되었으면 무시된다)

## 명세 레이어 초안 생성

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

다음 6개 고정 섹션을 자동 생성한다. **초안**이므로 내용은 기획 섹션에서 추출하되, 완전하지 않아도 된다.

### 04-actors.md
- thesis의 Situation에서 관계자/액터를 추출
- 각 기획 섹션의 Scope에서 언급된 사용자/시스템 추출

### 05-functional-requirements.md
- 각 기획 섹션의 Claim을 기능 요구사항으로 변환
- Supporting Arguments에서 구체적 기능 추출

### 06-data-model.md
- 각 기획 섹션의 Supporting Arguments에서 언급된 데이터/엔티티 추출
- Edge Cases에서 데이터 관련 제약 추출

### 07-api-contract.md
- 기획 섹션에서 인터페이스/API가 언급된 부분 추출
- 시스템 간 통신이 필요한 부분 식별

### 08-edge-cases.md
- 모든 기획 섹션의 Edge Cases 합산
- 중복 제거 및 구조화

### 09-acceptance-criteria.md
- 모든 기획 섹션의 Acceptance Criteria 합산
- 중복 제거 및 구조화

각 파일의 형식 (Toulmin 구조 포함):

```markdown
---
status: draft
scheme:
qualifier:
version: 1
section: {N}
title: {section-name}
thesis_argument: {관련 기획 논거}
github_issue: {issue_number}
created: {current_datetime}
updated: {current_datetime}
---

## Claim
> {기획에서 추출한 내용 — 초안}

## Grounds (근거)

### {근거 1}
{기획에서 추출한 내용}

## Warrant (논거 연결)
> {Claim과 Grounds를 연결하는 원칙 — 초안 또는 비워둠}

## Backing (Warrant 강화)
>

## Qualifier
>

## Rebuttal (반론 대응)
>

## Scope
### In
-
### Out (Non-Goals)
-

## Edge Cases
-

## Acceptance Criteria
- [ ]

## GitHub Edits
>

## Open Questions
- [ ] 초안 검토 필요

## Argument Log
| round | datetime | move | agent | outcome |
|-------|----------|------|-------|---------|

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 자동 생성 | finalize-planning | {current_date} |
```

## config.json 업데이트

```json
{
  "layer": "spec",
  "sections": {
    // 기존 기획 섹션 유지
    "04-actors": { "issue": N, "status": "draft" },
    "05-functional-requirements": { "issue": N, "status": "draft" },
    "06-data-model": { "issue": N, "status": "draft" },
    "07-api-contract": { "issue": N, "status": "draft" },
    "08-edge-cases": { "issue": N, "status": "draft" },
    "09-acceptance-criteria": { "issue": N, "status": "draft" }
  }
}
```

## GitHub Issues 생성

각 명세 섹션에 대해 GitHub Issue를 생성한다 (frontmatter 제거 후):

```bash
sed '1,/^---$/d; 1,/^---$/d' {section-file} > /tmp/spec-body.md
gh issue create --title "{section-title}" --body-file /tmp/spec-body.md --label "spec,draft"
```

## Git commit

```bash
git add -A
git commit -m "planning-complete: generate spec layer"
```

## logs/argument-log.md 추가

```markdown
## [{current_datetime}] finalize-planning
  Action: layer planning → spec
  Sections created: 04-actors, 05-functional-requirements, 06-data-model, 07-api-contract, 08-edge-cases, 09-acceptance-criteria
  Status: all draft
```

## logs/session.md 업데이트

```markdown
---
command: finalize-planning
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
finalize-planning 완료 — 기획 레이어 → 명세 레이어 전환. 6개 명세 섹션(04~09) draft 생성 완료.

## 재개 시 첫 질문
/sowhat:spec 04 → 04-actors 섹션 핑퐁 시작
```

## 완료 안내

```
✅ 기획 레이어 완료 → 명세 레이어 생성됨
  - 04-actors.md (draft)
  - 05-functional-requirements.md (draft)
  - 06-data-model.md (draft)
  - 07-api-contract.md (draft)
  - 08-edge-cases.md (draft)
  - 09-acceptance-criteria.md (draft)
  - Issues: #{numbers}

다음: /sowhat:spec {section} → 명세 섹션 핑퐁
```

## 핵심 원칙

- **기획 레이어 완성 전 명세 레이어 진입 불가** — 게이트가 강제한다
- **challenge 자동 실행은 생략 불가**
- **명세 초안은 기획에서 추출** — Claude가 새로운 내용을 만들지 않는다
- **Toulmin 필드는 비워두되 구조는 미리 만든다** — spec 핑퐁에서 채워진다
