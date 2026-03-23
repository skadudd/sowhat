---
model: claude-sonnet-4-6
---
# /sowhat:expand — 섹션 Bottom-Up 전개

이 커맨드는 기획 섹션을 핑퐁 방식으로 전개한다. Toulmin Model 전체 구조(Claim/Grounds/Warrant/Backing/Qualifier/Rebuttal)를 구축한다. `$ARGUMENTS`에 섹션 이름 또는 번호가 전달된다.

## 사전 검증 (1회만 실행 — 이후 재로드 금지)

**세션 시작 시 아래 파일들을 한 번만 로드하고 이후 모든 스텝에서 메모리 값을 재사용한다.**

1. `planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"spec"` 또는 `"finalized"`이면: `❌ 이미 명세/완료 레이어입니다. 기획 섹션 전개 불가.`
2. `00-thesis.md` 로드 → `thesis_answer`(Answer 40자), `key_arguments` 목록 추출 후 변수 저장
3. 대상 섹션 파일 확인:
   - `$ARGUMENTS`가 숫자면 → `{N}-*.md` 패턴으로 검색
   - `$ARGUMENTS`가 이름이면 → `*-{name}.md` 패턴으로 검색
   - 없으면 → 새 섹션 파일 생성 (다음 번호 자동 부여)
   - 섹션 파일 전체를 로드하고 **모든 필드를 변수로 추출**: `thesis_argument`, `stasis`, `scheme`, `claim`, `grounds`, `warrant`, `backing`, `qualifier`, `rebuttal`
4. 섹션 status 확인:
   - `settled` → `❌ 이미 settled된 섹션입니다. /sowhat:challenge로 재검토하세요.`
   - `invalidated` → `❌ invalidated 상태입니다. 상위 논거가 먼저 revision되어야 합니다.`
   - `draft` 또는 `discussing` 또는 `needs-revision` → 진행
5. `research/` 디렉터리 확인:
   - 해당 섹션과 관련된 `status: unreviewed` 파인딩이 있으면:
     `ℹ️ 이 섹션과 관련된 미검토 리서치가 {N}건 있습니다. /sowhat:research review {section}`
6. 로그 디렉터리 확인:
   ```bash
   mkdir -p logs maps/local maps/snapshots maps/debate
   ```

> **로드 원칙**: 이후 스텝에서 배너·질문·판단에 필요한 값은 모두 위에서 추출한 변수를 사용한다.
> 섹션 파일 재로드는 **사용자가 필드를 수정한 직후 저장 확인 시에만** 허용한다.

---

## 컨텍스트 배너

**모든 핑퐁 질문 앞에 다음 배너를 표시한다.** 사전 검증에서 추출한 변수를 사용하며 **파일을 재로드하지 않는다**.

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{thesis_answer}"                              │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 {N}/9 — {스텝명}                                  │
│ 완료: {완료된 필드와 값 요약 (없으면 생략)}               │
└────────────────────────────────────────────────────────┘
```

배너의 "완료" 행은 메모리에 저장된 변수(`claim`, `grounds`, `warrant` 등)에서 직접 구성한다.

예시:
```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "통합 비용 해소로 B2B SaaS 이탈을 막을 수 있다"  │
│ 이 섹션 논거: "시장 규모가 충분히 크다"                  │
│ 스텝 4/9 — Grounds                                     │
│ Stasis: 사실 주장 | Scheme: statistics                  │
│ Claim: "국내 SaaS 시장은 연 28% 성장 중이다"             │
└────────────────────────────────────────────────────────┘
```

---

## 핑퐁 절차

핑퐁 진행 중 언제든 인간이 `map`을 입력하면:
- `/sowhat:map {section} --field {현재 진행 중인 필드}` 트리거
- 맵 출력 후 핑퐁 재개

**각 스텝 완료 후 즉시 커밋:**
- `wip({section}): add stasis+scheme`
- `wip({section}): add claim`
- `wip({section}): add grounds`
- `wip({section}): add warrant`
- `wip({section}): add backing`
- `wip({section}): add qualifier`
- `wip({section}): add rebuttal`

---

### 스텝 0: 기존 섹션 상태 파악 (needs-revision일 때)

`needs-revision` 상태면: 어떤 필드가 문제였는지 확인하고 해당 필드부터 재개.
`draft` 또는 신규 섹션이면 스텝 1로.

---

### 스텝 1: IBIS 프레이밍 (새 섹션일 때만)

기존 섹션이면 이 스텝 건너뜀.

`00-thesis.md`에서 Key Arguments 목록을 로드하여 다음을 출력:

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 스텝 1/9 — IBIS 프레이밍                               │
└────────────────────────────────────────────────────────┘

❓ 이 섹션은 thesis의 어떤 Key Argument를 지지합니까?

  [1] {key argument 1}
  [2] {key argument 2}
  [3] {key argument 3}
  (00-thesis.md의 Key Arguments 전부 나열)
  [N+1] 직접 입력 (새 논거)
```

