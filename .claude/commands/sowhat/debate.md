---
model: claude-opus-4-6
---
# /sowhat:debate — 변증법적 논증 루프

이 커맨드는 3-에이전트 변증법 구조로 섹션(또는 전체 트리)을 공격·방어한다. `$ARGUMENTS`를 파싱하여 대상과 종료 조건을 결정한다.

Thesis가 위협받을 수 있으며, 그것이 논리적으로 정당하면 **무너뜨리는 것이 올바른 결과다.**

## 인자 파싱

```
/sowhat:debate [section|--global] [--rounds N|--until-stable|--until-broken]
```

| 인자 | 의미 |
|------|------|
| `{section}` (번호 또는 이름) | 단일 섹션 debate |
| `--global` 또는 인자 없음 | 전체 트리 debate |
| `--rounds N` | N라운드 후 종료 (기본값: 3) |
| `--until-stable` | 연속 2라운드 결과 변화 없으면 종료 |
| `--until-broken` | Claim 또는 Thesis 무너지면 즉시 종료 |

## 사전 검증

1. `planning/config.json` 로드 → sowhat 프로젝트 확인
2. `00-thesis.md` 로드
3. **작업 트리 확인**:
   ```bash
   git status --porcelain
   ```
   uncommitted 변경이 있으면:
   ```
   ❌ 작업 트리가 깨끗하지 않습니다. debate 브랜치 생성 전 커밋하세요.
     미커밋 파일: {list}
     다음: git add -A && git commit -m "wip: before debate"
   ```
4. **단일 섹션 모드**: 대상 섹션 파일 확인
   - 번호면 → `{N}-*.md` 패턴 검색
   - 이름이면 → `*-{name}.md` 패턴 검색
   - 없으면 → `❌ 섹션을 찾을 수 없습니다: {section}`
   - status가 `invalidated` → `❌ 이미 invalidated 상태입니다. debate 불필요.`
   - status가 `draft` → `❌ draft 상태입니다. /sowhat:expand로 먼저 전개하세요.`
5. **전체 모드**: settled 또는 discussing 상태 섹션 수 확인
   - 0개이면 → `❌ debate 가능한 섹션이 없습니다. /sowhat:expand로 섹션을 전개하세요.`
6. `logs/` 및 `logs/debate/` 디렉터리 생성:
   ```bash
   mkdir -p logs/debate
   ```
7. `argument-log.md` 생성 (없으면):
   ```bash
   # 없으면 생성
   echo "# Argument Log" > logs/argument-log.md
   ```

## Debate 브랜치 생성

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```bash
# 단일 섹션
BRANCH="debate/{section}-{YYYYMMDD-HHMM}"

# 전체 모드
BRANCH="debate/global-{YYYYMMDD-HHMM}"

git checkout -b "$BRANCH"
```

브랜치 생성 실패 시:
```
❌ 브랜치 생성 실패: {error}
  이미 존재하면: git branch -D {BRANCH} 후 재실행
```

## 3-에이전트 역할

### Con-Agent (claude-opus-4-6)
- 역할: 섹션을 다층 분석 후 **가장 치명적인 약점 하나**만 골라 공격
- 공격 전 분석 순서 (이 순서대로 점검, 첫 발견 시 우선 공격):
  1. **Warrant 취약점 먼저**: Non-sequitur / Missing link / Circular 중 해당되는가?
  2. **Qualifier Overclaiming**: `definitely` + 약한 근거 / `definitely` + 반론 없음?
  3. **Scheme CQ**: 해당 scheme의 Critical Questions 중 가장 치명적 질문 하나
  4. **Steelman**: 위 세 가지로 공격이 없으면, 섹션에 대한 최강 반론을 독립 생성

