# Fabrication Prevention — AI 생성 콘텐츠의 허구 인용 차단

sowhat의 모든 워크플로우가 참조하는 단일 규칙. AI가 사용자에게 제시하는 **선택지·제안·예시·placeholder·힌트**에 fabrication 가능한 고유값을 포함하지 않는다.

이 문서는 **spec**이다. 구현 layer는 아래 §Layer 책임 분리를 따른다.

## 이 문서 읽는 법 (navigation)

| 관심사 | 읽을 섹션 |
|---|---|
| 이 규칙이 왜 필요한가 | §왜 이 규칙이 필요한가 |
| 무엇을 막고 무엇을 안 막는가 | §Scope IN / §Scope OUT |
| 어느 layer에서 어떻게 막는가 | §Layer 책임 분리 + 의존성 다이어그램 |
| **AI 경로 vs 사용자 경로 차이** | §L0 "구현 명세" Contract 블록 |
| 특정 layer 구현 명세 | §L0 / §L1 / §L2 / §L2a / §L3 / §L4 "구현 명세" Contract 블록 |
| **unverified 플래그 의미와 처리** | §L0 / §L4 Contract |
| 내 워크플로우에 L1 적용했는지 | §대상 워크플로우 / §대상 에이전트 |
| 구체 금지 값 목록 | §금지되는 고유값 |
| 허용 표현 | §허용되는 표현 / §구체 내용이 들어올 수 있는 3가지 경로 |
| 테스트 케이스 | §Acceptance Criteria (P/R/X/E/S/ESH/AI/UV 시나리오) |
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
| **L0 입력 제약** | AI 제안 생성 시 + 사용자 직접 입력 시 | **AI 경로 엄격**: retrieval 통과(`#NNN`/`file:`) 없이 구체값 제안 금지 / **사용자 경로 중간**: 미출처 구체값에 `unverified` 플래그 자동 부여 | AI가 fabricate 가능 구체값을 먼저 제시하지 않음 + 사용자 미검증 입력 추적 | fabrication 판정 자체 (→ L2/L3) | — (첫 방어선) |
| **L1 생성** | 대상 워크플로우 템플릿 + 에이전트 `<principles>` | L0 규칙을 각 프롬프트에 구체화 (플레이스홀더 강제, 유형 기술 제시) | AI가 실명 인용 선택지를 먼저 제시하지 않음 | 사용자 직접 입력 검증 (L0 사용자 경로가 담당) | L0 정책 |
| **L2 형식 경고** | `settle` stub detection | 정규식 매칭 시 **warning + `unverified` 플래그 자동 부여** (reject 권한 없음) | 구체값 의심 패턴 탐지 및 플래그 부착 | reject 자체 (플래그 처리는 L4가 차단) / URL 실존·값 정확성·사람명·보고서명 | L0이 뚫린 값 + 사용자 직접 입력 값 |
| **L2a 참조 실존** | `settle` / `draft` 실행 시 | `#NNN` / `file:` / `dir:` / `§N` 참조 실존 확인, 미실존 시 `unverified` 플래그 | 가짜 참조로 Exception 발동 bypass 차단 (NM1 해소) | URL 실존 (→ L3) | L2 warning + Exception 매칭 |
| **L3 최종 검증** | `challenge` Stage 0 | URL fetch, 값 대조, 1차 출처 역추적, 사람명·보고서명 semantic 확인 | 가짜 URL·값 불일치·실존하지 않는 인물/출처 탐지 | (사용자가 실행해야 작동 — L4가 강제) | L2·L2a 통과 값 + `unverified` 플래그 항목 |
| **L4 게이트키핑** | `finalize-planning`, `finalize`, **`draft`** | L3 자동 강제 실행 + **`unverified` 플래그 존재 시 즉시 차단** | 최종 산출물 전 반드시 L3 통과 + 미검증 항목 0건 보장 | `finalize --force`로 우회 가능 (ESH1) | L3 호출 가능 + unverified 플래그 집계 기능 |

### Layer 의존성 다이어그램

```
[AI 제안 생성]                        [사용자 직접 입력]
       ↓                                    ↓
┌──────────────────────────┐        ┌─────────────────────────┐
│ L0 AI 경로 (엄격)        │        │ L0 사용자 경로 (중간)   │
│ retrieval 통과 값만 제안 │        │ 미출처 → unverified 플래그│
└──────────────────────────┘        └─────────────────────────┘
             ↓                                ↓
      [Toulmin 필드에 저장]           [Toulmin + unverified 플래그]
                             ↓
                  ┌──────────────────────────┐
                  │ L1 템플릿 (L0 구현체)    │
                  │ 각 워크플로우에 규칙 주입│
                  └──────────────────────────┘
                             ↓ (settle 시)
                  ┌──────────────────────────┐
                  │ L2 형식 경고             │ ← warning + unverified
                  │ (정규식 매칭, reject 없음)│    (reject 권한 박탈)
                  └──────────────────────────┘
                             ↓
                  ┌──────────────────────────┐
                  │ L2a 참조 실존 확인       │ ← #NNN/file:/§N 실존
                  │ (cross-reference)        │    미실존 → unverified
                  └──────────────────────────┘
                             ↓ (settled로 저장)
                  ┌──────────────────────────┐
                  │ L3 challenge Stage 0     │ ← semantic 검증
                  │ (optional — 사용자 실행) │    URL fetch, 값 대조
                  └──────────────────────────┘
                             ↑ 자동 호출 + unverified 차단
                  ┌──────────────────────────┐
                  │ L4 게이트:               │ ← unverified 존재 시 중단
                  │ finalize / finalize-     │    (draft 경로 포함)
                  │ planning / draft         │
                  └──────────────────────────┘
                             ↓ (통과한 값만)
                     [최종 산출물]
```

