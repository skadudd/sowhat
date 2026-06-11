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
- `"disabled"`: `⚠️ Deep Research가 비활성화되어 있습니다.` → 사용자에게 Web Research로 진행할지 명시적 동의 요청 (silent fallback 금지)
- `"auto"` 또는 `"enabled"`: 활성 엔진의 API 키 확인 (Perplexity 또는 Gemini 중 하나 이상). 둘 다 없으면 onboarding 안내

---

## 리서치 엔진 선택 (매 실행마다)

인자 파싱 완료 후, 사전 준비 전에 **반드시** 리서치 엔진 선택 프롬프트를 표시한다.
config 값은 default 선택지로 표시하되, 사용자가 매번 확인·변경할 수 있다.

> **상세 호출 패턴**: 각 엔진별 사전 핑 / 본 호출 / 영수증 검증 / 응답 파싱은 `references/deep-research-adapters.md` 참조. 이 섹션은 UX와 분기 결정만 다룬다.

### 1단계: 엔진 선택

config에서 default를 읽는다 (`references/deep-research-adapters.md` "Engine 선택 알고리즘" 참조):

| 상태 | 기본 선택 |
|---|---|
| `features.deep_research == "disabled"` 또는 두 키 모두 없음 | Web Research |
| `features.deep_research_engine == "perplexity"` + `PERPLEXITY_API_KEY` 존재 | Perplexity |
| `features.deep_research_engine == "gemini"` + `GEMINI_API_KEY` 존재 | Gemini |
| `features.deep_research_engine == "ask"` + 두 키 모두 존재 | (사용자 선택) |
| `features.deep_research_engine == "ask"` + 한 키만 존재 | 가용한 엔진 자동 선택 (알림만) |
| `--deep` 플래그가 있으면 | 위 결과를 강제 적용 (Web 비활성화) |

```
🔍 리서치 엔진 선택

  [1] 🌐 Web Research — WebSearch/WebFetch (빠름, API 키 불필요)
  [2] 🔬 Perplexity Deep Research — sonar-deep-research (동기, ~30초)
  [3] 🔬 Gemini Deep Research — Interactions API (비동기 폴링, 2-5분, citations 풍부)

  현재 기본값: [{config default}]
  엔터 = 기본값 사용
```

- `[1]` 선택 → `engine = "web"`, 기존 WebSearch/WebFetch 모드로 진행
- `[2]` 선택 → `engine = "perplexity"`, 2단계 (Preset 선택)로 이동
- `[3]` 선택 → `engine = "gemini"`, 2단계 (Agent 확인)로 이동
- 가용 키가 없는 엔진을 선택 시 → `❌ {engine} API 키가 설정되지 않았습니다. /sowhat:config 로 설정하세요.` → 1단계 재표시

### 2단계-A: Preset 선택 (Perplexity 선택 시만)

config에서 `features.deep_research_preset`을 default로 읽는다 (없으면 `"deep-research"`).

```
🔬 Perplexity Preset 선택

  [1] ⚡ fast-search     — 단일 스텝, 최소 지연 (빠른 사실 확인)
  [2] 🔎 pro-search      — 3스텝, 웹 검색+URL 패치 (일반 리서치)
  [3] 📊 deep-research   — 10스텝, 다단계 분석 (심층 조사)
  [4] 🏛️ advanced-deep   — 10스텝, 최대 깊이 (최대 정밀도)

  현재 기본값: [{config preset}]
  엔터 = 기본값 사용
```

선택 결과를 `selected_preset`에 저장하고 진행한다.

### 2단계-B: Agent 확인 (Gemini 선택 시만)

config에서 `features.gemini_deep_research_agent`를 default로 읽는다 (없으면 `"deep-research-pro-preview-12-2025"`).

```
🔬 Gemini Deep Research Agent

  현재 사용 Agent: {features.gemini_deep_research_agent}
  폴링 간격: {features.gemini_polling_interval_seconds}s
  타임아웃: {features.gemini_polling_timeout_seconds}s

  Agent를 변경하려면 /sowhat:config 에서 수정하세요.
  엔터 = 진행
```

> **config 반영 안 함**: 1단계와 2단계에서 선택한 값은 이번 실행에만 적용된다. 영구 변경은 `/sowhat:config`.

### Challenge Stage 0 / Debate Round 1에서의 엔진 선택

`/sowhat:challenge`의 Stage 0와 `/sowhat:debate`의 Round 1도 동일한 엔진 선택 UX를 적용한다:
- 오케스트레이터가 첫 호출 전에 엔진 선택 프롬프트를 표시
- 선택 결과를 research-agent 프롬프트의 태그에 반영:
  - `engine = "web"` → `<mode>fact-check</mode>` (WebSearch/WebFetch만 사용)
  - `engine == "perplexity"` → `<mode>deep-research</mode>` + `<perplexity_result>{영수증 JSON}</perplexity_result>`
  - `engine == "gemini"` → `<mode>deep-research</mode>` + `<gemini_result>{영수증 JSON}</gemini_result>`
