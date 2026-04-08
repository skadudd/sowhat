# /sowhat:config — sowhat 설정 관리

<!--
@metadata
checkpoints: []
config_reads: [features, credibility]
config_writes: [features]
continuation: null
status_transitions: []
-->

사용자가 Claude Code 내부 구조(settings.json, 환경변수 등)를 몰라도 되도록 sowhat 설정을 추상화한다.
**단계적 안내**: 항상 메뉴부터 시작 → 선택 → 입력. 사용자에게 "무엇이 가능한지"를 먼저 보여준다.

## 인자 파싱

`$ARGUMENTS`는 **무시한다**. 항상 대화형 메뉴부터 시작한다.
인자가 있어도 메뉴를 건너뛰지 않는다 — 사용자가 설정 가능 항목을 한눈에 파악하는 것이 우선.

---

## Step 1: 메인 메뉴

```
sowhat 설정

[1] API 키 관리
[2] 기능 설정
[3] 현재 설정 보기
[4] 설정 초기화
[5] 파일 직접 편집
```

---

## Step 2-A: API 키 관리 ([1] 선택 시)

### 2-A-1. 서비스 목록

현재 상태를 함께 표시한다:

```bash
# 환경변수 존재 여부만 확인 (값은 표시하지 않음)
if [ -n "$PERPLEXITY_API_KEY" ]; then
  perplexity_status="✅ 설정됨"
else
  perplexity_status="❌ 미설정"
fi
```

```
API 키 관리

[1] Perplexity ({perplexity_status})
    Deep Research 심층 조사에 사용

어떤 서비스를 설정할까요?
```

> 향후 서비스 추가 시 이 목록에 항목만 추가하면 된다.

### 2-A-2. Perplexity 설정 ([1] 선택 시)

이미 설정되어 있으면:

```
Perplexity API 키

현재: ✅ 설정됨 (pplx-****{마지막4자})

[1] 키 변경
[2] 키 삭제
[3] 돌아가기
```

미설정이면:

```
Perplexity API 키

현재: ❌ 미설정
발급: https://www.perplexity.ai/settings/api

API 키를 입력하세요 (pplx-...):
```

### 2-A-3. 키 검증 + 저장

사용자가 키를 입력하면:

1. **형식 검증**: `pplx-`로 시작하는지 확인
   - 아니면: `⚠️ Perplexity API 키는 보통 'pplx-'로 시작합니다. 이대로 진행할까요? [1] 예 [2] 다시 입력`

2. **연결 검증**: 실제 API 호출로 키 유효성 확인
   ```bash
   response=$(curl -s -o /dev/null -w "%{http_code}" \
     https://api.perplexity.ai/v1/agent \
     -H "Authorization: Bearer {입력된_키}" \
     -H "Content-Type: application/json" \
     -d '{"preset":"fast-search","input":"test"}')
   ```
   - `200`: 유효
   - `401`: `❌ API 키가 유효하지 않습니다. 다시 확인해주세요.` → 재입력 안내
   - `429`: 유효 (요청 한도 초과일 뿐 키는 정상)
   - 기타: `⚠️ API 연결 확인 실패 ({status}). 키를 저장하고 나중에 확인할까요? [1] 저장 [2] 취소`

3. **저장 범위 선택**:

   ```
   저장 범위를 선택하세요:

   [1] 전역 (모든 프로젝트에 적용)
       ~/.claude/settings.local.json
   [2] 이 프로젝트만
       .claude/settings.local.json
   [3] 둘 다
   ```

   선택에 따라 해당 `settings.local.json`을 읽고 (없으면 `{}` 기준), `env` 섹션에 추가한다:
   - **[1] 전역**: `~/.claude/settings.local.json`에 저장
   - **[2] 프로젝트**: `.claude/settings.local.json`에 저장
   - **[3] 둘 다**: 양쪽 모두 저장

   ```json
   {
     "env": {
       "PERPLEXITY_API_KEY": "pplx-..."
     }
   }
   ```

   **이미 존재하는 필드는 보존**하고 `env.PERPLEXITY_API_KEY`만 추가/업데이트한다.
   이 파일은 `.gitignore`에 포함되어 있어 git에 커밋되지 않는다.

