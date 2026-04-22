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

`[source:target]`은 `/sowhat:init --from {URL 또는 file}`로 시작한 content-critique 모드에서만 사용. 대상 콘텐츠는 `config.source`에 기록된 실존 파일/URL이므로 retrieval 기록과 동등하게 취급. 단, **target 인용 시 구간 식별자(page/paragraph/timestamp) 동반 권장** — 단일 URL이 모든 target 태그를 정당화하지는 않는다.

### 구조/내용 경계 판정 규칙 (5개 모호 지점)

cycle 7 외부 감사에서 지적된 경계 사례에 대한 판정 규칙. parser의 `CONCRETE_PATTERNS`는 정량 구체값을 잡고, 아래 규칙은 경계 사례를 LLM이 판정할 때 참조한다.

**C1. Warrant의 비교값 / 임계치 침투**

> 예: "대규모 데이터셋은 통계적 유의성을 가진다" (statistics scheme의 Warrant)

- 구체 수치 없음 → `[source:inference]` 허용
- "표본 N ≥ 1000이면" 같은 **구체 임계치 포함** → `[source:inference]` 부족. 해당 임계치의 출처(통계 교과서, 업계 기준)를 Backing으로 분리 + `[source:#NNN]` 또는 `[source:user]` 부착

**C2. cause-effect 메커니즘 기술**

> 예: "X는 Y를 야기한다 (메커니즘 Z 때문에)" 형식의 Warrant

- Z가 **논리 관계 기술** → `[source:inference]` 허용 (예: "비용 상승이 수요 감소로 이어진다")
- Z가 **도메인 지식·연구 결과** → retrieval 필요 (예: "도파민 수용체 D2의 탈감작으로 인해")

판정 기준: Z를 제거했을 때 Warrant가 여전히 논리적으로 성립하는가? 성립하면 Z는 보조 설명 → 내용 태그 필요. 성립 안 하면 Z는 논리 구조의 일부 → inference 허용.

**C3. target 태그의 retrieval 위상**

- `[source:target]`은 **대상 콘텐츠 범위 내** 인용에만 사용
- target의 수치·기관명 인용 시 **구간 식별자**(page/paragraph/timestamp) 동반 권장 (parser가 강제하진 않으나 critic 단계에서 spot-check 대상)
- target의 **외부 비교**(타겟이 인용한 외부 수치) 재인용은 `[source:target]` 부적합 — 해당 외부 출처를 직접 검증 후 `[source:#NNN]` 부착

**C4. Scheme 선택 시점**

현재 `autonomous.md`는 Stasis → Scheme → Claim → Grounds 순으로 자동 전개. Scheme 선택 시 Grounds가 아직 없으므로 AI 추론(`[source:inference]`)으로 결정.

- 제약: 실제 Grounds 수집 후 Scheme이 부적합하면 Scheme 재선택 허용 (cycle 7에서는 `/sowhat:revise scheme` 경로)
- 경계: "statistics scheme으로 결정 후 수치 없음 발견" → `[source:inference]` + placeholder 유지, 사용자 개입 요청

**C5. `placeholder` vs `inference` 경계**

- `[source:placeholder]`: 구체값이 **들어갈 자리는 있으나 아직 비어있음** (`"{비율}% 이탈"`, `"{기관} {연도} 보고"`)
- `[source:inference]`: 구체값이 **처음부터 필요 없는** 논리 기술 ("Grounds가 Claim을 지지한다")

**경계 판정 알고리즘**:

1. 불릿에 `{변수}` 형태 플레이스홀더가 있는가? → `[source:placeholder]`
2. 불릿에 `{변수}` 없고 수치·URL 등 구체 패턴도 없는가? → `[source:inference]`
3. 불릿에 구체 패턴이 있는가? → `[source:user/#NNN/sub-research/file:*]` 중 하나 필요

Parser의 `CONCRETE_PATTERNS`는 경계 3을 잡는다. 1·2의 구별은 LLM이 수행하며, 잘못된 태그 부착 시 parser warning(placeholder/inference + 구체값 조합)이 포착.

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

### LLM system prompt 강제 (생성 단계)

AI 호출 시 에이전트·워크플로우 프롬프트가 다음을 명시:

```
각 Grounds/Backing/Warrant/Rebuttal 항목 끝에 반드시 [source:type] 태그.
태그 없는 항목은 parser가 drop한다.

source 허용값:
  - user / #NNN / sub-research / file:path / target: retrieval이 실제 일어난 경우만
  - placeholder: 구체값 없는 유형 기술
  - inference: 구조·논리 추론
```

