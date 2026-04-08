# /sowhat:research — 외부 리서치 + 섹션 제안

<!--
@metadata
checkpoints:
  - type: decision
    when: "자율 모드 검색 계획 승인"
  - type: decision
    when: "파인딩 accept/reject"
config_reads: [research, features, credibility]
config_writes: [research]
continuation:
  primary: "/sowhat:research review"
  alternatives: ["/sowhat:expand {section}", "/sowhat:challenge"]
status_transitions: []
-->

이 커맨드는 외부 정보를 조사하여 기존 논리 트리(기획/명세)에 대한 수정 및 추가를 제안한다.

**예외 원칙**: 이 커맨드에서만 Claude가 정보를 가져온다. 단, 결정은 여전히 인간이 한다.

## 인자 파싱

`$ARGUMENTS`에 따라 모드가 결정된다:

| 인자 | 모드 |
|------|------|
| `http://...` 또는 `https://...` | URL 분석 |
| `file:{path}` | 로컬 파일 분석 |
| `dir:{path}` | 폴더 내 파일 일괄 분석 |
| `dir:{path} --glob {pattern}` | 폴더 내 특정 패턴 파일만 분석 |
| URL이 아닌 텍스트 (`file:`/`dir:` 접두어 없음) | 토픽 검색 |
| `--deep {토픽}` | Deep Research (Perplexity) — 토픽 심층 조사 |
| `--deep {URL}` | Deep Research — URL 콘텐츠 검증 + 심층 조사 |
| `--deep` (단독) | Deep Research — 자율 모드 + 심층 조사 |
| `review` | 미검토 파인딩 목록 |
| `review {section}` | 특정 섹션 관련 미검토 파인딩 |
| `accept {N}` | 파인딩 N 수용 |
| `reject {N}` | 파인딩 N 거부 |
| (없음) | 자율 리서치 |

### `--deep` 플래그 파싱

`$ARGUMENTS`에서 `--deep`을 먼저 분리한다:
- `--deep`이 있으면: `deep_mode = true`, 나머지 인자로 모드 결정
- `--deep` 없으면: `deep_mode = false`, 기존 동작
- `--deep` 단독이면: 자율 리서치 + Deep Research

`deep_mode = true`일 때 `config.json`의 `features.deep_research`를 확인한다:
- `"disabled"`: `⚠️ Deep Research가 비활성화되어 있습니다. config.json의 features.deep_research를 확인하세요.` → 기본 모드로 fallback
- `"auto"` 또는 `"enabled"`: 환경변수 `PERPLEXITY_API_KEY` 확인 → 없으면 onboarding 안내 (Deep Research 모드 섹션 참조)

---

## 리서치 엔진 선택 (매 실행마다)

인자 파싱 완료 후, 사전 준비 전에 **반드시** 리서치 엔진 선택 프롬프트를 표시한다.
config 값은 default 선택지로 표시하되, 사용자가 매번 확인·변경할 수 있다.

### 1단계: 엔진 선택

config에서 default를 읽는다:
- `features.deep_research`가 `"auto"` + `PERPLEXITY_API_KEY` 존재 → default: `Deep Research`
- `features.deep_research`가 `"enabled"` → default: `Deep Research`
- `features.deep_research`가 `"disabled"` 또는 API 키 없음 → default: `Web Research`
- `--deep` 플래그가 명시적으로 있으면 → default: `Deep Research` (override)

```
🔍 리서치 엔진 선택

  [1] 🌐 Web Research — WebSearch/WebFetch (빠름, API 키 불필요)
  [2] 🔬 Deep Research — Perplexity API (정밀, 다단계 분석)

  현재 기본값: [{config default}]
  엔터 = 기본값 사용
```

- `[1]` 선택 → `engine = "web"`, 기존 WebSearch/WebFetch 모드로 진행
- `[2]` 선택 → `engine = "deep"`, 2단계로 이동
- API 키 미설정 상태에서 `[2]` 선택 → `❌ PERPLEXITY_API_KEY가 설정되지 않았습니다. /sowhat:config 로 설정하세요.` → 1단계 재표시

