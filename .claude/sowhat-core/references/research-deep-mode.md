# Research — Deep Research 모드 (`--deep`)

Perplexity / Gemini Deep Research 엔진을 쓰는 `--deep` 분기의 오케스트레이션·UX 절차. 엔진 호출 시퀀스·영수증 검증 등 **기술 어댑터 명세는 `references/deep-research-adapters.md`가 단일 소유**하며, 이 파일은 그 위의 워크플로우 흐름을 정의한다. `workflows/research.md`가 `--deep` 분기에서 이 파일을 읽고 그대로 따른다.

---

## Deep Research 모드 (Perplexity / Gemini)

`--deep` 플래그가 있거나, 자율 리서치에서 Deep Research 엔진(`perplexity` 또는 `gemini`)이 선택되면 활성화.

> **호출 패턴 출처**: 모든 엔진별 호출/검증/파싱 세부 명세는 `references/deep-research-adapters.md`에 있다. 이 섹션은 사용자 가시 흐름과 분기 결정만 다룬다.

### 사전 조건 확인

**API 키 탐색 순서** (환경변수가 세션 시작 후 설정된 경우를 대비):

각 엔진의 API 키(`PERPLEXITY_API_KEY` 또는 `GEMINI_API_KEY`)를 다음 순서로 탐색:

1. 환경변수 (`$PERPLEXITY_API_KEY` / `$GEMINI_API_KEY`)
2. 프로젝트 `.claude/settings.local.json`의 `env.{KEY_NAME}`
3. 전역 `~/.claude/settings.local.json`의 `env.{KEY_NAME}`
4. 모두 없으면 → 해당 엔진 미설정

```python
def find_api_key(name):
    api_key = os.environ.get(name)
    if not api_key:
        project_settings = read_json(".claude/settings.local.json")
        api_key = project_settings.get("env", {}).get(name)
    if not api_key:
        global_settings = read_json("~/.claude/settings.local.json")
        api_key = global_settings.get("env", {}).get(name)
    return api_key

perplexity_key = find_api_key("PERPLEXITY_API_KEY")
gemini_key = find_api_key("GEMINI_API_KEY")
```

**실제 실행**: Read 도구로 `.claude/settings.local.json` → `~/.claude/settings.local.json` 순서로 파일을 읽어 직접 추출한다. 환경변수가 세션 시작 이후에 설정된 경우에도 파일에서 읽으므로 누락되지 않는다.

선택된 엔진의 API 키가 없으면:

```
❌ {engine} API 키가 설정되지 않았습니다.

설정하려면: /sowhat:config

💡 사용 가능한 엔진:
  {Perplexity 키 있으면: [1] Perplexity로 전환}
  {Gemini 키 있으면: [2] Gemini로 전환}
  [3] Web Research로 진행 (Deep Research 포기)
  [4] 취소
```

> **silent fallback 금지**: 사용자가 명시적으로 Web Research를 선택하지 않는 한, deep mode를 web으로 자동 다운그레이드하지 않는다.

### Deep Research 실행

> **핵심 원칙 1**: Deep Research API(Perplexity 또는 Gemini)는 **오케스트레이터(이 워크플로우를 실행하는 메인 Claude)가 직접 호출**한다. research-agent에게 API 호출을 위임하지 않는다. agent는 결과 분석만 담당한다.
>
> **핵심 원칙 2 (silent fallback 절대 금지)**: 아래 영수증 검증 게이트를 통과하지 못하면 **research-agent를 절대 deep-research mode로 스폰하지 않는다.** 사용자 명시적 동의 없는 자동 Web Research fallback은 결함이며, 사용자가 deep research를 받았다고 오인하게 만든다.
>
> **호출 패턴 출처**: 사전 핑 → 본 호출 → 영수증 검증 → 응답 파싱의 엔진별 세부 명세는 `references/deep-research-adapters.md` 참조. 이 섹션에서는 워크플로우 단위 분기만 다룬다.

#### 1. 검색 쿼리 구성

현재 thesis + 섹션 상태를 기반으로 엔진에 보낼 프롬프트를 구성한다:

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

이 프롬프트는 두 엔진 모두에 동일하게 적용된다. 엔진별로 페이로드 형태(Perplexity는 `messages`, Gemini는 `input`)만 다르다 — `references/deep-research-adapters.md`의 각 어댑터 명세를 따른다.

