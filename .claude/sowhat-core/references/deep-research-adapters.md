# Deep Research Adapters — 엔진별 호출/검증/파싱 명세

Deep Research를 지원하는 모든 엔진의 호출 패턴, 영수증 검증, 응답 파싱을 한곳에 집약한다.
`research.md`, `challenge.md`, `debate.md`는 이 문서를 참조하여 엔진별 분기를 단순화한다.

> **Silent fallback 절대 금지**: 모든 어댑터는 영수증 검증 게이트를 반드시 통과해야 한다. 실패 시 사용자 명시적 동의 없이 다른 엔진/Web Research로 자동 다운그레이드되지 않는다.

---

## 공통 영수증 정책

모든 Deep Research 호출은 다음 규칙을 따른다:

1. **영수증 디렉토리**: `research/_receipts/{engine}-{ISO8601 timestamp}[-{context}].json`
   - `engine`: `perplexity` | `gemini`
   - `context`: 선택. challenge Stage 0이면 `stage0-{section}`, debate면 `debate-r{round}-{section}` 등
2. **응답 전체를 그대로 저장** (헤더 분리 불필요, body만 저장 가능). 후속 검증과 사용자 감사 추적에 필요
3. **영수증 검증 통과 전에는 어떤 후속 단계도 진입 금지** — research-agent 스폰 차단, 사용자 출력에 결과 노출 차단
4. **메타데이터 헤더는 절대 생략 금지**: `🔬 Engine: {엔진}:{모델/agent} | Tokens: {N} | Citations: {M} | Spot-checked: {K}` 형식

---

## Adapter A — Perplexity (sonar-deep-research 외)

### A.1. 사전 핑 (Preflight)

```bash
ping_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  --ssl-revoke-best-effort https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","messages":[{"role":"user","content":"ping"}],"max_tokens":1}')
```

판정:
- `200` 또는 `429` → 키 유효, 본 호출 진행 (429는 일시적 한도)
- `401` → `❌ PERPLEXITY_API_KEY가 유효하지 않습니다. /sowhat:config 에서 갱신하세요.` → 본 호출 중단
- 기타 / 타임아웃 → `❌ Perplexity API 도달 실패 ({status})` → 본 호출 중단

### A.2. 본 호출 (동기, 단일 요청)

```bash
mkdir -p research/_receipts
receipt_path="research/_receipts/perplexity-$(date +%Y%m%dT%H%M%S){-context}.json"

curl -s --ssl-revoke-best-effort https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{preset에 대응하는 모델명}",
    "messages": [{"role": "user", "content": "{프롬프트}"}]
  }' > "$receipt_path"
```

Preset → 모델 매핑:

| Preset | 모델명 | 특성 |
|---|---|---|
| `fast-search` | `sonar` | 단일 스텝, 최소 지연 |
| `pro-search` | `sonar-pro` | 3스텝, 웹 검색+URL 패치 |
| `deep-research` | `sonar-deep-research` | 다단계 심층 (기본) |
| `advanced-deep-research` | `sonar-deep-research` | 동일 모델, 프롬프트 강화 |

> **Windows**: `--ssl-revoke-best-effort` 플래그 필수.

### A.3. 영수증 검증 (HARD GATE)

순서대로 모두 통과해야 함:

1. JSON 파싱 가능 → 실패 시 `❌ 응답이 유효한 JSON이 아닙니다 (영수증: $receipt_path)`
2. `error` 필드 부재 → 존재 시 `❌ Perplexity API 오류: {error.type} — {error.message}`
3. `usage.total_tokens > 0` → 0/누락 시 `❌ DEEP_RESEARCH_RECEIPT_INVALID: total_tokens가 0 또는 누락`
4. `choices[0].message.content` 비어있지 않음 → 빈 문자열이면 `❌ Perplexity 응답 본문이 비어있습니다`
5. `citations` 또는 `search_results` ≥ 1개 (deep-research/pro-search 한정) → 누락 시 `⚠️ 인용 출처 미수신 — 결과 신뢰도 낮음. 진행 여부 확인:`

### A.4. 응답 파싱 (검증 통과 후)

