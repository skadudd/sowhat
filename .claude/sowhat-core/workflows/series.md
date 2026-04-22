# /sowhat:series — 시리즈 콘텐츠 관리

<!--
@metadata
checkpoints:
  - type: decision
    when: "시리즈 생성 시 캐릭터/아크 확정"
  - type: decision
    when: "에피소드 등록 시 번호 확정"
config_reads: [project, series]
config_writes: [series]
continuation:
  primary: "/sowhat:init --series {name} --episode {N}"
  alternatives: ["/sowhat:series status", "/sowhat:series digest"]
status_transitions: []
-->

이 커맨드는 크로스 프로젝트 시리즈 콘텐츠를 관리한다. 각 에피소드는 독립적인 sowhat 프로젝트이며, 시리즈 레이어는 에피소드 간 맥락 연결, 용어 일관성, 서사 흐름을 추적한다.

> **AI Content Boundary**: 시리즈 digest·arc·terminology 작성 시 AI는 원본 에피소드 섹션의 인용만 사용 — 재구성·구체값 추가 금지. 에피소드 digest의 구체값은 원본 섹션의 source tag를 그대로 보존 (`[source:#NNN]` 등). shared-research 항목은 원본 finding ID 참조 필수. 상세: `references/ai-content-boundary.md`.

## 데이터 모델

시리즈 데이터는 **로컬 프로젝트 기반**으로 저장된다. 각 시리즈는 독립된 git repo이며, 에피소드는 시리즈 루트의 하위 디렉터리이다:

```
{series-root}/                    ← git repo (시리즈 루트)
  series/                         ← 시리즈 메타
    series.json
    arc.md
    terminology.json
    digests/
      ep-{NN}-{project}.md
    shared-research/
      pool.md
  ep-01-{name}/                   ← 에피소드 1 (sowhat 프로젝트)
    00-thesis.md
    planning/
    research/
    export/
    logs/
  ep-02-{name}/                   ← 에피소드 2
    ...
```

**글로벌 인덱스 (경량):** `~/.claude/sowhat-series/index.json`

시리즈 루트 경로만 기록하는 경량 인덱스. 시리즈 목록 조회 및 경로 해석에 사용된다.

```json
{
  "series": {
    "ai-vibe-coding": {
      "path": "/absolute/path/to/ai-vibe-coding",
      "title": "AI 바이브 코딩 시리즈",
      "created": "2026-03-31T10:00:00Z"
    }
  }
}
```

**series.json** (`{series-root}/series/series.json`):
```json
{
  "name": "ai-vibe-coding",
  "title": "AI 바이브 코딩 시리즈",
  "created": "2026-03-31T10:00:00Z",
  "updated": "2026-03-31T14:00:00Z",
  "character": "tech-blogger",
  "target_audience": "개발자 및 기술 리더",
  "episodes": [
    {
      "number": 1,
      "project_path": "ep-01-vibe-coding-intro",
      "project_name": "vibe-coding-intro",
      "title": "바이브 코딩이란 무엇인가",
      "status": "published",
      "thesis_answer": "바이브 코딩은...",
      "digest_file": "digests/ep-01-vibe-coding-intro.md",
      "settled_date": "2026-03-20T..."
    },
    {
      "number": 2,
      "project_path": null,
      "project_name": null,
      "title": "바이브 코딩 도구 생태계",
      "status": "planned",
      "thesis_answer": null,
      "digest_file": null,
      "settled_date": null
    }
  ],
  "episode_statuses": ["planned", "in-progress", "settled", "drafted", "published"]
}
```

**terminology.json:**
```json
{
  "terms": {
    "바이브 코딩": {
      "definition": "AI 도구를 활용하여 자연어 지시로 코드를 작성하는 개발 방식",
      "first_used": "ep-01",
      "section": "01-definition",
      "aliases": ["vibe coding"]
    }
  }
}
```

## 인자 파싱

`$ARGUMENTS`에서 서브커맨드를 파싱한다:

| 인자 패턴 | 서브커맨드 | 설명 |
|-----------|-----------|------|
| `create {name}` | create | 시리즈 생성 (기존 프로젝트 안에서 실행하면 승격 모드) |
| `promote` | create (승격) | 현재 프로젝트를 시리즈 Ep 1로 승격 (`create`의 단축) |
| `list` | list | 시리즈 목록 |
| `add {series-name}` | add | 현재 프로젝트를 에피소드로 등록 |
| `digest [episode]` | digest | 에피소드 다이제스트 생성 |
| `arc [series-name]` | arc | 서사 흐름 보기/편집 |
| `terms [series-name]` | terms | 용어 사전 보기/편집 |
| `check [series-name]` | check | 일관성 검사 |
| `status [series-name]` | status | 현황 대시보드 |
| (없음) | help | 사용법 안내 |

서브커맨드가 없거나 인식 불가 시:
```
❓ 시리즈 관리 — 서브커맨드를 선택하세요.

  /sowhat:series create {name}   — 시리즈 생성 (프로젝트 안이면 승격)
  /sowhat:series promote          — 현재 프로젝트를 시리즈 Ep 1로 승격
  /sowhat:series list             — 시리즈 목록
  /sowhat:series add {name}       — 현재 프로젝트를 에피소드로 등록
  /sowhat:series digest [ep]      — 에피소드 다이제스트 생성
  /sowhat:series arc [name]       — 서사 흐름 보기/편집
  /sowhat:series terms [name]     — 용어 사전 보기/편집
  /sowhat:series check [name]     — 일관성 검사
  /sowhat:series status [name]    — 현황 대시보드
```

---

## 서브커맨드: `create {name}` — 시리즈 생성

Interactive 핑퐁으로 시리즈를 생성한다.

### 0. 기존 프로젝트 감지 (승격 모드)

`create` 실행 시 현재 디렉터리에 `planning/config.json`이 존재하는지 확인한다.

**존재하면 (기존 sowhat 프로젝트 안에서 실행):**

```
📋 현재 디렉터리에 sowhat 프로젝트가 감지되었습니다.
  프로젝트: {config.project}
  상태: {settled 수}/{total} settled

❓ 이 프로젝트를 시리즈의 첫 번째 에피소드로 승격하시겠습니까?

  [1] 승격 — 현재 프로젝트를 Ep 1로, 시리즈 구조로 전환
  [2] 별도 생성 — 이 프로젝트와 무관한 새 시리즈를 다른 위치에 생성
```

**[1] 선택 시 → 승격 워크플로우 실행 (아래 "승격 모드" 섹션)**
**[2] 선택 시 → 일반 create 진행 (Step 1부터)**

**존재하지 않으면:** 일반 create 진행 (Step 1부터).

---

### 0-1. 승격 모드 — 기존 프로젝트를 시리즈 Ep 1로 전환

기존 sowhat 프로젝트를 시리즈 구조로 in-place 재구조화한다.

#### 정보 수집

시리즈 이름, 제목, 타겟 독자, 캐릭터, 에피소드 기획, 서사 흐름, 시리즈 Thesis를 일반 create와 동일하게 수집한다 (Step 1~7).

단, 다음이 다르다:
- **Ep 1 제목**: 현재 프로젝트의 thesis Answer에서 자동 제안
- **Ep 1 상태**: 현재 프로젝트의 실제 상태 반영 (`settled` 수 기반)
- **에피소드 기획**: Ep 1은 현재 프로젝트로 확정, Ep 2부터 입력

#### 폴더 재구조화

**[decision] 폴더 재구조화 확인:**

```
⚠️ 폴더 구조가 변경됩니다.

현재:
  {cwd}/
    00-thesis.md
    planning/
    export/
    ...

변경 후:
  {cwd}/                          ← 시리즈 루트
    series/                       ← 시리즈 메타 (신규)
    ep-01-{project-name}/         ← 현재 파일 이동
      00-thesis.md
      planning/
      export/
      ...

  - git 이력은 보존됩니다 (git mv 사용)
  - 모든 상대 경로 참조가 유지됩니다

[1] 진행
[2] 취소
```

**[1] 선택 시 실행:**