- scheme별 Critical Questions:

  | Scheme | Critical Questions |
  |--------|-------------------|
  | authority | 이 권위자가 이 도메인의 진짜 전문가인가? 이해충돌은 없는가? 반대 권위는? |
  | analogy | 두 케이스가 논증의 핵심 측면에서 충분히 유사한가? 차이점이 결정적인가? |
  | cause-effect | 인과 메커니즘이 타당한가? 역인과 가능성은? Confounding variable은? |
  | statistics | 표본이 대표성 있는가? 방법론이 건전한가? 데이터가 현재 시점에 유효한가? |
  | example | 대표 사례인가? 체리피킹이 아닌가? 일반화가 가능한가? |
  | sign | 이 신호가 신뢰할 수 있는 지표인가? 동일 신호에 대한 다른 해석은? |
  | principle | 이 원칙이 이 상황에 적용되는가? 관련 예외 조건은? |
  | consequence | 결과가 현실적인가? 의도치 않은 부작용은? 적용 시간대는? |

- 에스컬레이션: Claim `broken` → Key Argument 도전 → Key Argument `broken` → Thesis 도전
- **공격은 하나만**: 여러 약점을 나열하지 않는다. 가장 치명적인 것 하나에 집중.

### Pro-Agent (claude-sonnet-4-6)
- 역할: Con-Agent의 공격에 **공격의 논리적 약점을 직접 해소하는 방식**으로만 방어
- 방어 성공 기준: 공격이 지적한 구체적 논리 취약점을 직접 해소했는가?
- 방어 순서: Grounds 보강 → Warrant 명시화 → Qualifier 조정 → Scope 제한
- 금지: 단순 재주장 (Claim을 반복하는 것), 주제 전환, 감정적 호소
- 양보 조건: 방어 순서 전체를 소진해도 취약점을 해소할 수 없을 때만

### Research-Agent (claude-sonnet-4-6)
- 역할: Pro-Agent 또는 Con-Agent가 외부 근거를 요청할 때만 활성화
- 도구: WebSearch, WebFetch
- 출력: Grounds 또는 Backing에 삽입 가능한 형식으로 정리
- 한도: 라운드당 최대 2회 검색

## 라운드 구조

각 라운드는 다음 순서로 진행한다:

### Step 1: Con-Agent 공격

1. 섹션 파일의 Warrant, Qualifier, scheme, Grounds, Rebuttal 순서로 점검
2. **Warrant 취약점 우선 확인**:
   - Non-sequitur: Grounds → Claim이 논리적으로 연결되지 않음
   - Missing link: A → C 점프, 중간 단계 없음
   - Circular: Warrant가 Claim을 그대로 반복
3. Warrant 이상 없으면 **Qualifier Overclaiming** 확인:
   - `definitely` + 약한 근거 (인터뷰 1-3건, 사례 1-2개) → 공격
   - `definitely` + Rebuttal 없음 → 공격
4. 위 이상 없으면 **scheme CQ 적용**: scheme의 Critical Questions 중 현재 Grounds/Warrant를 가장 직접적으로 무력화하는 질문 선택
5. 위 이상 없으면 **Steelman**: 섹션의 Rebuttal을 먼저 보지 않고, 독립적으로 이 섹션에 대한 최강 반론 생성. Rebuttal 필드와 대조하여 대응 못한 부분 공격

출력 형식:
```
🔴 Con [라운드 N]
  공격 유형: {Warrant취약 | Qualifier과잉 | SchemesCQ | Steelman}
  공격: {구체적 논리 공격 — 단 하나, 명확하게}
  취약 지점: {Grounds/Warrant/Qualifier/Rebuttal 중 어디가 표적인가}
```

### Step 2: Pro-Agent 방어

Con-Agent의 공격에 응답한다. **공격이 지적한 논리적 약점을 직접 해소해야만 방어 성공**이다.

**방어 성공 (defense)**:
- 공격의 취약 지점을 Grounds 보강 / Warrant 명시화 / Backing 제시로 직접 해소
- 단순 재주장(Claim 반복) 불가
```
🟢 Pro — 방어 성공
  해소 방식: {어떻게 취약점을 직접 해소했는가}
  Rebuttal 업데이트: {섹션 파일 Rebuttal에 추가할 내용}
```

**수정 방어 (concession with modification)**:
- 취약점을 완전히 해소할 수 없으나, Qualifier 축소 또는 Scope 제한으로 공격 범위를 무력화
- Claim이 약화되지만 유효성 유지
```
🟡 Pro — 수정 방어
  수정: {Qualifier/Scope 조정 내용}
  이유: {왜 이 조정으로 공격 범위가 벗어나는가}
```