**핵심**: 각 layer는 **위 layer가 놓친 것만** 처리한다. L0가 근본 차단, L2/L2a는 형식 경고, L3는 semantic 검증, L4는 게이트. L0의 AI 엄격 + 사용자 중간 분리는 "AI 할루시네이션 원천 차단"과 "사용자 작성 편의성 유지"를 동시에 달성한다.

### 왜 L2는 warning 레이어로 강등되었는가 (cycle 4 재구성)

이전 L2는 정규식 매칭 시 reject 권한을 가졌다. 하지만 3회 audit에서 드러난 문제:
- 정규식은 알려진 패턴만 잡고 LLM creativity를 쫓아갈 수 없음
- 사이클마다 새 구멍 드러남 (C1 ko 비대칭, C2 decimal regression, ...)
- 유지보수 부담이 화이트리스트·단위·엣지 케이스마다 누적

L0 도입으로 근본 차단이 가능해지자 L2는 **보조 경고 레이어**로 재정의. 정규식 매칭은 `unverified` 플래그 부착 트리거이지 reject 조건이 아니다. 최종 차단은 L4 게이트가 플래그 집계로 수행.

### 왜 L2는 URL 유효성을 검증하지 않는가

L2·L2a는 출처 표기의 **형식적 존재**만 본다. URL이 fetchable한지, 값이 원문과 일치하는지는 실제 네트워크 호출이 필요하므로 L3로 위임한다. L2a가 추가되어도 이 원칙은 유지 — L2a는 로컬 참조(`#NNN`, `file:`, `§N`)의 실존만 확인.

### L4가 보장하는 것

- `finalize-planning.md`: challenge 자동 실행 **생략 불가** — 기획→명세 전환 전 Stage 0 통과 강제
- `finalize.md`: challenge 자동 실행 (`--force`로 건너뛸 수는 있으나 기본값은 실행)
- **`draft.md` (cycle 4 신규)**: export 전 `unverified` 플래그 집계 → 1건이라도 존재 시 중단. 이것이 "settle 후 draft 공유" 경로에서 fabrication 유출을 원천 차단한다.

사용자가 `/sowhat:challenge`를 명시적으로 실행하지 않아도 L4 시점에서 반드시 L3가 돌고, `unverified` 플래그는 따로 차단된다.

---

## 대상 워크플로우 (L1 차단 적용) — cycle 6 재분류

L1 차단은 "Toulmin 필드 생성 경로"에만 엄격히 적용한다. cycle 6에서 overreach 분류(character/series)를 정비하고 Core IF-ELSE 구현 범위를 명시.

### Toulmin 필드 생성 (L1 엄격 적용)

**기획 레이어:**
- `init` — Thesis Answer, Key Arguments 생성
- `expand` — Claim/Warrant/Backing/Rebuttal 제안 선택지 **(Core IF-ELSE ✓)**
- `autonomous` — Toulmin 필드 자동 생성 **(Core IF-ELSE ✓)**
- `add-argument` — 새 KA 제안 + 대응 섹션 초안
- `debate` — Con/Pro 에이전트 스폰 프롬프트 **(Core IF-ELSE ✓)**
- `steelman` — Anti-Thesis, Counter-Grounds/Warrant 생성 **(Core IF-ELSE ✓)**
- `critic` — 5차원 비평 근거
- `revise` — 수정 제안
- `inject` — 자료 추출·요약 과정

**명세 레이어:**
- `spec` — 명세 필드(Actors/Data/API/Edge Cases/AC) 제안

**산출물 레이어 (외부 공유 — L4 4중 게이트가 IF-ELSE를 대체):**
- `draft` — 최종 산출물 생성. L1 차단 + L4 게이트 (순서·challenge·unverified·렌더링 검증). IF-ELSE는 L4 단계에서 구현.

### Toulmin 외부 텍스트 생성 (L1 권장만 — cycle 6 재분류, AU17 해소)

다음은 **설정·관리 워크플로우**로 Toulmin 필드를 직접 생성하지 않는다. L1은 권장 원칙만 적용하고 IF-ELSE나 엄격 차단은 없다:

- `character` — 글쓰기 캐릭터 생성. 레퍼런스 분석 시 AI가 기관명·수치를 덧붙이지 않음
- `series` — 시리즈 에피소드 연결·용어 일관성 관리. 맥락 설명에 실명·수치 금지

### Core IF-ELSE 구현 (cycle 5-6 — AU13 해소)

다음 4개 워크플로우에 L0 IF-ELSE 실행 조건을 구조화:
- `expand`, `autonomous`, `debate`, `steelman`

나머지 대상 워크플로우는 **프롬프트 원칙 주입**만 (L1 블록 참조). `draft`는 IF-ELSE 대신 L4 4중 게이트로 대체.

### 공통

- 모든 워크플로우 문서 안의 `예)` `예:` `예시:` 문구
- 사용자에게 출력되는 모든 placeholder·힌트

### 제외

- `branch`: AI가 Toulmin 내용을 생성하지 않는 메타데이터 워크플로우 (새 브랜치 Toulmin은 `/sowhat:expand`가 채움, 그때 L1 작동)
- `note`, `snapshot`, `sync`, `resume`, `progress`, `map`, `config`: AI가 Toulmin 필드 생성 경로 아님

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
  - 한글 화이트리스트: `통계청(KOSIS)`, `한국은행`, `소프트웨어산업협회`, `한국개발연구원(KDI)`, `한국인터넷진흥원(KISA)`, `삼성경제연구소(SERI)`, `LG경제연구원`, `현대경제연구원`, `금융감독원(DART)`
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

## L0 입력 제약 — 구현 명세 (cycle 4 신설, cycle 5 Soft 재정비)

L0는 Toulmin 필드 작성 시점에 작동하는 **첫 방어선 (first line of defense)**. AI 경로와 사용자 경로를 분리 처리하여 할루시네이션 발생 가능성을 낮추고 작성 편의성을 유지한다.

