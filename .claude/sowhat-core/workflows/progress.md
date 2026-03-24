# /sowhat:progress — 세션 재개 + 현재 상태 확인

<!--
@metadata
checkpoints: []
config_reads: [project, layer, sections, research, last_sync]
config_writes: []
continuation:
  primary: "(동적 — 상태에 따라 결정)"
  alternatives: []
status_transitions: []
-->

이 커맨드는 현재 sowhat 프로젝트 상태를 한눈에 보여주고, 다음 행동을 안내한다.
인수 없음. 연결 재개 또는 새 세션 시작 시 호출한다.

## 사전 검증

`planning/config.json` 로드.
- 파일 없으면: `❌ sowhat 프로젝트가 아닙니다. /sowhat:init으로 초기화하세요.` 종료.

## 데이터 수집

다음을 병렬로 수집:

**1. config 파싱:**
- `project`, `layer`, `last_sync`, `sections` (이름 → issue, status), `research` (count, unreviewed, last_research)

**2. 섹션 파일 로드:**
- `planning/` 또는 프로젝트 루트에서 `*.md` 파일 탐색
- `00-thesis.md`에서 Answer + status 추출
- 각 섹션 파일 frontmatter에서 `status`, `title`, `section` 번호 추출
- 기획 섹션: `00-`~`03-` (또는 `finalize-planning` 전까지 생성된 것들)
- 명세 섹션: `04-actors`, `05-functional-requirements`, `06-data-model`, `07-api-contract`, `08-edge-cases`, `09-acceptance-criteria`

**3. 마지막 작업 감지:**
- `logs/argument-log.md` **마지막 5줄만** 읽기 (파일 전체 로드 금지)
  ```bash
  tail -n 5 logs/argument-log.md 2>/dev/null
  ```
- 형식: `[datetime] {section}: {field} — {내용}` 추출
- relative time 계산 (예: "2시간 전", "어제", "3일 전")

**4. 활성 debate 브랜치 탐지:**
```bash
git branch 2>/dev/null | grep "debate/"
```
- `debate/` 접두사로 시작하는 브랜치 목록 수집

**5. 미커밋 변경사항 탐지:**
```bash
git status --porcelain 2>/dev/null
```
- 출력이 비어있지 않으면 미커밋 변경사항 있음

**6. Open Questions 집계:**
- 각 섹션 파일의 `## Open Questions` 섹션에서 미해결 항목(체크박스 미완료 또는 일반 불릿) 개수 합산

## 상태 계산

**진행률 바 생성 함수:**
- 총 섹션 수: `layer`에 따라
  - `planning`: 기획 섹션 수 (00 제외, 01부터 카운트)
  - `spec` / `finalized`: 기획 섹션 + 명세 섹션(04~09) 합산
- settled 수: status가 `settled`인 섹션 수 (00-thesis 포함)
- 진행률 바: `█`(완료) + `░`(미완료), 10칸 기준
  - 예: 6/10이면 `[██████░░░░]`

**레이어별 섹션 상태 이모지:**
- `settled` → ✅
- `discussing` → 🟡
- `draft` → ⬜
- `needs-revision` → 🔴
- `invalidated` → ⚫
- 파일 없음(생성 전) → ⬜

**기획 섹션 상태 문자열:**
- 01~03 (또는 실제 기획 섹션) 이모지를 공백으로 연결
- 예: `✅✅🔴⬜`

**명세 섹션 상태 문자열:**
- 04~09 이모지를 공백으로 연결
- layer가 `planning`이면 전부 ⬜ (미생성)

**논증 강도 계산** (`references/strength-scoring.md` 참조):
- 각 settled/discussing 섹션의 strength score 계산
- 전체 tree score 계산
- 최약 고리(weakest link) 식별
- 가장 약한 차원(근거/논리/방어/보정) 식별