인간 선택 → `thesis_argument` 필드에 저장.

---

### 스텝 1.5: Stasis 유형 선택 (NEW)

논쟁의 유형을 먼저 확정한다. **이 섹션에서 무엇을 증명하려 하는가**에 따라 필요한 근거 유형이 달라진다.

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 1.5/9 — Stasis 유형                               │
└────────────────────────────────────────────────────────┘

❓ 이 섹션에서 증명하려는 것은 어떤 종류의 주장입니까?

──── 예시 ────
  사실 주장: "국내 SaaS 이탈률은 연 35%다"        → 측정값, 데이터가 핵심
  정의 주장: "이것이 PMF다"                       → 정의 기준과 분류 논리가 핵심
  가치 주장: "이 문제가 가장 중요하다"              → 비교 기준과 우선순위가 핵심
  행동 주장: "지금 진입해야 한다"                  → 사실+가치+실행가능성 모두 필요

──── 선택 ────
  [1] 사실 주장 — "X가 존재한다 / 측정됐다 / 일어났다"
  [2] 정의 주장 — "X는 Y에 해당한다 / Y이다"
  [3] 가치 주장 — "X는 중요하다 / 좋다 / 필요하다"
  [4] 행동 주장 — "X를 해야 한다" (복합)
```

| Stasis | 인정되는 근거 | 인정 안 되는 근거 |
|--------|-------------|----------------|
| 사실 | 측정값, 관찰, 데이터 | 의견, 가치 판단 |
| 정의 | 정의 기준, 분류 논리 | 단순 수치 |
| 가치 | 비교 대상, 우선순위 기준 | 사실 나열만 |
| 행동 | 사실+가치+실행가능성 조합 | 어느 하나만 |

인간 선택 → `stasis` 필드에 저장 → `wip({section}): add stasis+scheme` 커밋 (스텝 2 완료 후 함께).

---

### 스텝 2: Argument Scheme 선택

섹션의 `scheme` 필드가 이미 설정돼 있으면 이 스텝 건너뜀.

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 2/9 — Argument Scheme                             │
│ Stasis: {선택된 stasis}                                │
└────────────────────────────────────────────────────────┘

❓ 이 섹션은 어떤 방식으로 논증합니까?

──── 예시 ────
  "전문가들이 이것이 맞다고 한다"            → authority
  "A가 성공했으니 B도 성공할 것이다"          → analogy
  "X 때문에 Y가 발생한다"                   → cause-effect
  "데이터가 이것을 증명한다"                 → statistics

──── 선택 ────
  [1] authority    — 전문가/권위자의 의견으로 주장
  [2] analogy      — 유사 사례 비교로 주장
  [3] cause-effect — 인과관계로 주장
  [4] statistics   — 데이터/수치로 주장
  [5] example      — 대표적 사례로 주장
  [6] sign         — 신호/징후로 주장
  [7] principle    — 원칙/규칙으로 주장
  [8] consequence  — 결과/영향으로 주장
```

인간 선택 → `scheme` 필드에 저장 → `wip({section}): add stasis+scheme` 커밋.

---

### 스텝 3: Claim 핑퐁

섹션 제목, thesis Answer, thesis_argument, stasis, scheme을 함께 고려하여 Claim에 대한 구체적 제안 3개를 생성한다. **제안은 인간의 실제 맥락에서 파생한다** — generic 예시 사용 금지.

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 3/9 — Claim                                       │
│ Stasis: {stasis} | Scheme: {scheme}                    │
└────────────────────────────────────────────────────────┘

❓ 이 섹션의 핵심 주장(Claim)은 무엇입니까?
   ({stasis} / {scheme} 방식 논증 / "{thesis_argument}" 지지)

