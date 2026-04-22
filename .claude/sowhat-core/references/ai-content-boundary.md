# AI Content Boundary — AI와 사용자의 콘텐츠 경계

sowhat의 근본 원칙을 구현하는 단일 규칙:

> **Claude는 질문하고 구조를 제안한다. 내용은 대신 채우지 않는다.**

이 문서는 `fabrication-prevention.md`(cycle 1-6, 폐기)를 대체한다. 이전 접근은 "AI가 fabricate할 수 있음을 전제로 탐지·차단"하는 complexity containment였고 6 cycle 연속 실패. cycle 7에서 **AI가 fabricate할 기회 자체를 제거**하는 complexity removal로 전환.

---

## 핵심 원칙

### 구조 vs 내용 분리

| 영역 | 담당 | 예시 |
|---|---|---|
| **구조 (Structure)** | AI 제안 | Claim 형식, Warrant 논리 연결, Scheme 선택, Qualifier 추정 |
| **내용 (Content)** | 사용자·research·Sub-Research | 구체 수치, 기관명, 인물명, 보고서명, URL, 사례 |

**AI는 구조 영역에서 자유롭다**. 논리 구조, 논쟁 유형, 공격 각도 등은 AI가 제안. Toulmin scheme, IBIS 프레이밍, Stasis 선택도 AI가 제시.

**AI는 내용 영역에서 제안하지 않는다**. 구체값을 포함한 선택지·예시·플레이스홀더를 "AI가 먼저 제시"하는 경로를 **워크플로우에서 제거**.

### Source Tag 강제

AI 생성물의 모든 불릿·항목에 `[source:...]` 태그가 붙어야 한다. 태그 없는 항목은 parser가 자동 drop.

**허용 source 값**:

| source | 의미 | 예시 |
|---|---|---|
| `user` | 사용자가 직접 입력 | `"이탈률 34% [source:user]"` |
| `#NNN` | research/ finding 인용 | `"이탈률 34% [source:#003]"` |
| `sub-research` | 세션 내 Sub-Research 결과 | `"이탈률 34% [source:sub-research]"` |
| `file:{path}` | 사용자 제공 로컬 파일 | `"이탈률 34% [source:file:data/survey.csv]"` |
| `target` | content-critique 모드 대상 콘텐츠 인용 | `"원문: 'AI는 X다' [source:target]"` |
| `placeholder` | 구체값 없는 플레이스홀더 | `"{비율}% 이탈 [source:placeholder]"` |
| `inference` | 구조·논리 추론 (구체값 없음) | `"Grounds가 Claim을 지지한다 [source:inference]"` |

`[source:target]`은 `/sowhat:init --from {URL 또는 file}`로 시작한 content-critique 모드에서만 사용. 대상 콘텐츠는 `config.source`에 기록된 실존 파일/URL이므로 retrieval 기록과 동등하게 취급.

**AI가 `source:user`나 `source:#NNN`을 스스로 붙일 수 없다**. 이 태그는 사용자가 직접 입력했거나 실제 retrieval을 거친 경우에만 workflow가 자동 부착. AI가 임의로 태그를 붙이는 것은 regex로 감지되어 drop (Plan G parser).

---

## 내용이 들어올 수 있는 경로 (오직 4가지)

1. **사용자 직접 입력** — `[N] 직접 입력` 선택지로 사용자가 자유 입력. Source tag: `user`
2. **research/ 파인딩 매핑** — `/sowhat:research`로 이미 검증된 finding 인용. Source tag: `#NNN`
3. **Sub-Research 실행** — 세션 내에서 `/sowhat:research` agent 호출 → 영수증 검증 통과한 결과. Source tag: `sub-research`
4. **file:/dir: 자료** — `/sowhat:inject`로 사용자 제공 로컬 파일 주입. Source tag: `file:path`

**이 4가지 경로 밖의 구체값은 존재할 수 없다**. 경로를 거치지 않은 구체값이 저장 시도되면:
- Structured output parser가 태그 누락 감지 → drop
- 저장된 후에도 draft 시점에 source 태그 없는 구체값이 발견되면 차단

---

## 워크플로우별 적용

### expand (Grounds/Backing 입력)

**이전 (cycle 1-6)**:
```
❓ 근거 유형?
  [1] 공개 리포트 (업계 조사기관)
  [2] 정부 통계
  [3] 자체 조사
  [4] 직접 입력
  [6] Sub-Research
```
→ [1][2][3] 선택 후 AI가 "예: McKinsey 2024: 34%" 같은 **구체값 포함 선택지 생성**. 여기서 fabrication 발생.

**cycle 7 (Plan A)**:
```
❓ 근거 출처를 선택하세요.

  [1] 직접 입력 — 내가 가진 자료를 타이핑
  [2] 🔍 Sub-Research 실행 — AI가 외부 조사
  [3] research/ 파인딩에서 선택 — 이미 수집한 자료
```
→ 선택지에 **구체값이 절대 없음**. 구체값은 [1] 사용자 입력, [2] Sub-Research 결과, [3] finding에서만 나옴.

### autonomous (자동 전개)

**이전**: research 없으면 AI가 자기 기억으로 Grounds 생성 → fabrication

**cycle 7 (Plan A)**:
```
if not research/:
  해당 섹션 draft 상태로 유지
  사용자에게 안내: "research 먼저 수집하세요 (/sowhat:research)"
  자동 생성 시도 없음
```

### debate / steelman / critic (공격·방어·비평)

**이전**: Con/Pro 에이전트가 자체 근거 생성. fabrication 위험.