4. **완료 안내**:
   ```
   ✅ Perplexity API 키 설정 완료

   저장: {전역 (~/.claude/) | 프로젝트 (.claude/) | 전역 + 프로젝트}

   ⚠️ 이미 실행 중인 세션에는 자동 반영되지 않습니다.
      다른 세션에서 사용하려면 해당 세션을 재시작하세요.
   ```

### 2-A-4. 키 삭제

"키 삭제" 선택 시:

```
⚠️ Perplexity API 키를 삭제합니다.
Deep Research가 비활성화되고 기본 웹 검색이 사용됩니다.

[1] 삭제
[2] 취소
```

삭제 시 `.claude/settings.local.json`에서 `env.PERPLEXITY_API_KEY` 키를 제거한다.

---

## Step 2-B: 기능 설정 ([2] 선택 시)

### 2-B-1. 기능 목록

`planning/config.json`의 `features` 섹션을 읽고, 전역 기본값(`~/.claude/settings.local.json`의 `sowhat`)도 함께 참조하여 표시한다:

```
기능 설정

[1] Deep Research: {auto ✅ | enabled ✅ | disabled ❌}
    Perplexity API로 심층 조사

[2] Deep Research Preset: {deep-research}
    Perplexity Agent API preset

[3] Sub-Research: {enabled ✅ | disabled ❌}
    expand 중 병렬 리서치 자동 실행

변경할 항목 번호를 선택하세요 (또는 'done'):
```

> 프로젝트 config가 없으면 (init 전) 전역 기본값을 표시한다.

### 2-B-2. Deep Research 토글 ([1] 선택 시)

```
Deep Research 설정

[1] auto — API 키가 있으면 자동 활성화 (권장)
[2] enabled — 항상 활성화 (API 키 필수)
[3] disabled — 비활성화

현재: {현재값}
```

선택 시 `planning/config.json`의 `features.deep_research`를 업데이트한다.
`enabled` 선택 시 API 키가 없으면: `⚠️ API 키가 설정되지 않았습니다. 먼저 API 키를 설정하세요.` → 메인 메뉴로 돌아가기.

### 2-B-3. Deep Research Preset 변경 ([2] 선택 시)

```
Deep Research Preset (Perplexity Agent API)

[1] fast-search — 빠른 검색 (단일 스텝, 최소 지연)
[2] pro-search — 균형 (3스텝, 웹 검색+URL 패치)
[3] deep-research — 심층 조사 (10스텝, 다단계 분석) ← 기본값
[4] advanced-deep-research — 최대 정밀도 (10스텝, 최대 깊이)

현재: {현재값}
```

선택 시 `planning/config.json`의 `features.deep_research_preset`을 업데이트한다.

### 2-B-4. Sub-Research 토글 ([3] 선택 시)

```
Sub-Research 설정

[1] enabled — expand 중 자동 리서치 활성화
[2] disabled — 비활성화

현재: {현재값}
```

선택 시 `planning/config.json`의 `features.sub_research`를 업데이트한다.

### 2-B-5. 저장 범위 선택

각 항목 변경 시 저장 범위를 선택한다:

```
저장 범위:

[1] 이 프로젝트만 (planning/config.json)
[2] 전역 기본값으로 저장 (~/.claude/settings.local.json)
    → 새 프로젝트에도 이 값이 적용됩니다
[3] 둘 다
```

- **[1]**: `planning/config.json`의 `features.{field}`만 업데이트
- **[2]**: `~/.claude/settings.local.json`의 `sowhat.{field}`를 업데이트. 기존 `env` 등 다른 키는 보존.
- **[3]**: 양쪽 모두 업데이트

**프로젝트가 없을 때** (init 전): [2] 전역만 가능. [1]은 비활성.

전역 저장 시 `~/.claude/settings.local.json` 예시:
```json
{
  "env": {
    "PERPLEXITY_API_KEY": "pplx-..."
  },
  "sowhat": {
    "deep_research": "enabled",
    "deep_research_preset": "advanced-deep-research",
    "sub_research": "enabled"
  }
}
```

### 2-B-6. 변경 완료

각 항목 변경 + 저장 후 기능 목록(2-B-1)으로 돌아간다.
`done` 입력 시:

```
✅ 기능 설정 완료
```

---

## Step 2-C: 현재 설정 보기 ([3] 선택 시)

