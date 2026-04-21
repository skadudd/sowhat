# Fabrication Prevention — AI 생성 콘텐츠의 허구 인용 차단

sowhat의 모든 워크플로우가 참조하는 단일 규칙. AI가 사용자에게 제시하는 **선택지·제안·예시·placeholder·힌트**에 fabrication 가능한 고유값을 포함하지 않는다.

이 문서는 **spec**이다. 구현 layer는 아래 §Layer 책임 분리를 따른다.

## 이 문서 읽는 법 (navigation)

| 관심사 | 읽을 섹션 |
|---|---|
| 이 규칙이 왜 필요한가 | §왜 이 규칙이 필요한가 |
| 무엇을 막고 무엇을 안 막는가 | §Scope IN / §Scope OUT |
| 어느 layer에서 어떻게 막는가 | §Layer 책임 분리 + 의존성 다이어그램 |
| 특정 layer 구현 명세 | §L1 / §L2 / §L3 / §L4 "구현 명세" Contract 블록 |
| 내 워크플로우에 L1 적용했는지 | §대상 워크플로우 / §대상 에이전트 |
| 구체 금지 값 목록 | §금지되는 고유값 |
| 허용 표현 | §허용되는 표현 / §구체 내용이 들어올 수 있는 3가지 경로 |
| 테스트 케이스 | §Acceptance Criteria (P/R/X/E/S/ESH 시나리오) |
| spec 준수 검증 | §검증 가능성 (grep 명령 3단계) |

## 왜 이 규칙이 필요한가

expand 같은 핑퐁 워크플로우에서 AI는 선택지를 구체적으로 생성하도록 지시받는다. 예: `[1] McKinsey 2024 리포트: 이탈률 34%`. 이 값은 retrieval 없이 LLM이 생성한 것이며, 존재하지 않을 수 있다. 사용자가 그 선택지를 수락하면 **그럴듯하지만 실재하지 않는 인용**이 Backing으로 저장된다.

단일 layer로 이를 막으려 하면(예: settle이 URL 유효성까지 검증) 할 수 없는 일을 하게 되어 bypass가 생긴다. 따라서 **layer별로 책임을 분리하고, 각 layer는 자신이 보장할 수 있는 것만** 보장한다.

---

## Scope (이번 구현 범위)

### Scope IN — 완전히 막는다

- **기관명 + 연도 + 수치 조합** 탐지 (영문·한글·기관 접미어 패턴)
- 출처 표기(URL / `file:` / `dir:` / `#NNN` finding ID / DOI) **형식상 존재** 검증

### Scope OUT — 이번 구현에서 제외

다음 카테고리는 **L2 settle에서 탐지하지 않는다**. L3 challenge Stage 0 또는 L4 finalize 게이트에서 처리한다:

- **사람 이름** (`Smith et al.`, `김현철 교수`) — 정규식 false positive 과다, 인명 DB 필요
- **보고서·논문·책명** — 자유 형식, 규칙 기반 탐지 불가능
- **제품·법안·사건 고유명** — 사전 정의된 목록 없이 탐지 불가
- **URL 유효성 (실존·내용 대조)** — settle에서 fetch 불가, L3 책임
- **값 정확성 대조** — 원문과의 일치 여부는 실제 fetch 필요, L3 책임

향후 확장 시 이 목록을 Scope IN으로 이동.

---

## Layer 책임 분리

| Layer | 시점 | 책임 | Guarantees | Does NOT | Depends on |
|---|---|---|---|---|---|
| **L1 생성** | `expand`, `autonomous`, `debate`, `steelman`, `critic`, `revise`, `inject` 템플릿 + 4개 에이전트 `<principles>` | 플레이스홀더 강제, 실명 제시 차단 | AI가 먼저 `McKinsey 2024: 34%` 같은 선택지를 **제안하지 않음** | 사용자 직접 입력 검증 | — (첫 방어선) |
| **L2 입력 검증** | `settle` stub detection | **형식 검증만**: 기관명+연도+수치 패턴 + 출처 표기 존재 | 패턴 있는데 표기 없음 → reject | URL 실존·값 정확성·사람명·보고서명 | L1을 뚫은 값 또는 사용자 직접 입력 값 |
| **L3 최종 검증** | `challenge` Stage 0 | URL fetch, 값 대조, 1차 출처 역추적, 사람명·보고서명 semantic 확인 | 가짜 URL·값 불일치·실존하지 않는 인물/출처 탐지 | (사용자가 실행해야 작동) | L2를 통과한 값 (특히 scope out 카테고리 + 가짜 URL) |
| **L4 게이트키핑** | `finalize-planning`, `finalize` | L3 자동 강제 실행 | 최종 산출물 전 반드시 Stage 0 통과 | — | L3가 이미 구현되어 있고 호출 가능해야 함 |

