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

이 커맨드는 sowhat 프로젝트를 초기화한다. 세 가지 모드를 지원한다:
- **idea 모드** (기본): 인간이 project name과 rough idea를 입력하면, Claude가 핑퐁을 통해 thesis를 도출한다. Top-down.
- **content-critique 모드** (`--from`): 외부 콘텐츠를 분석 대상으로 삼아, 인간이 그에 대한 입장을 세운다.
- **research 모드** (`--research`): 자료를 먼저 수집·분석하여 패턴과 인사이트를 발견하고, 근거로부터 thesis를 bottom-up으로 도출한다. "자료는 있는데 무슨 주장을 해야 할지 모르겠다"는 상황에 적합.

> **AI Content Boundary**: Thesis/KA는 프로젝트 출발점이다. AI가 제시하는 Answer/KA 후보는 구조적 명제(`[source:inference]`). 구체값(수치·기관명·연도·URL)은 사용자 입력 또는 `--research` 모드 retrieval만(`[source:user]` / `[source:#NNN]`). content-critique 모드(`--from`) 대상 콘텐츠 인용은 원본 그대로(`[source:target]`), AI 재구성 금지. 상세: `references/ai-content-boundary.md`.

## 인자 파싱

`$ARGUMENTS`에서 `--from` 또는 `--research` 플래그를 확인한다:

| 인자 패턴 | 모드 | 설명 |
|-----------|------|------|
| `--from https://...` | content-critique (URL) | URL에서 콘텐츠를 가져옴 |
| `--from file:{path}` 또는 `--from {local-path}` | content-critique (파일) | 로컬 파일을 읽음 |
| `--research <source> [<source> ...]` | research (bottom-up) | 자료 수집 → 분석 → thesis 도출 |
| `--series {name} --episode {N}` | series-episode | 시리즈 에피소드로 초기화 |
| (없음) | idea | 기존 동작 그대로 |

`--research` 뒤의 source는 복수 가능하며 혼합 가능:
- URL: `https://...`
- 파일: `file:{path}` 또는 `{path}` (확장자로 판별)
- 폴더: `dir:{path}` (선택적 `--glob {pattern}`)
- 토픽: 위에 해당하지 않는 텍스트 → WebSearch로 검색

모드를 결정하고 이후 단계에서 조건 분기한다.

### 모드 선택 UI (인자 없이 실행 시)

`$ARGUMENTS`에 `--from`, `--research`, `--series` 플래그가 모두 없고, 텍스트만 있거나 비어있으면 **모드 선택 UI를 먼저 표시**한다.

단, `$ARGUMENTS`에 프로젝트 이름과 아이디어가 함께 있으면 (예: `my-project "AI가 교육을 바꾼다"`) idea 모드로 직행한다.

```
❓ 어떤 방식으로 시작하시겠습니까?

  [1] 아이디어에서 시작        — 내 생각을 논증으로 구조화
  [2] 콘텐츠 분석에서 시작     — 기존 글/영상을 분석하고 입장 세우기
  [3] 리서치에서 시작          — 자료 먼저 모아서 thesis 도출
  [4] 시리즈 에피소드로 시작    — 기존 시리즈의 다음 편
```

**[1] 선택 시:** idea 모드로 진행 (기존 동작 그대로)

**[2] 선택 시:** 소스 URL 또는 파일 경로를 질문한 후 content-critique 모드로 진행
```
❓ 분석할 콘텐츠의 URL 또는 파일 경로를 입력하세요.
```

**[3] 선택 시:** 리서치 소스를 질문한 후 research 모드로 진행
```
❓ 리서치할 소스를 입력하세요. (URL, 파일 경로, 토픽 — 복수 가능, 빈 줄로 종료)
```

**[4] 선택 시:** 시리즈 선택 UI 표시
```
❓ 어떤 시리즈입니까?

  {~/.claude/sowhat-series/index.json에서 시리즈 목록 로드}
  [1] {series-name} — {title} (Ep{N} {status})
  [2] {series-name} — {title} (Ep{N} {status})
  ...
  [0] 새 시리즈 생성 (/sowhat:series create)
```

