---
model: claude-sonnet-4-6
---
# /sowhat:finalize-planning — 기획 레이어 완료 + 명세 레이어 생성

이 커맨드는 기획 레이어의 게이트를 통과하고 명세 레이어 초안을 자동 생성한다.

## 사전 검증

1. `.planning/config.json` 로드
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

각 파일의 형식:

```markdown
---
status: draft
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

## Supporting Arguments

### {근거 1}
{기획에서 추출한 내용}

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

각 명세 섹션에 대해 GitHub Issue를 생성한다.

```bash
gh issue create --title "{section-title}" --body-file {section-file} --label "spec,draft"
```

## Git commit

```bash
git add -A
git commit -m "planning-complete: generate spec layer"
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