### 2단계: Preset 선택 (Deep Research 선택 시만)

config에서 `features.deep_research_preset`을 default로 읽는다 (없으면 `"deep-research"`).

```
🔬 Deep Research Preset 선택

  [1] ⚡ fast-search     — 단일 스텝, 최소 지연 (빠른 사실 확인)
  [2] 🔎 pro-search      — 3스텝, 웹 검색+URL 패치 (일반 리서치)
  [3] 📊 deep-research   — 10스텝, 다단계 분석 (심층 조사)
  [4] 🏛️ advanced-deep   — 10스텝, 최대 깊이 (최대 정밀도)

  현재 기본값: [{config preset}]
  엔터 = 기본값 사용
```

선택 결과를 `selected_preset`에 저장하고 진행한다.

> **config 반영 안 함**: 여기서 선택한 값은 이번 실행에만 적용된다. config를 영구 변경하려면 `/sowhat:config`를 사용한다.

### Challenge Stage 0에서의 엔진 선택

`/sowhat:challenge`의 Stage 0도 동일한 엔진 선택 UX를 적용한다:
- challenge 오케스트레이터가 Stage 0 스폰 전에 엔진 선택 프롬프트를 표시
- 선택 결과를 research-agent 프롬프트의 `<mode>` 태그에 반영:
  - `engine = "web"` → `<mode>fact-check</mode>` (WebSearch/WebFetch만 사용)
  - `engine = "deep"` → `<mode>deep-research</mode>` + `<preset>{selected_preset}</preset>`

---

## 사전 준비 (모든 모드 공통)

1. `planning/config.json` 로드 → sowhat 프로젝트 확인
2. `00-thesis.md` 로드 (항상)
3. 모든 섹션 파일 로드 (현재 기획 상태 파악)
4. `research/` 디렉터리 생성 (없으면):
   ```bash
   mkdir -p research
   ```
5. 다음 파인딩 번호 결정:
   - `research/` 내 `NNN-*.md` 파일 카운트 + 1
   - 3자리 zero-pad (001, 002, ...)

6. 자율 리서치 모드(`$ARGUMENTS` 없음)인 경우 `logs/session.md` 저장:
   ```markdown
   ---
   command: research
   section: (auto)
   step: planning
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research 자율 모드 시작 — 기획 상태 분석 중. 검색 계획 제안 전.

   ## 재개 시 첫 질문
   /sowhat:research → 자율 리서치 재시작
   ```

6. URL 분석 모드(`$ARGUMENTS`가 URL)인 경우 `logs/session.md` 저장:
   ```markdown
   ---
   command: research
   section: (url)
   step: fetching
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research URL 모드 시작 — {URL} 분석 중.

   ## 재개 시 첫 질문
   /sowhat:research {URL} → URL 리서치 재시작
   ```

7. 토픽 검색 모드(`$ARGUMENTS`가 URL 아닌 텍스트)인 경우 `logs/session.md` 저장:
   ```markdown
   ---
   command: research
   section: (search)
   step: searching
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research 토픽 검색 시작 — "{검색어}" 검색 중.

   ## 재개 시 첫 질문
   /sowhat:research {검색어} → 토픽 검색 재시작
   ```

8. 파일 분석 모드(`$ARGUMENTS`가 `file:`로 시작)인 경우 `logs/session.md` 저장:
   ```markdown
   ---
   command: research
   section: (file)
   step: analyzing
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research 파일 분석 시작 — {path} 분석 중.

   ## 재개 시 첫 질문
   /sowhat:research file:{path} → 파일 분석 재시작
   ```

9. 폴더 분석 모드(`$ARGUMENTS`가 `dir:`로 시작)인 경우 `logs/session.md` 저장:
   ```markdown
   ---
   command: research
   section: (dir)
   step: scanning
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research 폴더 분석 시작 — {path} 스캔 중.

   ## 재개 시 첫 질문
   /sowhat:research dir:{path} → 폴더 분석 재시작
   ```

