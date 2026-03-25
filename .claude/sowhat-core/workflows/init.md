# /sowhat:init — 프로젝트 초기화 + Thesis 핑퐁

<!--
@metadata
checkpoints:
  - type: decision
    when: "Answer 후보 선택"
  - type: decision
    when: "Key Arguments 구성"
config_reads: []
config_writes: [project, mode, source, github, layer, sections, last_sync, features]
continuation:
  primary: "/sowhat:expand 01-{section}"
  alternatives: ["/sowhat:progress"]
status_transitions: ["(none) → draft"]
-->

이 커맨드는 sowhat 프로젝트를 초기화한다. 두 가지 모드를 지원한다:
- **idea 모드** (기본): 인간이 project name과 rough idea를 입력하면, Claude가 핑퐁을 통해 thesis를 도출한다.
- **content-critique 모드** (`--from`): 외부 콘텐츠를 분석 대상으로 삼아, 인간이 그에 대한 입장을 세운다.

## 인자 파싱

`$ARGUMENTS`에서 `--from` 플래그를 확인한다:

| 인자 패턴 | 모드 | 설명 |
|-----------|------|------|
| `--from https://...` | content-critique (URL) | URL에서 콘텐츠를 가져옴 |
| `--from file:{path}` 또는 `--from {local-path}` | content-critique (파일) | 로컬 파일을 읽음 |
| (없음 또는 --from 없음) | idea | 기존 동작 그대로 |

모드를 결정하고 이후 단계에서 조건 분기한다. `--from` 외 나머지 인자는 기존대로 처리한다.

## 실행 절차

### 0. 환경 체크

```bash
agent-browser --version 2>/dev/null
```

미설치 시:

```
----------------------------------------
⚠️  필수 도구 미설치: agent-browser

  sowhat Sub-Research 기능에 필요합니다.
  (Vercel Labs 개발 — AI agent용 고성능 브라우저)
  설치하지 않으면 Sub-Research 기능이 비활성화됩니다.

  [1] 지금 설치 (권장)
  [2] 나중에 설치 (Sub-Research 비활성화로 계속)
----------------------------------------
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

#### idea 모드 (기본)

인간에게 다음을 요청한다:
- **프로젝트 이름** (영문 kebab-case)
- **대략적인 아이디어** (자유 형식)

입력이 `$ARGUMENTS`에 포함되어 있으면 그것을 사용한다.

#### content-critique 모드 (`--from`)

인간에게 **프로젝트 이름** (영문 kebab-case)만 요청한다.

그 후 대상 콘텐츠를 가져온다:
- **URL**: `WebFetch`로 콘텐츠를 가져온다.
- **파일**: `Read`로 파일을 읽는다 (PDF, markdown, text 지원).

```
----------------------------------------
📄 대상 콘텐츠를 가져왔습니다

  출처: {URL 또는 파일 경로}
  길이: ~{단어 수}자
  요약: {콘텐츠의 3문장 요약}

  [1] 확인 — 분석 시작
  [2] 다시 가져오기
  [3] 취소 — idea 모드로 전환
----------------------------------------
```

URL fetch 실패 시:
```
❌ URL을 가져올 수 없습니다: {error}
  [1] 다른 URL 입력
  [2] file: 모드로 로컬 파일 직접 제공
  [3] idea 모드로 전환
```

### 1.5. 대상 콘텐츠 Toulmin 분석 (content-critique 모드 전용)

가져온 콘텐츠를 Toulmin 구조로 분석한다. Claude가 분석하고 인간이 확인한다:

```
----------------------------------------
📄 대상 콘텐츠 Toulmin 분석

  Claim:     {대상의 핵심 주장}
  Grounds:   {주요 근거 1-3개}
  Warrant:   {논리적 연결 — 암묵적이면 "(암묵적)" 표기}
  Qualifier: {주장의 확실성 수준}
  Rebuttal:  {대상이 인정한 제한 조건 — 없으면 "(없음)"}

  [1] 분석 확인 — 다음 단계로
  [2] 분석 수정 필요
----------------------------------------
```

[2] 선택 시 인간이 수정할 부분을 지시하면 Claude가 반영한다. 확정될 때까지 반복.

분석 결과를 변수로 저장: `target_claim`, `target_grounds`, `target_warrant`, `target_qualifier`, `target_rebuttal`

### 1.6. 입장 선택 (content-critique 모드 전용)

```
----------------------------------------
❓ 이 콘텐츠에 대한 당신의 입장은?

  [1] 반박 (refute) — 대상의 주장이 틀렸다
  [2] 비평 (critique) — 대상의 주장에 약점이 있다
  [3] 대안 제시 (alternative) — 더 나은 방법이 있다
  [4] 부분 동의 (partial) — 일부만 동의한다