──── 좋은 Claim vs 나쁜 Claim ────
  너무 넓음: "시장이 중요하다"          → Claim이 아니라 토픽
  적절함:   "국내 SaaS 시장은 연 28%
             성장 중이며 진입 시점은 지금이다"

──── 제안 (귀하의 맥락 기반) ────
  [1] {thesis_argument와 stasis를 조합한 구체적 Claim 제안 1}
  [2] {구체적 Claim 제안 2}
  [3] {구체적 Claim 제안 3}

──── 기타 ────
  [4] 직접 작성
  [5] 잘 모르겠다 → Open Question 등록
```

인간 답변 → `## Claim` 필드에 저장 → `wip({section}): add claim` 커밋.

---

### 스텝 4: Grounds 핑퐁

**이 스텝은 SUB-RESEARCH 트리거 시 Semi-Async로 전환될 수 있다.** (아래 Semi-Async 섹션 참조)

scheme에 따라 다른 근거 유형을 안내한다.

**scheme별 증거 요건:**
- `statistics`: 수치/데이터 필수
- `cause-effect`: 인과 메커니즘 설명 필수 (수치 있으면 강함)
- `authority`: 전문가 이름/출처 (수치 불필요)
- `analogy`: 유사 사례와 유사성 설명 (수치 불필요)
- `example`: 대표적 사례와 대표성 설명 (수치 불필요)
- `sign`: 패턴 관찰 (수치 있으면 좋음)
- `principle`: 원칙 출처/적용 조건 (수치 불필요)
- `consequence`: 결과 흐름 설명 (수치 있으면 강함)

#### 4-1. 근거 유형 선택 (서브질문 트리)

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 4/9 — Grounds                                     │
│ Stasis: {stasis} | Scheme: {scheme}                    │
│ Claim: "{Claim 40자}"                                  │
└────────────────────────────────────────────────────────┘

❓ 이 주장을 지지하는 근거의 유형은?
   (scheme: {scheme} — 아래 유형에 따라 세부 질문이 달라집니다)

  [1] 수치/데이터     → 출처, 규모, 시기를 묻겠습니다
  [2] 인터뷰/설문     → 대상, 샘플 수, 핵심 응답을 묻겠습니다
  [3] 사례/비교       → 어떤 회사/상황, 어떤 유사성인지 묻겠습니다
  [4] 전문가 의견     → 누구, 어떤 발언인지 묻겠습니다
  [5] 직접 서술       → 자유 형식으로 입력
  [6] 🔍 Sub-Research → agent-browser로 인라인 검색 (Semi-Async 전환)
```

**[1] 수치/데이터 선택 시 세부 질문:**
```
  ❓ 출처는?
    [1] 공개 리포트 (IDC, Gartner, CB Insights 등)
    [2] 정부/기관 통계 (KOSIS, 소프트웨어산업협회 등)
    [3] 자체 조사/실험 데이터
    [4] 기타 (직접 입력)

  → 선택 후: "구체적으로 어떤 수치입니까? (예: IDC 2024: $12.3B, CAGR 27.8%)"
```

**[2] 인터뷰/설문 선택 시 세부 질문:**
```
  ❓ 조사 규모와 대상은?
    [1] 소규모 (n < 30) — 심층 인터뷰
    [2] 중규모 (n = 30~200) — 설문
    [3] 대규모 (n > 200) — 통계적 유의성 있음
    [4] 직접 입력

  → 선택 후: "핵심 발견은 무엇입니까? (예: 78%가 통합 비용을 이탈 이유로 언급)"
```

**[3] 사례/비교 선택 시 세부 질문:**
```
  ❓ 어떤 사례입니까?
    [1] 국내 유사 기업/상황
    [2] 해외 유사 기업/상황
    [3] 직접 입력

  → 선택 후: "우리 Claim과 이 사례의 유사성은 무엇입니까?"
```

#### 4-2. 즉시 기록 확인

근거 입력 후 즉시 표시:

```
✓ Grounds 기록됨:
  • {입력한 근거 요약}

  [+] 근거 추가
  [?] 이 근거가 충분한지 검토 (scheme 기준)
  [→] 근거 입력 완료 — 결합 방식 선택으로
```

`[?]` 선택 시 scheme의 증거 요건 기준으로 즉시 피드백:
```
  현재 근거 평가 ({scheme} scheme 기준):
  ✅ {통과 항목}
  ⚠️  {보완 권장 항목}