```bash
# 현재 datetime
date -u +"%Y-%m-%dT%H:%M:%SZ"

# 에피소드 디렉터리명 결정
EP_DIR="ep-01-{config.project}"

# 시리즈 메타 디렉터리 생성
mkdir -p series/digests series/shared-research

# 기존 프로젝트 파일을 에피소드 디렉터리로 이동
# 이동 대상: sowhat 프로젝트 파일 (series/ 제외한 모든 것)
mkdir -p "$EP_DIR"
git mv 00-thesis.md "$EP_DIR/"
git mv planning/ "$EP_DIR/"
[ -d research/ ] && git mv research/ "$EP_DIR/"
[ -d export/ ] && git mv export/ "$EP_DIR/"
[ -d logs/ ] && git mv logs/ "$EP_DIR/"
[ -d branches/ ] && git mv branches/ "$EP_DIR/"
[ -d maps/ ] && git mv maps/ "$EP_DIR/"
[ -f notes.md ] && git mv notes.md "$EP_DIR/"

# .gitignore, CLAUDE.md 등 루트 파일은 이동하지 않음
```

#### 시리즈 메타 파일 생성

일반 create의 Step 9과 동일하게 `series/series.json`, `series/arc.md`, `series/terminology.json`, `series/shared-research/pool.md` 생성.

단, `episodes[0]`은 현재 프로젝트 정보로 채운다:

```json
{
  "number": 1,
  "project_path": "ep-01-{project}",
  "project_name": "{config.project}",
  "title": "{Ep 1 제목}",
  "status": "{현재 상태 기반 — settled이면 'settled', draft 있으면 'drafted'}",
  "thesis_answer": "{00-thesis.md의 Answer}",
  "digest_file": null,
  "settled_date": "{마지막 settle 시각 또는 null}"
}
```

#### 에피소드 config.json 업데이트

`{EP_DIR}/planning/config.json`에 series 필드 추가:

```json
"series": {
  "name": "{series_name}",
  "episode": 1,
  "series_root": ".."
}
```

#### 다이제스트 자동 생성

Ep 1이 settled 상태이면 자동으로 다이제스트를 생성한다 (digest 서브커맨드 로직 호출).
settled가 아니면 건너뛴다.

#### 용어 사전 자동 추출

Ep 1의 settled 섹션에서 핵심 용어를 자동 추출하여 `series/terminology.json`에 초기 등록한다.
추출 방법: 각 섹션의 Claim에서 반복 등장하는 핵심 개념어를 식별.
사용자에게 확인:

```
📖 Ep 1에서 추출한 핵심 용어:
  - {term1}: "{자동 추출 정의}"
  - {term2}: "{자동 추출 정의}"

[1] 수락
[2] 수정 후 수락
[3] 건너뛰기
```

#### 글로벌 인덱스 등록

일반 create의 Step 10과 동일.

#### Git 커밋

```bash
git add -A
git commit -m "series: promote {project} to series {series_name} (Ep 1)"
```

#### 완료 안내

```
✅ 시리즈 승격 완료: {series_title}

  기존 프로젝트 → Ep 1: {ep1_title}
  캐릭터: {character 또는 "(미설정)"}
  에피소드: {N}편 계획 (Ep 1 = 현재 프로젝트)
  위치: {cwd}/
  
  폴더 구조:
    series/          ← 시리즈 메타
    ep-01-{name}/    ← 현재 프로젝트 (이동됨)

다음 액션:
  [1] 다음 에피소드 시작 (/sowhat:init --series {series_name} --episode 2)
  [2] Ep 1 다이제스트 생성 (/sowhat:series digest 1)
  [3] 시리즈 현황 (/sowhat:series status)
```

---

### 1. 시리즈 이름

`{name}` 인자가 있으면 사용, 없으면 질문:

```
❓ 시리즈 이름은? (영문 kebab-case)
  예) ai-vibe-coding, startup-lessons
```

이름을 `series_name`으로 저장.

### 2. 시리즈 제목

```
❓ 시리즈 제목은? (한국어 가능)
  예) "AI 바이브 코딩 시리즈", "스타트업 생존기"
```

### 3. 타겟 독자

```
❓ 시리즈의 타겟 독자는?
  예) "개발자 및 기술 리더", "예비 창업자", "일반 대중"
```

### 4. 캐릭터 선택

