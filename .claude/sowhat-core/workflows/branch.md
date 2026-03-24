# /sowhat:branch — 논증 분기 탐색

<!--
@metadata
checkpoints:
  - type: decision
    when: "분기 이름 설정"
  - type: decision
    when: "분기 채택 (merge) 결정"
config_reads: [sections]
config_writes: []
continuation:
  primary: "/sowhat:expand {section} (새 분기에서)"
  alternatives: ["/sowhat:branch compare {section}"]
status_transitions: []
-->

이 커맨드는 하나의 섹션에서 대안적 논증 경로를 생성·비교·병합한다. Git 브랜치처럼 현재 작업을 보존하면서 다른 방향의 논증을 탐색할 수 있다. `$ARGUMENTS`에 서브커맨드와 섹션/브랜치 이름이 전달된다.

## 핵심 개념

- **Branch**: 섹션의 Toulmin 콘텐츠를 복제한 대안적 논증 경로
- **저장 위치**: `branches/{section}/{branch-name}/` 디렉터리
- **Branch 파일**: 섹션 `.md` 파일의 복사본 (대안 콘텐츠 포함)
- **Branch 메타데이터**: `branches/{section}/branches.json`

---

## 인자 파싱

`$ARGUMENTS`를 파싱하여 서브커맨드를 결정한다:

| 패턴 | 서브커맨드 | 예시 |
|------|-----------|------|
| `{section}` | **create** | `/sowhat:branch 02-solution` |
| `compare {section}` | **compare** | `/sowhat:branch compare 02-solution` |
| `merge {section} {branch}` | **merge** | `/sowhat:branch merge 02-solution saas-model` |
| `delete {section} {branch}` | **delete** | `/sowhat:branch delete 02-solution opensource-model` |

---

## 사전 검증 (모든 서브커맨드 공통)

1. `planning/config.json` 로드 → `layer`가 `"planning"`인지 확인
   - `"spec"` 또는 `"finalized"`이면: `❌ 이미 명세/완료 레이어입니다. 분기 생성 불가.`
2. 대상 섹션 파일 확인:
   - `$ARGUMENTS`에서 섹션 식별자 추출
   - 숫자면 → `{N}-*.md` 패턴으로 검색
   - 이름이면 → `*-{name}.md` 패턴으로 검색
   - 없으면 → `❌ 섹션을 지정하세요. 예: /sowhat:branch 02-solution`
3. 섹션 상태 확인:
   - `settled` → `❌ settled 상태입니다. /sowhat:challenge 후 needs-revision이 되어야 분기 가능합니다.`
   - `invalidated` → `❌ invalidated 상태입니다.`
   - `draft`, `discussing`, `needs-revision` → 진행
4. 로그/브랜치 디렉터리 확인:
   ```bash
   mkdir -p branches/{section} logs
   ```

---

## 서브커맨드 1: create (분기 생성)

### 절차

1. 기존 `branches/{section}/branches.json` 확인
   - 있으면 기존 브랜치 목록 로드
   - 없으면 새로 생성

2. **현재 브랜치 이름 질문** (branches.json이 없는 경우):
   ```
   ┌─── 분기 생성: {section} ─────────────────────────┐
   │ 현재 논증을 보존하면서 대안 경로를 탐색합니다.     │
   │                                                    │
   │ 현재 논증의 이름을 지정하세요:                      │
   │ (예: saas-model, conservative-estimate, plan-a)     │
   └────────────────────────────────────────────────────┘
   ```

3. 사용자가 현재 브랜치 이름을 제공하면:
   - `branches/{section}/{current-name}/` 디렉터리 생성
   - 현재 섹션 파일을 `branches/{section}/{current-name}/{section}.md`로 복사

4. **새 브랜치 이름 질문**:
   ```
   새로운 대안 논증의 이름을 지정하세요:
   (예: opensource-model, aggressive-estimate, plan-b)
   ```

5. 사용자가 새 브랜치 이름을 제공하면:
   - `branches/{section}/{new-name}/` 디렉터리 생성
   - 현재 섹션 파일을 `branches/{section}/{new-name}/{section}.md`로 복사
   - 새 브랜치 파일의 Claim, Grounds, Warrant, Backing, Qualifier, Rebuttal을 초기화 (비움)
   - `thesis_argument`와 `stasis`, `scheme`은 유지
   - status를 `draft`로 변경