### Layer 의존성 다이어그램

```
[User input / AI proposal]
            ↓
┌─────────────────────────────────────┐
│ L1 생성 시점 — 템플릿/프롬프트 차단 │  ← AI가 실명·수치 생성 시도 차단
└─────────────────────────────────────┘
            ↓ (뚫리면)
┌─────────────────────────────────────┐
│ L2 settle stub detection            │  ← 형식 검증 (출처 표기 있나?)
│ (기관명+연도+수치 패턴 탐지)        │
└─────────────────────────────────────┘
            ↓ (pass → draft에 저장)
            ↓ (scope out 카테고리 + 가짜 URL 통과)
┌─────────────────────────────────────┐
│ L3 challenge Stage 0                │  ← semantic 검증 (실제 fetch/대조)
│ (optional — 사용자 명시 실행)       │
└─────────────────────────────────────┘
            ↑ 자동 호출
┌─────────────────────────────────────┐
│ L4 finalize/finalize-planning 게이트│  ← L3 자동 강제
│ (export 전 반드시 실행)             │
└─────────────────────────────────────┘
            ↓ (통과한 값만)
[최종 산출물]
```

**핵심**: 각 layer는 **위 layer가 놓친 것만** 처리한다. 모든 layer가 모든 걸 검증하려 하면 할 수 없는 일(L2의 URL fetch 등)을 시도하게 되어 bypass가 생긴다.

### 왜 L2는 URL 유효성을 검증하지 않는가

L2(settle)는 출처 표기의 **형식적 존재**만 본다. URL이 fetchable한지, 값이 원문과 일치하는지는 실제 네트워크 호출이 필요하므로 L3로 위임한다.

이로 인해 `"McKinsey 2024: 34% (https://fake.example.com)"` 같은 가짜 URL은 L2를 통과한다. 이건 버그가 아니라 **layer 경계**다. L4 finalize 게이트가 L3를 자동 호출하므로 최종 산출물엔 남지 않는다.

### L4가 보장하는 것

- `finalize-planning.md`: challenge 자동 실행 **생략 불가** — 기획→명세 전환 전 Stage 0 통과 강제
- `finalize.md`: challenge 자동 실행 (`--force`로 건너뛸 수는 있으나 기본값은 실행)

사용자가 `/sowhat:challenge`를 명시적으로 실행하지 않아도 L4 시점에서 반드시 L3가 돈다.

---

## 대상 워크플로우 (L1 차단 적용)

L1에서 플레이스홀더·실명 차단을 적용하는 워크플로우:

- `expand` — Claim/Warrant/Backing/Rebuttal 제안 선택지
- `autonomous` — Toulmin 필드 자동 생성
- `debate` — Con/Pro 에이전트 스폰 프롬프트
- `steelman` — Anti-Thesis, Counter-Grounds/Warrant 생성
- `critic` — 5차원 비평 근거
- `revise` — 수정 제안
- `inject` — 자료 추출·요약 과정
- 모든 워크플로우 문서 안의 `예)` `예:` `예시:` 문구
- 사용자에게 출력되는 모든 placeholder·힌트

> **제외**: `branch`는 AI가 Toulmin 내용을 생성하지 않는 메타데이터 워크플로우이므로 L1 대상이 아니다 (새 브랜치 Toulmin은 `/sowhat:expand`가 채우며, 그때 L1이 작동).

## 대상 에이전트 (L1 차단 적용)

에이전트 프롬프트의 `<principles>` 블록에 fabrication 금지 명시:

