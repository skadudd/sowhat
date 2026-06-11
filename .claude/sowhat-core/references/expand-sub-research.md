# Expand — Sub-Research Semi-Async 전환

스텝 4 Grounds 핑퐁에서 근거 출처로 `[6] Sub-Research`(AI 외부 조사)를 선택했을 때의 Semi-Async 흐름. Grounds 의존 스텝(CQ 응답)은 결과 대기, 무관 스텝(Confidence/Scope/AC)은 먼저 진행한다. `workflows/expand.md`가 스텝 4에서 Sub-Research 분기 진입 시 이 파일을 읽고 그대로 따른다.

---

### 스텝 4 SUB-RESEARCH: Semi-Async 전환

**[6] Sub-Research 선택 시 이 흐름으로 전환된다.**

#### Deep Research 선택 UX

[6] 선택 직후, `planning/config.json`의 `features.deep_research` 값을 확인한다.

> **API 키 탐색 순서** (환경변수가 세션 시작 후 설정된 경우를 대비):
> `$PERPLEXITY_API_KEY` → `.claude/settings.local.json` → `~/.claude/settings.local.json`
> (`/sowhat:research` 워크플로우의 "API 키 탐색 순서" 참조)

**Case 1: `deep_research` == `"disabled"` 또는 config에 features 없음**
→ UX 없이 기본 agent-browser 검색으로 바로 진행.

**Case 2: `deep_research` == `"enabled"` 또는 (`"auto"` && API 키 존재)**
→ 다음 선택지를 제시:

```
> [expand {section} > 스텝 4/7 Grounds > Sub-Research]
> Claim: "{Claim 40자}"

🔍 리서치 방식을 선택하세요:

  [1] 기본 웹 검색 — agent-browser 인라인 검색 (빠름, 표면 수준)
  [2] 🔬 Deep Research — Perplexity Agent API ({preset명}) 심층 조사

💡 Deep Research는 학술·통계·산업 리포트 등 깊은 근거가 필요할 때 유용합니다.
   현재 preset: {preset명} — /sowhat:config 에서 변경 가능
```

**Case 3: `deep_research` == `"auto"` && `PERPLEXITY_API_KEY` 미설정**
→ 다음 안내를 제시:

```
> [expand {section} > 스텝 4/7 Grounds > Sub-Research]
> Claim: "{Claim 40자}"

🔍 기본 웹 검색으로 진행합니다.

💡 Deep Research를 사용하려면: /sowhat:config api-key perplexity
```

→ 안내 후 기본 agent-browser 검색으로 바로 진행.

**[1] 기본 웹 검색 선택 시**: 아래 Semi-Async 흐름 그대로 진행.

**[2] Deep Research 선택 시**: `/sowhat:research --deep` 워크플로우의 Deep Research 실행 섹션을 따른다. 단, 다음 차이점이 있다:
- 검색 쿼리를 현재 Claim + Stasis + Scheme 기반으로 자동 구성 (인간 입력 불필요)
- 결과는 아래 "Sub-Research 결과 제시" 형식으로 표시하되, `🔬 Deep Research` 표시를 추가
- Semi-Async 전환은 동일하게 적용 (Confidence → Scope → AC 먼저 진행)
- Finding 파일 생성은 `/sowhat:research` 워크플로우와 동일한 형식

#### Semi-Async 실행 원칙

CQ 응답은 Grounds에 의존한다. Grounds가 확정되지 않은 채 CQ에 답변하면 Grounds 변경 시 답변도 다시 써야 한다. 따라서:

- **Grounds 의존 스텝 (CQ 응답)**: Grounds 완료 후에만 진행
- **Grounds 무관 스텝 (Confidence, Scope, AC)**: Sub-Research 실행 중 먼저 진행

```
🔍 Sub-Research 시작 ({기본 웹 검색|🔬 Deep Research})
   {agent-browser|Perplexity}가 백그라운드에서 검색 중입니다.
   Grounds와 무관한 스텝을 먼저 진행합니다.

   진행 순서: Confidence → Scope → AC → [Grounds 완료 대기] → CQ 응답
```

Confidence (스텝 6) → Scope (스텝 7 일부) → AC (스텝 7 일부) 순서로 먼저 진행한다.
CQ 응답 진입 직전에 Sub-Research 결과를 대기하고 확인한다.

#### Sub-Research Agent 프롬프트 (자동 생성)

```
다음 주장에 대한 근거를 리서치하세요.

Claim: "{현재 Claim}"
Stasis: {stasis}
Scheme: {scheme}
필요 근거 유형: {scheme 기반 증거 요건}

요구사항:
- 한국어 + 영어 병렬 검색 (WebSearch)
- 접근 가능한 페이지는 agent-browser로 본문 추출
- 최소 2개 이상의 독립 출처 확보 시도
- 수치/출처/연도가 있는 것만 채택
- 접근 불가 사이트는 스니펫으로 대체하고 명시할 것

반환 형식 (JSON):
[
  {
    "content": "...",
    "source": "...",
    "year": 2024,
    "credibility": "high|medium|low",
    "access": "full|snippet",
    "note": "접근 제한 등 특이사항"
  }
]
```

#### Sub-Research 결과 제시

**기본 웹 검색 결과:**
```
> [expand {section} > 스텝 4/7 Grounds > Sub-Research 완료]
> Claim: "{Claim 40자}"
> 검색: {검색어} (한국어 + 영어)

🔍 검색 결과 ({N}건)

  [1] {출처명} {연도}
      "{핵심 내용}"
      신뢰도: ★★★★★  접근: {full|snippet}
      Scheme 적합도: ✅ {이유}

  [2] {출처명} {연도}
      "{핵심 내용}"
      신뢰도: ★★★☆☆  접근: snippet ⚠️ 원문 미확인
      Scheme 적합도: ✅ {이유}

Grounds에 추가할 항목을 선택하세요:
  [1]  [2]  [3]  [12]  [13]  [23]  [123]
  [0] 결과 기각 — 직접 작성으로 돌아가기
```

**🔬 Deep Research 결과:**
```
> [expand {section} > 스텝 4/7 Grounds > 🔬 Deep Research 완료]
> Claim: "{Claim 40자}"

🔬 Deep Research 완료 ({N}건 발견, Perplexity {preset명})
   인용 출처: {M}개 URL

  [1] {출처명} {연도}
      "{핵심 내용}"
      📊 신뢰도: {Tier} ({tier_reason})
      Scheme 적합도: ✅ {이유}

  [2] {출처명} {연도}
      "{핵심 내용}"
      📊 신뢰도: {Tier} ({tier_reason}) — ⚠️ 교차검증 필요
      Scheme 적합도: ✅ {이유}

Grounds에 추가할 항목을 선택하세요:
  [1]  [2]  [3]  [12]  [13]  [23]  [123]
  [0] 결과 기각 — 직접 작성으로 돌아가기
```

Deep Research 결과의 신뢰도는 `references/source-credibility.md` Tier 시스템(T1-T4)을 사용한다. T4 출처는 자동으로 보조 인용 전용 경고가 붙는다.

#### Sub-Research 실패 처리

```
⚠️  Sub-Research 결과 불충분
    (검색 결과 없음 또는 Scheme 적합도 낮음)

  [1] 검색어 수정 후 재시도 → 직접 검색어 입력
  [2] Open Question으로 등록 후 나중에 직접 리서치
  [3] 근거 없이 진행 → Confidence를 "uncertain" 이하로 자동 제안
```

[3] 선택 시: `⚠️ Grounds 없이 진행합니다. Confidence는 "uncertain" 이하를 강력 권장합니다.`