---

## URL 분석 모드

`$ARGUMENTS`가 `http://` 또는 `https://`로 시작할 때.

### 1. URL 내용 추출

`WebFetch`로 URL 내용을 가져온다:
- 핵심 주장, 데이터 포인트, 인사이트 추출
- 통계, 방법론, 경쟁 환경, 사용자 행동 데이터, 기술 접근법에 집중

WebFetch 실패 시: `❌ URL 접근 실패: {URL}. 접근 가능한 URL인지 확인하세요.`

### 2. 출처 신뢰도 판정

`references/source-credibility.md`의 알고리즘으로 Tier를 판정한다:
- 도메인 매칭 → 콘텐츠 기반 판정 → 최종 Tier 결정
- 판정 결과를 파인딩 frontmatter의 `tier`, `tier_reasons`에 기록

### 3. 맥락 대조 분석

추출된 내용을 현재 thesis + 섹션과 대조한다:

- **섹션 관련성**: 어떤 섹션과 관련되는가?
- **지지/반박**: 기존 Claim을 강화하는가, 약화시키는가?
- **Open Questions**: 미해결 질문에 답하는가?
- **MECE 갭**: 누락된 논거를 시사하는가?
- **새 섹션 필요성**: 기존 섹션으로 커버되지 않는 중요 발견인가?
- **Tier 적합성**: 이 Tier의 출처가 대상 섹션의 Qualifier에 적합한가?

### 4. 파인딩 파일 생성

`research/{NNN}-{slug}.md` 파일을 생성한다:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```markdown
---
id: {N}
type: url
source: "{URL}"
tier: {T1|T2|T3|T4}
tier_reasons:
  - "{판정 이유}"
created: {current_datetime}
relevant_sections:
  - {관련 섹션 목록}
status: unreviewed
citations: []
---

## 출처
{URL} — {페이지 제목 또는 설명}

## 주요 발견
1. {발견 1}
2. {발견 2}
3. {발견 3}

## 섹션별 제안

### {섹션} — {대상 영역} (Grounds / Claim / Edge Cases 등)
> 현재: {현재 내용 인용, 존재하면}

제안: {수정/추가 내용과 이유}

## 원본 노트
{압축된 핵심 원문 내용 — 나중에 참조용}
```

### 5. 로그 업데이트

`research/log.md`에 append한다:

```markdown
## [{NNN}] {datetime} — URL 분석
- 출처: {URL}
- 발견: {N}건
- 관련 섹션: {목록}
- 상태: unreviewed
```

`research/log.md`가 없으면 `# 리서치 로그` 헤더와 함께 생성한다.

### 6. 제안 제시

인간에게 결과를 제시한다:

```
리서치 완료: {N}건 발견 ({URL})

[1] {발견} — {source}
    📊 신뢰도: {Tier} ({tier_reason}) — {Grounds 사용 가능|Backing 전용|교차검증 필요}
    관련: {섹션} — {대상 영역}

[2] {발견} — {source}
    📊 신뢰도: {Tier} ({tier_reason}) — {사용 가능 범위}
    관련: {섹션} — {대상 영역}

새 섹션 제안: (해당되면)
[3] NEW — "{제안 섹션명}"
    {thesis 연결 근거}

선택:
  accept [번호]  → 파인딩 수용 (해당 섹션 Open Questions에 추가)
  reject [번호]  → 파인딩 거부
  expand [번호]  → 해당 발견에 대해 상세 논의
  all            → 전체 수용
  none           → 전체 거부
```

인간의 선택에 따라 파인딩 파일의 `status`를 업데이트한다.

`accept` 시: 해당 섹션의 `## Open Questions`에 `- [ ] [리서치 #{NNN}] {제안 요약}` 추가.

---

## 파일 분석 모드