- challenge는 섹션 단위로 엔진을 다르게 사용 가능 (섹션별 fallback 선택)
- debate는 라운드 흐름을 끊지 않기 위해 세션 단위 결정(`deep_session_decision`)으로 1회만 묻는다

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

6. **모드 확정 후 `logs/session.md` 1회 저장** (`references/session-protocol.md` 형식 준수 — 모드별 중복 저장 금지). 결정된 모드에 따라 아래 값을 채워 단일 저장한다:

   | 모드 | section | step | 컨텍스트 / 재개 명령 |
   |------|---------|------|----------------------|
   | 자율 (인자 없음) | `(auto)` | `planning` | "기획 상태 분석 중. 검색 계획 제안 전." / `/sowhat:research` |
   | URL | `(url)` | `fetching` | "{URL} 분석 중." / `/sowhat:research {URL}` |
   | 토픽 검색 | `(search)` | `searching` | "\"{검색어}\" 검색 중." / `/sowhat:research {검색어}` |
   | 파일 (`file:`) | `(file)` | `analyzing` | "{path} 분석 중." / `/sowhat:research file:{path}` |
   | 폴더 (`dir:`) | `(dir)` | `scanning` | "{path} 스캔 중." / `/sowhat:research dir:{path}` |

   ```markdown
   ---
   command: research
   section: {표의 section}
   step: {표의 step}
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research {모드} 시작 — {표의 컨텍스트}

   ## 재개 시 첫 질문
   {표의 재개 명령}
   ```

   (`--deep` 분기는 엔진 선택 확정 후 동일 위치에서 1회 저장한다.)

---

## 리서치 분석 모드 (URL / 파일 / 폴더 / 토픽 검색 / 자율)

`사전 준비`에서 결정된 모드에 따라 해당 분석 절차를 실행한다. 5개 모드의 상세 절차(내용 추출 → 출처 Tier 판정 → 맥락 대조 → 파인딩 생성 → 제안 제시)는 **`references/research-modes.md`에서 감지된 모드 섹션을 읽고 그대로 따른다.**

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
  Grounds에 단독 사용할 수 없으며, CQ 보강으로만 활용됩니다.
    [1] CQ 보강으로 accept
    [2] reject
  ```
  [1] 선택 시: `applied_to` 필드에 `(cq-support-only)` 태그 추가
- **T3 출처 + 대상 섹션 Confidence가 uncertain 이하인 경우**:
  ```
  ℹ️ 이 파인딩은 T3 (준전문 출처)입니다.
  이 Confidence 수준에서 Grounds로 사용하려면 교차검증(독립 출처 2개)이 필요합니다.
    [1] accept (교차검증 예정)
    [2] CQ 응답 보조 인용으로 accept
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

엔진 메타데이터 헤더는 **반드시** 포함한다 (사용자가 어떤 리서치가 실제로 실행되었는지 검증할 수 있어야 함):

```
✅ 리서치 완료
  🔬 Engine: {web | perplexity:{모델명} | gemini:{agent명}}
  {Deep Research인 경우} Tokens: {N} | Citations: {M} | Spot-checked: {K}
  {Deep Research인 경우} 영수증: {receipt_path 목록}
  - 파인딩: {N}건 생성
  - 수용: {N}건 / 거부: {N}건 / 미검토: {N}건

----------------------------------------
다음 액션:

[1] 미검토 파인딩 확인 및 수용/거부 (/sowhat:research review)
[2] 리서치 기반 섹션 전개 (/sowhat:expand {section})
[3] 전체 트리 검증 (/sowhat:challenge)


----------------------------------------
```

> **`engine = "web"`일 때**: `Engine: web (WebSearch/WebFetch)` 로 표기. Tokens/Citations 라인은 생략.
>
> **사용자 동의 fallback이 발생한 세션**: 헤더에 추가로 `⚠️ Deep Research 실패 → Web Research fallback (사용자 동의)` + 실패 사유와 실패 영수증 경로 표기.

---

## Deep Research 모드 (`--deep`)

`--deep` 플래그가 있거나 엔진 선택에서 Perplexity/Gemini를 고른 경우, 해당 엔진의 Deep Research 오케스트레이션으로 진행한다. 사전 조건 확인 → 엔진 실행(영수증 검증 게이트) → 결과 종합 → 조합 모드(자율/토픽/URL 결합) 전체 절차는 **`references/research-deep-mode.md`를 읽고 그대로 따른다.** (호출 시퀀스·영수증 검증 등 기술 어댑터 명세는 `references/deep-research-adapters.md`.)

---

## 핵심 원칙

- **리서치는 제안이다** — 자동 반영 없음. 인간이 accept/reject
- **자율 모드는 승인 후 실행** — 검색 계획을 먼저 제시
- **항상 섹션에 매핑** — 떠다니는 정보 없음. 모든 발견은 섹션과 연결
- **누적 가능** — 여러 리서치 세션의 결과가 `research/`에 축적
- **thesis 맥락 필수** — 모든 분석은 현재 thesis를 기준으로
- **Deep Research는 선택적** — API 키 없어도 기본 기능은 동작. 있으면 품질 향상