`~/.claude/sowhat-characters/` 디렉터리를 스캔하여 사용 가능한 캐릭터를 나열:

```
❓ 시리즈에 사용할 글쓰기 캐릭터를 선택하세요.

사용 가능한 캐릭터:
  [1] tech-blogger — 기술 블로그 전문 목소리
  [2] academic — 학술적 톤
  [0] 나중에 설정 (캐릭터 없이 진행)
  [N] 새 캐릭터 생성 (/sowhat:character)
```

[N] 선택 시: `/sowhat:character`를 안내하고 시리즈 생성을 일시 중단.
[0] 선택 시: `character` 필드를 `null`로 설정.

### 5. 에피소드 기획

```
❓ 시리즈 에피소드를 기획하세요.

각 에피소드의 제목을 입력하세요 (빈 줄로 종료):
  Ep 1: 
  Ep 2:
  ...

(나중에 /sowhat:series add로 추가할 수도 있습니다)
```

입력된 에피소드를 `episodes[]` 배열로 저장. 모두 `"status": "planned"`.

### 6. 서사 흐름 (arc) 설정

에피소드 수를 기반으로 Act 구조를 제안:

```
❓ 시리즈의 전체 서사 흐름을 정의하세요.

추천 구조:
  Act 1 (정의/현황): Ep 1-{N/3} → Situation 확립
  Act 2 (심화/한계): Ep {N/3+1}-{2N/3} → Complication 전개
  Act 3 (미래/제언): Ep {2N/3+1}-{N} → Answer 도달

[1] 추천 수락
[2] 직접 입력
```

[2] 선택 시: Act별 이름과 에피소드 범위를 직접 입력받는다.

### 7. 시리즈 Thesis

```
❓ 시리즈 전체가 주장하는 바는 무엇입니까? (한 문장)
  (전체 에피소드를 관통하는 핵심 주장)

  예) "바이브 코딩은 소프트웨어 개발의 민주화를 실현한다"

[1] 직접 입력
[2] 나중에 결정 (TBD)
```

### 8. 시리즈 루트 위치 결정

```
❓ 시리즈 폴더를 어디에 만들까요?
  현재 위치: {cwd}

  [1] 여기에 생성 ({cwd}/{series_name}/)     ← 추천
  [2] 다른 위치 지정
```

[2] 선택 시 경로를 입력받는다. 최종 경로를 `series_root`에 저장.

### 9. 파일 생성

현재 datetime을 가져온다:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

디렉터리 생성:
```bash
mkdir -p {series_root}/series/digests
mkdir -p {series_root}/series/shared-research
```

Git 초기화:
```bash
cd {series_root} && git init
```

**{series_root}/series/series.json** 생성:
```json
{
  "name": "{series_name}",
  "title": "{series_title}",
  "created": "{current_datetime}",
  "updated": "{current_datetime}",
  "character": "{character_name 또는 null}",
  "target_audience": "{target_audience}",
  "episodes": [
    {
      "number": 1,
      "project_path": null,
      "project_name": null,
      "title": "{ep1_title}",
      "status": "planned",
      "thesis_answer": null,
      "digest_file": null,
      "settled_date": null
    }
  ],
  "episode_statuses": ["planned", "in-progress", "settled", "drafted", "published"]
}
```

**{series_root}/series/arc.md** 생성:

```markdown
# Series Arc: {series_title}

## Series Thesis
> (시리즈 전체가 주장하는 바)
> "{user_thesis 또는 TBD}"

## Episode Arc

### Act 1: {act1_name} (Ep {range})
{에피소드 목록 + 한 줄 설명}

### Act 2: {act2_name} (Ep {range})
{에피소드 목록}

### Act 3: {act3_name} (Ep {range})
{에피소드 목록}

## Narrative Progression Rules
- 각 에피소드는 다음 에피소드가 답할 질문으로 마무리한다
- Act 1은 Situation을 확립한다 (공유 이해 기반)
- Act 2는 Complication을 전개한다 (문제의 깊이)
- Act 3은 Answer를 도달한다 (해결과 제언)
```

**{series_root}/series/terminology.json** 생성:
```json
{
  "terms": {}
}
```