- `sowhat-con-agent` — 공격 근거 자체 생성 시
- `sowhat-pro-agent` — 방어 근거 자체 생성 시
- `sowhat-critic-agent` — 비평 근거·인용
- `sowhat-challenge-agent` — 공격 리포트 인용
- `sowhat-research-agent` — ✅ 이미 준수 ("Only report what you actually found — no hallucinated data")

---

## 금지되는 고유값 (L1 차단 대상)

AI가 retrieval 없이 생성하면 안 되는 것:

- **수치**: 구체 %, 배수, 금액, 건수, 연율 (예: `34%`, `CAGR 27.8%`, `$12.3B`, `3.2조원`, `3.5배`)
- **기관명**: 실재하는 조직·기업·학술지·매체 이름
  - 영문 화이트리스트: `McKinsey`, `IDC`, `Gartner`, `HubSpot`, `Forrester`, `CB Insights`, `Deloitte`, `PwC`, `Bain`, `BCG`, `KPMG`, `EY`, `Accenture`, `Statista`, `Nielsen`, `Ipsos`, `Pew`, `Harvard`, `MIT`, `Stanford`, `Oxford`, `Cambridge`, `OECD`, `IMF`, `WHO`, `UN`
  - 영문 기관 접미어 패턴: `[A-Z][a-zA-Z]+\s+(Research|Institute|Consulting|Group|Insights|Labs|Partners|Associates)` 형태는 실재 또는 가상 기관일 가능성이 높아 대상에 포함
  - 한글 화이트리스트: `통계청`, `한국은행`, `소프트웨어산업협회`, `한국개발연구원(KDI)`, `한국인터넷진흥원(KISA)`, `삼성경제연구소(SERI)`, `LG경제연구원`, `현대경제연구원`, `금융감독원`, `DART`
  - 한글 기관 접미어 패턴: `[가-힣]{2,}(협회|연구원|연구소|공사|청|원|부|위원회|재단|진흥원|개발원)` 형태는 실재 기관일 가능성이 높아 모두 대상에 포함
  - **화이트리스트 방식 이유**: 단순 `[A-Z][a-zA-Z]+\s+20\d{2}` 패턴은 "In 2024", "Meeting Notes 2024", "Key Takeaways 2024" 같은 일반 영문 표현을 false positive로 잡는다. 화이트리스트 + 접미어 2단 구조로 한글·영문 대칭을 이룬다.
- **연도 + 출처 조합**: `McKinsey 2024`, `IDC 2023` 등 검증 불가한 조합
- **URL**: 실제로 존재하는지 확인되지 않은 주소 (L1 차단 대상 / L2는 형식만 검증 / L3가 실존 확인)

### Scope OUT 카테고리 (L1 차단은 권장, L2는 미구현)

- 사람 이름 — L1에서 AI가 먼저 제시하지 않도록 권장하되, L2 자동 탐지 없음. L3에서 semantic 확인.
- 보고서·논문·책·기사명 — 동일
- 제품·법안·사건 고유명 — 동일

---

## 허용되는 표현

구조와 유형은 제시하되, 검증 가능한 고유값은 비운다:

- **플레이스홀더**: `{기관} {연도}: {수치} {단위}`
- **유형 설명**: `"업계 벤치마크 이탈률 수치"`, `"전환 비용에 대한 기관 연구"`
- **구조적 예시**: `"A is like B in respect C, therefore D"` (논리 구조만)
- **추상적 예시**: `"시장 성장률은 진입 타이밍의 적절성을 증명한다"` (수치 없이 논리만)
- **카테고리 힌트**: `"공개 리서치 리포트 (업계 조사기관 등)"` (type 지시, specific name 아님)

---

## 구체 내용이 들어올 수 있는 3가지 경로

아래 3가지만 허용된다. 이외 경로로 AI가 고유값을 생성하면 **fabrication**이다:

1. **사용자 직접 입력** (`[N] 직접 작성` 선택 시)
2. **Sub-Research 결과** (실제 WebSearch/WebFetch/Perplexity/Gemini 호출 후 반환된 데이터, 영수증 검증 통과)
3. **research/ 파인딩 매핑** (이미 검증된 finding의 인용)

---

