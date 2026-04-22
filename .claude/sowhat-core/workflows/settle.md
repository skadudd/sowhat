# /sowhat:settle — 완료 선언

<!--
@metadata
checkpoints:
  - type: verify-argument
    when: "자동 검증 후 settle 승인"
config_reads: [layer, sections]
config_writes: [sections]
continuation:
  primary: "/sowhat:expand {next}"
  alternatives: ["/sowhat:challenge", "/sowhat:debate {section}"]
status_transitions: ["discussing → settled"]
-->

이 커맨드는 섹션의 status를 settled로 전환한다. `$ARGUMENTS`에 섹션 이름, 번호, 또는 `thesis`가 전달된다.

## 대상 파일 결정

- `$ARGUMENTS`가 `thesis` 또는 `00` → `00-thesis.md`
- `$ARGUMENTS`가 숫자 → `{N}-*.md`
- `$ARGUMENTS`가 이름 → `*-{name}.md`
- 빈 값이면 → `❌ 섹션을 지정하세요. 예: /sowhat:settle thesis, /sowhat:settle 01`

## 사전 검증

1. `planning/config.json` 로드
2. 대상 섹션 파일 로드
3. 현재 status 확인:
   - 이미 `settled` → `❌ 이미 settled 상태입니다.`
   - `invalidated` → `❌ invalidated 상태입니다. 상위 논거가 먼저 revision되어야 합니다.`
   - `draft` → `❌ draft 상태입니다. /sowhat:expand로 먼저 전개하세요.`

## 자동 검증 (thesis의 경우)

`00-thesis.md`를 settle하는 경우:

1. **Situation** 존재 여부 — 비어있으면 거부
2. **Complication** 존재 여부 — 비어있으면 거부
3. **Question** 존재 여부 — 비어있으면 거부
4. **Answer (So What?)** 존재 여부 — 비어있으면 거부
5. **Answer 명확성** — 한 문장인가? 모호하지 않은가?
6. **Key Arguments** 존재 여부 — 최소 1개 논거가 있어야 함
7. **Open Questions** — 미해결 항목이 있으면 거부

## 자동 검증 (기획/명세 섹션의 경우)

다음 항목을 순서대로 확인한다:

1. **thesis_argument 필드** — 존재하는가?
2. **Claim ↔ thesis Answer 정합성** — Claim이 thesis Answer를 지지하는가?
3. **Grounds 존재 여부** — 최소 1개의 근거가 있어야 함
4. **Warrant 존재 및 품질** — Warrant가 존재하는가? `"Implicit"` 또는 비어있으면 **경고** (거부는 아니지만 표시)
5. **Qualifier 설정 여부** — 비어있으면 거부
6. **Rebuttal 처리 여부** — 반론이 addressed되었거나 Open Question으로 명시되어 있는가?
7. **Open Questions** — 미해결 항목이 있으면 거부
8. **scheme 필드** — 설정되어 있어야 함
9. **Filler stub detection** — Toulmin 필드가 형식만 채워져 있고 실질 내용이 없는 "빈 껍데기"를 탐지. 거부.
10. **Source tag 완전성** — `bin/source-tag-parser.js validate` 호출로 구조적 검증. 태그 누락, 화이트리스트 밖 값, 미실존 retrieval 대조 실패 시 거부.
11. **Cross-section regression** — 이 섹션을 settle함으로써 기존 settled 섹션과의 논증 일관성이 깨지는지 검증. 충돌 시 경고.

### Filler Stub Detection (빈 껍데기 탐지)

AI 구조 자동 생성에서도 여전히 발생 가능한 **filler stub** (형식만 있고 내용 없음)만 탐지한다. Fabrication 관련 정규식 탐지(L2), 참조 실존 확인(L2a), `unverified_items` 플래그는 cycle 7에서 모두 폐기 — AI가 구체값을 자동 생성할 경로가 제거됐고, 모든 구체값은 source tag로 추적되므로 불필요하다 (`references/ai-content-boundary.md`).

**탐지 패턴 — Filler only:**

| 필드 | Stub 판정 기준 | 예시 |
|------|---------------|------|
| Grounds | `[source:placeholder]` 만 있고 `[source:user/#NNN/sub-research/file:*]` 항목 0개 | `"{업계 통계} [source:placeholder]"` 만 |
| Warrant | Claim을 단순 반복하거나 동어반복 | Claim="시장이 크다" + Warrant="시장이 크기 때문에" |
| Backing | 구체적 출처/근거 없이 권위 호소만 | "업계 전문가 의견", "일반적으로 알려진 사실" |
| Rebuttal | 구체적 반론 명제 없음 + 대응만 generic | "반론이 있을 수 있으나 극복 가능" |
| Qualifier | 근거 강도와 무관한 최고 수준 설정 | Grounds의 실제 인용(`[source:#NNN]`) 1건 + `definitely` |