**주의 필요 항목:**
- `needs-revision` 상태 섹션 → debate 권장
- `invalidated` 상태 섹션이 있고 상위 섹션이 settled이면 → 재검토 필요 알림
- Open Questions 총 건수 > 0
- 논증 강도 60 미만 섹션 → 근거 보강 권장

**리서치 상태:**
- `research.unreviewed` > 0이면 표시
- Tier 분포 표시 (T1: N, T2: N, T3: N, T4: N)

## 다음 권장 액션 결정 로직

우선순위 순으로 평가하여 최대 5개 액션 도출:

1. **미커밋 변경사항** (최우선): git 저장 옵션 제시
2. **needs-revision 섹션** 존재: `/sowhat:debate {section}` 제안 (첫 번째 needs-revision 섹션)
3. **미검토 리서치** (unreviewed > 0): `/sowhat:research review` 제안
4. **레이어 진행 가능 여부:**
   - layer가 `planning`이고 모든 기획 섹션이 settled → `/sowhat:finalize-planning` 제안
   - layer가 `spec`이고 모든 명세 섹션(04~09)이 settled → `/sowhat:draft` 또는 `/sowhat:finalize` 제안
5. **다음 미완성 섹션** (draft/discussing 중 가장 작은 번호): `/sowhat:expand {section}` 제안
6. **다음 명세 섹션** (layer가 spec이고 unsettled 명세 섹션): `/sowhat:spec {section}` 제안
7. **모두 settled** + challenge 미실행: `/sowhat:challenge` 제안
8. **모두 settled** + challenge 통과 기록 있음: `/sowhat:draft` 제안

challenge 실행 여부 판단: `logs/argument-log.md`에 "challenge: passed" 또는 `logs/session-*.md`에서 challenge 완료 기록 확인.

## 출력 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 {project}
   Layer: {planning|spec|finalized}  |  마지막 업데이트: {relative time from last_sync}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Thesis
   "{Answer 한 줄 — 50자 초과 시 말줄임 처리}"  [{status}]

📊 진행 현황
   [{진행률 바}] {settled_count}/{total_count} 섹션 settled

   기획: {기획_이모지_문자열}  ({기획_settled}/{기획_total})
   명세: {명세_이모지_문자열}  ({명세_settled}/6{, layer가 planning이면 ", 아직 생성 전"})
```

주의 항목이 있으면:
```

⚠️  주의 필요
{needs-revision 섹션 목록:}
   - {N}-{section}: needs-revision (debate 권장)
{invalidated 재검토 필요 시:}
   - {N}-{section}: invalidated — 상위 논거 revision 후 재검토 필요
{open questions > 0:}
   - Open Questions: {N}건 미해결
```

논증 강도 표시 (settled/discussing 섹션이 1개 이상이면):
```

💪 논증 강도: {final_tree_score}/100 [{등급}]
   [{bar}]

   섹션별:
   {section_name}  {score}/100 {emoji}
   {section_name}  {score}/100 {emoji}

   ⚠️ 최약 고리: {weakest_section} ({score}/100) — {약한 이유}
```

리서치 항목이 있으면:
```

🔬 리서치
   미검토 파인딩: {N}건
   출처 분포: T1: {N} | T2: {N} | T3: {N} | T4: {N}
```

만료된 파인딩이 있으면 (stale_count > 0):
```

⚠️  만료된 파인딩: {stale_count}건
   영향 받는 섹션: {stale 파인딩의 relevant_sections 중복 제거 목록}
   → /sowhat:research review 로 재검토하세요
```

활성 debate 브랜치가 있으면:
```

🌿 진행 중인 Debate Branch
{브랜치 목록:}
   {branch-name} (미merge)
```

미커밋 변경사항이 있으면:
```

⚠️  미커밋 변경사항 있음
```

마지막 작업 기록이 있으면:
```

🕐 마지막 작업: {section} — {field} ({relative time})
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 권장 액션:
```

**미커밋 변경사항 있을 때 (최우선 삽입):**
```
  [S] git add -A && git commit -m "wip: save session state"
      또는 [X] 무시하고 계속