> **cycle 5 재정비 (Soft)**: L0는 "hard guarantee"가 아니라 "first line of defense"다. LLM이 규칙을 어길 수 있다는 불확실성을 전제로, L2/L3/L4가 백업 방어선으로 작동한다. L0 violation은 "설계 버그"가 아니라 **허용된 실패 모드** — 여러 layer의 방어 철학 덕분에 시스템 전체 보장은 유지된다.

### Contract

```
Input:          Grounds/Backing/Warrant에 들어갈 문자열
                + 출처: "ai" (AI 제안) | "user" (사용자 직접 입력)

Output:         AI 경로:    { suggestion_kind: "concrete" | "placeholder" | "qualitative", reason }
                사용자 경로: { flagged: true/false, unverified: bool, reason }

Preconditions:  입력 출처 구분 가능 (workflow가 AI 제안 단계인지 사용자 입력 단계인지 알고 있음)
                retrieval 소스 목록 확인 가능:
                  - research/NNN-*.md 파일들 (Glob으로 스캔)
                  - 사용자 제공 file:/dir: 경로

Postconditions: AI 경로: 선택지 메뉴가 retrieval 상태에 따라 동적으로 조정됨
                       (retrieval 있으면 구체값 옵션 포함, 없으면 정성/플레이스홀더/Sub-Research만)
                사용자 경로: 미출처 구체값 입력 시 Toulmin 필드에 `unverified: true` 메타 부착
                           (settle은 허용되지만 L4가 추적)

AI 경로 Guarantees (first line of defense):
  - 각 대상 워크플로우의 프롬프트가 LLM에게 다음을 **지시**:
    "retrieval 통과 없이 구체값(수치·기관명·연도·인물명·보고서·제품명·URL)을 선택지로 제시하지 말라.
     retrieval 경로 3가지(#NNN, file:/dir:, Sub-Research 결과)로만 구체값 인용."
  - 핵심 5개 워크플로우(expand, autonomous, debate, steelman, draft)는 IF-ELSE 조건으로 구조화:
    IF research/ 비어있음 AND file:/dir: 비어있음:
      → AI가 제시하는 선택지: 정성 기술 + "🔍 Sub-Research" 옵션만
    ELSE:
      → 매핑된 finding 기반 구체값 선택지 제공
  - 나머지 워크플로우는 프롬프트 원칙 주입(참조)만 — IF-ELSE 강제는 없음

사용자 경로 Guarantees (중간):
  - 사용자 입력에 구체값 포함 + 출처 표기 (URL/#NNN/file:/DOI/§N/Appendix[A-Z\d]+) 없으면:
    → 자동 `unverified: true` 메타 부착
    → settle 허용 (편의성)
    → L4에서 draft/finalize 시 차단

Does NOT guarantee:
  - **Hard constraint — AI가 규칙을 절대 어기지 않음은 보장하지 않는다 (Soft 철학)**
  - fabrication 판정 자체 (형식 판정은 L2, semantic 판정은 L3)
  - LLM 모델 버전 변경 시 동일 준수율

Failure modes (cycle 5: 허용된 실패 모드로 재정의):
  - AI 경로에서 LLM이 규칙 무시 → L2 warning이 `unverified` 플래그 부착 → L4 차단
    · 이는 설계 버그가 아닌 **정상 실패 경로** — Soft 철학
    · L2가 catch 못하면 L3가, L3도 못하면 L4 draft 게이트가 차단
  - 사용자가 가짜 출처(예: `#999` 미실존) → L2a cross-reference가 플래그 부착
  - 사용자가 unverified 플래그를 수동 제거 → spec 위반. 방어 불가. (사용자 명시적 책임, ESH 범주)