## L1 생성 차단 — 구현 명세

각 대상 워크플로우/에이전트의 템플릿·프롬프트에 fabrication 규칙이 주입되어 있다. 구현 상세는 각 워크플로우 파일의 "L1 Fabrication 차단" 블록과 각 에이전트의 `<principles>` 참조.

### Contract

```
Input:          AI가 사용자에게 출력할 문자열 (선택지/예시/플레이스홀더/근거 제안)
Output:         해당 문자열 자체 (규칙 준수 여부가 반영된 상태)

Preconditions:  워크플로우 템플릿 또는 에이전트 <principles>에 L1 참조 주입됨
                (Step 3 전수 조사로 검증)

Postconditions: 출력 문자열에 retrieval 없이 생성된 기관명·수치·연도 조합 없음
                (Scope OUT 카테고리는 L1 가이드만 적용, 자동 강제는 없음)

Guarantees:
  - AI가 선택지 메뉴에서 먼저 "McKinsey 2024: 34%" 같은 실명 인용을 제안하지 않음
  - 구체값이 필요하면 3가지 경로(사용자 직접 입력 / Sub-Research / research finding)로만 들어옴
  - 템플릿에 박힌 예시 문구(`예) "..."`)도 실명을 포함하지 않음

Does NOT guarantee:
  - 사용자가 직접 입력한 값의 검증 (→ L2)
  - AI가 L1 규칙을 완벽히 준수하는지 (LLM 준수도는 불확실, L2가 백업)

Failure modes:
  - 템플릿에 L1 참조가 빠짐 → Step 3 검증 명령으로 탐지
  - LLM이 규칙을 무시하고 실명 생성 → L2가 백업으로 탐지

Depends on: 없음 (첫 방어선)
```

---

## L2 Settle Stub Detection — 구현 명세

Settle은 **형식 검증만** 한다. 구현 상세는 `workflows/settle.md` §Stub Detection 참조.

### Contract

```
Input:          Toulmin 필드 문자열 (Grounds, Backing, Warrant 등)
Output:         pass | reject + reason

Preconditions:  섹션 파일이 로드되어 있고 Toulmin 필드가 채워짐
                Fabrication 검증 예외 목록이 정의됨 (아래 섹션 참조)

Postconditions: reject 시 섹션 status는 변화 없음 (settled로 전환 안 됨)
                pass 시 섹션 status는 settled로 전환 가능

Guarantees:
  - 화이트리스트 기반 기관명(en_direct/ko_direct) + 연도 + 수치 조합이 있는데
    출처 표기(URL / file: / dir: / #NNN / DOI) 중 어느 것도 형식상 존재하지 않으면 reject
  - 기관 접미어 패턴(en_suffix/ko_suffix) + 연도 + 수치도 동일 규칙
  - false positive 방지용 예외(자체 데이터 맥락 / 섹션 교차참조)로 합리적 입력 통과

Does NOT guarantee:
  - URL이 실제로 fetchable한지 (→ L3)
  - 값이 원문과 일치하는지 (→ L3)
  - 인물명·보고서명·제품명 fabrication (→ L3, scope out)
  - AI가 생성한 실명인지 사용자가 직접 입력한 실명인지 구분

Failure modes:
  - 정규식 false positive → 예외 조건 추가로 해소 (AC Test Scenarios 확장)
  - 정규식 false negative → 화이트리스트 확장 또는 접미어 추가
  - 우회 입력 (e.g., `"McKinsey 2024: 34%"` + 가짜 URL) → L3가 잡음

Depends on: L1이 뚫린 값 + 사용자 직접 입력 값
            (L1이 완벽하면 L2 reject 빈도가 낮아짐)
```

### Fabrication 검증 예외 (false positive 방지)

다음 조건 중 하나라도 해당되면 L2 판정을 하지 않는다:

- **자체 데이터 맥락 표기**: `자체 조사`, `자체 데이터`, `내부 조사`, `인하우스`, `internal survey`, `internal data`, `in-house study/research` 중 하나 명시 + 표본 크기(`(n=N)`) 권장
- **파일 경로 출처**: `file:{path}` 또는 `dir:{path}` 참조
- **Research finding ID**: `#NNN` (3자리) 또는 `[리서치 #NNN]`
- **URL**: `http://` 또는 `https://` (실존 확인은 L3)
- **DOI**: `doi:`, `DOI:`, `10.\d{4,}/` 패턴
- **섹션 내부 교차참조**: `{NN}-{section}`, `Appendix`, `§` 등

