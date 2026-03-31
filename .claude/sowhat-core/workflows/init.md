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

---

## Research 모드 (`--research`) — 자료 기반 Bottom-Up Thesis 도출

**idea 모드와의 핵심 차이**: idea 모드는 "주장이 먼저, 근거는 나중" (top-down). research 모드는 "근거가 먼저, 주장은 근거에서 도출" (bottom-up).

### R-0. 프로젝트 이름 + 관심 영역 입력

```
❓ 프로젝트 이름은? (영문 kebab-case)
```

```
❓ 어떤 영역/주제에 대한 논증을 만들고 싶습니까?
   (thesis는 아직 없어도 됩니다. 관심 영역만 알려주세요)

  예) "국내 SaaS 시장의 현재 상태"
  예) "원격근무가 생산성에 미치는 영향"
  예) "우리 팀의 기술 부채 문제"
```

인간이 관심 영역을 제시하면 `topic` 변수에 저장한다.

### R-1. 자료 수집 (Collect Phase)

`--research` 뒤에 소스가 지정되어 있으면 해당 소스를 수집한다. 없으면 대화로 수집:

```
----------------------------------------
📚 자료 수집

  현재 관심 영역: "{topic}"

  자료를 추가하세요. 혼합 가능합니다:

  [1] URL 입력 (논문, 기사, 보고서)
  [2] 파일 경로 (file:{path})
  [3] 폴더 경로 (dir:{path})
  [4] 토픽 검색 (WebSearch로 자동 수집)
  [5] 수집 완료 — 분석으로 진행
----------------------------------------
```

사용자가 [5]를 선택할 때까지 반복. 각 소스 추가 시 즉시 확인:

```
✅ 추가됨: {source} ({type})
   현재 {N}개 소스 수집됨

  [1] 추가  [5] 수집 완료
```

**최소 1개 소스 필수.** 0개에서 [5] 선택 시: `❌ 최소 1개 이상의 자료가 필요합니다.`

소스 목록을 `collected_sources[]` 배열에 저장한다.

### R-2. 자료 분석 (Analysis Phase)

각 소스를 분석한다. 기존 research 워크플로의 분석 로직을 재사용:

- **URL**: `WebFetch`로 내용 추출 + Tier 판정
- **파일**: `Read`로 내용 추출 + Tier 판정
- **폴더**: `Glob` + `Read`로 파일별 분석 + 종합
- **토픽**: `WebSearch` + 상위 3~5개 `WebFetch` + Tier 판정

각 소스에서 추출:
1. **핵심 데이터 포인트** (수치, 통계, 사실)
2. **주요 주장** (소스 저자의 claim)
3. **근거** (주장을 뒷받침하는 evidence)
4. **출처 신뢰도** (Tier 판정)

`research/` 디렉터리에 파인딩 파일로 저장한다 (기존 research 워크플로와 동일 형식).
단, `status: pre-thesis` (thesis 도출 전이므로 `relevant_sections`는 비워둠).

분석 진행 중 대시보드:
```
📊 분석 중... [{완료}/{전체}]
  ✅ {source_1} — {Tier}, {N}건 발견
  🔄 {source_2} — 분석 중...
  ⬜ {source_3} — 대기
```

### R-3. 종합 (Synthesis Phase)

모든 소스 분석이 완료되면 종합한다:

1. **데이터 포인트 합산**: 전체 소스에서 추출된 사실/수치 통합
2. **합의점 식별**: 여러 소스가 동의하는 것 (convergent evidence)
3. **충돌점 식별**: 소스 간 상반되는 주장
4. **패턴 발견**: 데이터에서 도출할 수 있는 추세/패턴
5. **갭 식별**: 자료에서 다루지 않지만 중요한 빈 영역
6. **근거 강도 평가**: Tier 분포, 데이터 양, 합의 수준

종합 결과를 `research/SYNTHESIS.md`에 저장:

```markdown
---
type: synthesis
sources: {N}
created: {datetime}
---

# Research Synthesis: {topic}

## 핵심 데이터 포인트
1. {수치/사실} — {출처} (T{N})
2. {수치/사실} — {출처} (T{N})

## 합의점 (여러 소스 동의)
- {합의 사항} — {소스 수}개 소스 확인

## 충돌점
- {소스A}: "{주장}" vs {소스B}: "{반대 주장}"

## 발견된 패턴
- {패턴 설명}

## 정보 갭
- {누락 영역}

## Tier 분포
T1: {N} | T2: {N} | T3: {N} | T4: {N}
```