#### 2. 엔진별 호출 (어댑터 위임)

선택된 엔진에 따라 어댑터의 호출 시퀀스를 그대로 따른다:

| 엔진 | 어댑터 | 패턴 | 영수증 |
|---|---|---|---|
| `perplexity` | Adapter A (`deep-research-adapters.md` §A) | 동기, 단일 curl | `research/_receipts/perplexity-{ts}.json` |
| `gemini` | Adapter B (`deep-research-adapters.md` §B) | 비동기, create + 폴링 | `research/_receipts/gemini-{ts}-create.json`, `research/_receipts/gemini-{ts}-final.json` |

Gemini의 경우 폴링 루프 동안 사용자에게 진행상황을 주기적으로 표시한다 — 5분 가까이 걸릴 수 있으므로 침묵하면 멈춘 것처럼 보인다.

```
🔬 Gemini Deep Research 진행 중... (interaction_id: {id}, elapsed: {N}s / {timeout}s)
```

#### 3. 영수증 검증 게이트 (HARD GATE — 어댑터 §A.3 / §B.4)

저장된 영수증을 어댑터별 검증 항목으로 검증한다. 이 게이트의 모든 조건을 통과하지 못하면 **research-agent를 deep-research mode로 절대 스폰하지 않는다.**

**검증 실패 시 대응 (silent fallback 금지)** — `references/deep-research-adapters.md`의 "사용자 동의 fallback 절차"를 그대로 따른다:

```
❌ Deep Research 영수증 검증 실패
   엔진: {perplexity:sonar-deep-research | gemini:{agent}}
   사유: {위 검증 항목 중 실패한 것}
   영수증: {receipt_path}

   자동 fallback은 차단되어 있습니다 (사용자가 deep research를 받았다고 오인 방지).

   다음 중 선택:
     [1] Web Research(WebSearch/WebFetch)로 fallback — engine = "web"
     [2] 다른 Deep Research 엔진으로 재시도 (가용 시)
     [3] 영수증 확인 후 동일 엔진 재시도
     [4] 취소
```

선택 결과:
- `[1]` → `engine = "web"`으로 전환, 토픽 검색 모드로 진행. 결과 출력 헤더에 실패 사유 + 실패 영수증 경로를 명시.
- `[2]` → 다른 엔진의 키가 있으면 1단계 엔진 선택부터 재실행
- `[3]` → 영수증 파일 경로를 보여주고 사용자가 확인 후 재실행 결정
- `[4]` → 즉시 종료

#### 4. 결과를 research-agent에 전달 (검증 통과 시에만)

영수증 검증을 통과한 응답만 research-agent에 주입한다. 엔진에 따라 태그가 다르다:

```
# Perplexity
Task(sowhat-research-agent, prompt = """
  <mode>deep-research</mode>
  <thesis>{thesis}</thesis>
  <section>{section}</section>
  <search_focus>{토픽}</search_focus>
  <perplexity_result>
    {영수증 파일의 JSON 전문 — usage.total_tokens > 0 보장됨}
  </perplexity_result>
  <receipt_path>{receipt_path}</receipt_path>
  <instructions>
    Perplexity 결과를 분석하여 Finding 형식으로 변환하라.
    핵심 인용 2건을 WebFetch로 spot-check하라.
    출력에 🔬 Engine / Tokens / Citations 메타데이터 헤더를 반드시 포함하라.
  </instructions>
""")

# Gemini
Task(sowhat-research-agent, prompt = """
  <mode>deep-research</mode>
  <thesis>{thesis}</thesis>
  <section>{section}</section>
  <search_focus>{토픽}</search_focus>
  <gemini_result>
    {final_receipt 파일의 JSON 전문 — status="completed", usage.total_tokens > 0 보장됨}
  </gemini_result>
  <receipt_path>{final_receipt}</receipt_path>
  <instructions>
    Gemini Interactions 결과를 분석하여 Finding 형식으로 변환하라.
    outputs[-1].text가 최종 보고서, grounding_metadata에서 citations 추출.
    핵심 인용 2건을 WebFetch로 spot-check하라.
    출력에 🔬 Engine / Tokens / Citations 메타데이터 헤더를 반드시 포함하라.
  </instructions>
""")
```