### 탐지 우선순위 (중복 플래그 방지)

같은 문자열이 여러 조건에 매칭되어도 한 번만 플래그. 우선순위:
1. 금지 기관명 직접 등장 (영문·한글)
2. 한글 접미어 패턴 + 연도
3. 영문 specific-looking citation

---

## L3 Challenge Stage 0 — 구현 명세

구현은 `workflows/challenge.md` Stage 0 및 `agents/sowhat-research-agent.md` fact-check mode 참조.

### Contract

```
Input:          settled 섹션의 Grounds/Backing 주장 목록
Output:         각 claim별 [정확/부정확/부분정확/확인불가] + severity

Preconditions:  섹션이 settled 또는 discussing 상태
                네트워크 접근 가능 (WebFetch/WebSearch)
                research-agent가 fact-check 모드로 스폰 가능

Postconditions: 부정확/부분정확 발견 시 리포트에 기록 + severity 부여
                (역전파는 사용자 승인 필요 — 자동 invalidation 없음)

Guarantees:
  - 모든 URL을 WebFetch로 실존·내용 대조
  - 2차 출처(뉴스 등)이면 1차 출처 역추적 시도
  - 출처 없는 사실 주장은 WebSearch로 독립 검증
  - 단위·방향·해석·대표성 검증
  - 사람명·보고서명이 실존하고 해당 발언/내용이 인용과 일치하는지 semantic 확인
  - Scope OUT 카테고리(인물명/보고서명/제품명) fabrication 여기서 탐지

Does NOT guarantee:
  - 사용자가 `/sowhat:challenge`를 실행하지 않으면 동작하지 않음 (→ L4가 강제)
  - 네트워크 실패 시 일부 claim이 "확인불가"로 남음
  - WebSearch 결과가 없는 전문 영역은 검증 불가

Failure modes:
  - 네트워크 장애 / API 한도 초과 → 해당 claim `확인불가` 판정, 전체 abort 아님
  - Deep Research 영수증 검증 실패 → silent fallback 금지, 사용자 동의 후 Web Research
  - Research-agent 타임아웃 → challenge.md의 Stage 0 타임아웃 핸들러로 abort+재시도

Depends on: L2를 통과한 값 (특히 scope out 카테고리 + 가짜 URL 가능성)
            research-agent 구현 + Perplexity/Gemini 엔진 구현
```

---

## L4 Finalize 게이트 — 구현 명세

사용자가 `/sowhat:challenge`를 명시적으로 실행하지 않아도, finalize/finalize-planning 시점에 L3가 자동으로 돈다. **L2를 통과한 가짜 URL은 L4에서 반드시 발각된다.**

### Contract

```
Input:          finalize-planning 또는 finalize 커맨드 실행 요청
Output:         export 성공 또는 중단 (L3 결과에 따라)

Preconditions:  finalize-planning: 모든 기획 섹션 settled
                finalize: 모든 명세 섹션 settled
                L3(challenge Stage 0)가 호출 가능 상태

Postconditions: L3 통과 시 → 다음 레이어로 전환 또는 export 생성
                L3 실패 시 → 즉시 중단, 인간이 문제 해결 후 재실행

Guarantees:
  - finalize-planning: challenge 자동 실행 **생략 불가** — 기획→명세 전환 전 L3 반드시 통과
  - finalize: challenge 자동 실행 (기본값) — export 전 L3 반드시 통과

Does NOT guarantee:
  - `finalize --force` 시 L3 건너뜀 (escape hatch, ESH1 참조)
  - 사용자가 finalize를 전혀 실행하지 않으면 L4 작동 안 함 (ESH2 참조)

Failure modes:
  - L3가 critical 이슈 발견 → 중단 + 리포트 안내
  - L3 타임아웃 → challenge.md의 Stage 0 타임아웃 핸들러로 위임
  - 네트워크 장애 → L3 partial result + 인간 판단 요청

Depends on: L3 구현이 호출 가능해야 함
            finalize-planning.md, finalize.md의 "challenge 자동 실행" 블록
```

