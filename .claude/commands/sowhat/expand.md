---
model: claude-sonnet-4-6
---
# /sowhat:expand — 섹션 Bottom-Up 전개

이 커맨드는 기획 섹션을 핑퐁 방식으로 전개한다. `$ARGUMENTS`에 섹션 이름 또는 번호가 전달된다.

## 사전 검증

1. `.planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"spec"` 또는 `"finalized"`이면: `❌ 이미 명세/완료 레이어입니다. 기획 섹션 전개 불가.`
2. `00-thesis.md` 로드 (항상)
3. 대상 섹션 파일 확인:
   - `$ARGUMENTS`가 숫자면 → `{N}-*.md` 패턴으로 검색
   - `$ARGUMENTS`가 이름이면 → `*-{name}.md` 패턴으로 검색
   - 없으면 → 새 섹션 파일 생성 (다음 번호 자동 부여)
4. 섹션 status 확인:
   - `settled` → `❌ 이미 settled된 섹션입니다. /sowhat:challenge로 재검토하세요.`
   - `invalidated` → `❌ invalidated 상태입니다. 상위 논거가 먼저 revision되어야 합니다.`
   - `draft` 또는 `discussing` 또는 `needs-revision` → 진행
5. `.research/` 디렉터리 확인:
   - 해당 섹션과 관련된 `status: unreviewed` 파인딩이 있으면:
     `ℹ️ 이 섹션과 관련된 미검토 리서치가 {N}건 있습니다. /sowhat:research review {section}`

## 핑퐁 절차

### 1. thesis_argument 확인

섹션의 `thesis_argument` 필드가 비어있으면 인간에게 질문:
- "이 섹션은 thesis의 어떤 Key Argument를 지지합니까?"

### 2. Claim 핑퐁

- "이 논거의 핵심 주장(Claim)은 무엇입니까?"
- "이 Claim이 thesis의 Answer '{answer}'를 어떻게 지지합니까?"

### 3. Supporting Arguments 핑퐁

- "이 주장의 근거는 무엇입니까?"
- "반례가 있다면 무엇입니까?"
- "이것이 없으면 Claim이 성립하지 않습니까?"
- 각 근거에 대해 깊이 파고든다.

### 4. Scope 핑퐁

- "이 섹션이 다루는 범위(In)는?"
- "명시적으로 다루지 않는 것(Out/Non-Goals)은?"

### 5. Edge Cases 핑퐁

- "예외적인 상황이나 경계 조건은?"
- "실패 시나리오는?"

### 6. Acceptance Criteria 핑퐁

- "이 섹션이 완료되었다고 판단하는 기준은?"
- 각 AC는 검증 가능한 형태로 구조화한다.

## 파일 생성/업데이트

핑퐁 중 인간이 답한 내용을 즉시 섹션 파일에 반영한다.

새 섹션 생성 시:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```markdown
---
status: discussing
version: 1
section: {N}
title: {section-name}
thesis_argument: {thesis의 어떤 논거를 지지하는가}
github_issue: {issue number}
created: {current_datetime}
updated: {current_datetime}
---

## Claim
> {인간이 답한 내용}

## Supporting Arguments

### {근거 1}
{인간이 답한 내용}

### {근거 2}
{인간이 답한 내용}

## Scope
### In
- {인간이 답한 내용}
### Out (Non-Goals)
- {인간이 답한 내용}

## Edge Cases
- {인간이 답한 내용}

## Acceptance Criteria
- [ ] {인간이 답한 내용}

## GitHub Edits
> GitHub에서 직접 수정된 내용. 반영 여부는 인간이 결정.

## Open Questions
- [ ]

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 | | {current_date} |
```

## 종료 조건

인간이 충분하다고 판단하면 핑퐁을 종료한다. 종료 시 안내:

```
✅ 섹션 {N}-{name} 전개 완료 (status: discussing)

다음: /sowhat:settle {section} → 이 섹션 완료 선언
      /sowhat:expand {other} → 다른 섹션 전개
      /sowhat:challenge → 전체 트리 검증
```

## 핵심 원칙

- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **인간이 답한 것을 구조화한다**
- **한 번에 하나의 질문** — 인간의 답변을 듣고 다음 질문 결정
- **항상 thesis와의 연결을 확인한다**
- **status를 discussing으로 변경** (draft였으면)