`$ARGUMENTS`가 `file:`로 시작할 때.

### 1. 파일 읽기

`Read`로 로컬 파일을 읽는다:
- PDF, markdown, 텍스트, CSV, JSON 지원
- 파일 없으면: `❌ 파일을 찾을 수 없습니다: {path}`

### 2. 출처 신뢰도 판정

파일 유형에 따라 Tier 판정:
- 학술 논문 PDF → T1
- 공식 보고서/백서 → T1~T2
- 기술 문서/내부 자료 → T2~T3
- 기타 → 내용 기반 판정

### 3. 맥락 대조 분석

URL 분석 모드와 동일 — thesis + 섹션과 대조하여 관련성, 지지/반박, Open Questions 대응 여부 분석.

### 4. 파인딩 생성

URL 모드와 동일한 형식으로 파인딩 파일을 생성한다.
단, `type: file`, `source: "file:{path}"`.

### 5. 제안 제시

URL 모드와 동일 (Tier 표시 포함).

---

## 폴더 분석 모드

`$ARGUMENTS`가 `dir:`로 시작할 때.

### 1. 파일 목록 수집

`Glob`으로 폴더 내 파일을 수집한다:
- `--glob` 옵션 있으면 해당 패턴 사용 (예: `--glob *.pdf`)
- 없으면 기본 패턴: `*.md`, `*.pdf`, `*.txt`, `*.csv`, `*.json`
- 0개 → `❌ {path}에서 지원 파일을 찾지 못했습니다.`
- 20개 초과 → `⚠️ {N}개 파일 발견. 처음 20개만 처리합니다. --glob으로 범위를 좁혀주세요.`

### 2. 개별 파일 분석

각 파일을 `Read`로 읽고:
- 핵심 데이터 포인트, 주장, 통계 추출 (파일당 3~5줄 요약)
- 파일별 Tier 판정

### 3. 종합 분석

여러 파일을 종합한다:
- 중복 제거
- 파일 간 합의점 식별 (여러 파일이 동의하는 것)
- 파일 간 충돌점 식별 (상반되는 주장)
- thesis + 섹션과 대조하여 관련성 분석

### 4. 파인딩 생성

URL 모드와 동일한 형식으로 파인딩 파일을 생성한다.
단, `type: dir`, `source: "dir:{path} ({N}files)"`.

파인딩 파일의 `## 원본 노트` 섹션에 개별 파일 목록과 각 파일 요약을 기재:
```markdown
## 원본 노트
### 개별 파일 분석
- {파일1}: {1줄 요약} (📊 {Tier})
- {파일2}: {1줄 요약} (📊 {Tier})
...

### 통합 요약
{전체 파일에서 추출한 핵심 주장·데이터·패턴}
```

종합 Tier는 폴더 내 파일 중 **가장 높은 Tier**를 대표 Tier로 설정한다 (inject의 보수적 접근과 달리, research는 accept/reject 게이트가 있으므로 높은 Tier 적용).

### 5. 제안 제시

URL 모드와 동일 (Tier 표시 포함). 파일 수를 함께 표시:
```
리서치 완료: {N}건 발견 (dir:{path}, {M}개 파일 분석)
```

---

## 토픽 검색 모드

`$ARGUMENTS`가 URL이 아닌 텍스트일 때 (`file:`/`dir:` 접두어 없음).

### 1. 웹 검색

`WebSearch`로 주제를 검색한다.

### 2. 소스 선별 + 추출

검색 결과에서 상위 3~5개 관련 URL을 `WebFetch`로 가져온다.
- thesis 맥락과 관련성이 높은 것 우선
- **Tier가 높은 출처를 우선 선택** (T1/T2를 T4보다 먼저)
- 접근 실패한 URL은 건너뛰고 다음으로
- 각 URL에 대해 `references/source-credibility.md` 기준으로 Tier 판정

### 3. 종합