**{series_root}/series/shared-research/pool.md** 생성:
```markdown
# Shared Research Pool: {series_title}

시리즈 전체에서 공유되는 리서치 자료 인덱스.

## Sources
(에피소드 진행 시 자동 추가)
```

### 10. 글로벌 인덱스 등록

`~/.claude/sowhat-series/index.json`에 시리즈 경로를 등록한다.

```bash
mkdir -p ~/.claude/sowhat-series
```

**⚠️ 공유 레지스트리 갱신 규칙 (반드시 준수):**

이 파일은 사용자의 **모든 sowhat 프로젝트가 공유하는 전역 레지스트리**다. 손상되면 `series list`, `series status`, `init --series` 등이 전역적으로 깨진다. 따라서:

1. **파일이 없는 경우에만** Write로 아래 스키마 전체 생성
2. **파일이 이미 존재하면 반드시 Edit 도구를 사용해 surgical 추가**. Read→Write 전체 덮어쓰기는 금지 (파싱 오류 시 타 프로젝트 엔트리 유실 위험)
   - Edit의 `old_string`: `"series": {` 블록 직후의 첫 엔트리 또는 닫는 `}` 주변 고유 문자열
   - `new_string`: 기존 문자열 + 새 엔트리 (쉼표 처리 주의)
3. **같은 `{series_name}` 엔트리가 이미 존재하면** 즉시 중단하고 사용자에게 고지: `⚠️ 시리즈 이름 '{series_name}'이 이미 등록되어 있습니다. 덮어쓸까요?`
4. **변경 전 반드시 Read로 현재 상태 확인** 후 기존 엔트리 목록을 사용자에게 한 줄 고지: `글로벌 인덱스에 '{series_name}' 추가 (기존: {N}개 엔트리 보존)`

새 엔트리 스키마:

```json
{
  "series": {
    "{series_name}": {
      "path": "{series_root의 절대 경로}",
      "title": "{series_title}",
      "created": "{current_datetime}"
    }
  }
}
```

### 11. Git 커밋

```bash
cd {series_root}
git add -A
git commit -m "init: create series {series_name}"
```

### 12. 완료 안내

```
✅ 시리즈 생성: {series_title}
  캐릭터: {character 또는 "(미설정)"}
  에피소드: {N}편 계획
  위치: {series_root}/

다음 액션:
  [1] 첫 에피소드 시작 (/sowhat:init --series {series_name} --episode 1)
  [2] 서사 흐름 편집 (/sowhat:series arc {series_name})
  [3] 시리즈 현황 (/sowhat:series status {series_name})
```

---

## 서브커맨드: `list` — 시리즈 목록

`~/.claude/sowhat-series/index.json`을 읽어 등록된 시리즈 목록을 표시한다.

파일이 없거나 `series` 객체가 비어 있으면:
```
📚 등록된 시리즈가 없습니다.
  /sowhat:series create {name}으로 시리즈를 생성하세요.
```

각 시리즈의 경로에서 `{path}/series/series.json`을 읽어 목록 출력 (경로가 유효하지 않으면 `⚠️ 경로 없음` 표시):

```
----------------------------------------
📚 sowhat 시리즈 목록

이름                  제목                        에피소드     진행
----------------------------------------
ai-vibe-coding       AI 바이브 코딩 시리즈         3/5편       Ep2 진행중
startup-lessons      스타트업 레슨                 1/3편       Ep1 작성중

**사용:**
  /sowhat:series status ai-vibe-coding
  /sowhat:series create new-series
----------------------------------------
```

진행 상태는 첫 번째 `in-progress` 에피소드를 표시. 없으면 마지막 완료 에피소드 또는 "시작 전".

---

## 서브커맨드: `add {series-name}` — 현재 프로젝트를 에피소드로 등록

### 사전 검증

1. 현재 디렉터리의 `planning/config.json` 로드
   - 없으면: `❌ sowhat 프로젝트가 아닙니다. /sowhat:init으로 초기화하세요.`
2. `~/.claude/sowhat-series/index.json`에서 `{series-name}`의 경로를 찾고, `{path}/series/series.json` 로드
   - 없으면: `❌ 시리즈를 찾을 수 없습니다: {series-name}. /sowhat:series create {series-name}으로 먼저 생성하세요.`