6. `branches/{section}/branches.json` 생성/갱신:
   ```json
   {
     "section": "{section}",
     "branches": [
       {
         "name": "{current-name}",
         "created": "{ISO8601}",
         "status": "active",
         "qualifier": "{현재 qualifier 값}",
         "strength": null
       },
       {
         "name": "{new-name}",
         "created": "{ISO8601}",
         "status": "active",
         "qualifier": null,
         "strength": null
       }
     ],
     "original": "{current-name}"
   }
   ```

7. `logs/session.md` 갱신 — `active_branch` 필드 추가:
   ```markdown
   ---
   command: branch
   section: {section}
   active_branch: {new-name}
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   branch 생성 완료 — {section}에서 {new-name} 브랜치 활성화됨.
   /sowhat:expand {section}으로 새 브랜치를 전개하세요.

   ## 재개 시 첫 질문
   새 브랜치 '{new-name}'의 Claim을 어떤 방향으로 잡으시겠습니까?
   ```

8. 완료 출력:
   ```
   ✅ 분기 생성 완료: {section}

   - 원본 보존: {current-name}
   - 새 브랜치: {new-name} (active)

   다음: /sowhat:expand {section} 으로 새 브랜치를 전개하세요.
   ```

### 세션 관리

- 브랜치가 활성화되면 `logs/session.md`에 `active_branch` 필드가 기록된다.
- expand/debate/settle은 활성 브랜치 파일(`branches/{section}/{active-branch}/{section}.md`)을 대상으로 동작한다.
- challenge는 브랜치된 섹션을 건너뛴다 (메인 파일의 `settled`/`discussing` 상태만 검사).

### 브랜치 전환

이미 branches.json이 존재하는 상태에서 create를 실행하면:
1. 새 브랜치 이름만 질문
2. 현재 활성 브랜치의 작업물을 저장
3. 새 브랜치 생성 후 활성화

---

## 서브커맨드 2: compare (분기 비교)

### 절차

1. `branches/{section}/branches.json` 로드
   - 없으면: `❌ {section}에 분기가 없습니다. /sowhat:branch {section}으로 먼저 생성하세요.`

2. 각 브랜치의 섹션 파일 로드:
   - `branches/{section}/{branch-name}/{section}.md`

3. 각 브랜치의 강도 점수 계산 (`strength-scoring.md` 참조):
   - 근거 강도 (Evidence): Grounds 수 × Tier 가중치 × 유형 가중치
   - 논리 연결 (Logic): Warrant 명확도 + Scheme CQ 대응
   - 반박 커버리지 (Defense): Rebuttal 수 + Steelman 대응
   - Qualifier 정합성 (Calibration): 주장 수준과 근거 수준 일치도

4. `branches.json`에 계산된 `qualifier`와 `strength` 값을 갱신

