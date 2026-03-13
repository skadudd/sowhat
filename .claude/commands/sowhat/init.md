---
model: claude-sonnet-4-6
---
# /sowhat:init — 프로젝트 초기화 + Thesis 핑퐁

이 커맨드는 sowhat 프로젝트를 초기화한다. 인간이 project name과 rough idea를 입력하면, Claude가 핑퐁을 통해 thesis를 도출한다.

## 실행 절차

### 1. 입력 수집

인간에게 다음을 요청한다:
- **프로젝트 이름** (영문 kebab-case)
- **대략적인 아이디어** (자유 형식)

입력이 `$ARGUMENTS`에 포함되어 있으면 그것을 사용한다.

### 2. Thesis 핑퐁

Situation/Complication/Question/Answer를 도출하기 위해 **질문만** 한다. 절대 내용을 대신 채우지 않는다.

질문 예시 (이 중 적절한 것을 선택하되, 상황에 맞게 변형):
- "이 문제가 해결되지 않으면 어떤 일이 생기는가?"
- "지금 이 시점에 이것을 만드는 이유는?"
- "성공한다면 무엇이 달라지는가?"
- "이것의 핵심 사용자는 누구인가?"
- "기존 대안이 있다면, 왜 부족한가?"

**한 번에 하나의 질문**만 한다. 인간의 답변을 듣고 다음 질문을 결정한다.

### 3. SCQ 구조화

충분한 대화가 이루어지면, 인간의 답변을 바탕으로 다음을 구조화하여 **제안**한다:
- **Situation**: 현재 상황 (독자가 동의할 수 있는 사실)
- **Complication**: 문제 또는 긴장
- **Question**: 핵심 질문

인간이 확인하면 다음 단계로 진행한다.

### 4. Answer (So What?) 도출

Question에 대한 Answer를 인간에게 요청한다.
- Answer는 **한 문장**이어야 한다.
- 모호하면 재핑퐁: "이 Answer가 구체적으로 무엇을 하겠다는 것인가?"

### 5. Key Arguments 도출

Answer를 지지하는 핵심 논거들을 인간에게 요청한다.
- Claude가 초안을 제안할 수 있지만, 최종 결정은 인간이 한다.
- 각 논거는 하위 섹션 파일로 전개될 것임을 안내한다.

### 6. 파일 생성

현재 datetime을 가져온다:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`00-thesis.md`를 생성한다:

```markdown
---
status: draft
version: 1
created: {current_datetime}
updated: {current_datetime}
---

## Situation
> {인간이 답한 내용}

## Complication
> {인간이 답한 내용}

## Question
> {인간이 답한 내용}

## Answer (So What?)
> {인간이 확정한 한 문장}

## Key Arguments
- [ ] {논거 1} → 01-{section-name}.md
- [ ] {논거 2} → 02-{section-name}.md
- [ ] {논거 3} → 03-{section-name}.md

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 | init | {current_date} |

## Open Questions
- [ ]
```

### 7. Git 초기화

```bash
git init
git add -A
git commit -m "init: create thesis draft"
```

### 8. GitHub 연결

```bash
# GitHub repo 생성 (private)
gh repo create {project-name} --private --source=. --push

# thesis Issue 생성
gh issue create --title "Thesis: {Answer 한 줄 요약}" --body-file 00-thesis.md --label "draft"
```

Issue 번호를 기록한다.

### 9. .planning/config.json 생성

```json
{
  "project": "{project-name}",
  "github": {
    "repo": "{owner}/{project-name}",
    "token_env": "GITHUB_TOKEN"
  },
  "layer": "planning",
  "sections": {
    "00-thesis": { "issue": {issue_number}, "status": "draft" }
  },
  "last_sync": "{current_datetime}"
}
```

### 10. 각 Key Argument에 대한 Issue 생성

각 논거에 대해 GitHub Issue를 생성하고, config.json의 sections에 추가한다.

### 11. 완료 안내

```
✅ sowhat 프로젝트 초기화 완료
  - 00-thesis.md 생성 (status: draft)
  - GitHub repo: {owner}/{project-name}
  - Issues: #{numbers}

다음: /sowhat:settle thesis → thesis를 settled로 전환
      /sowhat:expand {section} → 섹션 전개 시작
```

## 핵심 원칙

- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **인간이 답한 것을 구조화한다** — 인간의 말을 재구성하되 의미를 바꾸지 않는다
- **Answer 확정 전까지 thesis settled 불가**
- **모호한 Answer는 재핑퐁** — 명확해질 때까지