3. config.json에 이미 `series` 필드가 있으면:
   - 같은 시리즈: `⚠️ 이미 이 시리즈에 등록되어 있습니다 (Ep{N}).`
   - 다른 시리즈: `⚠️ 이미 다른 시리즈에 등록되어 있습니다: {other_series}. 변경합니까? [1] 예 [2] 아니오`

### 에피소드 번호 결정

`planned` 상태인 에피소드가 있으면:

```
❓ 어떤 에피소드에 등록합니까?

계획된 에피소드:
  [1] Ep 1: {title} (planned)
  [2] Ep 2: {title} (planned)
  [3] Ep 3: {title} (planned)
  [N] 새 에피소드 추가
```

`planned` 에피소드가 없으면 자동으로 다음 번호를 할당.

### 등록 실행

1. `planning/config.json`에 `series` 필드 추가:
   ```json
   "series": {
     "name": "{series-name}",
     "episode": {N},
     "series_root": ".."
   }
   ```
   `"series_root": ".."` — 에피소드 디렉터리에서 시리즈 루트로의 상대 경로. 에피소드는 시리즈 루트의 직접 하위 디렉터리이므로 항상 `".."`이다.

2. `series.json`에 에피소드 정보 업데이트:
   - `project_path`: 시리즈 루트 기준 상대 경로 (예: `"ep-02-tools"`)
   - `project_name`: config.json의 `project` 값
   - `status`: `"in-progress"`

3. `series.json`의 `updated` 필드를 현재 datetime으로 갱신.

### 완료 안내

```
✅ 에피소드 등록 완료
  시리즈: {series_title}
  에피소드: Ep {N} — {episode_title}
  프로젝트: {project_name}

다음 액션:
  [1] 이전 에피소드 다이제스트 확인 (/sowhat:series digest {N-1})
  [2] 시리즈 현황 (/sowhat:series status {series-name})
```

---

## 서브커맨드: `digest [episode]` — 에피소드 다이제스트 생성

다이제스트는 에피소드 간 맥락 전달의 핵심 메커니즘이다.

### 에피소드 결정

`[episode]` 인자가 있으면 해당 에피소드, 없으면:
1. 현재 프로젝트가 시리즈에 등록되어 있으면 해당 에피소드 번호 사용
2. 아니면 질문:
   ```
   ❓ 다이제스트를 생성할 에피소드 번호는?
   ```

### 사전 검증

1. 에피소드의 `project_path`가 설정되어 있고, `{series-root}/{project_path}/` 디렉터리가 존재하는지 확인
   - 없으면: `❌ Ep{N}의 프로젝트 경로가 설정되지 않았습니다.`
2. 해당 프로젝트의 `{series-root}/{project_path}/00-thesis.md` 로드
3. settled 상태인 섹션 파일 로드

### 다이제스트 생성

에피소드 프로젝트의 논증 데이터를 분석하여 다이제스트를 생성한다:

```markdown
# Episode {N} Digest: {title}

## Thesis
Answer: {00-thesis.md의 Answer 전문}

## 확립된 결론 (Established Conclusions)
(다음 에피소드의 전제로 사용 가능)
1. "{01 섹션의 Claim}" — qualifier: {Q}, scheme: {S}
   핵심 근거: {가장 강한 Ground, 한 줄}
2. "{02 섹션의 Claim}" — qualifier: {Q}, scheme: {S}
   핵심 근거: {가장 강한 Ground}

## 열린 실마리 (Open Threads)
(다음 에피소드 후보 주제)
- {01 섹션의 Open Question}
- {인정했지만 완전히 대응하지 못한 Rebuttal}
- {debate/challenge 과정에서 발견된 Gap}

## 사용된 용어 (Terms Defined)
- {용어}: {이 에피소드에서 사용된 정의}

## 핵심 리서치 (Key Research)
- {Finding}: {source, 한 줄} → {적용 섹션}

## 시리즈 연결 메모 (Series Connection Notes)
- 이전 에피소드 참조: {어떤 에피소드의 어떤 결론을 전제로 사용했는가}
- 다음 에피소드 암시: {에피소드 마지막에 제기된 질문}
```

