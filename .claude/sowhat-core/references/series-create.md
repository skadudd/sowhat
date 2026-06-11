# Series — `create {name}` / `promote` 서브커맨드

시리즈 신규 생성 및 기존 프로젝트의 Ep 1 승격(`promote`) 전체 절차 (승격 모드 → 시리즈 메타 입력 → 파일 생성 → 글로벌 인덱스 등록 → 커밋). `workflows/series.md`가 `create`/`promote` 분기에서 이 파일을 읽고 그대로 따른다.

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

`logs/session.md` 완료 저장:
```
---
command: series
section: (auto)
step: complete
status: complete
saved: {current_datetime_ISO8601}
---

## 마지막 컨텍스트
series create 완료 — {series_name} 생성. 에피소드 {N}편 계획.

## 재개 시 첫 질문
/sowhat:init --series {series_name} --episode 1
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