**완전 양보 (full concession)**:
- Grounds 보강, Warrant 명시화, Qualifier 조정 모두 시도했으나 취약점 해소 불가
```
🔴 Pro — 완전 양보
  소진한 방어: {시도했으나 불충분한 방어들}
  인정: {왜 방어 불가능한가}
```

### Step 3: Research-Agent (조건부)

Pro-Agent 또는 Con-Agent가 다음 표현을 사용할 때만 활성화:
- `"외부 근거 필요"`, `"데이터 필요"`, `"리서치 요청"`

```bash
# WebSearch 실행
# WebFetch로 상위 2개 소스 확인
```

```
🔍 Research — 외부 근거
  검색: {검색어}
  발견: {핵심 데이터 포인트}
  삽입 위치: Grounds 항목 {N} 또는 Backing
```

### Step 4: 오케스트레이터 판정

Pro-Agent의 방어가 공격의 논리적 취약점을 **직접 해소했는가**를 기준으로 판정한다.

| 결과 | 판정 기준 | 섹션 status 변경 |
|------|-----------|------------------|
| `strengthened` | Pro가 공격 취약점을 직접 해소 + Rebuttal 강화됨 | 유지 |
| `modified` | Qualifier/Scope 조정으로 공격 범위를 벗어남 (약화 수용) | 유지 (내용 수정) |
| `weakened` | Pro가 방어했으나 취약점 일부 잔존 — "방어는 했으나 논리 손상" | `needs-revision` |
| `broken` | Pro가 완전 양보 | `invalidated` |
| `thesis-threatened` | Thesis Answer까지 영향 | **즉시 PAUSE** |

**판정 기준 세부:**
- `strengthened` vs `weakened` 경계: Pro가 취약점을 **직접** 해소했는가 vs 다른 논거로 우회했는가
- 우회 방어는 `weakened`로 판정 (공격 지점이 해소되지 않았으므로)
- `modified`는 Pro가 Qualifier/Scope를 좁혀 "그 범위에서는 여전히 참"임을 보인 경우만

### Step 5: 라운드 파일 생성 및 커밋

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`logs/debate/{section}-round-{N}.md` 생성:

```markdown
---
section: {section}
round: {N}
datetime: {current_datetime}
outcome: {strengthened|modified|weakened|broken|thesis-threatened}
branch: {branch_name}
---

## Con-Agent 공격
{공격 내용}

## Pro-Agent 응답
{응답 내용}

## Research (있으면)
{리서치 결과}

## 오케스트레이터 판정
{outcome}: {이유}

## 섹션 변경 사항
- {변경된 필드}: {이전} → {이후}
```

`logs/argument-log.md`에 append:

```markdown
## [{current_datetime}] debate({section}) round-{N}
  Action: {outcome}
  Before: {주요 변경 전 상태}
  After: {주요 변경 후 상태}
```

섹션 파일 업데이트 후 커밋:

```bash
git add {section_file} logs/debate/{section}-round-{N}.md logs/argument-log.md
git commit -m "debate({section}): round-{N} - {outcome}"
```

## 세션 저장

각 라운드 시작 시 `logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: debate
section: {section}
step: round-{N}
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
{이번 라운드 Con-Agent 공격 요약 + 현재 판정 대기 중인지 여부. 예: "round-2 진행 중. Con: Warrant의 인과관계 약점 공격. Pro: 상관관계 데이터로 방어 중. 오케스트레이터 판정 대기"}

## 재개 시 첫 질문
{판정 결과를 적용하고 다음 라운드 시작할 것, 또는 Post-Debate 요약 제시할 것}
```

라운드 완료 후 `step: round-{N}-complete`으로 업데이트.

debate 완료 커밋 직전에 `status: complete`로 업데이트한다.

---

## 에스컬레이션 경로

```
섹션 Claim broken
  → Key Argument 도전 시작
      → Key Argument broken
          → Thesis Answer 도전
              → PAUSE + 인간 보고
```

### Thesis 위기 감지 시

```
⚠️  Thesis 위기 감지

  근거: {무엇이 무너졌고 왜}
  영향: {어떤 섹션들이 invalidated되는가}

  이 debate branch를 어떻게 처리하시겠습니까?
  [1] Thesis 수정 후 계속 (debate branch 유지)
  [2] 섹션만 수정 (에스컬레이션 거부)
  [3] Debate 중단 (branch 삭제)
```