### Parser 구현 (검증 단계)

**구현 위치**: `.claude/sowhat-core/bin/source-tag-parser.js` (Node.js, 의존성 0).

**호출 시점**:

| 진입점 | 호출 | 거부 기준 |
|---|---|---|
| `/sowhat:settle {section}` | `node .claude/sowhat-core/bin/source-tag-parser.js validate {section_file} --project .` | exit 1 → settle 거부 |
| `/sowhat:draft` (Step 5.5a) | `node .claude/sowhat-core/bin/source-tag-parser.js validate --all planning/ --project . --strict` | exit 1 → draft 중단 |
| `npm test` (CI 회귀) | `node scripts/test-source-tags.js` | regression fixture 불일치 |

**Parser가 수행하는 4가지 정적 검사**:

1. **태그 존재**: Toulmin 필드(Grounds/Backing/Warrant/Rebuttal)의 모든 불릿에 `[source:...]` 부착 여부
2. **화이트리스트**: `user / #\d{3} / sub-research / file:.+ / target / placeholder / inference` 정규식 매칭. 외 값은 error
3. **Retrieval 실존**: `[source:#NNN]` → `research/NNN-*.md` 파일 존재 확인, `[source:file:{path}]` → 경로 실존 확인. 미실존 시 error
4. **구조/내용 경계 경고**: `[source:placeholder]` / `[source:inference]` 태그인데 구체값(수치·%·URL·DOI·연도) 포함 → warning (retrieval 태그 필요 의심)

**출력**: human-readable 리포트 또는 `--json` 구조화 출력. exit code 0(무결점) / 1(errors 또는 `--strict` 하 warnings) / 2(CLI 사용 오류).

**Parser가 검증하지 않는 것**: AI가 `[source:#003]` 으로 인용한 내용이 실제 해당 finding에 있는가의 **의미 수준 대조**. 이는 challenge Stage 0에서 research-agent가 WebFetch로 수행.

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

| 정의 | 달성 여부 | 근거 |
|---|---|---|
| Fabrication 0 (이전 목표) | 불가능 | LLM 기반 시스템의 본질적 한계 |
| Fabrication Transparency (cycle 5) | 검증 불가능한 "좋은 말" | 측정 기준 부재 |
| **"사용자 입력과 AI 구조화를 구조적으로 구별" (cycle 7)** | **대체로 달성** | 아래 달성 조건 참조 |

**달성 조건** (이 조건이 모두 참이어야 "구조적 구별"이 성립):

1. 모든 Toulmin 불릿이 `[source:...]` 태그를 갖는다 — parser(`.claude/sowhat-core/bin/source-tag-parser.js`)로 정적 검증
2. Retrieval 태그(`user/#NNN/sub-research/file/target`)의 대상이 실존 — parser가 research/ 디렉토리와 파일 시스템 대조
3. LLM이 retrieval 태그를 허위 부착한 경우 challenge Stage 0에서 의미 수준 검증으로 탐지
4. 사용자가 `--force`를 사용하지 않음 (sandbox escape 상태 밖)

4개 조건이 모두 충족될 때만 "구별"이 실재한다. **Qualifier**: in most cases (cycle 1-6의 "definitely" 과대주장을 수정). 아래 Rebuttal 섹션의 5가지 실패 조건이 이 Qualifier를 정당화한다.

---

## Rebuttal — 이 설계가 실패할 수 있는 조건

cycle 1-6 실패 패턴(각 cycle이 자기 scope 내에서 "완벽" 선언)을 방지하기 위해 cycle 7 설계의 **5가지 실패 조건**과 현 대응을 명시한다.

### R1. LLM이 retrieval 태그를 허위 부착

**실패 시나리오**: LLM이 `[source:#003]`을 실제 retrieval 없이 붙임. Parser의 실존 확인(`research/003-*.md` 파일 유무)은 통과하지만, finding의 실제 내용과 무관한 인용일 수 있음.

**현 대응**:
- Parser가 파일 실존을 보장 (구조적 방어선 1)
- Challenge Stage 0이 WebFetch로 의미 수준 대조
- 발견 시 settle 거부 → revise 트리거

**잔여 위험**: Stage 0 skip (사용자 `--force`) 또는 접근 불가 소스의 경우 통과 가능.

### R2. 구조/내용 경계의 모호성

**실패 시나리오**: "대부분의 기업", "업계 평균", "대규모 표본" 같은 표현은 구조(`[source:inference]`)인가 내용(retrieval 필요)인가?