**cycle 7 (Plan A)**:
- 에이전트는 **논리적 취약점**(Warrant non-sequitur, Qualifier overclaiming, Scheme CQ 미충족)만 공격
- 구체값 필요 시 `<research_findings>` 태그로 오케스트레이터가 미리 주입한 finding만 사용
- 주어진 findings 없으면 논리 공격만 수행. 구체값 생성 시도 0.

### draft (외부 산출물 생성)

**이전**: L4 4중 게이트 (순서·challenge·unverified·렌더링 검증) + 정규식 + frontmatter schema

**cycle 7 (Plan A+G)**:
- 산출물은 planning/spec 섹션의 내용을 **그대로 또는 paraphrase**만 가능
- 각 구체값 옆에 source 태그 자동 렌더링:
  ```markdown
  이탈률은 34%에 달한다¹
  ---
  ¹ 출처: #003 (research/003-saas-churn.md) — 검증된 finding
  ```
- 기획에 없던 구체값이 산출물에 나타나면 parser가 감지해 drop
- 복잡한 L4 게이트 불필요

---

## Plan G: Structured Output Parser

AI 호출 시 system prompt에 다음 강제:

```
각 Grounds/Backing/Warrant 항목 끝에 반드시 [source:type] 태그.
태그 없는 항목은 최종 출력에서 제거된다.

source 허용값:
  - user: 사용자가 직접 입력할 부분
  - placeholder: 구체값 없는 유형 기술
  - inference: 구조·논리 추론
  - #NNN / sub-research / file:path: retrieval이 실제 일어난 경우만
```

Parser가 수행:
1. AI 출력 파싱 — 각 불릿/문장의 `[source:...]` 태그 추출
2. 태그 없는 항목 → silently drop (사용자에게 표시 X)
3. AI가 임의로 `[source:user]` / `[source:#NNN]` 등을 붙인 경우:
   - workflow가 추적하는 실제 retrieval 기록과 대조
   - 기록 없는 주장 → drop
4. `placeholder` / `inference` 태그 항목 → 통과 (구체값 없음)

**Parser 구현 위치**: workflow markdown에 명시적 step으로. 예: expand.md Step 5 (Warrant 생성) 뒤에 "output filter" step.

---

## 폐기된 개념들 (cycle 1-6 유산)

다음은 **더 이상 사용되지 않음**:

- L0 AI-엄격 / L0 사용자-중간 경로 분리
- L2 정규식 기반 fabrication 탐지 (en_direct, ko_direct, en_suffix, ko_suffix, en_vague, ko_vague)
- L2a 참조 실존 확인 (cross-reference)
- L4 4중 게이트 (순서 강제, challenge auto-invoke, unverified 집계, 렌더링 검증)
- `unverified_items` frontmatter 스키마
- `last_challenged_at` 타임스탬프 스키마
- `detected_by` 배열 (L0-ai, L2-en_direct 등 enum)
- 13개 workflow의 "L1 Fabrication 차단" 블록

**이 개념들은 AI fabrication이 발생한다는 전제하에 탐지·차단하려는 시도였다.** cycle 7에서 fabrication 발생 경로 자체를 제거했으므로 모두 불필요.

---

## Challenge Stage 0의 축소된 역할

challenge Stage 0 (사실 검증)은 완전 폐기하지 않는다. 단 **역할 축소**:

- **이전**: AI fabrication 탐지 + 사용자 입력 검증 + 복잡한 Tier 판정
- **cycle 7**: **사용자 입력 citation의 실존 확인만**. 사용자가 `"McKinsey 2024: 34% [source:user]"`라 입력했을 때 "실제로 이런 리포트가 존재하는가"를 WebFetch로 확인. AI fabrication 탐지는 불필요 (발생 안 함).

---

## "완벽한 제품"의 정의 (cycle 7)

| 정의 | 달성 여부 |
|---|---|
| Fabrication 0 (이전 목표) | 불가능 (업계 연구 증명) |
| Fabrication Transparency (cycle 5) | 검증 불가능한 "좋은 말" |
| **"사용자 입력과 AI 구조화를 결코 혼동하지 않음" (cycle 7)** | **구조적으로 달성** |

사용자는 산출물의 모든 구체값 옆에 source 태그를 본다. AI가 만든 것은 `[inference]`/`[placeholder]`만 가능 (구체값 없음). 구체값이 있으면 반드시 `[user]`/`[#NNN]`/`[sub-research]`/`[file:]` — 즉 **사용자가 추적 가능한 출처**.

이것이 cycle 7의 "완벽".

---

## 마이그레이션

기존 프로젝트의 섹션 파일:

- `unverified_items` frontmatter 필드: 무시 (noop). 삭제하지 않아도 workflow가 더 이상 참조 안 함.
- `last_challenged_at` 필드: 동일 — 무시
- 기존 Grounds/Backing의 구체값: source 태그 없이 저장됨. 재settle 시점에 workflow가 사용자에게 "이 구체값의 출처는?" 1회 묻고 태그 부착.

스크립트 신설 계획: `/sowhat:migrate-sources {section}` — 기존 섹션의 구체값을 스캔해 source 태그 일괄 부착 마법사.

---

## 요약

**3가지 문장:**

1. **AI는 구조만 제안, 내용은 사용자·research에서만** — sowhat DESIGN.md 원칙으로의 회귀.
2. **모든 구체값에 `[source:...]` 태그 강제** — parser가 태그 없는 항목 drop.
3. **Fabrication 탐지·차단 로직은 전면 폐기** — 발생 경로 제거했으므로 불필요.