```
sowhat 설정 현황

프로젝트: {project name}
레이어: {planning | spec | finalized}

API 키:
  Perplexity: {✅ 설정됨 (pplx-****{마지막4자}) | ❌ 미설정}

기능:
  Deep Research: {auto | enabled | disabled}
  Deep Research Preset: {preset name}
  Sub-Research: {enabled | disabled}

전역 기본값 (~/):
  Deep Research: {sowhat.deep_research || 미설정}
  Deep Research Preset: {sowhat.deep_research_preset || 미설정}
  Sub-Research: {sowhat.sub_research || 미설정}

출처 신뢰도:
  Strict 모드: {true | false}
  화이트리스트: {N}개 도메인
  블랙리스트: {N}개 도메인
```

API 키 값은 마지막 4자리만 표시한다.

---

## Step 2-D: 설정 초기화 ([4] 선택 시)

```
⚠️ 다음 설정을 기본값으로 초기화합니다:
  - features (기능 토글)
  - credibility (출처 신뢰도 커스텀 설정)

API 키는 초기화되지 않습니다.

[1] 초기화
[2] 취소
```

초기화 시 `planning/config.json`의 `features`와 `credibility`를 기본값으로 복원:
```json
"features": {
  "sub_research": "enabled",
  "sub_research_engine": "agent-browser",
  "sub_research_fallback": "websearch",
  "deep_research": "auto",
  "deep_research_preset": "deep-research"
},
"credibility": {
  "custom_whitelist": [],
  "custom_blacklist": [],
  "strict_mode": false
}
```

---

## Step 2-E: 파일 직접 편집 ([5] 선택 시)

대화형 핑퐁 대신 설정 파일을 직접 편집하고 검증받는 모드.

### 2-E-1. 편집 대상 선택

```
파일 직접 편집

[1] 프로젝트 설정 (planning/config.json)
    현재 프로젝트의 features, credibility 등
[2] 전역 기본값 (~/.claude/settings.local.json)
    API 키 + sowhat 전역 기본값
```

### 2-E-2. 편집 가능 필드 레퍼런스 출력

선택된 파일의 편집 가능한 필드와 허용값을 출력한다. 사용자가 무엇을 어떻게 바꿀 수 있는지 즉시 파악할 수 있도록 한다.

**[1] 프로젝트 설정 선택 시:**

```
planning/config.json 편집 레퍼런스

편집 가능 필드:
┌─────────────────────────┬──────────────────────────────────────────────┐
│ features.deep_research  │ "auto" | "enabled" | "disabled"              │
│ features.deep_research  │                                              │
│   _preset               │ "fast-search" | "pro-search"                 │
│                         │ | "deep-research" | "advanced-deep-research" │
│ features.sub_research   │ "enabled" | "disabled"                       │
│ credibility.strict_mode │ true | false                                 │
│ credibility.custom      │ ["domain1.com", "domain2.org"]               │
│   _whitelist            │                                              │
│ credibility.custom      │ ["domain.com"]                               │
│   _blacklist            │                                              │
└─────────────────────────┴──────────────────────────────────────────────┘

⚠️ 위 필드 외에는 수정하지 마세요 (project, layer, sections 등은 워크플로우가 관리).

파일을 편집한 뒤 'done'을 입력하면 검증합니다.
```

**[2] 전역 기본값 선택 시:**

```
~/.claude/settings.local.json 편집 레퍼런스

편집 가능 필드:
┌───────────────────────────────┬──────────────────────────────────────────────┐
│ env.PERPLEXITY_API_KEY        │ "pplx-..." (문자열)                          │
│ sowhat.deep_research          │ "auto" | "enabled" | "disabled"              │
│ sowhat.deep_research_preset   │ "fast-search" | "pro-search"                 │
│                               │ | "deep-research" | "advanced-deep-research" │
│ sowhat.sub_research           │ "enabled" | "disabled"                       │
└───────────────────────────────┴──────────────────────────────────────────────┘

⚠️ permissions, env 내 다른 키 등 기존 필드는 건드리지 마세요.

파일을 편집한 뒤 'done'을 입력하면 검증합니다.
```

### 2-E-3. 편집 대기 + 검증

사용자가 `done`을 입력하면 파일을 다시 읽고 검증한다.