인간의 선택을 기다린다. 응답 없이 진행하지 않는다.

- [1] 선택 → Thesis 핑퐁 시작, `/sowhat:expand` 방식으로 Answer 수정
- [2] 선택 → 에스컬레이션 취소, 섹션 status만 업데이트
- [3] 선택 → `git checkout main && git branch -D {branch}` 실행 후 종료

## 종료 조건 판단

각 라운드 후 종료 여부를 판단한다:

- `--rounds N`: 현재 라운드 수 >= N → 종료
- `--until-stable`: 최근 2라운드 연속으로 `strengthened` → 종료
- `--until-broken`: outcome이 `broken` 또는 `thesis-threatened` → 즉시 종료
- 기본값 (`--rounds 3`): 3라운드 후 종료

## --global 모드

전체 트리를 debate한다. 순서:

1. `needs-revision` 상태 섹션 먼저
2. `discussing` 상태 섹션
3. `settled` 상태 섹션 (공격 강도 낮춤 — Qualifier 검증 위주)
4. thesis 자체 (`--until-broken` 또는 모든 섹션 완료 후)

브랜치: `debate/global-{YYYYMMDD-HHMM}`

각 섹션마다 동일한 라운드 구조를 적용한다. 섹션 하나가 `broken` 되면:
- 해당 섹션의 하위 의존 섹션 `invalidated` 처리
- 다음 섹션으로 이동 (Thesis 위기가 아닌 한)

전체 완료 후 종합 요약 출력.

## Post-Debate 요약 및 인간 결정

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Debate 결과: {section}
  라운드: {N}
  결과: {strengthened | modified | weakened | broken}

  변경사항:
  {변경된 항목과 내용 목록}

  Branch: {branch_name}
  변경 diff:

  [1] main으로 merge (변경 수용)
  [2] cherry-pick (선택적 수용)
  [3] branch 보류 (나중에 결정)
  [4] branch 삭제 (debate 기각)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

인간의 선택에 따라:

**[1] merge 선택**:
```bash
git checkout main
git merge {branch_name} --no-ff -m "debate({section}): merge round results"
```

**[2] cherry-pick 선택**:
인간이 커밋 해시를 지정하거나 라운드 번호를 선택하면:
```bash
git checkout main
git cherry-pick {commit_hash}
```

**[3] 보류 선택**:
```
⏸  Branch {branch_name} 보류됨
  나중에: git checkout {branch_name} 으로 재검토
  또는: /sowhat:debate {section} 으로 새 debate 시작
```

**[4] 삭제 선택**:
```bash
git checkout main
git branch -D {branch_name}
```

```
✅ Debate 완료 (섹션 변경 없음)
```

## 완료 안내

merge 또는 cherry-pick 완료 후:

```
✅ Debate 완료: {section}
  결과: {outcome}
  적용된 변경: {N}건

다음: /sowhat:expand {section} → weakened/broken 섹션 재전개
      /sowhat:challenge → 전체 트리 검증
      /sowhat:settle {section} → 강화된 섹션 완료 선언
```

## 핵심 원칙

- **Warrant 취약점 우선** — Con-Agent는 항상 Warrant Non-sequitur/Missing link/Circular 먼저 점검
- **Steelman 독립 생성** — Rebuttal을 먼저 보지 않고 최강 반론 생성 후 대조
- **공격은 하나만** — 여러 약점 나열 금지, 가장 치명적인 것 하나에 집중
- **우회 방어는 weakened** — 공격 지점을 직접 해소하지 않은 방어는 성공이 아님
- **Pro-Agent 단순 재주장 금지** — Claim 반복은 방어가 아님
- **Claim이 무너져야 한다면 무너뜨린다** — 방어를 위한 방어 없음
- **Research-Agent는 요청 시만 활성화** — 자동으로 검색하지 않는다
- **브랜치는 인간이 결정한다** — 자동 merge 없음
- **Thesis 위기는 즉시 PAUSE** — 임의로 처리하지 않는다
- **에스컬레이션은 단계적** — Claim → Key Argument → Thesis 순서 준수