5. 비교 결과 출력:
   ```
   ━━━ Branch 비교: {section} ━━━

                    {branch-1}      {branch-2}      ...
   Claim:          "{요약}"         "{요약}"
   Qualifier:      {값} ({등급})    {값} ({등급})
   Strength:       {점수}/100      {점수}/100
   Grounds:        {N}개 ({Tier})   {N}개 ({Tier})
   Rebuttal:       {N}개            {N}개

   ✅ 추천: {최고 점수 브랜치} (강도 우위 +{차이})
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

6. 점수 차이가 10 미만이면 추천 대신:
   ```
   ⚠️ 강도 차이가 미미합니다 ({차이}점). 추가 debate를 권장합니다.
   ```

7. 비교 후 행동 제안:
   ```
   다음 선택:
   - /sowhat:branch merge {section} {추천 브랜치} — 추천 브랜치를 채택
   - /sowhat:debate {section} — 활성 브랜치를 더 강화
   - /sowhat:branch {section} — 새 대안 추가
   ```

---

## 서브커맨드 3: merge (분기 병합)

### 절차

1. `branches/{section}/branches.json` 로드
   - 없으면: `❌ {section}에 분기가 없습니다.`

2. 지정된 `{branch-name}`이 branches.json에 있는지 확인
   - 없으면: `❌ '{branch-name}' 브랜치를 찾을 수 없습니다. 존재하는 브랜치: {목록}`

3. **confirm-merge Checkpoint** — 인간 승인을 받는다:
   ```
   ┌─── confirm-merge ──────────────────────────────┐
   │ {branch-name}을 {section}의 메인 논증으로       │
   │ 채택합니다.                                     │
   │                                                  │
   │ 승인 브랜치: {branch-name} ({strength}/100)      │
   │ 보관 브랜치: {나머지 목록}                        │
   │                                                  │
   │ 보관 브랜치의 Rebuttal이 승인 브랜치에            │
   │ 추가 반론으로 제안됩니다.                         │
   │                                                  │
   │ 진행하시겠습니까? (y/n)                           │
   └──────────────────────────────────────────────────┘
   ```

4. 승인 시:
   a. 선택된 브랜치 파일로 메인 섹션 파일을 교체:
      - `branches/{section}/{branch-name}/{section}.md` → `planning/{section}.md`
   b. 패배 브랜치들의 Rebuttal 수집:
      - 각 패배 브랜치의 Rebuttal 내용을 추출
      - 승인 브랜치의 Rebuttal 필드에 이미 없는 항목만 추가 제안:
        ```
        패배 브랜치에서 수집한 추가 반론:
        - [{패배 브랜치명}] {rebuttal 내용 1}
        - [{패배 브랜치명}] {rebuttal 내용 2}

        이 반론들을 승인 브랜치의 Rebuttal에 추가하시겠습니까? (y/n/선택)
        ```
   c. 사용자 선택에 따라 Rebuttal 추가
   d. 패배 브랜치를 아카이브:
      - `branches/{section}/{branch-name}/` → 유지 (참조용)
      - branches.json에서 해당 브랜치의 status를 `"archived"`로 변경
   e. 승인 브랜치의 status를 `"merged"`로 변경
   f. `logs/session.md`에서 `active_branch` 필드 제거

5. 완료 출력:
   ```
   ✅ 병합 완료: {section}

   - 채택: {branch-name}
   - 보관: {나머지 브랜치 목록}
   - 추가된 반론: {N}개

   다음: /sowhat:settle {section} 또는 /sowhat:debate {section}
   ```

---

## 서브커맨드 4: delete (분기 삭제)

### 절차

1. `branches/{section}/branches.json` 로드
   - 없으면: `❌ {section}에 분기가 없습니다.`

2. 지정된 `{branch-name}` 확인
   - 없으면: `❌ '{branch-name}' 브랜치를 찾을 수 없습니다.`

3. original 브랜치인지 확인:
   - `branches.json`의 `original` 값과 같으면: `❌ 원본 브랜치는 삭제할 수 없습니다. /sowhat:branch merge로 다른 브랜치를 채택한 후 삭제하세요.`

4. 활성 브랜치 수 확인:
   - 삭제 후 남는 active 브랜치가 1개뿐이면:
     ```
     ⚠️ 삭제 후 브랜치가 1개만 남습니다. 자동으로 merge를 실행합니다.
     ```
     → merge 서브커맨드를 남은 브랜치로 자동 실행

5. **confirm-delete Checkpoint**:
   ```
   '{branch-name}' 브랜치를 삭제합니다. 복구할 수 없습니다.
   진행하시겠습니까? (y/n)
   ```

6. 승인 시:
   - `branches/{section}/{branch-name}/` 디렉터리 삭제
   - branches.json에서 해당 항목 제거
   - 활성 브랜치가 삭제된 브랜치였으면 `original`로 전환

7. 완료 출력:
   ```
   ✅ 삭제 완료: {branch-name}

   남은 브랜치: {목록}
   활성 브랜치: {active-branch}
   ```

---

## expand/debate/settle과의 통합

### 브랜치 활성 시 동작 변경

`logs/session.md`에 `active_branch` 필드가 있으면:

1. **expand**: `branches/{section}/{active-branch}/{section}.md`를 대상으로 전개
2. **debate**: 활성 브랜치 파일을 대상으로 공격·방어
3. **settle**: 활성 브랜치 파일을 대상으로 검증 (단, settle 성공 시 자동 merge 제안)
4. **challenge**: 브랜치된 섹션은 건너뜀 — `settled`/`discussing` 상태의 메인 파일만 검사

### 배너 표시

브랜치가 활성화된 상태에서는 컨텍스트 배너에 브랜치 정보를 추가한다:

```
┌─── 진행 컨텍스트 ──────────────────────────────────────┐
│ Thesis: "{thesis_answer}"                              │
│ 이 섹션 논거: "{thesis_argument}"                       │
│ 🔀 브랜치: {active-branch} ({section})                  │
│ 스텝 {N}/9 — {스텝명}                                  │
└────────────────────────────────────────────────────────┘
```

---

## 세션 프로토콜 연동

- `logs/session.md`의 `active_branch` 필드로 활성 브랜치를 추적한다.
- resume 시 `active_branch`가 있으면 해당 브랜치 파일을 자동으로 로드한다.
- 브랜치 전환 시 현재 작업 상태를 session.md에 저장한 후 전환한다.