### R-4. 종합 리뷰 + 인간 인사이트 주입 (Thesis Emergence)

두 단계로 나뉜다: **(A) 자료가 말하는 것** → **(B) 인간이 보는 것**.

#### R-4A. 종합 결과 제시 (자료가 말하는 것)

종합 결과를 인간에게 보여준다. 이 단계에서는 thesis를 제안하지 않는다 — 사실만 전달:

```
----------------------------------------
📊 자료 종합 완료

  소스: {N}개 분석  |  데이터 포인트: {M}개
  합의점: {N}건  |  충돌점: {N}건
  Tier 분포: T1:{N} T2:{N} T3:{N} T4:{N}

  핵심 합의점:
  - {합의 1}
  - {합의 2}

  핵심 충돌점:
  - {소스A} vs {소스B}: {충돌 설명}

  발견된 패턴:
  - {패턴 1}

  정보 갭:
  - {아직 모르는 것}
----------------------------------------
```

#### R-4B. 인간 인사이트 주입 (인간이 보는 것)

자료 종합을 본 인간에게 **자기 관점**을 물어본다:

```
❓ 이 자료들을 보고 어떤 생각이 드십니까?

  아직 thesis가 아니어도 됩니다.
  자료에서 보이는 것, 직감, 경험, 가설, 의문 — 무엇이든.

  예) "시장은 크지만 진입 시점이 핵심인 것 같다"
  예) "데이터는 긍정적인데 내 경험상 함정이 있다"
  예) "합의점보다 충돌점이 더 흥미롭다 — 왜 의견이 갈리는지"
  예) "여기에 없는 관점이 있다: {인간만 아는 내부 정보}"

  [직접 입력]
```

인간의 입력을 `human_insight` 변수에 저장한다.

**추가 핑퐁 (선택적):**
인간의 인사이트가 모호하면 Claude가 구체화 질문을 한다:

```
❓ "{human_insight}"에서 더 구체적으로:
  - 이 생각의 근거는 무엇입니까? (경험? 직감? 다른 데이터?)
  - 자료에서 이 방향을 뒷받침하는 것이 있습니까?
  - 자료가 이 방향과 **모순되는** 부분은 괜찮습니까?
```

인간의 인사이트가 수집된 자료와 **충돌**할 수 있다 — 그것도 정당한 방향이다. 단, 충돌을 명시한다:

```
ℹ️ 자료와의 관계:
  ✅ 뒷받침: 파인딩 #{N}, #{M}이 이 방향을 지지
  ⚠️ 충돌: 파인딩 #{K}가 반대 방향 ({충돌 내용 한 줄})
  ❓ 미확인: 이 방향에 대한 직접적 자료 없음

  충돌이 있어도 진행 가능합니다.
  자료가 틀렸을 수도 있고, 자료가 다루지 않는 맥락이 있을 수 있습니다.
```

#### R-4C. Thesis 후보 제안 (근거 + 인사이트 결합)

자료 종합 + 인간 인사이트를 **결합**하여 thesis 후보를 제안한다:

```
❓ 자료 + 당신의 인사이트를 결합한 Thesis 후보:

  [1] "{인간 인사이트 기반, 자료가 뒷받침하는 Thesis}"
      근거: 파인딩 #{N}, #{M} (T1, T2) + 인간 인사이트
      근거 강도: ████████░░ 강함

  [2] "{순수 자료 기반 Thesis — 인사이트와 다른 방향}"
      근거: 파인딩 #{N}, #{M}, #{K} (T1, T2)
      근거 강도: ██████████ 매우 강함

  [3] "{인간 인사이트 기반, 자료가 부분적으로만 뒷받침}"
      근거: 파인딩 #{N} (T2) + 인간 인사이트
      ⚠️ 파인딩 #{K}와 충돌 — expand에서 Rebuttal로 다룰 필요
      근거 강도: ████░░░░░░ 보통

  [4] 직접 작성
  [5] 추가 자료 수집 필요 → R-1로 돌아감
  [6] 인사이트 수정 → R-4B로 돌아감
```

**제안 원칙:**
- [1]을 **인간 인사이트 반영 후보**로, [2]를 **순수 자료 후보**로 항상 대비
- 인간 인사이트가 자료와 충돌하면 [3]처럼 명시하되 거부하지 않음
- 각 후보에 근거 강도 바를 표시 — 어떤 방향이 더 단단한지 시각적으로
- **인간 인사이트와 자료의 교집합이 가장 강한 thesis** — 인간의 직관 + 데이터의 객관성