```

#### 4-3. Grounds 결합 방식 선언 (NEW)

근거가 2개 이상 있을 때:

```
❓ 이 근거들의 결합 방식은?

──── 예시 ────
  Linked:     "시장이 크다" AND "우리가 진입할 역량이 있다"
               → 둘 다 있어야 Claim 성립. 하나가 무너지면 Claim도 무너짐.
  Convergent: "인터뷰 결과" OR "시장 데이터" OR "경쟁사 사례"
               → 각각이 독립적으로 Claim을 지지. 하나가 약해도 나머지가 지지.

──── 선택 ────
  [1] Linked     — 모두 있어야 Claim 성립 (하나가 빠지면 전체가 약해짐)
  [2] Convergent — 각각이 독립 지지 (하나가 빠져도 나머지가 유지)
  [3] Mixed      — 일부는 Linked, 일부는 Convergent
```

`grounds_structure` 필드에 저장. challenge/debate의 공격 전략이 이에 따라 달라진다.

인간 답변 → `## Grounds` 필드에 저장 → `wip({section}): add grounds` 커밋.

---

### 스텝 4 SUB-RESEARCH: Semi-Async 전환

**[6] Sub-Research 선택 시 이 흐름으로 전환된다.**

#### Semi-Async 실행 원칙

Warrant는 Grounds에 의존한다. Grounds가 확정되지 않은 채 Warrant를 작성하면 Grounds 변경 시 Warrant도 다시 써야 한다. 따라서:

- **Grounds 의존 스텝 (Warrant)**: Grounds 완료 후에만 진행
- **Grounds 무관 스텝 (Qualifier, Scope, AC)**: Sub-Research 실행 중 먼저 진행

```
🔍 Sub-Research 시작
   agent-browser가 백그라운드에서 검색 중입니다.
   Grounds와 무관한 스텝을 먼저 진행합니다.

   진행 순서: Qualifier → Scope → AC → [Grounds 완료 대기] → Warrant
```

Qualifier (스텝 6) → Scope (스텝 9 일부) → AC (스텝 9 일부) 순서로 먼저 진행한다.
Warrant 진입 직전에 Sub-Research 결과를 대기하고 확인한다.

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

agent-browser 호출 예시 (Agent 내부):
```bash
# 페이지 이동 + 텍스트 추출
agent-browser navigate https://example.com/report
agent-browser extract-text

# 배치 처리
echo '[{"cmd":"navigate","url":"..."},{"cmd":"extract-text"}]' | agent-browser batch
```

#### Sub-Research 결과 제시

```
┌─── Sub-Research 완료 ──────────────────────────────────┐
│ Claim: "{Claim 40자}"                                  │
│ 검색: {검색어} (한국어 + 영어)                          │
└────────────────────────────────────────────────────────┘

🔍 검색 결과 ({N}건)

  [1] {출처명} {연도}
      "{핵심 내용}"
      신뢰도: ★★★★★  접근: {full|snippet}
      Scheme 적합도: ✅ {이유}

  [2] {출처명} {연도}
      "{핵심 내용}"
      신뢰도: ★★★☆☆  접근: snippet ⚠️ 원문 미확인
      Scheme 적합도: ✅ {이유}

  [3] ...

────────────────────────────────────────
Grounds에 추가할 항목을 선택하세요:
  [1]  [2]  [3]  [12]  [13]  [23]  [123]
  [0] 결과 기각 — 직접 작성으로 돌아가기
```

#### Sub-Research 실패 처리

```
⚠️  Sub-Research 결과 불충분
    (검색 결과 없음 또는 Scheme 적합도 낮음)

  [1] 검색어 수정 후 재시도 → 직접 검색어 입력
  [2] Open Question으로 등록 후 나중에 직접 리서치
  [3] 근거 없이 진행 → Qualifier를 "presumably" 이하로 자동 제안
```

[3] 선택 시: `⚠️ Grounds 없이 진행합니다. Qualifier는 "presumably" 이하를 강력 권장합니다.`

#### Grounds 주입 + 흐름 복귀

```
✓ Grounds 추가됨:
  • {선택한 항목 요약}

  research/{NNN}-sub-research-{section}.md 에도 저장됨

─── Grounds 결합 방식 선택 ───
(스텝 4-3으로 이동)
```

research/ 파일 frontmatter:
```yaml
---
id: {N}
type: sub-research
trigger: expand-grounds
section: {section}
claim: "{Claim}"
scheme: {scheme}
created: {current_datetime}
status: accepted
---
```