> **`--force` 주의**: `finalize --force`는 L3를 건너뛴다. 이 escape hatch를 사용하면 fabrication 방어선이 전부 무너진다. `--force` 사용 시 사용자에게 알려진 문제 인지 checkpoint가 있다 (`finalize.md` 참조).

---

## 워크플로우 문서 안의 예시 문구

워크플로우 문서(`workflows/*.md`, `references/*.md`)에 쓰인 `예)` `예:` `예시:` 문구도 L1 규칙을 적용한다. 이유: 워크플로우가 실행될 때 이 문구가 그대로 사용자에게 출력되어 "제안"으로 오인될 수 있다.

**좋은 예시 문구:**
```
예) "국내 {산업} 시장은 연 {N}% 성장 중이다"
예) "{기관} {연도} 리포트, CAGR {N}%"
예) "{비율}%가 {요인}을 {결과} 이유로 언급"
```

**나쁜 예시 문구:**
```
예) "국내 SaaS 시장은 연 28% 성장 중이다"
예) "IDC 2024 리포트, CAGR 27.8%"
예) "78%가 통합 비용을 이탈 이유로 언급"
```

---

## Acceptance Criteria (Test Scenarios)

각 시나리오가 **어느 layer에서** 어떻게 처리되는지 명시한다. 구현은 이 표를 통과해야 한다.

### ✅ L2 Settle 통과 (형식 요건 충족)

| # | 입력 문자열 (Grounds/Backing 예시) | L2 판정 | 이유 |
|---|---|---|---|
| P1 | `"자체 조사 (n=120, 2024 Q1): 이탈률 34% — file:data/survey.csv"` | pass | 자체 데이터 맥락 + 표본 + file: 경로 |
| P2 | `"리서치 #003: 업계 벤치마크 이탈률 34%"` | pass | finding ID 존재 |
| P3 | `"McKinsey 2024: 이탈률 34% (https://mckinsey.com/report)"` | pass | URL 형식 존재 (실존 여부는 L3) |
| P4 | `"소프트웨어산업협회 2024 조사: 34% (https://sw.or.kr/...)"` | pass | 한글 기관 + URL 형식 존재 |
| P5 | `"성장기 시장 진입자는 생존율이 높다"` | pass | 정성 기술, 기관+연도+수치 패턴 미매칭 |
| P6 | `"Lee et al. 2023: churn 34% (doi:10.1234/abc)"` | pass | DOI 존재 (인물명은 scope out) |
| P7 | `"이탈률 34% (§3 참조)"` | pass | 섹션 교차참조 예외 |
| P8 | `"통계청 KOSIS 2024: 28% — file:data/kosis.csv"` | pass | 금지 기관명이지만 file: 경로 존재 |
| P9 | `"업계 벤치마크 수준의 이탈률"` | pass | 수치·고유명 없음 |
| P10 | `"Smith et al. 2023에 따르면 34%"` | pass | **scope out** — 인물명, L3에서 검증 |
| P11 | `"Salesforce가 2024년 34% 성장"` | pass | **scope out** — 제품명, L3에서 검증 |
| P12 | `"내부 조사 (n=50): 2024 Q2 NPS 42점"` | pass | 자체 데이터 맥락 + 표본 |

### ❌ L2 Settle 거부 (Scope IN 위반)