research-agent는 API 호출 없이 **분석과 검증만** 수행한다. 영수증 무결성은 agent 측에서도 한 번 더 확인한다 (이중 게이트).

#### 5. 응답 파싱 + Finding 변환

엔진별 응답 구조에 맞춰 파싱 (`references/deep-research-adapters.md` §A.4 / §B.5 참조):

1. **응답에서 추출 (엔진별)**:

   **Perplexity (Adapter A)**:
   - 본문: `choices[0].message.content`
   - 인용 URL: `citations` (단순 배열) 또는 `search_results[].url`
   - 토큰: `usage.total_tokens`

   **Gemini (Adapter B)**:
   - 본문(최종 보고서): `outputs[-1].text`
   - 사고 요약(있을 때): `outputs[].thought_summary`
   - 인용 URL: `outputs[].grounding_metadata.grounding_chunks[].web.uri`
   - 토큰: `usage.total_tokens`

2. **출처별 Tier 판정**:
   - 추출한 각 URL에 대해 `references/source-credibility.md` 알고리즘 적용
   - 엔진이 인용한 출처라고 해서 자동으로 높은 Tier를 부여하지 않음
   - 도메인 매칭 → 콘텐츠 기반 판정 → 최종 Tier 결정

3. **Finding 파일 생성**:
   ```markdown
   ---
   id: {N}
   type: deep-research
   engine: "{perplexity:{모델명} | gemini:{agent명}}"
   source: "{engine}:{preset 또는 agent} — {검색 주제}"
   tier: {종합 Tier — citations 중 최고 Tier}
   tier_reasons:
     - "{Engine} Deep Research 종합 결과"
     - "{개별 citation tier 판정 이유}"
   created: {current_datetime}
   tokens_used: {usage.total_tokens — 영수증에서 추출, 0이면 안 됨}
   receipt_path: "{research/_receipts/{engine}-{timestamp}.json}"
   citations_count: {citation 개수}
   spot_checked: {WebFetch로 검증한 citation 개수}
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
   {Perplexity Agent API ({preset명}) | Gemini Interactions API ({agent명})} — {검색 주제}
   조사 시각: {datetime}
   🔬 Engine: {engine}:{모델/agent} | Tokens: {N} | Citations: {M} | Spot-checked: {K}
   영수증: {receipt_path}

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
   {엔진 응답 전문 — 나중에 참조용. 영수증 파일에도 동일하게 보존됨}
   ```

4. **핵심 인용 검증** (선택적):
   - Tier 판정 결과 T1/T2 출처가 있으면, `WebFetch`로 해당 URL을 직접 확인
   - 엔진이 인용한 수치가 원문과 일치하는지 spot-check (최대 2개)
   - 불일치 발견 시 Finding에 `⚠️ 교차검증 필요` 태그 추가

#### 6. 제안 제시

기존 모드와 동일한 형식으로 인간에게 제시한다. 단, Deep Research 메타데이터 헤더는 **반드시** 표기한다 (어떤 엔진이 실제로 실행되었는지 사용자가 검증할 수 있어야 함):

```
🔬 Deep Research 완료
   Engine: {perplexity:{모델명, 예: sonar-deep-research} | gemini:{agent명, 예: deep-research-pro-preview-12-2025}}
   Tokens: {usage.total_tokens} | Citations: {M}개 URL | Spot-checked: {K}개
   영수증: {receipt_path}
   조사 범위: {검색 주제}
   파인딩: {N}건 생성

[1] {발견} — {source}
    📊 신뢰도: {Tier} ({tier_reason}) — {Grounds 사용 가능|보조 인용 전용|교차검증 필요}
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

> **검증 fallback이 발생한 경우**: 사용자가 영수증 검증 실패 시 `[1] Web Research로 fallback` 을 선택했다면, 위 헤더는 다음으로 대체한다:
> ```
> ⚠️ Deep Research 실패 → Web Research fallback (사용자 동의)
>    실패 엔진: {perplexity:모델 | gemini:agent}
>    실패 사유: {validation failure reason}
>    실패 영수증: {receipt_path}
>    현재 Engine: web (WebSearch/WebFetch)
> ```

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