```

**활성 debate 브랜치 있을 때 (브랜치별):**
```
  [M] debate/{branch} merge  [D] debate/{branch} delete
```

**권장 액션 목록 (번호 순):**
```
  [1] /sowhat:{command} {arg}     ← {사유 한 줄}
  [2] /sowhat:{command} {arg}     ← {사유 한 줄}
  [3] /sowhat:{command} {arg}     ← {사유 한 줄}
  [4] /sowhat:{command} {arg}     ← {사유 한 줄}
  [5] /sowhat:{command} {arg}     ← {사유 한 줄}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 출력 예시

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 my-saas-product
   Layer: spec  |  마지막 업데이트: 3시간 전
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Thesis
   "B2B SaaS 구독 모델로 중소기업 HR 자동화 시장을 선점한다"  [settled]

📊 진행 현황
   [████████░░] 8/10 섹션 settled

   기획: ✅✅✅🔴  (3/4)
   명세: ✅🟡⬜⬜⬜⬜  (1/6, 1 discussing)

⚠️  주의 필요
   - 03-competition: needs-revision (debate 권장)
   - Open Questions: 3건 미해결

🔬 리서치
   미검토 파인딩: 2건

🕐 마지막 작업: 05-functional-requirements — Acceptance Criteria (어제)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 권장 액션:

  [1] /sowhat:debate 03-competition     ← needs-revision 해결
  [2] /sowhat:research review           ← 미검토 리서치 2건
  [3] /sowhat:spec 06-data-model        ← 다음 미완성 명세 섹션
  [4] /sowhat:challenge                 ← 전체 논증 검증
  [5] /sowhat:map                       ← 전체 구조 시각화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 상호작용 처리

사용자가 출력 후 번호를 입력하면:

- `[S]` 또는 "S": git 저장 커밋 실행
  ```bash
  git add -A && git commit -m "wip: save session state"
  ```
  성공 시: `✅ 저장 완료` / 실패 시: `❌ git 커밋 실패: {오류}`

- `[X]` 또는 "X": 미커밋 무시하고 계속 (아무 동작 없음, 다음 입력 대기)

- `[M]` 또는 "M {브랜치명}": debate 브랜치 merge 안내
  ```
  debate/{branch} merge 절차:
    git checkout {현재 브랜치}
    git merge debate/{branch}
  충돌 발생 시 수동 해결이 필요합니다.
  ```

- `[D]` 또는 "D {브랜치명}": debate 브랜치 삭제 확인
  ```
  ⚠️  debate/{branch}를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
    [Y] 삭제  [N] 취소
  ```
  [Y]: `git branch -d debate/{branch}` 실행

- `[1]`~`[5]`: 해당 커맨드 실행 안내 (Claude Code가 직접 해당 /sowhat: 커맨드를 실행)

- 번호 외 입력: 무시하고 `입력값을 인식할 수 없습니다. [1]-[5] 또는 [S], [X], [M], [D]를 입력하세요.`

## 엣지 케이스

- `00-thesis.md` 없음: thesis 줄을 `(00-thesis.md 없음 — /sowhat:init 실행 필요)`로 표시
- 섹션 파일이 아예 없음: `기획: (섹션 없음)` 표시, 액션 [1]은 `/sowhat:init`
- `logs/argument-log.md` 없음: "마지막 작업" 줄 생략
- git 명령 실패 (git 없음 등): debate 브랜치, 미커밋 섹션 생략하고 나머지 출력
- `last_sync` 파싱 불가: "마지막 업데이트: 알 수 없음"
- layer가 `finalized`이고 모든 섹션 settled: 액션 목록을
  ```
    [1] /sowhat:draft --output all    ← 최종 문서 재생성
    [2] /sowhat:challenge             ← 최종 검증 재실행
  ```
  로 단순화
- research 디렉터리 없음: 리서치 섹션 생략
- 섹션 번호가 `config.json`에는 있지만 파일이 없음: 해당 섹션을 ⬜(파일 없음)로 표시