인간이 선택하면 `thesis_answer` 변수에 저장.

**[4] 직접 작성 시:** 인간이 작성한 thesis와 수집된 자료의 관계를 즉시 분석:
```
입력하신 Thesis: "{thesis}"

자료와의 관계:
  ✅ 뒷받침 파인딩: #{N}, #{M} ({Tier})
  ⚠️ 충돌 파인딩: #{K} ({충돌 내용})
  ❓ 관련 없는 파인딩: #{J}

  [1] 이대로 진행
  [2] 수정
```

### R-4 --auto 모드 동작

`--auto` 플래그가 있으면:
- **R-4A**: 종합 결과를 출력하되 인간 입력 대기 없이 바로 R-4C로
- **R-4B**: 건너뜀 (인사이트 주입 없음)
- **R-4C**: 근거 강도가 가장 높은 후보를 자동 선택. 선택 결과만 출력:
  ```
  ✅ Thesis 자동 선택: "{thesis}"
     근거 강도: ██████████ ({T1 N건 + T2 N건})
  ```

---

### R-5. Key Arguments 자동 매핑 (Evidence Mapping)

선택된 thesis를 뒷받침하는 근거들을 **자동으로** Key Arguments에 그룹핑한다:

1. 수집된 데이터 포인트를 thesis와의 관련성으로 분류
2. 관련 데이터 포인트를 주제별로 클러스터링 → Key Argument 후보
3. 각 Key Argument에 매핑된 파인딩 번호를 기록

```
❓ 자료에서 도출된 Key Arguments 구조:

  [1] "{논거 1}" — 근거: 파인딩 #{N}, #{M} ({Tier 분포})
  [2] "{논거 2}" — 근거: 파인딩 #{N}, #{M} ({Tier 분포})
  [3] "{논거 3}" — 근거: 파인딩 #{N} ({Tier 분포})

  ⚠️ 미매핑 파인딩: #{N}, #{M} — 관련 Key Argument 없음

  [확정] 이 구조로 진행
  [수정] Key Argument 추가/수정
  [리서치] 미매핑 파인딩 기반으로 추가 Key Argument 제안
```

### R-6. SCQ 역도출 (Reverse SCQ)

idea 모드는 SCQ → Answer 순서지만, research 모드는 Answer(thesis)가 이미 있으므로 **역순**으로 SCQ를 구성한다:

```
❓ Thesis(Answer)로부터 SCQ를 역구성합니다:

  Answer: "{thesis_answer}"

  역도출된 SCQ:
  Situation:    {Answer가 전제하는 현재 상황}
  Complication: {이 상황에서의 문제/긴장}
  Question:     {이 Answer가 답하는 질문}

  [1] 확정
  [2] 수정 필요
```

이후 IBIS Issue도 역도출:
```
  Issue: {Question에서 파생된 핵심 Issue}
```

### R-7. 이후 기존 흐름으로 합류

Step 7(디렉터리 생성) 이후는 idea 모드와 동일하게 진행한다. 차이점:

1. **`00-thesis.md`에 `## Research Base` 섹션 추가**:
   ```markdown
   ## Research Base
   > 모드: research (bottom-up)
   > 소스: {N}개
   > 파인딩: {M}건
   > Synthesis: research/SYNTHESIS.md
   ```

2. **파인딩 파일 `relevant_sections` 업데이트**: 매핑된 Key Argument에 따라 각 파인딩의 `relevant_sections`를 채움

3. **파인딩 `status`를 `pre-thesis` → `accepted`로 전환**: thesis와 매핑된 파인딩만 전환. 미매핑은 `unreviewed`로.

4. **config.json에 `mode: "research"` 기록**:
   ```json
   {
     "mode": "research",
     "research_sources": [
       { "type": "url", "source": "..." },
       { "type": "file", "source": "..." }
     ],
     ...
   }
   ```

5. **expand 시 파인딩 자동 참조**: research 모드 프로젝트에서 expand를 실행하면, 해당 섹션에 매핑된 파인딩을 Grounds 후보로 자동 제시. expand 스텝 4(Grounds) 시작 시:
   ```
   ℹ️ 이 섹션에 매핑된 리서치 파인딩 {N}건:
     [R1] #{NNN}: {핵심 발견} (T{N})
     [R2] #{NNN}: {핵심 발견} (T{N})

   이 파인딩을 Grounds에 활용하시겠습니까?
   [1] 전부 활용
   [2] 선택적 활용
   [3] 직접 작성 (파인딩 무시)
   ```

### R-8. 추가 자료 수집 (init 이후)