| 추출 항목 | 위치 |
|---|---|
| 본문 | `choices[0].message.content` |
| 인용 URL 배열 | `citations` (단순 URL 배열) 또는 `search_results[].url` |
| 토큰 사용량 | `usage.total_tokens`, `usage.prompt_tokens`, `usage.completion_tokens` |
| 모델명 | `model` |

### A.5. research-agent 주입 형태

```
<mode>deep-research</mode>
<perplexity_result>
  {receipt 파일의 JSON 전문}
</perplexity_result>
<receipt_path>{receipt_path}</receipt_path>
```

---

## Adapter B — Gemini (Interactions API)

> **출처**: https://ai.google.dev/gemini-api/docs/interactions
> **베타 API** — 엔드포인트/모델명이 GA 시 변경될 수 있으므로 `features.gemini_deep_research_agent` config 값으로 override 가능.

### B.1. 사전 핑 (Preflight)

```bash
ping_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  --ssl-revoke-best-effort https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: $GEMINI_API_KEY")
```

판정:
- `200` → 키 유효, 본 호출 진행
- `401` / `403` → `❌ GEMINI_API_KEY가 유효하지 않거나 권한이 없습니다. /sowhat:config 에서 갱신하세요.`
- 기타 / 타임아웃 → `❌ Gemini API 도달 실패 ({status})`

### B.2. 본 호출 — Step 1 (비동기 작업 시작)

```bash
mkdir -p research/_receipts
ts=$(date +%Y%m%dT%H%M%S)
create_receipt="research/_receipts/gemini-${ts}-create{-context}.json"

curl -s --ssl-revoke-best-effort \
  https://generativelanguage.googleapis.com/v1beta/interactions \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "{features.gemini_deep_research_agent — 기본 deep-research-pro-preview-12-2025}",
    "input": "{프롬프트}",
    "background": true
  }' > "$create_receipt"

interaction_id=$(jq -r '.id' "$create_receipt")
```

검증:
- `interaction_id`가 빈 값이거나 `null`이면 → `❌ Gemini Interactions create 실패 (영수증: $create_receipt)`
- 응답에 `error` 필드 존재 시 → `❌ Gemini API 오류: {error.message}`

### B.3. 본 호출 — Step 2 (폴링 루프)

```bash
final_receipt="research/_receipts/gemini-${ts}-final{-context}.json"
interval=${features.gemini_polling_interval_seconds:-10}
timeout=${features.gemini_polling_timeout_seconds:-600}
elapsed=0

while [ $elapsed -lt $timeout ]; do
  curl -s --ssl-revoke-best-effort \
    "https://generativelanguage.googleapis.com/v1beta/interactions/${interaction_id}" \
    -H "x-goog-api-key: $GEMINI_API_KEY" > "$final_receipt"

  status=$(jq -r '.status' "$final_receipt")

  case "$status" in
    completed)  break ;;
    failed|cancelled)
      echo "❌ Gemini Deep Research $status (영수증: $final_receipt)"
      exit 1 ;;
    *)  sleep "$interval"
        elapsed=$((elapsed + interval)) ;;
  esac
done

if [ "$status" != "completed" ]; then
  echo "❌ Gemini Deep Research 타임아웃 (${timeout}s 초과). 영수증: $final_receipt"
  exit 1
fi
```

> **사용자 가시성**: 폴링 루프 동안 매 N회마다 진행상황 표시 권장 — `🔬 Gemini Deep Research 진행 중... ({elapsed}s / {timeout}s)`. Bash로 표시하기 어렵다면 오케스트레이터 메시지로 대체.

### B.4. 영수증 검증 (HARD GATE)

`final_receipt` 파일에 대해 순서대로:

1. JSON 파싱 가능
2. `error` 필드 부재
3. `status == "completed"` (failed/cancelled은 위 폴링에서 이미 abort)
4. `usage.total_tokens > 0` → 0/누락 시 `❌ DEEP_RESEARCH_RECEIPT_INVALID: total_tokens가 0 또는 누락`
5. `outputs` 배열이 비어있지 않고, `outputs[-1].text`가 비어있지 않음
6. citations(grounding_metadata) 1개 이상 — Deep Research 특성상 grounding 없으면 신뢰도 의심

### B.5. 응답 파싱 (검증 통과 후)

