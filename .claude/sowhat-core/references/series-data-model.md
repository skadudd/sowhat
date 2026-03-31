# 시리즈 데이터 모델 레퍼런스

시리즈의 로컬 프로젝트 기반 디렉터리 구조와 글로벌 인덱스 스키마를 정의한다.

---

## 디렉터리 구조

### 시리즈 루트 (git repo)

```
{series-root}/                    <- git repo (시리즈 루트)
  series/                         <- 시리즈 메타
    series.json                   <- 시리즈 메타데이터 (에피소드 목록 포함)
    arc.md                        <- 매크로 서사 흐름 (Act 구조)
    terminology.json              <- 공유 용어 사전
    digests/
      ep-01-{project}.md          <- 에피소드 다이제스트
      ep-02-{project}.md
    shared-research/
      pool.md                     <- 시리즈 공유 리서치 인덱스
  ep-01-{name}/                   <- 에피소드 1 (sowhat 프로젝트)
    00-thesis.md
    planning/
      config.json
    research/
    export/
    logs/
  ep-02-{name}/                   <- 에피소드 2
    ...
```

### 글로벌 인덱스 (경량)

```
~/.claude/sowhat-series/
  index.json                      <- 모든 시리즈의 경로 매핑
```

---

## 스키마

### index.json (`~/.claude/sowhat-series/index.json`)

시리즈 이름에서 로컬 경로로의 매핑. 시리즈 목록 조회 및 경로 해석에 사용된다.

```json
{
  "series": {
    "{series-name}": {
      "path": "/absolute/path/to/series-root",
      "title": "시리즈 한국어 제목",
      "created": "2026-03-31T10:00:00Z"
    }
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `path` | string | 시리즈 루트의 절대 경로 |
| `title` | string | 시리즈 표시 이름 |
| `created` | ISO 8601 | 시리즈 생성 시각 |

### series.json (`{series-root}/series/series.json`)

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
    }
  ],
  "episode_statuses": ["planned", "in-progress", "settled", "drafted", "published"]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | string | 시리즈 식별자 (kebab-case) |
| `title` | string | 시리즈 표시 이름 |
| `created` | ISO 8601 | 생성 시각 (변경 불가) |
| `updated` | ISO 8601 | 마지막 수정 시각 |
| `character` | string/null | 바인딩된 글쓰기 캐릭터 |
| `target_audience` | string | 타겟 독자 |
| `episodes` | array | 에피소드 목록 |
| `episode_statuses` | array | 유효한 에피소드 상태 값 |

#### episodes[] 항목

| 필드 | 타입 | 설명 |
|------|------|------|
| `number` | integer | 에피소드 번호 |
| `project_path` | string/null | 시리즈 루트 기준 상대 경로 (예: `"ep-01-intro"`) |
| `project_name` | string/null | sowhat 프로젝트 이름 |
| `title` | string | 에피소드 제목 |
| `status` | string | `planned` / `in-progress` / `settled` / `drafted` / `published` |
| `thesis_answer` | string/null | 에피소드 thesis (settle 후 기록) |
| `digest_file` | string/null | `series/digests/` 기준 상대 경로 |
| `settled_date` | ISO 8601/null | settle 완료 시각 |

### 에피소드 config.json series 필드

에피소드 프로젝트의 `planning/config.json`에 포함되는 시리즈 정보:

```json
{
  "series": {
    "name": "ai-vibe-coding",
    "episode": 2,
    "series_root": ".."
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | string | 시리즈 식별자 |
| `episode` | integer | 에피소드 번호 |
| `series_root` | string | 에피소드 디렉터리에서 시리즈 루트로의 상대 경로. 항상 `".."` |

---

## 경로 해석 패턴

### 시리즈 루트 찾기

```
1. index.json에서 series-name으로 path 조회
2. path가 유효한 디렉터리인지 확인
3. {path}/series/series.json 로드
```

### 에피소드 디렉터리에서 시리즈 메타 접근

```
에피소드 cwd: {series-root}/ep-02-tools/
config.json의 series_root: ".."
시리즈 메타: ../series/series.json
서사 흐름:   ../series/arc.md
용어 사전:   ../series/terminology.json
다이제스트:  ../series/digests/ep-01-*.md
```

### 시리즈 루트에서 에피소드 접근

```
시리즈 루트: {series-root}/
에피소드:    {series-root}/{episode.project_path}/
thesis:     {series-root}/{episode.project_path}/00-thesis.md
config:     {series-root}/{episode.project_path}/planning/config.json
```

---

## 마이그레이션 (기존 글로벌 구조 -> 로컬 구조)

기존 `~/.claude/sowhat-series/{name}/` 구조에서 마이그레이션이 필요한 경우:

1. 시리즈 루트 디렉터리 생성 및 git init
2. `~/.claude/sowhat-series/{name}/` 내용을 `{series-root}/series/`로 복사
3. 각 에피소드 프로젝트를 `{series-root}/ep-{NN}-{name}/`으로 이동
4. series.json의 `project_path`를 절대 경로에서 상대 경로로 변환
5. 각 에피소드 config.json의 `series.series_path`를 `series.series_root: ".."`으로 변환
6. `~/.claude/sowhat-series/index.json`에 새 경로 등록