여러 소스를 종합한다:
- 중복 제거
- 합의점 식별 (여러 소스가 동의하는 것)
- 충돌점 식별 (소스 간 상반되는 주장)

### 4. 파인딩 생성

URL 모드와 동일한 형식으로 파인딩 파일을 생성한다.
단, `type: search`, `source: "{검색어}"`.
Tier는 종합된 소스 중 **가장 높은 Tier**를 대표 Tier로 설정한다.

여러 소스에서 온 발견은 하나의 파인딩 파일에 종합한다.

### 5. 제안 제시

URL 모드와 동일 (Tier 표시 포함).

---

## 자율 리서치 모드

`$ARGUMENTS`가 비어있을 때.

### 1. 현재 기획 상태 분석

다음을 분석한다:
- `draft` 또는 `discussing` 상태 섹션 — 아직 미완성
- 모든 섹션의 `## Open Questions` — 미해결 질문
- MECE 갭 분석 — Key Arguments가 Answer를 완전히 커버하는가
- Grounds가 약한 Claim — 근거가 부족한 주장

### 2. 검색 계획 제시

**인간에게 먼저 승인을 받는다**:

```
현재 기획 상태 분석 결과, 다음 리서치를 제안합니다:

[1] "{검색어 1}"
    관련: {섹션} — 이유: {왜 이 검색이 필요한가}

[2] "{검색어 2}"
    관련: {섹션} — 이유: {왜 이 검색이 필요한가}

[3] "{검색어 3}"
    관련: {섹션} — 이유: {왜 이 검색이 필요한가}

어떤 것을 조사할까요? (all / 번호 / none)
```

### 3. 승인된 검색 실행

인간이 선택한 항목만 토픽 검색 모드로 실행한다.

### 4. 결과 종합

각 검색별 파인딩을 생성하고, 전체 제안을 한번에 제시한다.

---

## 서브커맨드

### `review`

`research/` 내 `status: unreviewed`인 파인딩을 요약 표시한다:

```
미검토 리서치 {N}건:

[001] URL 분석 — {source 요약}
      관련: {섹션 목록}
      발견: {주요 발견 한 줄 요약}

[002] 토픽 검색 — "{검색어}"
      관련: {섹션 목록}
      발견: {주요 발견 한 줄 요약}
```

미검토 파인딩이 없으면: `✅ 미검토 리서치가 없습니다.`

### `review {section}`

특정 섹션과 관련된 `unreviewed` 파인딩만 표시한다.
파인딩 frontmatter의 `relevant_sections`에 해당 섹션이 포함된 것만 필터.

### `accept {N}`

파인딩 `{N}`의 Tier를 확인한다:
- **T4 출처인 경우**:
  ```
  ⚠️ 이 파인딩은 T4 (비검증 출처)입니다.
  Grounds에 단독 사용할 수 없으며, Backing으로만 활용됩니다.
    [1] Backing으로 accept
    [2] reject
  ```
  [1] 선택 시: `applied_to` 필드에 `(backing-only)` 태그 추가
- **T3 출처 + 대상 섹션 Qualifier ≤ 2인 경우**:
  ```
  ℹ️ 이 파인딩은 T3 (준전문 출처)입니다.
  이 Qualifier에서 Grounds로 사용하려면 교차검증(독립 출처 2개)이 필요합니다.
    [1] accept (교차검증 예정)
    [2] Backing으로 accept
    [3] reject
  ```

파인딩 `{N}`의 `status`를 `accepted`로 변경한다.
해당 파인딩의 제안을 관련 섹션의 `## Open Questions`에 추가한다:
```
- [ ] [리서치 #{NNN}] {제안 요약}
```

`logs/argument-log.md`에 append한다 (파일이 없으면 `# Argument Log` 헤더와 함께 생성):

```markdown
## [{current_datetime}] research:accept({N})
  Finding: {source summary}
  Applied to: {sections}
  Added to Open Questions: {section} #{open_question_number}
```

### `reject {N}`