| 추출 항목 | 위치 |
|---|---|
| 본문 (최종 보고서) | `outputs[-1].text` |
| 사고 요약 (선택) | `outputs[].thought_summary` (있을 때만) |
| 인용 URL 배열 | `outputs[].grounding_metadata.grounding_chunks[].web.uri` 또는 응답 내 `citations` 필드 |
| 토큰 사용량 | `usage.total_tokens`, `usage.prompt_tokens`, `usage.completion_tokens` |
| Agent 식별자 | 요청 시 보낸 `agent` 값 (응답에는 없을 수 있음 — 메타에 직접 기록) |

> **주의**: Gemini Interactions API는 베타이므로 응답 구조가 변경될 수 있다. 위 필드가 누락되면 `final_receipt` 파일 전체를 사용자에게 표시하고 어떤 필드가 비어있는지 보고할 것.

### B.6. research-agent 주입 형태

```
<mode>deep-research</mode>
<gemini_result>
  {final_receipt 파일의 JSON 전문}
</gemini_result>
<receipt_path>{final_receipt}</receipt_path>
```

---

## Engine 선택 알고리즘

`research.md`, `challenge.md`, `debate.md`의 엔진 선택 단계는 다음을 따른다:

```
config_engine = features.deep_research_engine ?? "ask"
perplexity_available = PERPLEXITY_API_KEY 존재
gemini_available = GEMINI_API_KEY 존재

# 케이스 1: config가 명시적으로 선택
IF config_engine == "perplexity" AND perplexity_available:
  use perplexity
ELIF config_engine == "gemini" AND gemini_available:
  use gemini
ELIF config_engine in ["perplexity", "gemini"] AND not available:
  show error: "{engine} 키가 없습니다. /sowhat:config" + 사용 가능한 엔진 목록 제시

# 케이스 2: config == "ask" 또는 미설정
ELIF perplexity_available AND gemini_available:
  prompt user:
    🔬 Deep Research 엔진 선택
      [1] Perplexity sonar-deep-research   (동기, ~30초)
      [2] Gemini deep-research-pro-preview (비동기, 2-5분, citations 풍부)
ELIF perplexity_available:  use perplexity (단독 가용 — 자동 선택, 알림만)
ELIF gemini_available:      use gemini (단독 가용 — 자동 선택, 알림만)
ELSE:
  show error: "Deep Research 사용 가능한 엔진이 없습니다. /sowhat:config 에서 키 설정"
```

> **`--deep` 플래그가 명시적으로 있는데 가용 엔진이 0개**: Web Research fallback을 사용자가 명시적으로 선택해야 함. 자동 fallback 금지.

---

## 사용자 동의 fallback 절차 (영수증 검증 실패 시)

영수증 검증 게이트가 실패한 경우 모든 어댑터는 동일한 사용자 동의 절차를 따른다:

```
❌ Deep Research 영수증 검증 실패
   엔진: {perplexity:sonar-deep-research | gemini:{agent}}
   사유: {validation.reason}
   영수증: {receipt_path}

   자동 fallback은 금지되어 있습니다 (사용자가 deep research를 받았다고 오인 방지).

   다음 중 선택:
     [1] Web Research(WebSearch/WebFetch)로 fallback — engine = "web"
     [2] 다른 Deep Research 엔진으로 재시도 (사용 가능한 경우)
     [3] 영수증 확인 후 동일 엔진 재시도
     [4] 취소
```

세션 단위 결정이 필요한 워크플로우(debate)는 `deep_session_decision`로 1회만 묻고 재사용한다.

---

## 메타데이터 출력 표준

모든 Deep Research 결과 출력은 다음 헤더를 **반드시** 포함한다:

```
🔬 Engine: {perplexity:{모델} | gemini:{agent}}
   Tokens: {usage.total_tokens} | Citations: {M} | Spot-checked: {K}
   영수증: {receipt_path}
```

Web Research fallback 발생 시:

```
⚠️ Deep Research 실패 → Web Research fallback (사용자 동의)
   실패 엔진: {engine:model}
   실패 사유: {validation.reason}
   실패 영수증: {failed_receipt_path}
   현재 Engine: web (WebSearch/WebFetch)
```

이 헤더를 생략하는 출력은 어떤 워크플로우에서도 허용되지 않는다 — 사용자가 어떤 엔진이 실제로 실행되었는지 검증할 수 없게 만들기 때문이다.