---

### 스텝 5: Warrant 핑퐁

**SUB-RESEARCH Semi-Async 중이었다면: 여기서 Grounds 결과를 먼저 확인한다.**

```
[SUB-RESEARCH 대기 중이었을 경우만 표시]
⏳ Warrant 진입 전 Grounds 결과를 확인합니다.
   {Sub-Research 결과 제시 → 인간 선택 → Grounds 확정 → Warrant 시작}
```

Warrant는 Grounds와 Claim 사이의 논리적 연결고리다. **이 스텝이 논증의 핵심이다.**

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 5/9 — Warrant                                     │
│ Stasis: {stasis} | Scheme: {scheme}                    │
│ Claim: "{Claim 40자}"                                  │
│ Grounds: {근거 요약 (40자)}                             │
└────────────────────────────────────────────────────────┘

❓ Warrant: 이 근거가 주장을 어떻게 지지합니까?
   "{Grounds 핵심}" 이기 때문에 → "{Claim}" 이 성립하는 이유

──── 귀하의 맥락 기반 예시 ────
  귀하의 Grounds: "{Grounds 핵심 30자}"
  귀하의 Claim:   "{Claim 30자}"
  Warrant 예시:   "{Grounds → Claim 연결 논리를 Claude가 파생하여 제안}"

──── 제안 ────
  [1] {이 Grounds-Claim 연결에 맞는 구체적 Warrant 제안 1}
  [2] {구체적 Warrant 제안 2}
  [3] {구체적 Warrant 제안 3}

──── 기타 ────
  [4] 직접 작성
  [5] 이건 당연하다 (Implicit) — ⚠️ /sowhat:challenge 공격에 가장 취약
```

인간이 [5] Implicit을 선택하면: `⚠️ Implicit Warrant는 /sowhat:challenge에서 가장 먼저 공격받습니다. 계속하시겠습니까? [1] 계속  [2] Warrant 작성` 확인 후 진행.

인간 답변 → `## Warrant` 필드에 저장 → `wip({section}): add warrant` 커밋.

---

### 스텝 6: Qualifier 선택

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 스텝 6/9 — Qualifier                                   │
│ Claim: "{Claim 40자}"                                  │
│ Grounds: {근거 수}건 ({structure})                     │
└────────────────────────────────────────────────────────┘

❓ 이 주장의 확신 수준은?

──── 예시 ────
  "항상 그렇다 (definitely)" → 반례 하나에도 Claim 전체가 무너짐. 위험.
  "대부분의 경우 (in most cases)" → 현실적이고 방어하기 쉬움.

──── 선택 ────
  [1] definitely    — 항상, 예외 없음 (⚠️ 가장 공격받기 쉬움)
  [2] usually       — 일반적으로
  [3] presumably    — 아마도, 추정상
  [4] in most cases — 대부분의 경우 (권장)
  [5] possibly      — 가능성 있음 (약한 주장)
```

**Grounds 강도와 Qualifier 균형 자동 체크:**
- `definitely` + 근거 1-2건 → `⚠️ Overclaiming 위험. "usually" 또는 "in most cases" 권장`
- `possibly` + 강한 데이터 → `⚠️ Underclaiming. 더 강한 qualifier도 방어 가능합니다`

선택 후 조건 질문:
```
❓ 이 "{qualifier}"가 적용되는 조건은?
   (어떤 상황에서 이 주장이 성립하는가)

  [1] {이 논증 맥락에 맞는 조건 제안 1}
  [2] {조건 제안 2}
  [3] 별도 조건 없음
  [4] 직접 작성
```

인간 답변 → `## Qualifier` 필드에 저장 → `wip({section}): add qualifier` 커밋.

---

### 스텝 7: Backing 핑퐁 (선택적)

Backing은 Warrant 자체를 뒷받침하는 추가 근거다.

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 스텝 7/9 — Backing (선택적)                            │
│ Warrant: "{Warrant 40자}"                              │
└────────────────────────────────────────────────────────┘

❓ Warrant를 뒷받침하는 추가 근거(Backing)가 있습니까?
   (Warrant "{Warrant 요약}"이 왜 일반적으로 성립하는가)

──── 제안 ────
  [1] {이 Warrant를 뒷받침할 수 있는 구체적 Backing 제안 1}
  [2] {Backing 제안 2}