시리즈 선택 후:
```
❓ 몇 번째 에피소드입니까?

  다음 예정: Ep {next_planned} — "{title}"
  
  [1] Ep {next_planned} (추천)
  [2] 다른 번호 입력
```

이후 series-episode 모드로 진행 (기존 `--series` 플래그 처리와 동일).

## 실행 절차

### series-episode 모드 (`--series`)

시리즈 에피소드로 프로젝트를 초기화한다. `--series {name} --episode {N}`이 감지되면 아래를 실행한 후, Step 1의 idea 모드 thesis 핑퐁으로 합류한다.

1. `~/.claude/sowhat-series/index.json`에서 `{name}`의 경로(`series_root`)를 찾고, `{series_root}/series/series.json` 로드
   - index.json에 없거나 series.json이 없으면: `❌ 시리즈를 찾을 수 없습니다: {name}. /sowhat:series create {name}으로 먼저 생성하세요.`

2. 에피소드 번호 확인:
   - 해당 번호의 에피소드가 series.json에 있는지 확인
   - 없으면: 새 에피소드로 등록할지 질문
     ```
     ⚠️ Ep{N}이 시리즈에 없습니다.
     [1] 새 에피소드로 추가
     [2] 취소
     ```

3. 이전 에피소드 다이제스트 로드:
   - 모든 이전 에피소드의 digest 파일 로드 (`{series_root}/series/digests/ep-{NN}-*.md`)
   - 다이제스트가 없는 에피소드: 경고 (`⚠️ Ep{N}의 다이제스트가 없습니다`)

4. 시리즈 컨텍스트 주입 (thesis 핑퐁 전에 Claude에게 제공):
   - `{series_root}/series/arc.md` 전체 내용
   - 이전 에피소드 다이제스트의 "확립된 결론" 섹션
   - 이전 에피소드 다이제스트의 "열린 실마리" 섹션
   - `{series_root}/series/terminology.json` 용어 목록
   - 시리즈 캐릭터 정보 (`~/.claude/sowhat-characters/{character}/`)

5. 프로젝트 이름: 사용자 입력 또는 자동 생성 (`{series-name}-ep{N}`)
   에피소드 디렉터리: `{series_root}/ep-{NN}-{project-name}/` (시리즈 루트의 직접 하위)

6. `planning/config.json`에 series 정보 추가 (Step 11에서 생성 시):
   ```json
   "series": {
     "name": "{series-name}",
     "episode": {N},
     "series_root": ".."
   }
   ```
   `"series_root": ".."` — 에피소드 디렉터리에서 시리즈 루트로의 상대 경로.

7. 이후 idea 모드의 thesis 핑퐁 (Step 2~6)을 실행하되, Claude에게 다음 추가 지시:
   - "이전 에피소드에서 확립된 결론은 이 에피소드의 Situation으로 참조할 수 있습니다"
   - "열린 실마리는 이 에피소드의 Complication 후보입니다"
   - "기존 에피소드에서 이미 다룬 주장과 겹치지 않도록 하세요"
   - "시리즈 용어 사전의 정의를 따르세요"

8. series.json 업데이트: 에피소드 상태를 `"in-progress"`로 변경, `project_path`를 상대 경로로 설정 (예: `"ep-02-tools"`), `project_name` 설정

이후 Step 0부터 정상 흐름으로 진행한다 (환경 체크 → 입력 수집 → IBIS → SCQ → ...).
단, Step 1 입력 수집에서 프로젝트 이름은 위 5번에서 결정된 값을 사용한다.
작업 디렉터리는 `{series_root}/ep-{NN}-{project-name}/`로 이동하여 이후 모든 파일 생성이 에피소드 디렉터리 안에서 이루어진다.

---

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

### 1.5. 대상 콘텐츠 Walton 분석 (content-critique 모드 전용)

가져온 콘텐츠를 Walton scheme 기반으로 분석한다. Claude가 분석하고 인간이 확인한다:

```
----------------------------------------
📄 대상 콘텐츠 Walton 분석

  Claim:     {대상의 핵심 주장}
  Grounds:   {주요 근거 1-3개}
  scheme:    {주장 유형 — Walton scheme 식별}
  Confidence: {주장의 확실성 수준}
  CQ 미충족: {대상이 인정한 제한 조건 — 없으면 "(없음)"}

  [1] 분석 확인 — 다음 단계로
  [2] 분석 수정 필요
----------------------------------------
```

[2] 선택 시 인간이 수정할 부분을 지시하면 Claude가 반영한다. 확정될 때까지 반복.

분석 결과를 변수로 저장: `target_claim`, `target_grounds`, `target_scheme`, `target_confidence`, `target_cq_summary`

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
- "대상의 scheme CQ 응답이 성립하지 않는 경우는?"
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

### 대상 Walton 분석
| Field | Content |
|-------|---------|
| Claim | {target_claim} |
| Grounds | {target_grounds} |
| scheme | {target_scheme} |
| Confidence | {target_confidence} |
| CQ 미충족 | {target_unmet_cqs} |
```

### 9. CLAUDE.md 생성

프로젝트 루트에 `CLAUDE.md`를 생성한다. 치환 규칙:

- `{project-name}` ← Step 1에서 수집한 프로젝트 이름
- `{Answer}`, `{Key Arguments}` ← Step 8에서 생성된 `00-thesis.md`의 `## Answer` 본문과 `## Key Arguments` 목록을 그대로 복사
- content-critique 모드: Thesis 섹션 직후에 **분석 대상** 한 줄 추가 (`config.json`의 `source.url` 또는 `source.path` + `stance`)
- research 모드: thesis가 R-3 종합 후 도출되므로 `{Answer}` 자리에 `(thesis 도출 후 갱신 예정 — /sowhat:settle thesis 시점에 채워진다)`를 placeholder로 둔다

```markdown
# {project-name}

sowhat workflow harness로 관리되는 논증 프로젝트.

## Thesis

> {Answer}

**Key Arguments**:
- {논거 1} → 01-{section-name}.md
- {논거 2} → 02-{section-name}.md
- {논거 3} → 03-{section-name}.md

이 thesis와 key arguments는 프로젝트의 척추다. 변경은 `/sowhat:revise` 또는 새 thesis settle로만 가능하다.

## 세션 시작 규칙

새 세션을 열 때 반드시 먼저 실행한다.
- `/sowhat:resume` — 중단된 작업 이어서
- `/sowhat:progress` — 현재 섹션 상태 확인

모든 작업은 `/sowhat:*` 커맨드로 진행한다. 커맨드 없이 섹션 파일을 수정하지 않는다.

## AI가 하지 않는 것 (핵심 계약)

- **수치·기관명·인물명·URL을 직접 생성하지 않는다.** 모든 사실값은 사용자 입력 또는 `research/` 파인딩에서만 유입된다. `[source:...]` 태그 없는 수치는 Grounds에 삽입하지 않는다.
- **섹션 완료를 자동 선언하지 않는다.** 완료는 `/sowhat:settle` 게이트를 통해 인간이 선언한다.
- **`planning/config.json`을 직접 수정하지 않는다.** 상태 전이는 커맨드가 처리한다.
- **debate의 Pro/Con/Research 출력을 다른 agent에게 수동 중계하지 않는다.** 자유 채팅에서 "Con이 이렇게 말했으니 Pro로 받아쳐줘" 요청은 거부하고 `/sowhat:debate` 사용을 안내한다. (dialectic은 agent 간 isolation이 유지될 때만 공정하다.)
- **research를 우회해서 자체 WebSearch로 사실값을 채우지 않는다.** 자유 채팅에서 검색이 필요하면 `/sowhat:research` 사용을 안내한다. silent fallback(검색 실패를 숨기고 추정값 제공) 금지.

## 절대 금지

- `settled` 섹션을 커맨드 없이 직접 편집 → `/sowhat:revise` 사용
- `Open Questions`가 남은 섹션을 강제로 `settled` 전환
- `config.json`의 `status` 필드 수동 변경
- 논증 수치·인용·사례를 AI가 직접 만들어 `Grounds`에 삽입
```