Depends on: 없음 (첫 방어선)
```

### AI 경로 구현 지침 (워크플로우 템플릿에 주입할 내용)

각 대상 워크플로우는 AI가 구체값을 제안할 때 다음 패턴을 따른다:

```
1. 해당 섹션에 매핑된 research finding (#NNN) 확인
2. 사용자 제공 file:/dir: 자료 확인
3. 1·2가 있으면 그 값만 인용하여 구체 제안 생성
4. 1·2가 없으면:
   - 정성 기술 + "🔍 Sub-Research 실행" 선택지 제공
   - 사용자가 Sub-Research 선택 시 research-agent 스폰 후 결과로 재생성
```

### 사용자 경로 구현 지침

사용자가 Toulmin 필드에 직접 입력 시 (expand/revise/inject 핑퐁):

```
입력 파싱:
  - 구체값 패턴 감지 (숫자%, $금액, 기관명, 인물명, URL 등)
  - 구체값 존재 AND 출처 표기 부재 → Toulmin 필드 메타에 `unverified: true` 부착
  - 사용자에게 조용히 알림: "ℹ️ 출처 미표기 — unverified 플래그 부착. 최종 산출물 전 해소 필요."

해소 경로:
  - /sowhat:research → 검증된 finding으로 대체
  - /sowhat:revise → URL/파일 경로 추가
  - 사용자가 정당성 판단 시 수동 플래그 제거 (단 spec 위반, draft/finalize에서 경고)
```

---

## L1 생성 차단 — 구현 명세

각 대상 워크플로우/에이전트의 템플릿·프롬프트에 fabrication 규칙이 주입되어 있다. 구현 상세는 각 워크플로우 파일의 "L1 Fabrication 차단" 블록과 각 에이전트의 `<principles>` 참조.

### Contract

```
Input:          AI가 사용자에게 출력할 문자열 (선택지/예시/플레이스홀더/근거 제안)
Output:         해당 문자열 자체 (규칙 준수 여부가 반영된 상태)

Preconditions:  다음 11개 워크플로우 + 4개 에이전트에 L1 참조 주입됨:
                - 기획: init / expand / autonomous / add-argument / debate /
                        steelman / critic / revise / inject
                - 명세: spec
                - 산출물(외부 공유): draft  ← 최종 산출물 경로, 특히 엄격
                - 에이전트: con / pro / critic / challenge
                (Step 3 전수 조사로 검증; Step 4 dry-run 54/54 통과)

Postconditions: 출력 문자열에 retrieval 없이 생성된 기관명·수치·연도 조합 없음
                (Scope OUT 카테고리는 L1 가이드만 적용, 자동 강제는 없음)

Guarantees:
  - AI가 선택지 메뉴에서 먼저 "McKinsey 2024: 34%" 같은 실명 인용을 제안하지 않음
  - 구체값이 필요하면 3가지 경로(사용자 직접 입력 / Sub-Research / research finding)로만 들어옴
  - 템플릿에 박힌 예시 문구(`예) "..."`)도 실명을 포함하지 않음
  - draft 단계에서 기획 섹션에 없던 새 구체값을 산출물에 추가하지 않음 (L4 이후 경로 보호)
  - init 단계에서 thesis Answer·Key Arguments에 실명 투입 차단 (프로젝트 출발점 오염 방지)

Does NOT guarantee:
  - 사용자가 직접 입력한 값의 검증 (→ L2)
  - AI가 L1 규칙을 완벽히 준수하는지 (LLM 준수도는 불확실, L2가 백업)

Failure modes:
  - 템플릿에 L1 참조가 빠짐 → Step 3 검증 명령으로 탐지 (상시 grep 권장)
  - LLM이 규칙을 무시하고 실명 생성 → L2가 백업으로 탐지
  - 새 워크플로우 추가 시 L1 주입 누락 → 회귀 방지 자동화는 미구현, 수동 Step 3 재실행 필요

Depends on: 없음 (첫 방어선)
```

---

## L2 Settle 형식 경고 — 구현 명세 (cycle 4: reject → warning 강등)

**cycle 4 재구성**: 이전 L2는 정규식 매칭 시 reject 권한을 가졌으나, L0 도입으로 근본 차단이 가능해지자 **warning 레이어로 강등**. 정규식 매칭은 `unverified` 플래그 부착 트리거이지 reject 조건이 아니다. 최종 차단은 L4가 플래그 집계로 수행.

구현 상세는 `workflows/settle.md` §Stub Detection 참조.

### Contract

```
Input:          Toulmin 필드 문자열 (Grounds, Backing, Warrant 등)
Output:         { warning: bool, unverified: bool, reason }
                (reject 권한 없음 — cycle 4 변경)

Preconditions:  섹션 파일이 로드되어 있고 Toulmin 필드가 채워짐
                L0에서 `unverified` 플래그 부착된 항목은 이미 식별됨
                Fabrication 검증 예외 목록이 정의됨 (복합 조건 — §예외 참조)
                정규식은 불릿(`-`/`*`) 단위로 개별 적용, `.*?`는 문장 경계(`.!?\n`)에서 중단

Postconditions: 정규식 매칭 + Exception 미발동 시:
                  → 해당 불릿의 Toulmin 필드 메타에 `unverified: true` 부착
                  → settle 자체는 허용 (reject 아님)
                정규식 미매칭 또는 Exception 발동 시:
                  → 플래그 없음

Guarantees:
  - **4-way 대칭 매칭** (한·영 × 화이트리스트·접미어):
    - en_direct / ko_direct: 기관명 화이트리스트 + 연도 + 수치
    - en_suffix / ko_suffix: 기관 접미어 패턴 + 연도 + 수치
  - 매칭 시 같은 불릿 안에 출처 표기(URL / file: / dir: / #NNN / DOI / 복합 cross_ref) 형식 존재 확인
  - 출처 표기 없으면 `unverified` 플래그 부착 (reject 아님)
  - 불릿 단위 처리로 무관한 두 불릿 간 cross-match 방지
  - 문장 경계(`[^.!?\n]*?`)로 같은 불릿 내 두 문장 간 cross-match 방지
  - Exception 복합 조건:
    · self_data 키워드 + `(n=\d+)` / `표본 \d+명` / `file:`/`dir:` 중 하나 동반
    · `§\d+` 숫자 식별자 필수 (단독 `§` 무효)
    · `Appendix [A-Z\d]+` 식별자 필수 (단독 `Appendix` 무효)

Does NOT guarantee:
  - reject 자체 (L4가 플래그 집계로 차단 — cycle 4 변경)
  - URL이 실제로 fetchable한지 (→ L3)
  - 참조의 실존 (→ L2a)
  - 값이 원문과 일치하는지 (→ L3)
  - 인물명·보고서명·제품명 fabrication (→ L3, scope out)
  - **실명 은닉**, **어순 변경**, **익명화** — 화이트리스트 한계, L3 의존

Failure modes:
  - 정규식 false positive → `unverified` 플래그가 잘못 부착될 수 있음.
    사용자가 출처 추가(revise)로 해소하거나, 플래그 수동 제거(단 draft/finalize에서 경고)
  - 정규식 false negative → L0 AI 경로가 근본 차단으로 방어
  - regex 결함(NC1/NC2 유형) 영향 ↓ — reject 권한 없으니 false positive도 차단 아닌 경고

Depends on: L0을 통과한 값 (AI 경로 엄격 통과 또는 사용자 입력)
```

---

## L2a 참조 실존 확인 — 구현 명세 (cycle 4 신설)

L2 Exception에서 `#NNN`, `file:`, `§N` 등이 매칭되어도 실제 참조 대상의 실존을 확인하지 않으면 bypass가 가능했다 (NM1). L2a가 이를 해소.

### Contract

```
Input:          Toulmin 필드에서 매칭된 참조 문자열들
                (`#\d{3}`, `file:{path}`, `dir:{path}`, `§\d+`)

Output:         각 참조별 { exists: bool, path_or_id, reason }

Preconditions:  settle 또는 draft 커맨드 실행 중
                research/ 디렉토리 접근 가능
                파일 시스템 Read 가능
                프로젝트 섹션 번호 범위 알고 있음 (00-thesis, 01-03 planning, 04-09 spec)

Postconditions: 각 참조에 대해:
                  실존 확인 성공 → pass (no flag)
                  실존 확인 실패 → 해당 불릿에 `unverified: true` 플래그 부착

Guarantees:
  - `#NNN` (3자리) → `research/NNN-*.md` Glob 패턴 매칭 확인
  - `file:{path}` → Read 시도 (파일 없으면 실패)
  - `dir:{path}` → Glob으로 디렉토리 내 파일 존재 확인
  - `§\d+` → 숫자가 프로젝트 섹션 번호 범위(0~9) 내인지 확인
  - Exception 발동으로 L2 통과한 가짜 참조 차단

Does NOT guarantee:
  - `file:` 참조의 내용이 실제 인용과 일치하는지 (→ L3 semantic)
  - URL 실존 (→ L3 WebFetch)
  - 사용자가 지정한 `file:` 파일이 어떤 의도인지

Failure modes:
  - research/ 디렉토리 없음 (init 전) → L2a 비활성화, L2 plain 동작
  - 파일 경로 퍼미션 에러 → "확인 불가"로 처리, 보수적으로 unverified 플래그
  - `§` 숫자가 특수 프로젝트(명세 10+)에서 범위 외 → 사용자 정의 범위 지원 필요 (향후)

Depends on: L2 Exception 매칭 결과 + 프로젝트 파일 시스템
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

같은 문자열이 여러 조건에 매칭되어도 한 번만 플래그. 우선순위 4단계:
1. **en_direct** — 영문 기관명 화이트리스트 + 연도 + 수치
2. **ko_direct** — 한글 기관명 화이트리스트 + 연도 + 수치
3. **en_suffix** — 영문 기관 접미어 패턴 + 연도 + 수치
4. **ko_suffix** — 한글 기관 접미어 패턴 + 연도 + 수치

> **`settle.md`와 본 문서는 동일 우선순위를 사용한다**. 구현 변경 시 두 문서를 함께 업데이트할 것.

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

## L4 게이트키핑 — 구현 명세 (cycle 4: draft 경로, cycle 5: challenge auto-invoke + 순서 강제)

cycle 3까지 L4는 finalize/finalize-planning에서 L3를 자동 실행하는 게이트였다. cycle 4에서 draft 경로 추가 + unverified 플래그 집계 차단을 도입. **cycle 5에서 AU2/AU9 해소**: L4가 실제로 L3를 어떻게 호출하는지, draft가 challenge 미실행 상태에서 실행될 때 어떻게 처리할지 명시.

### Contract

```
Input:          finalize-planning / finalize / draft 커맨드 실행 요청
Output:         export 성공 또는 중단

Preconditions:  finalize-planning: 모든 기획 섹션 settled
                finalize: 모든 명세 섹션 settled
                draft: 모든 대상 섹션 settled
                L3(challenge Stage 0) 호출 경로 구현됨
                unverified 플래그 집계 가능 (섹션 파일 frontmatter 스캔)
                섹션 메타에 `last_challenged_at` 타임스탬프 (cycle 5 신규)

Postconditions: 통과 시 → 다음 레이어 전환 또는 export/draft 생성
                차단 시 → 즉시 중단, 사용자에게 해소 경로 안내

Guarantees:
  1. **unverified 플래그 차단** (cycle 4):
     - finalize-planning / finalize / draft 실행 시 모든 대상 섹션의 frontmatter
       `unverified_items` 배열을 집계
     - 1건이라도 존재 시 즉시 중단 + 해소 경로 안내
  2. **challenge auto-invoke** (cycle 5 신규 — AU2 해소):
     - finalize-planning: `/sowhat:challenge --all-planning` 자동 실행 (생략 불가)
     - finalize: `/sowhat:challenge --all` 자동 실행 (기본, `--force` 제외)
     - draft: 각 대상 섹션의 `last_challenged_at` 확인
       · 없거나 `status != settled` 이후 갱신 안 됨 → `/sowhat:challenge --all` 자동 실행
       · 있음 → 기존 결과 재사용 (재실행 안 함, 효율성)
  3. **순서 강제** (cycle 5 신규 — AU9 해소):
     - draft 실행 시 config.json의 `layer` 필드 검증
       · `layer == "planning"` AND `/sowhat:finalize-planning` 미실행 → 차단:
         "기획 확정이 선행되어야 합니다. /sowhat:finalize-planning 먼저 실행"
     - layer 검증 통과 후 challenge auto-invoke (위 Guarantees 2번)

Does NOT guarantee:
  - `--force` escape hatch 사용 시 L3·unverified·순서 강제 모두 건너뜀 (ESH1)
  - 사용자가 finalize/draft를 전혀 실행하지 않으면 L4 작동 안 함 (ESH2)
    (단, sowhat 주된 사용 패턴은 "settle → draft"이므로 이 경로가 일반적)
  - 사용자가 unverified 플래그를 수동 제거한 경우 (ESH)

Failure modes:
  - L3 critical 이슈 → 중단 + 리포트
  - L3 타임아웃 → challenge.md 타임아웃 핸들러 (partial result + 인간 판단)
  - 네트워크 장애 → L3 partial + 사용자 확인
  - unverified 집계 실패 (frontmatter 파싱 에러) → 보수적으로 차단
  - `last_challenged_at` 스키마 부재 (기존 프로젝트) → 1회 auto-invoke 수행 후 저장

Depends on: L3 호출 경로 구현
            섹션 파일 frontmatter 스키마 (`unverified_items`, `last_challenged_at`)
            config.json의 `layer` 필드 정합성
```

> **`--force` 주의**: `finalize --force` / `draft --force`는 L3·unverified 차단·순서 강제 전부를 건너뛴다. 이 escape hatch 사용 시 fabrication 방어선이 무너진다. 명시적 경고 checkpoint 필수.

### cycle 5 변경 요약

- **AU2 해소**: `draft`가 L4 시점에 `/sowhat:challenge` 자동 실행. 기존엔 문서상으론 "자동"이라 했지만 draft.md 구현에 호출 없었음. 이제 `last_challenged_at` 기반 조건부 실행.
- **AU9 해소**: `draft`는 `layer == "spec"` 또는 `"finalized"` 이후에만 허용. planning 상태에선 `finalize-planning` 선행 강제.
- **책임 분배**: L4가 challenge invocation을 담당하고 L3 Contract는 "호출되면 작동"으로 정합.

### draft 경로 강화의 근거

sowhat의 주된 사용 패턴은 **"settle 후 draft로 외부 공유"**. draft가 fabrication을 유출하지 않도록:

- L1 차단 (draft.md 템플릿에 주입 — cycle 3) + L1 렌더링 검증 (cycle 5 AU3)
- L4 unverified 플래그 차단 (cycle 4)
- L4 challenge auto-invoke (cycle 5 신규)
- L4 순서 강제 (cycle 5 신규)

이렇게 4중 방어선이 draft 경로에 집중되어 "settle 후 draft 공유" 시나리오의 fabrication 유출을 0에 가깝게 만든다.

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

### cycle 4 재분류 원칙

cycle 3까지 AC의 `L2 판정` 열은 `pass` 또는 `reject`만 사용했다. cycle 4에서 L2가 warning 레이어로 강등됨에 따라 다음으로 재분류:

| 이전 (cycle 3) | 현재 (cycle 4) | 의미 |
|---|---|---|
| `pass` | `pass` | 변화 없음 — 플래그도 warning도 없음 |
| `reject` | `warn+UV` | L2 정규식 매칭 → `unverified` 플래그 부착 (settle 허용, L4에서 최종 차단) |

이전 "reject" 시나리오는 settle 자체는 되지만 `unverified: true` 메타가 달려 draft/finalize에서 L4가 차단. 따라서 보호 강도는 유지되면서 사용자 작성 편의는 향상된다.

신규 카테고리:
- **AI1-N**: L0 AI 경로 엄격 — retrieval 없이는 AI가 구체값 선택지를 **제안 자체 불가능**
- **UV1-N**: 사용자 경로 중간 — 미출처 구체값에 자동 플래그
- **XR1-N**: L2a cross-reference — `#NNN`/`file:`/`§N` 실존 확인
- **DG1-N**: L4 draft 게이트 — unverified 집계 차단


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

### ⚠️ L2 warning + UV flag (Scope IN 위반 — cycle 4 재분류)

이전 `reject` 시나리오. cycle 4에서 L2는 reject 권한 없음 → `unverified` 플래그 부착. settle은 허용되지만 draft/finalize 시 L4가 차단.

| # | 입력 문자열 | L2 판정 | L4 게이트 효과 | 매칭 조건 |
|---|---|---|---|---|
| R1 | `"McKinsey 2024: 이탈률 34%"` | warn+UV | draft/finalize 중단 | 영문 기관 + 연도 + 수치, 출처 표기 0 |
| R2 | `"소프트웨어산업협회 2024 조사: 34%"` | warn+UV | 동일 | 한글 기관명 직접 + 연도 + 수치 |
| R3 | `"통계청 KOSIS 2024: 28%"` | warn+UV | 동일 | 금지 기관명 직접 등장 |
| R4 | `"한국컨설팅연구원 2024: CAGR 27%"` | warn+UV | 동일 | 한글 접미어 패턴(`연구원`) + 연도 + 수치 |
| R5 | `"Gartner 2024: $12.3B TAM"` | warn+UV | 동일 | 영문 기관 + 연도 + 금액 단위 |
| R6 | `"IDC 2024 기준 이탈률 34%"` | warn+UV | 동일 | 영문 기관명이 한글 맥락에 있어도 매칭 |
| R7 | `"글로벌컨설팅협회 2024: 34%"` | warn+UV | 동일 | 가상 기관명도 접미어 패턴 매칭 |
| R8 | `"KDI 2024 보고서: 28%"` | warn+UV | 동일 | 금지 기관명(약어) 직접 등장 |
| R9 | `"DART 2024 데이터: 34%"` | warn+UV | 동일 | 금지 기관명 직접 등장 |
| R10 | `"Bain 2023 survey: 45%"` | warn+UV | 동일 | 영문 기관 + 연도 + 수치 |
| R11 | `"한국은행 2024년 보고에 의하면 34%"` | warn+UV | 동일 | 금지 기관명 + 연도 + 수치 |

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
| S1 | `"Global Strategy Consulting 2024: 34%"` | warn+UV | `Consulting` 접미어 매칭 (가상 기관), L4에서 draft 차단 |
| S2 | `"Market Research Institute 2023: 45%"` | warn+UV | `Institute` 접미어 매칭 |
| S3 | `"Tech Insights 2024: CAGR 27%"` | warn+UV | `Insights` 접미어 매칭 |

### 🧾 Fact-Mention Regression Set (C1 해소 후 추가)

기관명만 단순 언급하는 경우. **이전 구현**은 `ko_direct`가 연도·수치 조건 없이 이름만 매칭해 reject했다. 수정된 구현은 영문과 대칭으로 `기관명 + 연도 + 수치` 3요소 모두 필요.

| # | 입력 문자열 | L2 판정 | 이유 |
|---|---|---|---|
| FX1 | `"통계청 홈페이지를 참고하세요"` | pass | 기관명 있지만 연도·수치 없음 |
| FX2 | `"한국은행의 연구 방법론은 흥미롭다"` | pass | 기관명만 있음 |
| FX3 | `"McKinsey의 컨설팅 방식은 전통적이다"` | pass | 기관명만 있음 (영문은 이전에도 pass) |
| FX4 | `"Harvard는 좋은 대학이다"` | pass | 기관명만 있음 |
| FX5 | `"KDI 보고서가 있다"` | pass | 기관명 + 일반 단어, 연도·수치 없음 |

### 🛡️ Bypass-Attempt Regression Set (C2 해소 후 추가)

Exception 키워드만 붙여 fabrication을 감추려는 시도. **이전 구현**은 키워드 존재만 확인해 통과시켰다. 수정된 구현은 **복합 구조 요구**:
- `자체 조사` → `(n=N)` 또는 `file:` 경로 동반 필수
- `§` → `§\d+` 숫자 필수
- `Appendix` → `Appendix [A-Z\d]+` 식별자 필수

| # | 입력 문자열 | L2 판정 | 이유 |
|---|---|---|---|
| BP1 | `"자체 조사: McKinsey 2024 리포트 34%"` | warn+UV | `자체 조사` 뒤에 `(n=N)` 또는 `file:` 없음 → self_data 미발동, L4 draft 차단 |
| BP2 | `"McKinsey 2024: 34% (§ 참고)"` | warn+UV | `§` 뒤 숫자 없음 → cross_ref 미발동 |
| BP3 | `"통계청 KOSIS 2024: 34% (Appendix)"` | warn+UV | `Appendix` 뒤 식별자 없음 → cross_ref 미발동 |
| BP4-valid | `"McKinsey 2024: 34% (§3 참조)"` | pass | `§3` 숫자 동반 — 정당한 섹션 참조 |
| BP5-valid | `"통계청 KOSIS 2024: 34% (Appendix A)"` | pass | `Appendix A` 식별자 동반 — 정당한 부록 참조 |
| BP6-valid | `"자체 조사 (n=120): McKinsey 방식 적용, 2024년 34% 달성"` | pass | `(n=120)` 표본 크기로 self_data 정당화 |

### 📐 Cross-Match Regression Set (M2 해소 후 추가)

정규식 `.*?`가 문장 경계를 무시해 무관한 기관명과 수치를 cross-match하던 문제. 수정된 구현은 **불릿 단위로 개별 적용**하고 문장 경계(`. / ! / ?`)에서 `.*?` 매칭을 끊음.

| # | 입력 문자열 | L2 판정 | 이유 |
|---|---|---|---|
| CM1 | 불릿1: `"Harvard는 좋은 대학이다."` 불릿2: `"2024년 시장 34% 성장"` (별개 불릿) | pass | 불릿 단위 처리로 cross-match 방지 |
| CM2 | 한 불릿: `"Harvard는 좋은 대학이다. 참고로 2024년 34% 성장."` | pass | 문장 경계(`.`)로 매칭 중단 |
| CM3 | 한 불릿: `"Harvard 2024 연구에서 34% 성장"` | warn+UV | 같은 문장 내 기관+연도+수치 — 정당한 매칭, L4 draft 차단 |

### 🕳️ Scope-OUT Assumption Cases (M3 L2 miss 명시)

L2의 화이트리스트·접미어 방식이 **근본적으로 잡을 수 없는 경우**. L3 semantic 검증에 의존. spec은 이 한계를 공식 인정.

| # | 입력 문자열 | L2 | L3 효과 |
|---|---|---|---|
| SO1 | `"유명 컨설팅사 2024 리포트: 34%"` | pass (실명 숨김) | WebSearch로 "유명 컨설팅사 2024 리포트" 검증 시도 → 확인불가 판정 |
| SO2 | `"A 글로벌 기관 2024년 조사: 34%"` | pass (익명화) | 동일 |
| SO3 | `"2024년 Harvard 연구에서 34% 보고"` | pass (어순 변경 — 기관명이 연도 뒤) | WebSearch + Harvard 연구 실존 확인 |

> **설계 의도 명시**: L2는 화이트리스트·접미어 패턴의 **전형적 배치**에만 대응한다. 어순 변경, 실명 은닉, 익명화 우회는 **L3의 책임**이다. L4 finalize 게이트가 L3를 자동 실행하므로 최종 산출물엔 남지 않는다.

### 🤖 L0 AI-엄격 경로 (cycle 4 신설)

AI가 워크플로우 템플릿에서 구체값 선택지를 **제안할 수 있는 조건**. retrieval 없이는 제안 자체 불가능.

| # | 상황 | AI 응답 | 이유 |
|---|---|---|---|
| AI1 | 섹션에 매핑된 research finding 없음, 사용자 `file:` 없음, 기관명+수치 Claim 제안 요청 | 정성 기술 + "🔍 Sub-Research 실행" 선택지만 제시 | L0 엄격 — 구체값 제시 불가 |
| AI2 | 섹션에 `research/003-saas-churn.md` 매핑됨 (T2, 34% 수치 포함) | `[1] #003 기반: "이탈률 34% — 출처: #003"` | retrieval 통과한 값만 인용 |
| AI3 | 사용자가 `/sowhat:inject file:data/internal.csv` 실행 후 매핑 | `[1] file:data/internal.csv: {요약된 값}` 제시 가능 | file: 경로가 retrieval 경로로 인정 |
| AI4 | `/sowhat:autonomous` 실행 중, Grounds 자동 전개 필요 | research-agent 먼저 스폰 → 결과로 구체값 생성 | autonomous.md의 "수치·출처 할루시네이션 방지" 준수 |
| AI5 | Con-agent가 공격 근거 생성 시 `<research_findings>` 태그 비어있음 | 구체값 없이 논리적 취약점(Warrant non-sequitur 등)으로 공격 | 에이전트 `<principles>`에 명시 |

### 👤 L0 사용자-중간 경로 (cycle 4 신설)

사용자 직접 입력 시 unverified 플래그 부착 조건.

| # | 입력 문자열 | 처리 | 의미 |
|---|---|---|---|
| UV1 | `"McKinsey 2024: 34%"` (사용자 직접, 출처 없음) | settle 허용 + `unverified: true` 플래그 | L4 draft 단계에서 차단됨 |
| UV2 | `"McKinsey 2024: 34% (https://mckinsey.com/report)"` | settle 허용, 플래그 없음 | URL이 출처로 인정 |
| UV3 | `"업계 벤치마크 수준의 이탈률"` | settle 허용, 플래그 없음 | 구체값 없음 |
| UV4 | 사용자가 수동으로 `unverified: false` 설정 | settle 허용, 플래그 없음 | spec 위반이지만 방어 불가. draft 시 "사용자 수정됨" 경고 (선택) |

### 🔗 L2a Cross-reference 검증 (cycle 4 신설)

`#NNN`/`file:`/`§N` 참조가 실존하는지 확인. 미실존 시 `unverified` 플래그 부착.

| # | 입력 문자열 | L2a 판정 | 이유 |
|---|---|---|---|
| XR1 | `"McKinsey 2024: 34% (#003)"` + `research/003-*.md` 실존 | pass | finding ID 실존 확인 |
| XR2 | `"McKinsey 2024: 34% (#999)"` — 미실존 | warn+UV | research/ Glob 매칭 실패 |
| XR3 | `"자체 조사 (n=120) file:data/real.csv"` — 파일 존재 | pass | Read 가능 |
| XR4 | `"자체 조사 (n=120) file:data/fake-path.csv"` — 미실존 | warn+UV | Read 실패 |
| XR5 | `"이탈률 34% (§3)"` — 01~09 범위 내 | pass | 섹션 번호 유효 |
| XR6 | `"이탈률 34% (§99)"` — 범위 밖 | warn+UV | 존재하지 않는 섹션 |

### 🚦 L4 Draft 게이트 (cycle 4 신설)

`/sowhat:draft` 실행 시 unverified 플래그 집계 → 1건이라도 존재 시 중단.

| # | 상황 | L4 판정 |
|---|---|---|
| DG1 | 모든 settled 섹션에 `unverified: false` | draft 진행 |
| DG2 | `02-solution`에 `unverified: true` 1건 존재 | 즉시 중단 + 해소 경로 안내 (`/sowhat:research` 또는 `/sowhat:revise`) |
| DG3 | 여러 섹션에 여러 unverified | 목록 집계 후 전체 제시, 중단 |

### 💰 Korean Magnitude Units (cycle 5 신설 — AU5 해소 검증)

한국어 경제·금융 표현의 복합 단위(`조원`/`억원`/`천만`/`만원`) fabrication 탐지.

| # | 입력 문자열 | L2 판정 | 매칭 조건 |
|---|---|---|---|
| KM1 | `"한국은행 2024: 3조원 규모"` | warn+UV | ko_direct 확장 패턴 매칭 (`조원`) |
| KM2 | `"통계청 2024: 5억원"` | warn+UV | ko_direct (`억원`) |
| KM3 | `"금융감독원 2024: 500만원"` | warn+UV | ko_direct (`만원`) |
| KM4 | `"KOSIS 2024: 3.5조원"` | warn+UV | ko_direct (소수점 + `조원`) |
| KM5-v | `"한국은행 2024: 3조원 (file:bok-2024.pdf)"` | pass | file: 출처 존재 |
| KM6-v | `"한국은행 기준금리 인상"` | pass | 연도·수치 없음 (FX 패턴) |

### 🌫️ Vague Attribution / Two-sentence Bypass (cycle 5 신설 — AU6 해소 검증)

기관명과 수치가 서로 다른 문장에 분리된 fabrication. 현재 `[^.!?\n]*?` 문장 경계 제한으로 cross-match 안 되므로 별도 정규식(`ko_vague`/`en_vague`) 필요.

| # | 입력 문자열 | L2 판정 | 이유 |
|---|---|---|---|
| VA1 | `"McKinsey 조사에 따르면 이탈이 높다. 산업 표준인 34%를 초과한다."` | warn+UV | en_vague: `industry standard` + 수치 또는 첫 문장 McKinsey + vague 연결 |
| VA2 | `"한국은행 보고서 참고. 2024년 기준 3.5조원."` | warn+UV | ko_vague: `기준` + 수치 + 연도 |
| VA3 | `"Gartner 리서치에서 언급. 시장점유율 34%."` | pass (L3 의존) | 완전 분리 — 첫 문장에 수치 없고 두 번째 문장에 vague keyword 없음. L2 한계. L4 → L3 auto-invoke로 semantic 검증 |
| VA4-v | `"McKinsey 조사 결과다. 자세한 내용은 참고문헌 1번."` | pass | 수치 없음 |

> **L2 vague 패턴**:
> - 한글: `(산업 표준|업계 평균|일반적으로|통상|보통|기준|참고)[^.!?\n]*?(\d+\.?\d*%|\$\d+|배|\d+\.?\d*\s*(조|억|만)?원)`
> - 영문: `(industry average|industry standard|benchmark|reported|according to)[^.!?\n]*?(\d+\.?\d*%|\$\d+)`

### 🔗 Isolated Reference (cycle 5 신설 — AU7 해소 검증)

기관명·수치 없이 `#NNN`/`file:`/`§N` 참조만 있는 경우도 L2a 독립 validator가 실존 확인.

| # | 입력 문자열 | L2a 판정 | 이유 |
|---|---|---|---|
| IR1 | `"어떤 연구(#003)에 따르면 성장세"` + research/003-*.md 실존 | pass | 독립 `#NNN` 매칭 → 실존 확인 |
| IR2 | `"어떤 연구(#999)에 따르면 성장세"` — 미실존 | warn+UV | 기관명·수치 없어도 L2a 독립 발동 |
| IR3 | `"자료는 file:data/fake.csv에 있다"` — 경로 미실존 | warn+UV | L2 매칭 무관, L2a 독립 실행 |
| IR4-v | `"§3을 참조하라"` — 섹션 범위 내 | pass | L2a `§\d+` 범위 검증 |

> **L2a 독립 실행 (cycle 5)**: L2 정규식 매칭 여부와 무관하게 모든 Toulmin 필드에서 참조 패턴 스캔 후 실존 확인. Exception 조건부에서 독립 validator로 확장 (AU7 해소).

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