**탐지 방법:**
1. 각 Toulmin 필드를 불릿 단위로 분리
2. Grounds: source tag 분포 확인 — `placeholder`/`inference`만 있고 retrieval 태그(user/#NNN/sub-research/file:*)가 0개면 filler
3. Warrant: Claim 키워드 80% 이상 반복 → 동어반복 stub
4. Rebuttal: 구체적 반론 명제 없음 → stub

**검증 결과:**
- **Filler stub 발견** → `❌ Stub 탐지: {필드} — {이유}` → settle 거부
- **경계 사례** → `⚠️ Stub 의심: {필드} — {이유}` → 경고 (거부 아님)

### Source Tag 완전성 검증 (Plan G parser 호출)

cycle 7 Plan G parser(`bin/source-tag-parser.js`)를 settle 진입 전 **실제로 호출**하여 태그 준수를 구조적으로 보증한다. 이 검증은 LLM semantic 판정이 아닌 코드 기반 정적 검사다.

```bash
date -u +"%Y%m%d-%H%M%S"
mkdir -p logs/parser
node bin/source-tag-parser.js validate {section_file} --project . \
  --json | tee logs/parser/settle-{section}-{datetime}.json
```

Parser 출력을 `logs/parser/settle-{section}-{datetime}.json`에 영구 저장. dogfooding·cycle 8 audit에서 실제 parser 판정 이력을 추적 가능.

Parser가 검증하는 항목:

1. **태그 존재**: Grounds/Backing/Warrant/Rebuttal 모든 불릿에 `[source:...]` 부착 여부
2. **화이트리스트**: 허용값(`user` / `#NNN` / `sub-research` / `file:{path}` / `target` / `placeholder` / `inference`) 외 값 거부
3. **Retrieval 실존**:
   - `[source:#NNN]` → `research/NNN-*.md` 파일 존재 확인
   - `[source:file:{path}]` → 경로 실존 확인
4. **구조/내용 경계**: `[source:placeholder]` / `[source:inference]` 태그인데 구체값(수치·URL·DOI·연도) 포함 시 warning

**처리 로직**:

- Parser `exit code 1` (errors) → settle 거부. parser 보고서 그대로 출력.
- Parser `exit code 0` + warnings → 경고 표시 + 사용자에게 진행 여부 확인.
- Parser `exit code 0` + no warnings → 통과.

Parser가 감지하지 못하는 의미 수준 검증(AI가 `[source:#003]` 으로 인용했지만 해당 finding에 실제로 해당 내용이 있는지)은 challenge Stage 0에서 별도 수행.

---

### Cross-Section Regression Gate

이 섹션을 settle함으로써 기존 settled 섹션과의 논증 일관성이 깨지는지 검증한다.

**검증 대상:**
1. **Claim 충돌**: 이 섹션의 Claim이 다른 settled 섹션의 Claim과 모순되지 않는가?
2. **Grounds 의존 깨짐**: 다른 settled 섹션의 Grounds가 이 섹션의 Claim을 전제로 하는 경우, 전제가 여전히 유효한가?
3. **thesis 정합성**: 이 섹션을 포함한 전체 settled 섹션의 Claim이 thesis Answer를 논리적으로 지지하는가?

**검증 방법:**
1. 모든 settled 섹션의 Claim + Grounds + Warrant를 로드
2. 이 섹션의 Claim과 각 settled 섹션의 Claim 간 논리적 모순/충돌 검사
3. 이 섹션을 인용하는 다른 섹션의 Grounds 텍스트에서 전제 유효성 확인
4. thesis Answer → Key Arguments → 각 섹션 Claim의 논리 체인 검증

**검증 결과:**
- 충돌 없음 → 조용히 통과 (표시 없음)
- 충돌 발견 → 경고 출력 (settle 거부는 아님, verify-argument checkpoint에서 인간이 판단):
  ```
  ⚠️ Cross-section regression 감지

  {N}-{section}의 Claim과 충돌:
    이 섹션: "{this claim}"
    {N}-{section}: "{other claim}"
    충돌: {충돌 설명}

  [영향받는 섹션]: {section list}
  ```

---

### Scheme별 추가 검증

- `statistics` scheme → 실제 수치/데이터가 Grounds에 있어야 함. 없으면 거부
- `authority` scheme → 출처/전문가가 Backing에 명시되어야 함. 없으면 거부
- `analogy` scheme → 비교 대상이 명시되어야 함. 없으면 거부
- `cause-effect` scheme → 인과 메커니즘이 Warrant에 설명되어야 함. 없으면 경고

검증 방법: 각 항목을 읽고 논리적 정합성을 판단한다.

## 검증 실패 시

```
❌ settle 거부: {섹션 이름}

이유:
- {구체적 이유 1}
- {구체적 이유 2}

해소 필요:
- {무엇을 해야 하는지}
```

settle을 거부하고 종료한다.

## 검증 통과 시

### 0. verify-argument Checkpoint

자동 검증 결과를 인간에게 제시하고 승인을 받는다 (`references/checkpoints.md` 참조):

```
**[verify-argument]** {섹션 이름}

> [settle {섹션 이름} > verify-argument]
> 자동 검증 결과:
> {각 검증 항목: ✅ 통과 / ⚠️ 경고 목록}

[1] 승인 — settle 진행
[2] 수정 필요 — 어떤 부분?
[3] 건너뛰기 — 나중에 다시
```

- `[1]` → 아래 Step 1~8 실행
- `[2]` → 인간의 수정 지시를 받아 반영 후 재검증
- `[3]` → session.md에 `status: awaiting_checkpoint` 저장, 종료

### 1. 파일 업데이트

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

- `status: settled`로 변경
- `updated: {current_datetime}`로 변경

### 2. Git commit (상태 변경)

```bash
git add {section_file}
git commit -m "settle({section}): {claim 한 줄 요약}"
```

### 3. GitHub Issue 업데이트

```bash
gh issue close {issue_number}
gh issue edit {issue_number} --add-label "settled" --remove-label "draft,discussing,needs-revision"
```

### 4. config.json 업데이트

해당 섹션의 `status`를 `"settled"`로 변경한다.

### 5. 00-thesis.md 업데이트 (기획 섹션의 경우)

Key Arguments 체크박스를 체크한다:
- `- [ ] {논거} → {N}-{section}.md` → `- [x] {논거} → {N}-{section}.md`

### 6. logs/argument-log.md 추가

`logs/argument-log.md`에 append한다 (파일이 없으면 `# Argument Log` 헤더와 함께 생성):

```markdown
## [{current_datetime}] settle({section})
  Action: status → settled
  Before: {이전 status}
  After: settled
  Claim: {claim 한 줄 요약}
  Scheme: {scheme}
  Qualifier: {qualifier}
  Warrant: {명시됨 | Implicit}
```

### 7. Git commit (로그 업데이트)

```bash
git add logs/argument-log.md planning/config.json 00-thesis.md
git commit -m "wip(logs): settle log for {section}"
```

### 7.5. logs/session.md 업데이트

```markdown
---
command: settle
section: {N}-{section}
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
settle 완료 — {N}-{section} settled 전환. Claim: {claim 한 줄}

## 재개 시 첫 질문
/sowhat:expand {next} → 다음 섹션 전개
```

### 8. 완료 안내 + 논증 구조 요약 + 강도 점수

완료 메시지와 함께 논증 구조 및 강도 점수를 **인라인으로 즉시 출력**한다.
강도 점수는 `references/strength-scoring.md`의 알고리즘으로 계산한다.

```
----------------------------------------
✅ settled: {섹션 이름}
  Issue #{N} closed
----------------------------------------

📋 논증 구조 요약

  📌 Claim [{scheme} / {qualifier}]
    {Claim 전문}

  🔍 Grounds
    {Grounds 전문}

  🔗 Warrant
    {Warrant 전문 | ⚠️ Implicit — 명시화 권장}

  📚 Backing
    {Backing | 없음}

  ⚡ Rebuttal
    {Rebuttal | 없음}

📊 논증 강도: {section_score}/100 [{등급}]
  근거     [{evidence_bar}] {evidence_score}/35
  논리     [{logic_bar}]    {logic_score}/30
  방어     [{defense_bar}]  {defense_score}/20
  보정     [{calibration_bar}] {calibration_score}/15
  {60 미만이면: ⚠️ 논증 강도가 낮습니다. /sowhat:debate {section}으로 강화를 권장합니다.}

----------------------------------------
⚠️  컨텍스트 관리 권장
  세션이 길어졌을 수 있습니다.

  [1] /clear 후 재시작 (상태는 파일에 저장됨)
  [2] /compact (압축 요약)
  [3] 계속 진행
----------------------------------------

----------------------------------------
다음 액션:

[1] 다음 섹션 전개 (expand {next})
[2] 전체 트리 검증 (challenge) — 모든 섹션 settled 후
[3] 변증법 강화 (debate {section})
[4] 논증 수정 + 영향 점검 (revise {section})
----------------------------------------
```

## 핵심 원칙

- **완료는 인간이 선언한다** — Claude가 자동으로 settle하지 않는다
- **검증은 구조·정합성만** — cycle 7에서 L2/L2a/unverified_items는 폐기. AI가 구체값을 자동 생성할 경로가 없으므로 fabrication 탐지·플래그 불필요 (`references/ai-content-boundary.md`)
- **Filler stub은 거부** — 형식만 채운 빈 껍데기 논증은 여전히 settle 불가. 단, fabrication 의심은 더 이상 settle 거부 사유가 아니다 — source tag가 모든 구체값을 이미 추적
- **Source tag 완전성** — 태그 없는 구체값이 있으면 거부 (parser 우회 케이스)
- **검증 실패 시 거부** — 무엇을 해소해야 하는지 명시한다
- **Warrant "Implicit"은 경고** — 거부까지는 아니지만 약한 논증임을 표시한다
- **Regression은 경고한다** — 기존 settled 섹션과 충돌하면 인간이 판단