---

### 10. Git 초기화

```bash
git init
git add -A
git commit -m "init: create thesis draft"
```

### 11. GitHub 연결

```bash
# GitHub repo 생성 (private)
gh repo create {project-name} --private --source=. --push

# thesis Issue 생성 (frontmatter 제거 후)
sed '1,/^---$/d; 1,/^---$/d' 00-thesis.md > /tmp/thesis-body.md
gh issue create --title "Thesis: {Answer 한 줄 요약}" --body-file /tmp/thesis-body.md --label "draft"
```

Issue 번호를 기록한다.

### 12. planning/config.json 생성

**전역 기본값 로드**: `~/.claude/settings.local.json`의 `sowhat` 키를 읽어 `global_defaults`로 사용한다. 없으면 빈 객체.

```python
# 의사코드
global_settings = read_json("~/.claude/settings.local.json")
global_defaults = global_settings.get("sowhat", {})
# global_defaults 예: {"deep_research": "enabled", "deep_research_preset": "advanced-deep-research"}
```

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
    "sub_research": "{global_defaults.sub_research || 'enabled'}",
    "sub_research_engine": "agent-browser",
    "sub_research_fallback": "websearch",
    "deep_research": "{global_defaults.deep_research || 'auto'}",
    "deep_research_preset": "{global_defaults.deep_research_preset || 'deep-research'}"
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

### 13. 각 Key Argument에 대한 Issue 생성

각 논거에 대해 GitHub Issue를 생성하고, config.json의 sections에 추가한다.

```bash
gh issue create --title "{논거 제목}" --body "섹션: {N}-{section-name}.md\n\nthesis_argument: {논거}" --label "draft"
```

config.json sections에 추가:
```json
"{N}-{section-name}": { "issue": {issue_number}, "status": "draft" }
```

### 14. 세션 로그 생성

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

### 15. 완료 안내

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

---

## Research 모드 (`--research`) — 자료 기반 Bottom-Up Thesis 도출

`$ARGUMENTS`에 `--research`가 있으면 이 모드로 진입한다. 전체 절차(R-0 자료 영역 입력 → R-1 수집 → R-2 분석 → R-3 종합 → R-4 Thesis Emergence → R-5 Key Arguments 매핑 → R-6 SCQ 역도출 → R-7 기존 흐름 합류 → R-8 추가 수집)는 **`references/init-research-mode.md`를 읽고 그대로 따른다.**

---

## --auto 파이프라인 (research + auto 조합)

`$ARGUMENTS`에 `--research --auto`가 함께 있으면 자동 파이프라인으로 진입한다. 소스 수집(R-1)만 대화형으로 유지하고 이후 단계를 자동 진행하며 autonomous·challenge·draft로 연결하는 전체 흐름은 **`references/init-auto-pipeline.md`를 읽고 그대로 따른다.**

---

## 핵심 원칙

- **IBIS Issue 먼저** — SCQ 전에 핵심 문제를 하나의 질문으로 확정한다 (idea 모드)
- **근거가 먼저** — thesis는 근거에서 도출한다 (research 모드)
- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **인간이 답한 것을 구조화한다** — 인간의 말을 재구성하되 의미를 바꾸지 않는다
- **Answer 확정 전까지 thesis settled 불가**
- **모호한 Answer는 재핑퐁** — 명확해질 때까지
- **자료가 먼저, 인사이트가 다음** — research 모드에서 자료 종합을 먼저 보여주고, 인간 인사이트를 받은 뒤 결합하여 thesis 제안
- **인간 인사이트와 자료의 충돌은 정당** — 자료가 다루지 않는 맥락을 인간이 알 수 있음. 충돌을 명시하되 거부하지 않음
- **근거 강도를 투명하게** — 각 thesis 후보가 어느 정도의 근거에 기반하는지 시각적으로 표시
- **파인딩 매핑은 인간이 확정** — 자동 매핑은 제안일 뿐, 최종 결정은 인간