| # | 입력 문자열 | L2 판정 | 매칭 조건 |
|---|---|---|---|
| R1 | `"McKinsey 2024: 이탈률 34%"` | reject | 영문 기관 + 연도 + 수치, 출처 표기 0 |
| R2 | `"소프트웨어산업협회 2024 조사: 34%"` | reject | 한글 기관명 직접 + 연도 + 수치 |
| R3 | `"통계청 KOSIS 2024: 28%"` | reject | 금지 기관명 직접 등장 |
| R4 | `"한국컨설팅연구원 2024: CAGR 27%"` | reject | 한글 접미어 패턴(`연구원`) + 연도 + 수치 |
| R5 | `"Gartner 2024: $12.3B TAM"` | reject | 영문 기관 + 연도 + 금액 단위 |
| R6 | `"IDC 2024 기준 이탈률 34%"` | reject | 영문 기관명이 한글 맥락에 있어도 매칭 |
| R7 | `"글로벌컨설팅협회 2024: 34%"` | reject | 가상 기관명도 접미어 패턴 매칭 |
| R8 | `"KDI 2024 보고서: 28%"` | reject | 금지 기관명(약어) 직접 등장 |
| R9 | `"DART 2024 데이터: 34%"` | reject | 금지 기관명 직접 등장 |
| R10 | `"Bain 2023 survey: 45%"` | reject | 영문 기관 + 연도 + 수치 |
| R11 | `"한국은행 2024년 보고에 의하면 34%"` | reject | 금지 기관명 + 연도 + 수치 (한글 조사 `년` 포함) |

### ⚠️ L2 통과 / L3에서 잡힘 (layer 경계 케이스)

이 시나리오들은 L2를 **의도적으로 통과**시킨다. L4 게이트가 L3를 자동 실행하므로 최종 산출물엔 남지 않는다.

| # | 입력 문자열 | L2 | L3 판정 | L4 게이트 효과 |
|---|---|---|---|---|
| X1 | `"McKinsey 2024: 34% (https://fake-url.example.com)"` | pass | WebFetch 실패 → 부정확/확인불가 | finalize 시 challenge 자동 실행으로 반드시 탐지 |
| X2 | `"Smith et al. 2023: 이탈률 34% (https://journal.example.com/smith-2023)"` | pass (인물명 scope out) | URL fetch로 인물·내용 실존 확인 | 동일 |
| X3 | `"McKinsey 2024: 34% (https://real-mckinsey.com/report)"` — URL은 실존하나 수치는 조작 | pass | 값 대조 시 부정확 판정 | 동일 |
| X4 | `"갤럭시 Z Fold 6 연구 2024: 시장점유율 34%"` — 제품·연구 고유명 | pass (scope out) | semantic 확인으로 실존성 검증 | 동일 |

### 🧪 False-positive Regression Set (정규식 개선 후 추가)

화이트리스트 방식 전환 시 잡아야 할 edge case. 단순 패턴 방식이었다면 모두 false positive로 reject되었으나, 화이트리스트+접미어 2단 방식으로는 올바르게 분류됨.

| # | 입력 문자열 | L2 판정 | 이유 |
|---|---|---|---|
| E1 | `"In 2024, market grew 34%"` | pass | `In`은 화이트리스트 아님, 접미어도 없음 |
| E2 | `"Oct 2024 report shows 28% decline"` | pass | `Oct`은 화이트리스트 아님 |
| E3 | `"Meeting Notes 2024 Q1: churn 34%"` | pass | `Meeting Notes`는 화이트리스트 아님, 접미어 아님 |
| E4 | `"Key Takeaways 2024: 45% conversion"` | pass | `Takeaways`는 접미어 목록에 없음 |
| E5 | `"My personal 2024 observation: 50% improvement"` | pass | 일반 영문 표현 |
| E6 | `"Summer 2023 campaign: 12% uplift"` | pass | 계절명은 화이트리스트 아님 |
| S1 | `"Global Strategy Consulting 2024: 34%"` | reject | `Consulting` 접미어 매칭 (가상 기관) |
| S2 | `"Market Research Institute 2023: 45%"` | reject | `Institute` 접미어 매칭 |
| S3 | `"Tech Insights 2024: CAGR 27%"` | reject | `Insights` 접미어 매칭 |

### 💥 L4 Escape Hatch (방어선 무효화)

| # | 시나리오 | 결과 |
|---|---|---|
| ESH1 | 사용자가 `/sowhat:finalize --force` 실행 | L3 건너뜀. L2를 통과한 fabrication(X1-X4)이 최종 산출물에 포함 가능. finalize.md가 명시적 경고 checkpoint를 띄우지만 최종 책임은 사용자 |
| ESH2 | 사용자가 settle까지만 하고 challenge·finalize를 명시 실행하지 않음 | L2 통과 상태로 보관. 외부 공유 전엔 L4가 작동하지 않으므로 fabrication이 draft 상태에 머물 수 있음 |