**검증 항목:**

```python
def validate_config(file_path, file_type):
    content = read_file(file_path)

    # 1. JSON 파싱
    try:
        data = json.loads(content)
    except JSONDecodeError as e:
        return ERROR(f"❌ JSON 파싱 실패 (line {e.lineno}): {e.msg}")

    if file_type == "project":  # planning/config.json
        features = data.get("features", {})

        # 2. deep_research 값 검증
        dr = features.get("deep_research")
        if dr and dr not in ["auto", "enabled", "disabled"]:
            return ERROR(f"❌ features.deep_research: '{dr}' — 허용값: auto | enabled | disabled")

        # 3. deep_research_preset 값 검증
        preset = features.get("deep_research_preset")
        valid_presets = ["fast-search", "pro-search", "deep-research", "advanced-deep-research"]
        if preset and preset not in valid_presets:
            return ERROR(f"❌ features.deep_research_preset: '{preset}' — 허용값: {valid_presets}")

        # 4. sub_research 값 검증
        sr = features.get("sub_research")
        if sr and sr not in ["enabled", "disabled"]:
            return ERROR(f"❌ features.sub_research: '{sr}' — 허용값: enabled | disabled")

        # 5. strict_mode 타입 검증
        sm = data.get("credibility", {}).get("strict_mode")
        if sm is not None and not isinstance(sm, bool):
            return ERROR(f"❌ credibility.strict_mode: '{sm}' — boolean이어야 합니다")

        # 6. 필수 필드 존재 확인
        for key in ["project", "layer", "sections"]:
            if key not in data:
                return ERROR(f"❌ 필수 필드 '{key}'가 삭제되었습니다. 복원하세요.")

    elif file_type == "global":  # ~/.claude/settings.local.json
        sowhat = data.get("sowhat", {})

        # sowhat 필드 검증 (위와 동일한 값 검증)
        dr = sowhat.get("deep_research")
        if dr and dr not in ["auto", "enabled", "disabled"]:
            return ERROR(f"❌ sowhat.deep_research: '{dr}'")

        preset = sowhat.get("deep_research_preset")
        valid_presets = ["fast-search", "pro-search", "deep-research", "advanced-deep-research"]
        if preset and preset not in valid_presets:
            return ERROR(f"❌ sowhat.deep_research_preset: '{preset}'")

        sr = sowhat.get("sub_research")
        if sr and sr not in ["enabled", "disabled"]:
            return ERROR(f"❌ sowhat.sub_research: '{sr}'")

        # API 키 형식 경고 (에러는 아님)
        api_key = data.get("env", {}).get("PERPLEXITY_API_KEY", "")
        if api_key and not api_key.startswith("pplx-"):
            return WARNING("⚠️ PERPLEXITY_API_KEY가 'pplx-'로 시작하지 않습니다")

    return OK
```

### 2-E-4. 검증 결과 출력

**통과 시:**
```
✅ 검증 통과

변경 감지:
  features.deep_research_preset: "deep-research" → "advanced-deep-research"
  features.deep_research: "auto" → "enabled"
```

**실패 시:**
```
❌ 검증 실패

  [1] features.deep_research_preset: "ultra-search" — 허용값: fast-search | pro-search | deep-research | advanced-deep-research
  [2] JSON line 15: Expected ',' but got '}'

파일을 수정한 뒤 다시 'done'을 입력하세요. (또는 'cancel')
```

실패 시 사용자가 다시 편집 → `done` → 재검증 루프를 반복한다. `cancel` 입력 시 메인 메뉴로 복귀.

---

## 핵심 원칙

- **단계적 안내** — 항상 메뉴 → 선택 → 입력. 사용자가 "무엇이 가능한지"를 먼저 본다
- **사용자는 Claude Code 내부를 몰라도 된다** — settings.json, 환경변수 경로를 노출하지 않음
- **API 키는 안전하게** — `.claude/settings.local.json`에 저장 (gitignored), 표시 시 마스킹
- **검증 후 저장** — API 키는 실제 호출로 유효성 확인 후 저장
- **기존 설정 보존** — 설정 파일의 다른 필드를 절대 덮어쓰지 않음
- **돌아가기 가능** — 각 단계에서 상위 메뉴로 복귀 가능