파인딩 `{N}`의 `status`를 `rejected`로 변경한다.
섹션 파일은 수정하지 않는다.

---

## config.json 업데이트

리서치 실행 후 `planning/config.json`에 `research` 필드를 업데이트한다:

```json
"research": {
  "count": {총 파인딩 수},
  "unreviewed": {미검토 수},
  "last_research": "{datetime}"
}
```

`research` 필드가 없으면 추가한다.

---

## 종료 안내

```
✅ 리서치 완료
  - 파인딩: {N}건 생성
  - 수용: {N}건 / 거부: {N}건 / 미검토: {N}건

----------------------------------------
다음 액션:

[1] 미검토 파인딩 확인 및 수용/거부 (/sowhat:research review)
[2] 리서치 기반 섹션 전개 (/sowhat:expand {section})
[3] 전체 트리 검증 (/sowhat:challenge)


----------------------------------------
```

---

## Deep Research 모드 (Perplexity)

`--deep` 플래그가 있거나, 자율 리서치에서 `deep` 옵션 선택 시 활성화.
Perplexity Agent API의 preset을 사용하여 다단계 심층 조사를 수행한다.

### 사전 조건 확인

**API 키 탐색 순서** (환경변수가 세션 시작 후 설정된 경우를 대비):

1. 환경변수 `$PERPLEXITY_API_KEY` 확인
2. 없으면 → `.claude/settings.local.json`의 `env.PERPLEXITY_API_KEY` 직접 읽기 (프로젝트)
3. 없으면 → `~/.claude/settings.local.json`의 `env.PERPLEXITY_API_KEY` 직접 읽기 (전역)
4. 모두 없으면 → 미설정

```python
# 의사코드: API 키 탐색
api_key = os.environ.get("PERPLEXITY_API_KEY")

if not api_key:
    # 프로젝트 레벨 settings.local.json에서 읽기
    project_settings = read_json(".claude/settings.local.json")
    api_key = project_settings.get("env", {}).get("PERPLEXITY_API_KEY")

if not api_key:
    # 전역 settings.local.json에서 읽기
    global_settings = read_json("~/.claude/settings.local.json")
    api_key = global_settings.get("env", {}).get("PERPLEXITY_API_KEY")
```

**실제 실행**: Read 도구로 `.claude/settings.local.json` → `~/.claude/settings.local.json` 순서로 파일을 읽어 `env.PERPLEXITY_API_KEY` 값을 직접 추출한다. 환경변수가 세션 시작 이후에 설정된 경우에도 파일에서 읽으므로 누락되지 않는다.

API 키를 어디에서도 찾을 수 없으면:

```
❌ Perplexity API 키가 설정되지 않았습니다.

설정하려면: /sowhat:config

💡 Deep Research 없이 기본 웹 검색으로 진행할까요?
  [1] 기본 웹 검색으로 진행
  [2] 취소
```

```bash
# features.deep_research 확인
# 1순위: planning/config.json → features.deep_research
# 2순위: ~/.claude/settings.local.json → sowhat.deep_research
# 3순위: 기본값 "auto"
#
# "disabled"면 --deep 무시하고 기본 모드로 진행
# "auto"면 API 키 존재 시 활성화
# "enabled"면 API 키 필수
#
# deep_research_preset도 동일 우선순위:
# config.json → ~/.claude/settings.local.json → 기본값 "deep-research"
```

API 키 없이 `[1]` 선택 시: `--deep` 플래그를 무시하고 기존 토픽 검색 모드로 fallback.

### Deep Research 실행

#### 1. 검색 쿼리 구성

현재 thesis + 섹션 상태를 기반으로 Perplexity에 보낼 프롬프트를 구성한다:

```
당신은 논증 구조 분석을 위한 리서치 에이전트입니다.

[Thesis]: {thesis 전문}
[현재 논증 구조]: {섹션별 Claim/Grounds 요약}
[조사 대상]: {사용자 지정 토픽 또는 자율 분석 결과}

다음을 조사해주세요:
1. 위 주장을 뒷받침하거나 반박하는 데이터, 통계, 사례
2. 관련 학술 연구, 산업 리포트, 공식 통계
3. 대안적 관점이나 반론
4. 각 출처의 원문 URL

모든 수치와 데이터에는 반드시 출처 URL을 명시하세요.
```

#### 2. API 호출

```bash
curl -s https://api.perplexity.ai/v1/agent \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "preset": "{config.features.deep_research_preset || deep-research}",
    "input": "{위에서 구성한 프롬프트}",
    "instructions": "You are a thorough research analyst. Always cite sources with URLs. Provide quantitative data when available. Distinguish between primary sources (government statistics, academic papers) and secondary sources (news articles, blog posts)."
  }'
```

사용 가능한 preset:
| Preset | 특성 | 용도 |
|--------|------|------|
| `fast-search` | 단일 스텝, 웹 검색만, 최소 지연 | 빠른 사실 확인 |
| `pro-search` | 3스텝, 웹 검색+URL 패치 | 일반적 리서치 |
| `deep-research` | 10스텝, 다단계 분석 | 심층 조사 (기본값) |
| `advanced-deep-research` | 10스텝, 최대 깊이 | 최대 정밀도 리서치 |

API 응답 구조:
```json
{
  "id": "resp_...",
  "status": "completed",
  "output": [
    {
      "type": "message",
      "content": [{ "type": "output_text", "text": "..." }]
    },
    {
      "type": "search_results",
      "queries": ["..."],
      "results": [
        { "title": "...", "url": "https://...", "snippet": "..." }
      ]
    }
  ],
  "usage": { "cost": { "total_cost": 0.0 } }
}
```

API 실패 시:
- 401: `❌ PERPLEXITY_API_KEY가 유효하지 않습니다. https://www.perplexity.ai/settings/api 에서 확인하세요.`
- 429: `❌ API 요청 한도 초과. 잠시 후 다시 시도하세요.`
- 기타: `❌ Perplexity API 오류 ({status}). 기본 웹 검색으로 전환할까요?`

fallback 선택 시 토픽 검색 모드로 전환.

#### 3. 응답 파싱 + Finding 변환

Perplexity 응답을 파싱하여 기존 Finding 형식으로 변환한다:

1. **응답에서 추출**:
   - 주요 발견 사항: `output[].content[].text` (type이 `"message"`인 항목)
   - 인용된 출처 URL: `output[].results[]` (type이 `"search_results"`인 항목)
   - 데이터 포인트 (수치, 통계)

2. **출처별 Tier 판정**:
   - `output[].results[]`의 각 URL에 대해 `references/source-credibility.md` 알고리즘 적용
   - Perplexity가 인용한 출처라고 해서 자동으로 높은 Tier를 부여하지 않음
   - 도메인 매칭 → 콘텐츠 기반 판정 → 최종 Tier 결정

3. **Finding 파일 생성**:
   ```markdown
   ---
   id: {N}
   type: deep-research
   source: "perplexity:{preset명} — {검색 주제}"
   tier: {종합 Tier — citations 중 최고 Tier}
   tier_reasons:
     - "Perplexity Deep Research 종합 결과"
     - "{개별 citation tier 판정 이유}"
   created: {current_datetime}
   relevant_sections:
     - {관련 섹션 목록}
   status: unreviewed
   citations:
     - url: "{citation_url_1}"
       tier: {T1|T2|T3|T4}
     - url: "{citation_url_2}"
       tier: {T1|T2|T3|T4}
   ---

   ## 출처
   Perplexity Agent API ({preset명}) — {검색 주제}
   조사 시각: {datetime}

   ## 주요 발견
   1. {발견 1} — 출처: {URL} (📊 {Tier})
   2. {발견 2} — 출처: {URL} (📊 {Tier})
   3. {발견 3} — 출처: {URL} (📊 {Tier})

   ## 섹션별 제안

   ### {섹션} — {대상 영역} (Grounds / Claim / Edge Cases 등)
   > 현재: {현재 내용 인용, 존재하면}

   제안: {수정/추가 내용과 이유}

   ## 인용 출처 상세
   | # | URL | Tier | 판정 이유 |
   |---|-----|------|-----------|
   | 1 | {url} | {Tier} | {이유} |
   | 2 | {url} | {Tier} | {이유} |

   ## 원본 노트
   {Perplexity 응답 전문 — 나중에 참조용}
   ```

