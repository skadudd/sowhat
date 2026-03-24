# /sowhat:init — 프로젝트 초기화 + Thesis 핑퐁

<!--
@metadata
checkpoints:
  - type: decision
    when: "Answer 후보 선택"
  - type: decision
    when: "Key Arguments 구성"
config_reads: []
config_writes: [project, github, layer, sections, last_sync, features]
continuation:
  primary: "/sowhat:expand 01-{section}"
  alternatives: ["/sowhat:progress"]
status_transitions: ["(none) → draft"]
-->

이 커맨드는 sowhat 프로젝트를 초기화한다. 인간이 project name과 rough idea를 입력하면, Claude가 핑퐁을 통해 thesis를 도출한다.

## 실행 절차

### 0. 환경 체크

```bash
agent-browser --version 2>/dev/null
```

미설치 시:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  필수 도구 미설치: agent-browser

  sowhat Sub-Research 기능에 필요합니다.
  (Vercel Labs 개발 — AI agent용 고성능 브라우저)
  설치하지 않으면 Sub-Research 기능이 비활성화됩니다.

  [1] 지금 설치 (권장)
  [2] 나중에 설치 (Sub-Research 비활성화로 계속)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[1] 선택 시:**

```bash
# agent-browser CLI 설치
npm install -g agent-browser

# Chrome for Testing 다운로드
agent-browser install

# 설치 검증
agent-browser --version
```

```
✅ agent-browser 설치 완료 — Sub-Research 활성화됨
```

**[2] 선택 시:** `planning/config.json`의 `features.sub_research`를 `"disabled"`로 설정한다 (Step 11에서 처리).

---

### 1. 입력 수집

인간에게 다음을 요청한다:
- **프로젝트 이름** (영문 kebab-case)
- **대략적인 아이디어** (자유 형식)

입력이 `$ARGUMENTS`에 포함되어 있으면 그것을 사용한다.

### 2. IBIS Issue 프레이밍 (NEW)

SCQ 구조화 전에, 먼저 핵심 Issue(문제)를 명확히 한다.
IBIS 방법론에서 모든 논의는 핵심 Issue 질문에서 시작한다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 해결하려는 핵심 Issue(문제)는 무엇입니까?
   (IBIS: 모든 논의는 핵심 Issue에서 시작합니다)

──── 예시 ────
  "어떻게 하면 B2B SaaS 이탈률을 줄일 수 있는가?"
  "왜 우리 팀의 생산성이 목표의 60%에 머무는가?"
  "어떤 GTM 전략으로 6개월 내 PMF를 달성할 수 있는가?"

──── 제안 ────
  [1] {프로젝트 이름과 아이디어 기반으로 생성한 Issue 질문}
  [2] {대안 Issue 질문}
  [3] 직접 입력
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

인간이 Issue를 확정하면 다음 단계로 진행한다.

### 3. SCQ 핑퐁

Issue를 기반으로 Situation/Complication/Question을 도출하기 위해 **질문만** 한다. 절대 내용을 대신 채우지 않는다.

**한 번에 하나의 질문**만 한다. 인간의 답변을 듣고 다음 질문을 결정한다.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ {질문}

──── 예시 ────
  "{답변 예시}"  ({annotation})

──── 제안 ────
  [1] {대화 내용에서 추론한 구체적 제안}
  [2] {대안 제안}

──── 기타 ────
  [3] 직접 작성
  [4] 잘 모르겠다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

질문 레퍼토리 (상황에 맞게 선택):
- "이 문제가 해결되지 않으면 어떤 일이 생기는가?"
- "지금 이 시점에 이것을 만드는 이유는?"
- "성공한다면 무엇이 달라지는가?"
- "이것의 핵심 사용자는 누구인가?"
- "기존 대안이 있다면, 왜 부족한가?"

### 4. SCQ 구조화

충분한 대화가 이루어지면, 인간의 답변을 바탕으로 구조화하여 **제안**한다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 이 구조가 맞습니까?

  Situation:   {현재 상황 — 독자가 동의할 수 있는 사실}
  Complication: {문제 또는 긴장}
  Question:    {핵심 질문}