> ESH1·ESH2는 **사용자의 명시적 선택**에 의한 우회이므로 spec 범위 밖. 본 spec은 "L4가 정상 실행된 경로"까지 보장한다.

---

## 예외 (구체 값이 허용되는 경우)

- **규칙 설명의 negative example**: "이런 것은 금지"를 설명하기 위해 금지 예시를 인용하는 경우 (예: 이 문서의 "나쁜 예시" 블록)
- **실제 세션 로그**: `logs/` 디렉터리에 실제 핑퐁·검증 결과를 기록하는 경우 (사용자 입력 또는 retrieval 결과)
- **실재 검증된 인용**: 실제로 사용자가 입력했거나 retrieval로 확인된 인용을 섹션 파일에 저장하는 경우

---

## 검증 가능성

이 규칙의 준수 여부는 다음 명령으로 점검할 수 있다:

```bash
# 프로젝트 루트(sowhat 저장소)에서 실행 — 경로에 .claude/ 접두 필수
# 검사 범위: workflows + references + agents (Step 3에서 agents도 포함)

# (1) 영문 기관명 화이트리스트 직접 매칭
rg "\b(McKinsey|IDC|Gartner|HubSpot|Forrester|Deloitte|Statista|CB Insights|PwC|Bain|BCG|KPMG|EY|Accenture|Nielsen|Ipsos|Pew|Harvard|MIT|Stanford|Oxford|Cambridge|OECD|IMF|WHO|UN)\b" \
   .claude/sowhat-core/workflows/ .claude/sowhat-core/references/ .claude/agents/

# (1-b) 영문 기관 접미어 패턴 + 연도
rg "\b[A-Z][a-zA-Z]+\s+(Research|Institute|Consulting|Group|Insights|Labs|Partners|Associates)\b\s*20\d{2}" \
   .claude/sowhat-core/workflows/ .claude/sowhat-core/references/ .claude/agents/

# (1-c) 수치 단위 단독 스캔 (컨텍스트 확인용 — false positive 있을 수 있음)
rg "CAGR|\d+\.\d+%|\$\d+\.\d+B|\d+\.\d+조" \
   .claude/sowhat-core/workflows/ .claude/sowhat-core/references/ .claude/agents/

# (2) 한글 기관명 직접 지정
rg "통계청|한국은행|소프트웨어산업협회|한국개발연구원|KDI|KISA|SERI|LG경제연구원|현대경제연구원|금융감독원|DART" \
   .claude/sowhat-core/workflows/ .claude/sowhat-core/references/ .claude/agents/

# (3) 한글 기관 접미어 패턴 + 연도 (포괄적 감지)
rg "[가-힣]{2,}(협회|연구원|연구소|공사|청|원|부|위원회|재단|진흥원|개발원)\s*20\d{2}" \
   .claude/sowhat-core/workflows/ .claude/sowhat-core/references/ .claude/agents/
```

결과는 다음 **예외 문서**에서만 나와야 한다. 그 외 워크플로우/참조/에이전트 문서에서 잡히면 검토 대상이다:

- `.claude/sowhat-core/references/fabrication-prevention.md` — 이 규칙 본문의 negative example
- `.claude/sowhat-core/references/source-credibility.md` — Tier 분류 기준 설명 (AI 제안이 아니라 판정 가이드)
- `.claude/sowhat-core/references/challenge-algorithm.md` — Primary 출처 유형 설명 (사실 검증 가이드)
- `.claude/sowhat-core/workflows/autonomous.md` — "수치·출처 할루시네이션 방지"의 금지 예시 나열
- `.claude/sowhat-core/workflows/expand.md` — 최상단 CRITICAL 블록의 "금지 → 허용" 치환 테이블
- `.claude/sowhat-core/workflows/settle.md` — Stub Detection의 fabrication 패턴 설명 예시
- `.claude/sowhat-core/workflows/revise.md` — L1 블록의 "금지 예시" (McKinsey 예시 수정안)
- `.claude/agents/sowhat-research-agent.md` — fact-check 모드의 1차 출처 포털 가이드 (KOSIS, Census 등)