프로젝트 초기화 후에도 `/sowhat:research`로 추가 자료를 수집할 수 있다. research 모드 프로젝트는 기존 research 워크플로와 완전히 호환된다.

---

## --auto 파이프라인 (research + auto 조합)

`/sowhat:init --research --auto`일 때의 전체 흐름.

**인간 개입 지점은 딱 두 곳**: (1) 최초 소스 수집, (2) critical checkpoint.

### 전체 흐름

```
[인간] 소스 수집 (R-1 대화형)
  ↓ "수집 완료"
[자동] R-2 분석 → R-3 종합 → R-4 thesis 자동 선택
  ↓
[자동] R-5 Key Args 매핑 → R-6 역 SCQ → R-7 파일 생성
  ↓
[자동] settle thesis (자동 승인)
  ↓
[자동] /sowhat:autonomous 실행
  │     (expand → mini-debate → settle → strength-check)
  │     ⚠️ critical checkpoint 시 일시정지 → 인간 개입 → 재개
  ↓
[자동] /sowhat:challenge 실행
  │     ⚠️ critical/major 이슈 발견 시 일시정지
  │     통과 시 계속
  ↓
[자동] /sowhat:draft 실행 (기본 프로파일)
  ↓
완료 리포트
```

### 소스 수집 (유일한 대화형 단계)

`--auto`여도 소스 수집(R-1)은 대화형으로 유지한다. 인간만 자료를 제공할 수 있다.

```
----------------------------------------
📚 Research + Auto 모드

  자료를 추가하세요. "수집 완료" 입력 시 자동 진행됩니다.
  (thesis 도출 → 전개 → 검증 → 산출물 생성까지 자동)

  [1] URL 입력
  [2] 파일 경로 (file:{path})
  [3] 폴더 경로 (dir:{path})
  [4] 토픽 검색
  [5] 수집 완료 → 자동 파이프라인 시작
----------------------------------------
```

[5] 이후 인간 입력 없이 전체 파이프라인 실행.

### autonomous 연결

init 완료 후 thesis를 자동 settle하고 autonomous를 실행한다:

```
settle thesis → autonomous 실행 시:
  - --skip-debate 없음 (mini-debate 포함)
  - --max-rounds 2 (기본값)
  - checkpoint 정책: autonomous 기존과 동일
    - thesis 방향 변경 → PAUSE
    - critical issue → PAUSE
    - claim broken → PAUSE
    - 3회 연속 settle 실패 → PAUSE
```

PAUSE 발동 시:
```
⚠️  AUTO PIPELINE 일시정지

  이유: {checkpoint 유형}
  현재 진행: {autonomous N/M 섹션}

  [1] 문제 해결 후 자동 재개
  [2] 수동 모드로 전환 (자동 파이프라인 종료)
  [3] 파이프라인 중단
```

[1] 선택 → 인간이 문제를 해결하면 나머지 파이프라인 자동 재개.
[2] 선택 → 이후 인간이 수동으로 expand/settle/challenge/draft 실행.

### challenge 연결

autonomous 완료 후 (Post-Autonomous challenge 포함) 추가 이슈가 없으면 draft로 진행.
이슈 있으면:

```
⚠️  Challenge에서 {N}건 발견

  [1] 자동 수정 후 재도전 (revise → re-challenge)
  [2] 수동 모드로 전환
  [3] 무시하고 draft 진행 (⚠️ 이슈 있는 상태로 산출물 생성)
```

[1] 선택 시: 각 이슈를 자동 revise → challenge 재실행 (최대 2회 반복).

### draft 연결

challenge 통과 후 draft를 자동 실행한다.

**기본 프로파일 적용:**
- 유형: 보고서 (report)
- 독자: 일반 (general)
- 길이: 중간 (medium)
- 시리즈: 단일 (single)

```
✅ Auto Pipeline 완료

  소스: {N}개 분석
  Thesis: "{thesis_answer}"
  섹션: {M}개 settled
  논증 강도: {score}/100
  산출물: drafts/{filename}

  총 소요: {시간}

  다음:
  [1] 산출물 확인 및 수정
  [2] 다른 프로파일로 재산출 (/sowhat:draft --profile)
  [3] 논증 강화 (/sowhat:debate)
```

### --auto + --profile 조합

draft 프로파일을 지정하고 싶으면:
```
/sowhat:init --research --auto --profile blog
/sowhat:init --research --auto --profile prd
/sowhat:init --research --auto --profile slide
```

`--profile` 없으면 기본값(report) 적용.

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