4. **핵심 인용 검증** (선택적):
   - Tier 판정 결과 T1/T2 출처가 있으면, `WebFetch`로 해당 URL을 직접 확인
   - Perplexity가 인용한 수치가 원문과 일치하는지 spot-check (최대 2개)
   - 불일치 발견 시 Finding에 `⚠️ 교차검증 필요` 태그 추가

#### 4. 제안 제시

기존 모드와 동일한 형식으로 인간에게 제시한다. 단, Deep Research 표시 추가:

```
🔬 Deep Research 완료: {N}건 발견 (Perplexity {preset명})
   조사 범위: {검색 주제}
   인용 출처: {M}개 URL

[1] {발견} — {source}
    📊 신뢰도: {Tier} ({tier_reason}) — {Grounds 사용 가능|Backing 전용|교차검증 필요}
    관련: {섹션} — {대상 영역}

[2] {발견} — {source}
    📊 신뢰도: {Tier} ({tier_reason}) — {사용 가능 범위}
    관련: {섹션} — {대상 영역}

선택:
  accept [번호]  → 파인딩 수용
  reject [번호]  → 파인딩 거부
  expand [번호]  → 해당 발견에 대해 상세 논의
  all            → 전체 수용
  none           → 전체 거부
```

### Deep Research + 자율 모드 결합

자율 리서치 모드(`$ARGUMENTS` 없음)에서 `--deep` 플래그가 있을 때:

1. 기획 상태 분석 (기존과 동일)
2. 검색 계획 제시 시 Deep Research 옵션 표시:
   ```
   현재 기획 상태 분석 결과, 다음 리서치를 제안합니다:

   [1] "{검색 주제 1}" 🔬 Deep Research
       관련: {섹션} — 이유: {왜 이 검색이 필요한가}

   [2] "{검색 주제 2}" 🔬 Deep Research
       관련: {섹션} — 이유: {왜 이 검색이 필요한가}

   어떤 것을 조사할까요? (all / 번호 / none)
   ```
3. 승인된 항목을 Deep Research로 실행 (각각 별도 API 호출)

### Deep Research + 토픽 결합

`/sowhat:research --deep {토픽}` 형태:
- `{토픽}`을 Deep Research 프롬프트의 `[조사 대상]`에 삽입
- 나머지는 위 흐름과 동일

### Deep Research + URL 결합

`/sowhat:research --deep {URL}` 형태:
- 먼저 `WebFetch`로 URL 내용을 가져옴
- 가져온 내용을 Deep Research 프롬프트에 컨텍스트로 포함:
  ```
  [분석 대상 콘텐츠]:
  {WebFetch로 가져온 내용 요약}

  위 콘텐츠의 주장과 데이터를 검증하고, 관련 근거를 심층 조사해주세요.
  ```
- URL 내용 기반 팩트체크 + 추가 근거 수집 효과

---

## 핵심 원칙

- **리서치는 제안이다** — 자동 반영 없음. 인간이 accept/reject
- **자율 모드는 승인 후 실행** — 검색 계획을 먼저 제시
- **항상 섹션에 매핑** — 떠다니는 정보 없음. 모든 발견은 섹션과 연결
- **누적 가능** — 여러 리서치 세션의 결과가 `research/`에 축적
- **thesis 맥락 필수** — 모든 분석은 현재 thesis를 기준으로
- **Deep Research는 선택적** — API 키 없어도 기본 기능은 동작. 있으면 품질 향상