**현 대응**:
- Parser가 수치·%·연도·URL·DOI 같은 명시적 구체값만 탐지
- 구체값 없는 정성적 표현은 `[source:inference]` 허용
- `.claude/sowhat-core/bin/source-tag-parser.js`의 `CONCRETE_PATTERNS` 는 경계 사례 추가 시 확장

**잔여 위험**: 정성적 과장("압도적 다수", "혁명적 변화")이 inference 태그로 통과. challenge Stage 2(Scheme CQ) 영역.

### R3. 사용자 실수

**실패 시나리오**: 사용자가 `[source:user]`로 잘못된 수치(타이핑 실수, 오래된 데이터)를 입력.

**현 대응**:
- Challenge Stage 0이 사용자 citation 실존·값 정확성 확인
- 발견 시 revise 트리거

**잔여 위험**: Stage 0 접근 불가 소스(사내 데이터, 구독 매체)의 경우 검증 불가. Qualifier 하향 권고가 유일한 방어.

### R4. `--force` escape hatch 남발

**실패 시나리오**: 사용자가 draft/finalize에서 `--force`를 일상적으로 사용.

**현 대응**:
- 완료 메시지에 `--force` 사용 사실 명시 (workflow 출력 수준)
- 사용자 책임 선언

**현 대응이 하지 않는 것** (정직한 한계):
- 시스템 수준 감사 로그 없음. `--force` 사용 이력이 파일에 영구 기록되지 않는다. Phase 6 의 `logs/argument-log.md` append 는 각 workflow 의 선택적 기록이며 `--force` 전용 ESH 로그 store 는 미구현.

**잔여 위험**: `--force` 일상화 시 cycle 7 보증 전체가 무효. 정책·운영 리스크 (설계 결함 아님). 감사 로그가 없으므로 사후 추적도 제한적. **Cycle 8 후보**: `--force` 전용 영구 로그 store + workflow 게이트 구현.

### R5. 기존 프로젝트 마이그레이션 누수

**실패 시나리오**: cycle 1-6 섹션 파일이 source 태그 없이 존재. 재settle 없이 draft 진입 시 parser가 대량 error.

**현 대응**:
- Parser가 태그 없는 불릿을 error로 보고 (강제 인지)
- 사용자가 수동으로 `/sowhat:revise` 또는 에디터로 태그 부착
- `/sowhat:migrate-sources` 자동 마법사는 **deferred** (아래 §"마이그레이션" 참조)

**잔여 위험**: 대량 섹션 마이그레이션의 수동 부담. Cycle 8 후보 주제.

### Qualifier 정당화

위 5개 실패 조건 중 **R1·R3는 Stage 0 의미 검증에 의존**, **R2·R4·R5는 정책·운영 영역**. 설계 차원의 "구조적 구별"은 R1~R5 밖에서 성립하므로 **"in most cases"**가 정확한 Qualifier다. cycle 1-6의 "이번에는 완벽"(definitely) 과대주장 패턴을 의식적으로 회피.

---

## 마이그레이션 (cycle 1-6 → cycle 7)

기존 프로젝트의 섹션 파일:

- `unverified_items` frontmatter 필드: 무시 (noop). Workflow가 더 이상 참조하지 않으므로 유지해도 안전.
- `last_challenged_at` 필드: 동일 — 무시
- 기존 Grounds/Backing의 구체값: source 태그 없이 저장됨. 재settle 또는 draft 진입 시 parser가 error 보고 → 사용자가 수동으로 `/sowhat:revise`로 태그 부착

### `/sowhat:migrate-sources` — **Deferred** (cycle 8 후보)

기존 섹션의 구체값을 스캔해 source 태그 일괄 부착하는 자동 마법사는 **cycle 7에서 구현하지 않는다**. 이유:

- 마이그레이션 도구 자체가 LLM semantic 판단 필요(구체값 → 출처 매핑) — parser 스코프 밖
- 소량 프로젝트는 수동 revise로 충분
- 구현 전에 실사용에서 수요 확인 필요

**cycle 7 스코프 내 대안**:
- 섹션별 수동 `/sowhat:revise` — parser error 리포트가 대상 불릿을 드러내줌
- 새 프로젝트부터 적용 (cycle 1-6 프로젝트는 대부분 마이그레이션 불필요)

---

## 요약

**3가지 문장:**

1. **AI는 구조만 제안, 내용은 사용자·research에서만** — sowhat DESIGN.md 원칙으로의 회귀.
2. **모든 구체값에 `[source:...]` 태그 강제** — parser가 태그 없는 항목 drop.
3. **Fabrication 탐지·차단 로직은 전면 폐기** — 발생 경로 제거했으므로 불필요.