### 파일 저장

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`{series-root}/series/digests/ep-{NN}-{project_name}.md`에 저장.
NN은 두 자리 (01, 02, ...).

`series.json`의 해당 에피소드 `digest_file` 필드 업데이트.

### 용어 자동 추출

다이제스트 생성 시 "사용된 용어" 섹션의 용어를 `terminology.json`에 자동 추가.
이미 존재하는 용어는 건너뛴다 (기존 정의 유지).

### 완료 안내

```
✅ 다이제스트 생성: Ep {N} — {title}
  확립된 결론: {M}건
  열린 실마리: {K}건
  새 용어: {L}건 추가됨
  위치: {series-root}/series/digests/ep-{NN}-{project_name}.md

다음 액션:
  [1] 다음 에피소드 시작 (/sowhat:init --series {series-name} --episode {N+1})
  [2] 용어 사전 확인 (/sowhat:series terms {series-name})
  [3] 일관성 검사 (/sowhat:series check {series-name})
```

---

## 서브커맨드: `arc [series-name]` — 서사 흐름 보기/편집

### 시리즈 결정

`[series-name]` 인자가 있으면 사용, 없으면:
1. 현재 프로젝트의 config.json에서 `series.name` 확인
2. 없으면: `~/.claude/sowhat-series/index.json`에서 시리즈 목록 표시 후 선택 요청

시리즈 루트 경로 해석: `~/.claude/sowhat-series/index.json`에서 `{series-name}`의 `path`를 가져온다.

### 동작

`{series-root}/series/arc.md` 파일의 내용을 표시한다:

```
----------------------------------------
📖 서사 흐름: {series_title}

{arc.md 전체 내용}
----------------------------------------

[1] 편집
[2] 종료
```

[1] 선택 시: 대화형으로 수정할 부분을 지정.

```
🔧 서사 흐름 편집

  [1] Series Thesis 변경
  [2] Act 이름/범위 변경
  [3] 에피소드 설명 수정
  [4] Narrative Progression Rules 수정
  [5] 전체 재작성
  [6] 완료
```

수정 후 `arc.md` 파일을 업데이트하고 `series.json`의 `updated`를 갱신.

---

## 서브커맨드: `terms [series-name]` — 용어 사전 보기/편집

### 시리즈 결정

`arc`와 동일한 로직.

### 동작

`terminology.json`의 용어를 표시:

```
----------------------------------------
📖 용어 사전: {series_title}

  용어                    정의                                첫 사용
  ----------------------------------------
  바이브 코딩             AI 도구를 활용하여...                 ep-01
  프롬프트 엔지니어링      AI에게 효과적인 지시를...             ep-02

  총 {N}개 용어
----------------------------------------

[1] 용어 추가
[2] 용어 수정
[3] 용어 삭제
[4] 전체 에피소드 용어 일관성 검사
[5] 종료
```

#### [1] 용어 추가

```
❓ 추가할 용어:
❓ 정의:
❓ 첫 사용 에피소드 (예: ep-01):
❓ 별칭 (쉼표로 구분, 없으면 빈 줄):
```

#### [2] 용어 수정

```
❓ 수정할 용어 이름:
```

해당 용어의 현재 값을 표시하고 수정할 필드를 선택.

#### [3] 용어 삭제

```
❓ 삭제할 용어 이름:
  ⚠️ "{용어}"를 삭제합니까? [1] 예 [2] 아니오
```

#### [4] 용어 일관성 검사

각 에피소드의 settled 섹션과 draft를 스캔하여 용어 사전의 정의와 다르게 사용된 경우를 보고:

```
🔍 용어 일관성 검사

✅ "바이브 코딩" — 3개 에피소드에서 일관적
⚠️ "프롬프트 엔지니어링" — Ep3에서 다른 의미로 사용됨
  사전: "AI에게 효과적인 지시를 작성하는 기술"
  Ep3: "AI 모델의 입력을 최적화하는 학문" (02-deep-dive.md)
  → 사전 정의를 업데이트하거나 Ep3를 수정하세요
```

---

## 서브커맨드: `check [series-name]` — 크로스 에피소드 일관성 검사

