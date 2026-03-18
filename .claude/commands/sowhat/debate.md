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

### Pro-Agent (claude-sonnet-4-6)
- 역할: 현재 Claim/Thesis를 **최선을 다해** 방어
- 사용 전략: Toulmin 구조 전체 동원 (Grounds → Warrant → Backing → Qualifier)
- 양보 조건: 논리적으로 불가능한 경우에만, 그리고 반드시 Qualifier 또는 Scope 조정과 함께
- 금지: 논리적 근거 없는 양보

### Con-Agent (claude-opus-4-6)
- 역할: 섹션의 `scheme` 필드에 맞는 Walton Critical Questions로 공격
- scheme별 공격 전략:
  - `authority`: 권위의 진정성·관련성 공격, 반대 권위 제시
  - `analogy`: 유사성의 정도 공격, 차이가 Claim을 무효화하는지 검증
  - `cause-effect`: 인과 메커니즘 공격, 교란 변수 제시
  - `statistics`: 표본 대표성·방법론 공격
  - `example`: 사례의 대표성 공격, 체리피킹 여부 검증
  - `sign`: 지표의 신뢰성 공격, 대안 설명 제시
  - `principle`: 원칙의 적용 가능성 공격, 예외 상황 제시
  - `consequence`: 결과의 현실성 공격, 의도치 않은 부작용 제시
- 에스컬레이션: Claim 무너지면 → Key Argument 도전 → Key Argument 무너지면 → Thesis 도전

### Research-Agent (claude-sonnet-4-6)
- 역할: Pro-Agent 또는 Con-Agent가 외부 근거를 요청할 때만 활성화
- 도구: WebSearch, WebFetch
- 출력: Grounds 또는 Backing에 삽입 가능한 형식으로 정리
- 한도: 라운드당 최대 2회 검색

## 라운드 구조

각 라운드는 다음 순서로 진행한다:

### Step 1: Con-Agent 공격

1. 섹션의 `scheme` 필드 확인
2. 해당 scheme의 Walton Critical Questions 적용
3. 현재 Grounds, Warrant, Backing의 약점 식별
4. **가장 강한 공격 하나**만 선택하여 제시

출력 형식:
```
🔴 Con [라운드 N] — {scheme} scheme 공격
  Critical Question: {Walton CQ 구체적 질문}
  공격: {구체적 논리 공격}
  근거: {Grounds/Warrant/Backing 중 어디가 취약한가}
```

### Step 2: Pro-Agent 방어

Con-Agent의 공격에 응답한다. 응답 유형:

**방어 성공 (defense)**:
- Warrant 또는 Backing으로 반박
- Rebuttal 섹션에 이 반박을 추가
```
🟢 Pro — 방어 성공
  반박: {논리적 근거}
  Rebuttal 업데이트: {구체적 내용}
```

**수정 방어 (concession with modification)**:
- Qualifier 축소 또는 Scope 제한으로 방어
- Claim이 약화되지만 유효성 유지
```
🟡 Pro — 수정 방어
  수정: {Qualifier/Scope 조정 내용}
  이유: {왜 이 조정으로 공격을 무력화하는가}
```

**완전 양보 (full concession)**:
- 논리적으로 더 이상 방어 불가능
- Claim을 invalidated 처리
```
🔴 Pro — 완전 양보
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

### Step 4: 오케스트레이터 평가

라운드 결과를 다음 중 하나로 판정한다:

| 결과 | 조건 | 섹션 status 변경 |
|------|------|------------------|
| `strengthened` | 방어 성공, Rebuttal 강화됨 | 유지 |
| `modified` | Qualifier/Scope 축소 | 유지 (내용 수정) |
| `weakened` | 방어했으나 논리적 손상 | `needs-revision` |
| `broken` | 완전 양보 | `invalidated` |
| `thesis-threatened` | Thesis Answer까지 영향 | **즉시 PAUSE** |

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

- **Claim이 무너져야 한다면 무너뜨린다** — 방어를 위한 방어 없음
- **scheme별 CQ 적용 필수** — 일반 공격이 아닌 논증 구조 특화 공격
- **Research-Agent는 요청 시만 활성화** — 자동으로 검색하지 않는다
- **브랜치는 인간이 결정한다** — 자동 merge 없음
- **Thesis 위기는 즉시 PAUSE** — 임의로 처리하지 않는다
- **에스컬레이션은 단계적** — Claim → Key Argument → Thesis 순서 준수