──── 기타 ────
  [3] 생략 (Warrant가 자명함)
  [4] 직접 작성
  [5] 🔍 Sub-Research → Backing 근거 검색
```

[5] 선택 시 스텝 4의 SUB-RESEARCH와 동일한 흐름 실행 (단, trigger: `expand-backing`).

인간 답변 → `## Backing` 필드에 저장 → `wip({section}): add backing` 커밋.

---

### 스텝 8: Rebuttal 핑퐁

scheme의 Critical Questions를 참고하여 가장 강력한 반론(Steelman)을 생성한다.

**scheme별 Critical Questions (Rebuttal 제안 생성 시 참고):**
- `authority`: 이 권위자가 이 도메인의 진짜 전문가인가? 해당 분야에 합의가 있는가?
- `analogy`: 두 케이스가 충분히 유사한가? 차이점이 논증에 결정적인가?
- `cause-effect`: 역인과(reverse causation) 가능성은? Confounding variable은?
- `statistics`: 표본이 대표성 있는가? 방법론이 건전한가? 데이터가 최신인가?
- `example`: 대표적인 사례인가? 체리피킹은 아닌가?
- `sign`: 이 신호가 신뢰할 수 있는 지표인가? 다른 설명은 없는가?
- `principle`: 이 원칙이 이 상황에 적용되는가? 관련 예외는 없는가?
- `consequence`: 결과가 현실적인가? 의도치 않은 효과는? 시간대는?

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 스텝 8/9 — Rebuttal                                    │
│ Claim: "{Claim 40자}"                                  │
│ Warrant: "{Warrant 40자}"                              │
│ Qualifier: {qualifier}                                 │
└────────────────────────────────────────────────────────┘

❓ 가장 강력한 반론(Rebuttal)은 무엇이며, 어떻게 대응합니까?
   (Steelman: 반론을 가장 강하게 표현한 뒤 대응)

──── 예시 ────
  반론: "시장이 크다고 우리가 그 시장을 잡을 수 있는 건 아니다"
  대응: "우리 GTM은 니치 세그먼트 선점에 집중하므로 전체 시장 점유율 불필요"

──── 제안 (scheme Critical Questions 기반) ────
  [1] {scheme CQ에서 도출한 가장 강한 반론 + 대응 제안 1}
  [2] {반론 + 대응 제안 2}
  [3] {반론 + 대응 제안 3}

──── 기타 ────
  [4] 직접 작성
  [5] 지금은 생략 → Open Question으로 남김
```

인간 답변 → `## Rebuttal` 필드에 저장 → `wip({section}): add rebuttal` 커밋.

---

### 스텝 9: Scope + Acceptance Criteria

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{Answer 40자}"                                │
│ 스텝 9/9 — Scope + AC                                  │
│ Claim: "{Claim 40자}"                                  │
└────────────────────────────────────────────────────────┘
```

**Scope:**
```
❓ 이 섹션이 다루는 범위는?

──── In (포함) ────
  이 섹션에서 명시적으로 다루는 것:

──── Out / Non-Goals (제외) ────
  이 섹션에서 명시적으로 다루지 않는 것:

──── 제안 ────
  [1] {이 Claim 맥락에 맞는 In/Out 제안}
  [2] 직접 작성
```

**Acceptance Criteria:**
```
❓ 이 섹션이 완료되었다고 판단하는 기준은?
   (검증 가능한 형태로)

──── 예시 ────
  "Claim이 thesis reviewer에게 자명하게 납득됨"
  "핵심 반론에 대한 대응이 문서화됨"

──── 제안 ────
  [1] {이 섹션 내용에 맞는 구체적 AC 제안 1}
  [2] {AC 제안 2}
  [3] {AC 제안 3}
  [4] 직접 작성
```

인간 답변 → `## Scope`, `## Acceptance Criteria` 필드 저장.

---

## 파일 생성/업데이트

핑퐁 중 인간이 답한 내용을 즉시 섹션 파일에 반영한다.

새 섹션 생성 시 datetime 취득:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

섹션 파일 구조:

```markdown
---
status: discussing
stasis: {사실|정의|가치|행동}
scheme: {선택된 scheme}
qualifier: {선택된 qualifier}
grounds_structure: {linked|convergent|mixed}
version: 1
section: {N}
title: {section-name}
thesis_argument: {thesis의 어떤 논거를 지지하는가}
github_issue: {issue number}
created: {current_datetime}
updated: {current_datetime}
---

## Claim
> {인간이 답한 내용}

## Grounds (근거)
- {근거 1}
- {근거 2}

> 결합 방식: {linked|convergent|mixed}

## Warrant (논거 연결)
> {Grounds가 Claim을 지지하는 이유}

## Backing (Warrant 강화)
- {Warrant 자체를 뒷받침하는 근거 (없으면 비워둠)}

## Qualifier
> 확신 수준: {definitely|usually|presumably|in most cases|possibly}
> 조건: {Qualifier가 적용되는 조건}

## Rebuttal (반론 대응)
> 가장 강력한 반론: {steelman}
> 대응: {왜 이 반론이 Claim을 무너뜨리지 못하는가}

## Scope
### In
- {인간이 답한 내용}
### Out (Non-Goals)
- {인간이 답한 내용}

## Acceptance Criteria
- [ ] {인간이 답한 내용}

## GitHub Edits
>

## Open Questions
- [ ]

## Argument Log
| round | datetime | move | agent | outcome |
|-------|---------|------|-------|---------|

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 | | {current_date} |
```

---

## 세션 저장

각 스텝 시작 시 `logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: expand
section: {section}
step: {현재 스텝 이름: stasis|scheme|claim|grounds|warrant|backing|qualifier|rebuttal|scope}
sub_research_pending: {true|false}
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
{직전 핑퐁 교환 내용을 2~3문장으로 요약}
{Sub-Research 진행 중이면: "Sub-Research 백그라운드 실행 중. Qualifier 핑퐁 완료. Warrant 진입 전 Grounds 결과 대기 중."}

## 재개 시 첫 질문
{다음에 물어볼 질문 그대로}
```

`expand({section}): complete` 커밋 직전에 `status: complete`로 업데이트한다.

---

## Argument Log 업데이트

핑퐁 세션 완료 후 `logs/argument-log.md`에 추가:

```markdown
## [{datetime}] expand({section})
  Added: {완료된 필드 목록}
  Stasis: {stasis}
  Scheme: {scheme}
  Qualifier: {qualifier}
  Grounds Structure: {linked|convergent|mixed}
  Sub-Research: {used|not-used}
  Status: draft → discussing
```

---

## 종료 조건

인간이 충분하다고 판단하면 핑퐁을 종료한다.

최종 커밋:
```bash
git add planning/{section}.md logs/argument-log.md
git commit -m "expand({section}): complete toulmin structure"
```

종료 안내:

```
✅ 섹션 {N}-{name} 전개 완료

  Claim:     {Claim 한 줄 요약}
  Stasis:    {stasis}
  Scheme:    {scheme}
  Qualifier: {qualifier}
  Grounds:   {N}건 ({structure})
  Warrant:   {Warrant 한 줄 요약}
  Rebuttal:  {"addressed" 또는 "open question"}

  status: discussing
  커밋: {N}회

다음: /sowhat:settle {section}      → 완료 선언
      /sowhat:debate {section}      → 논증 자동 강화
      /sowhat:map {section}         → 논증 시각화
      /sowhat:challenge             → 전체 트리 검증
```

---

## 핵심 원칙

- **컨텍스트 배너는 생략 불가** — 모든 핑퐁 질문 앞에 항상 표시
- **Stasis 먼저** — 논쟁 유형을 확정하지 않으면 근거 유형을 알 수 없다
- **서브질문으로 의사결정 나무** — 개방형 질문 대신 유형 선택 → 세부 확인 순서
- **Sub-Research는 Semi-Async** — Grounds 의존 스텝(Warrant)은 대기, 무관 스텝은 먼저
- **Grounds 결합 방식 명시** — Linked/Convergent에 따라 challenge 공격 전략이 달라짐
- **예시는 맥락 기반** — generic 예시 금지, 인간의 실제 Claim/Grounds에서 파생
- **즉시 기록 확인** — 각 답변 후 기록된 내용을 바로 보여주고 추가/계속 선택
- **Claude는 질문만 한다** — 내용을 대신 채우지 않는다
- **항상 thesis와의 연결을 확인한다** — 모든 필드는 thesis Answer로 거슬러 올라간다
- **Warrant는 생략 불가** — Implicit Warrant는 경고 후 계속 가능하나 위험함을 고지
- **각 스텝 완료마다 커밋** — 작업 손실 방지