──── 제안 ────
  [1] 확정
  [2] 수정 필요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Answer (So What?) 도출

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ Question에 대한 Answer는 무엇입니까?
   (한 문장으로 — 이것이 이 프로젝트의 핵심 주장이 됩니다)

──── 예시 ────
  "{프로젝트 맥락에 맞는 Answer 예시}"

──── 제안 ────
  [1] {대화에서 추론한 Answer}
  [2] {대안 Answer}

──── 기타 ────
  [3] 직접 작성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Answer는 **한 문장**이어야 한다. 모호하면 재핑퐁: "이 Answer가 구체적으로 무엇을 하겠다는 것인가?"

### 6. Key Arguments 도출

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ Answer를 지지하는 핵심 논거들은 무엇입니까?
   (각 논거는 하위 섹션 파일로 전개됩니다)

──── 예시 ────
  "시장 규모가 충분히 크다"  (시장 논거)
  "기술적으로 실현 가능하다"  (실행 가능성 논거)
  "경쟁 우위가 있다"  (차별화 논거)

──── 제안 ────
  [1] {논거 1}
  [2] {논거 2}
  [3] {논거 3}

──── 기타 ────
  [4] 논거 추가/수정
  [5] 확정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Claude가 초안을 제안할 수 있지만, 최종 결정은 인간이 한다.

### 7. 디렉터리 생성

```bash
mkdir -p logs maps/local research planning
```

### 8. 파일 생성

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

## Issue (IBIS)
> {인간이 확정한 핵심 Issue 질문}

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

### 9. Git 초기화

```bash
git init
git add -A
git commit -m "init: create thesis draft"
```

### 10. GitHub 연결

```bash
# GitHub repo 생성 (private)
gh repo create {project-name} --private --source=. --push

# thesis Issue 생성 (frontmatter 제거 후)
sed '1,/^---$/d; 1,/^---$/d' 00-thesis.md > /tmp/thesis-body.md
gh issue create --title "Thesis: {Answer 한 줄 요약}" --body-file /tmp/thesis-body.md --label "draft"
```

Issue 번호를 기록한다.

### 11. planning/config.json 생성

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
  "last_sync": "{current_datetime}",
  "research": {
    "count": 0,
    "unreviewed": 0,
    "last_research": null
  },
  "features": {
    "sub_research": "enabled",
    "sub_research_engine": "agent-browser",
    "sub_research_fallback": "websearch"
  }
}
```

### 12. 각 Key Argument에 대한 Issue 생성

각 논거에 대해 GitHub Issue를 생성하고, config.json의 sections에 추가한다.

```bash
gh issue create --title "{논거 제목}" --body "섹션: {N}-{section-name}.md\n\nthesis_argument: {논거}" --label "draft"
```

config.json sections에 추가:
```json
"{N}-{section-name}": { "issue": {issue_number}, "status": "draft" }
```

### 13. 세션 로그 생성

`logs/session.md`를 Write 도구로 덮어쓴다 (resume이 읽는 표준 경로):

```markdown
---
command: init
section: 00-thesis
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
init 완료 — {project-name} 프로젝트 초기화. Thesis draft 생성. Answer: {Answer 한 줄}

## 재개 시 첫 질문
/sowhat:settle thesis → thesis를 settled로 전환
```

### 14. 완료 안내

```
✅ sowhat 프로젝트 초기화 완료
  - 00-thesis.md 생성 (status: draft)
  - GitHub repo: {owner}/{project-name}
  - Issues: #{numbers}
  - logs/session.md 생성

---

## ▶ 다음

**00-thesis: Thesis 확정** — Thesis를 settled로 전환

`/sowhat:settle thesis`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---

**또한 가능:**
- `/sowhat:expand {section}` — 섹션 전개 시작

---
```

## 핵심 원칙

- **IBIS Issue 먼저** — SCQ 전에 핵심 문제를 하나의 질문으로 확정한다
- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **인간이 답한 것을 구조화한다** — 인간의 말을 재구성하되 의미를 바꾸지 않는다
- **Answer 확정 전까지 thesis settled 불가**
- **모호한 Answer는 재핑퐁** — 명확해질 때까지