----------------------------------------
```

선택한 입장을 `stance` 변수로 저장한다. 이후 SCQ 핑퐁에서 대상 콘텐츠와 입장이 컨텍스트로 사용된다.

### 2. IBIS Issue 프레이밍

SCQ 구조화 전에, 먼저 핵심 Issue(문제)를 명확히 한다.
IBIS 방법론에서 모든 논의는 핵심 Issue 질문에서 시작한다.

**content-critique 모드**: Issue 제안 시 대상 콘텐츠의 Claim과 사용자의 stance를 반영한다. 예: stance=refute → "대상의 주장 '{target_claim}'은 정당한가?", stance=alternative → "'{target_claim}'보다 더 나은 접근은 무엇인가?"

```
❓ 해결하려는 핵심 Issue(문제)는 무엇입니까?
   (IBIS: 모든 논의는 핵심 Issue에서 시작합니다)

  예) "어떻게 하면 B2B SaaS 이탈률을 줄일 수 있는가?"
  예) "왜 우리 팀의 생산성이 목표의 60%에 머무는가?"

[1] {프로젝트 이름과 아이디어 기반으로 생성한 Issue 질문}
[2] {대안 Issue 질문}
[3] 직접 입력
```

인간이 Issue를 확정하면 다음 단계로 진행한다.

### 3. SCQ 핑퐁

Issue를 기반으로 Situation/Complication/Question을 도출하기 위해 **질문만** 한다. 절대 내용을 대신 채우지 않는다.

**한 번에 하나의 질문**만 한다. 인간의 답변을 듣고 다음 질문을 결정한다.

**content-critique 모드**: 질문이 대상 콘텐츠를 참조한다. 예:
- "대상이 '{target_grounds}'를 근거로 들었는데, 이에 대한 당신의 반응은?"
- "대상의 Warrant '{target_warrant}'가 성립하지 않는 경우는?"
- "대상이 놓치고 있는 핵심 맥락은 무엇인가?"

```
❓ {질문}

  예) "{답변 예시}" ({annotation})

[1] {대화 내용에서 추론한 구체적 제안}
[2] {대안 제안}
[3] 직접 작성
[4] 잘 모르겠다
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
❓ 이 구조가 맞습니까?

  Situation:    {현재 상황 — 독자가 동의할 수 있는 사실}
  Complication: {문제 또는 긴장}
  Question:     {핵심 질문}

[1] 확정
[2] 수정 필요
```

### 5. Answer (So What?) 도출

```
❓ Question에 대한 Answer는 무엇입니까?
   (한 문장으로 — 이것이 이 프로젝트의 핵심 주장이 됩니다)

  예) "{프로젝트 맥락에 맞는 Answer 예시}"

[1] {대화에서 추론한 Answer}
[2] {대안 Answer}
[3] 직접 작성
```

Answer는 **한 문장**이어야 한다. 모호하면 재핑퐁: "이 Answer가 구체적으로 무엇을 하겠다는 것인가?"

### 6. Key Arguments 도출

```
❓ Answer를 지지하는 핵심 논거들은 무엇입니까?
   (각 논거는 하위 섹션 파일로 전개됩니다)

  예) "시장 규모가 충분히 크다" (시장 논거)
  예) "기술적으로 실현 가능하다" (실행 가능성 논거)

[1] {논거 1}
[2] {논거 2}
[3] {논거 3}
[4] 논거 추가/수정
[5] 확정
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

**content-critique 모드 전용**: `## Issue (IBIS)` 바로 다음에 `## Source Content` 섹션을 추가한다. idea 모드에서는 이 섹션을 **생성하지 않는다**.

```markdown
## Source Content
> 분석 대상: {URL 또는 파일 경로}
> 입장: {반박|비평|대안 제시|부분 동의}

### 대상 Toulmin 분석
| Field | Content |
|-------|---------|
| Claim | {target_claim} |
| Grounds | {target_grounds} |
| Warrant | {target_warrant} |
| Qualifier | {target_qualifier} |
| Rebuttal | {target_rebuttal} |
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

**idea 모드:**
```json
{
  "project": "{project-name}",
  "mode": "idea",
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

**content-critique 모드** (위에 추가):
```json
{
  "project": "{project-name}",
  "mode": "content-critique",
  "source": {
    "type": "url",
    "url": "{source_url}",
    "stance": "{refute|critique|alternative|partial}",
    "fetched": "{current_datetime}"
  },
  ...
}
```

`source.type`이 `"file"`이면 `"url"` 대신 `"path"` 필드를 사용한다:
```json
"source": {
  "type": "file",
  "path": "{file_path}",
  "stance": "{stance}",
  "fetched": "{current_datetime}"
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

----------------------------------------
다음 액션:

[1] Thesis 확정 (settle thesis)
[2] 첫 섹션 전개 (expand 01)
[3] 전체 상태 확인 (progress)
[4] 대상 콘텐츠 비평 (critic) — content-critique 모드
----------------------------------------
```

content-critique 모드에서는 추가로 안내:
```
💡 content-critique 모드 활성화됨
  - /sowhat:critic — 대상 콘텐츠의 약점을 체계적으로 분석
  - /sowhat:debate {section} --stance persuade — 설득 모드 토론
```

## 핵심 원칙

- **IBIS Issue 먼저** — SCQ 전에 핵심 문제를 하나의 질문으로 확정한다
- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **인간이 답한 것을 구조화한다** — 인간의 말을 재구성하되 의미를 바꾸지 않는다
- **Answer 확정 전까지 thesis settled 불가**
- **모호한 Answer는 재핑퐁** — 명확해질 때까지