### 시리즈 결정

`arc`와 동일한 로직.

### 검사 항목

다이제스트가 있는 에피소드를 대상으로 5가지 검사를 실행:

#### 1. 용어 일관성

`terminology.json`의 용어가 각 에피소드에서 일관되게 사용되는지 검사.

#### 2. 주장 모순

에피소드 간 다이제스트의 "확립된 결론"을 비교하여 충돌하는 Claim을 식별.

#### 3. 캐릭터 이탈

시리즈에 캐릭터가 지정되어 있고 draft가 있는 에피소드에서, `~/.claude/sowhat-characters/{character}/` Voice DNA와 비교하여 일관성 검사.

#### 4. 서사 흐름 정합성

`arc.md`의 Act 구조와 실제 에피소드 다이제스트 내용을 비교:
- Act 1 에피소드가 Situation 확립에 집중하는지
- Act 2 에피소드가 Complication 전개에 집중하는지
- Act 3 에피소드가 Answer 도달에 집중하는지

#### 5. 반복/중복

동일한 Claim이 여러 에피소드에서 반복되는지 검사.

### 출력

```
----------------------------------------
🔍 시리즈 일관성 검사: {series_title}

✅ 용어 일관성: 통과 ({N}개 용어 검사)
⚠️ 주장 충돌: 1건
  Ep1 Claim: "바이브 코딩은 생산성을 30% 높인다"
  Ep3 Claim: "바이브 코딩의 생산성 향상은 미미하다"
  → 의도적이면 arc.md에 "관점 전환" 표시 권장

✅ 캐릭터: 일관 (tech-blogger)
✅ 서사 흐름: 정합
⚠️ 반복: 1건
  "AI 도구의 한계" — Ep2, Ep4에서 유사하게 다룸
  → Ep4에서 Ep2 참조 추가 권장
----------------------------------------
```

---

## 서브커맨드: `status [series-name]` — 시리즈 현황 대시보드

### 시리즈 결정

`arc`와 동일한 로직.

### 출력

`{series-root}/series/series.json`과 각 에피소드 프로젝트의 상태를 종합 (에피소드 경로: `{series-root}/{episode.project_path}/`):

```
----------------------------------------
📊 시리즈 현황: {series_title}

캐릭터: {character}
독자: {target_audience}
에피소드: {completed}/{total}편

Ep   제목                         상태          Thesis
----------------------------------------
1    바이브 코딩이란 무엇인가       published     ✅ settled
2    도구 생태계                    in-progress   🔄 discussing
3    바이브 코딩의 한계              planned       —
4    실전 사례 분석                  planned       —
5    바이브 코딩의 미래              planned       —

다이제스트: Ep1 ✅ | Ep2 ❌ (settle 후 생성 가능)
공유 리서치: {N}건
용어 사전: {M}개

다음 액션:
  [1] 현재 에피소드 계속 (/sowhat:progress in Ep2 project)
  [2] 다이제스트 생성 (/sowhat:series digest 1)
  [3] 일관성 검사 (/sowhat:series check)
  [4] 다음 에피소드 시작 (/sowhat:init --series {series_name} --episode 3)
----------------------------------------
```

`completed`는 `settled`, `drafted`, `published` 상태인 에피소드 수.

Thesis 열은 에피소드 프로젝트의 `00-thesis.md` 상태:
- `✅ settled` — thesis 확정
- `🔄 discussing` — thesis 논의 중
- `📝 draft` — thesis 초안
- `—` — 프로젝트 미생성

---

## 핵심 원칙

- **에피소드는 독립 프로젝트** — 기존 sowhat 워크플로우 그대로 동작
- **시리즈 레이어는 링크 + 요약** — 전체 프로젝트를 복사하지 않고 digest만 참조
- **캐릭터는 시리즈에 바인딩** — 이미 있는 character 시스템 활용
- **리서치 풀은 공유, 논증은 독립** — 같은 자료를 다른 각도로 활용 가능
- **크로스 에피소드 cascade 없음** — 경고만, 자동 invalidation 없음
- **다이제스트가 핵심 연결 메커니즘** — 에피소드 간 맥락 전달의 유일한 인터페이스
