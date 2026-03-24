---
model: claude-haiku-4-5-20251001
description: GitHub 변경사항을 감지하고 로컬에 반영한다. "sync", "동기화", "GitHub 반영", "변경사항 가져오기", "label 업데이트" 등 GitHub에서 직접 이슈를 수정했거나 팀원이 변경했을 때 로컬과 맞추기 위해 사용. GitHub이 source-of-truth — 충돌 시 확인 요구.
---
# /sowhat:sync — GitHub 변경 감지 + 로컬 반영

이 커맨드는 GitHub의 변경사항을 감지하여 로컬 파일에 반영한다.

## 실행 절차

### 1. config.json 로드

`planning/config.json`을 로드하여 GitHub repo 정보와 섹션 목록을 가져온다.

### 2. GitHub Issues 상태 Pull

```bash
# 모든 관련 Issue 상태 가져오기
gh issue list --state all --json number,state,title,labels,body,comments --limit 100
```

### 3. 변경 감지 + 반영

각 섹션에 대해 로컬 상태와 GitHub 상태를 비교한다.

#### Label 변경 → frontmatter status 업데이트

GitHub Issue의 label이 로컬 status와 다르면:

```
감지: Issue #{number} label 변경 ({old_label} → {new_label})
```

- label → status 매핑:
  - `draft` → `draft`
  - `discussing` → `discussing`
  - `settled` → `settled`
  - `needs-revision` → `needs-revision`
  - `invalidated` → `invalidated`

- 섹션 파일의 frontmatter `status` 업데이트
- config.json의 해당 섹션 `status` 업데이트

**역전파 처리**: `needs-revision`이나 `invalidated`로 변경된 경우, 하위 의존 섹션이 존재하면 자동 invalidate 전에 확인한다:

```
⚠️  역전파 감지: {섹션}이 {이전 status} → {새 status}로 변경됩니다.
    영향받는 하위 섹션: {목록}

[1] 자동 invalidate — 하위 섹션도 invalidated로 변경
[2] 건너뜀 — 하위 섹션은 현재 상태 유지
```

선택 후 진행:
- `[1]`: 하위 섹션 `invalidated`로 변경 + 해당 GitHub Issues도 label 변경
- `[2]`: 현재 섹션만 업데이트, 하위 섹션 유지

#### 댓글 추가 → Open Questions에 append

```bash
# Issue의 댓글 가져오기
gh issue view {number} --json comments
```

새 댓글이 있으면 해당 섹션의 `## Open Questions`에 추가:

```markdown
## Open Questions
- [ ] {기존 질문}
- [ ] [GitHub @{author}] {댓글 내용 요약} (#{issue_number})
```

#### body 수정 → GitHub Edits에 append

GitHub Issue body가 로컬 파일과 다르면 `## GitHub Edits`에 기록:

```markdown
## GitHub Edits
> GitHub에서 직접 수정된 내용. 반영 여부는 인간이 결정.

### {current_date} 수정 감지
{변경된 부분 요약}
```

**반영 여부는 인간이 결정한다** — 자동 반영하지 않는다.

### 4. config.json 업데이트

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`last_sync`를 현재 datetime으로 업데이트한다.

### 5. 결과 출력

변경이 있으면:
```
🔄 Sync 완료 ({current_datetime})

변경사항:
  - Issue #2 label 변경: discussing → needs-revision
    → 01-problem.md status 업데이트
    → 02-solution.md invalidated (역전파)
  - Issue #3 댓글 2개 → 02-solution.md Open Questions에 추가
  - Issue #4 body 수정 감지 → 03-scope.md GitHub Edits에 기록

다음: /sowhat:expand {section} → 역전파된 섹션 재전개
```

변경이 없으면:
```
✅ Sync 완료 — 변경 없음
```

### 6. Git commit (변경이 있는 경우)

```bash
git add -A
git commit -m "sync: github changes ({변경 요약})"
```

## GitHub API 실패 시

```
⚠️ GitHub API 실패 — 로컬 상태로 계속합니다.
  에러: {error_message}
  다음: gh auth login 또는 네트워크 확인
```

경고만 출력하고 로컬 상태를 유지한다. 작업을 중단하지 않는다.

## 핵심 원칙

- **Source of truth: GitHub** — GitHub의 상태가 우선
- **body 수정은 자동 반영하지 않는다** — 인간이 결정
- **역전파는 즉시 실행** — label 변경 시
- **API 실패 시 경고 후 계속** — 블로킹하지 않는다
