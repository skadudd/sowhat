# /sowhat:snapshot — 논증 의미적 스냅샷

<!--
@metadata
checkpoints:
  - type: decision
    when: "restore 실행 전 확인"
config_reads: [layer, sections, snapshots]
config_writes: [snapshots]
continuation:
  primary: "/sowhat:progress"
  alternatives: ["/sowhat:snapshot diff", "/sowhat:revise {section}"]
status_transitions: ["(restore) → needs-revision"]
-->

논증 상태를 의미적 스냅샷으로 캡처하고, 버전 간 논증 진화를 비교한다. `$ARGUMENTS`

워크플로우: **인자 파싱 → 사전 준비 → sub-command 실행**

---

## 인자 파싱

```
/sowhat:snapshot {sub-command} [args]
```

| 인자 패턴 | 동작 |
|-----------|------|
| `"label text"` or `{label}` | 스냅샷 생성 |
| `list` | 목록 출력 |
| `diff {v1} {v2}` | 두 버전 비교 |
| `restore {version} [--section {section}]` | 복원 |
| (없음) | 서브커맨드 선택 UI 표시 (아래 참조) |

### 서브커맨드 선택 UI (인자 없이 실행 시)

`$ARGUMENTS`가 비어있으면 아래 UI를 표시한다:

```
❓ 무엇을 하시겠습니까?

  [1] 현재 상태 스냅샷 저장
  [2] 스냅샷 목록 보기
  [3] 두 버전 비교
  [4] 이전 버전으로 복원
```

[1] 선택 시 → 라벨 입력 요청 후 create 실행
```
❓ 스냅샷 라벨을 입력하세요.
  예) "Initial thesis", "Post-challenge revision"
```

[2] 선택 시 → list 실행

[3] 선택 시 → 두 버전 번호 입력 요청 후 diff 실행
```
❓ 비교할 두 버전을 입력하세요.
  예) v1 v3
```

[4] 선택 시 → 버전 번호 입력 요청 후 restore 실행
```
❓ 복원할 버전 번호를 입력하세요.
  예) v2
```

---

## 사전 준비

1. `planning/config.json` 로드
2. `00-thesis.md` 로드
3. 모든 섹션 파일 로드 (`planning/` 디렉터리의 `{NN}-*.md` 패턴)

---

## Sub-command: 스냅샷 생성 (create)

### 절차

1. 현재 datetime 획득:
   ```bash
   date -u +"%Y-%m-%dT%H:%M:%SZ"
   ```

2. 버전 번호 결정:
   - `snapshots/snapshots-index.json` 읽기
   - 파일 없으면 첫 스냅샷 (v1)
   - 있으면 마지막 버전 + 1

3. `snapshots/` 디렉터리 생성 (없으면):
   ```bash
   mkdir -p snapshots/v{N}
   ```

4. `snapshots/v{N}/snapshot.json` 생성:

```json
{
  "version": "v{N}",
  "label": "{user label}",
  "created": "{datetime}",
  "trigger": "manual",
  "git_commit": "{current HEAD hash}",
  "thesis": {
    "answer": "{full answer text from 00-thesis.md}",
    "key_arguments": ["{KA1}", "{KA2}"]
  },
  "sections": {
    "{section-id}": {
      "status": "{status}",
      "claim": "{full Claim text}",
      "grounds_summary": "{N} grounds: {brief list}",
      "warrant": "{full Warrant text}",
      "qualifier": "{qualifier value}",
      "scheme": "{scheme value}",
      "rebuttal_count": 0,
      "open_questions_count": 0
    }
  },
  "research_state": {
    "total_findings": 0,
    "applied": 0
  }
}
```

**필드 추출 방법:**
- `thesis.answer`: `00-thesis.md`의 Answer 섹션 전문
- `thesis.key_arguments`: `00-thesis.md`의 Key Arguments 목록
- `sections.{id}.claim`: 각 섹션 파일의 `## Claim` 내용
- `sections.{id}.grounds_summary`: Grounds 항목 수 + 한줄 요약
- `sections.{id}.warrant`: `## Warrant` 전문
- `sections.{id}.qualifier`: `## Qualifier` 값
- `sections.{id}.scheme`: `## Scheme` 값
- `sections.{id}.rebuttal_count`: `## Rebuttal` 항목 수
- `sections.{id}.open_questions_count`: `## Open Questions` 항목 수
- `sections.{id}.status`: `planning/config.json`의 해당 섹션 status
- `research_state`: `planning/config.json`의 research 필드에서 추출

5. `snapshots/snapshots-index.json` 업데이트 (없으면 생성):

```json
{
  "versions": [
    {"version": "v1", "label": "...", "created": "...", "trigger": "manual"}
  ],
  "latest": "v{N}"
}
```

6. `planning/config.json`의 `snapshots` 필드 업데이트:

```json
"snapshots": {
  "latest": "v{N}",
  "count": {N},
  "auto_snapshot": true
}
```

7. Git commit:
```bash
git add snapshots/ planning/config.json
git commit -m "snapshot(v{N}): {label}"
```

### 출력

```
✅ 스냅샷 생성: v{N} — "{label}"
  섹션: {settled}/{total} settled
  Commit: {short hash}
```

---

## Sub-command: 목록 (list)

### 절차

`snapshots/snapshots-index.json` 읽기. 파일 없으면 → `❌ 스냅샷이 없습니다. /sowhat:snapshot "label"로 첫 스냅샷을 생성하세요.`

### 출력

```
----------------------------------------
📸 스냅샷 목록

버전    라벨                          생성일              트리거
----------------------------------------
v1      Initial thesis                2026-03-15          manual
v2      Post-challenge revision       2026-03-20          auto:challenge
v3      Added market argument         2026-03-31          auto:add-argument

최신: v3
총 {N}개 스냅샷

**사용:**
  /sowhat:snapshot diff v1 v3
  /sowhat:snapshot restore v2
  /sowhat:snapshot "new label"
----------------------------------------
```

---

## Sub-command: diff

### 절차

1. `snapshots/v{v1}/snapshot.json`과 `snapshots/v{v2}/snapshot.json` 로드
2. 두 파일 중 하나라도 없으면 → `❌ 스냅샷을 찾을 수 없습니다: v{missing}`
3. 필드별 비교 수행

### 출력

```
----------------------------------------
📊 논증 진화: {v1} → {v2}
생성: {v1.created} → {v2.created}

THESIS
  Answer: {UNCHANGED | CHANGED}
  {if changed: show both versions}
  Key Arguments: {+N added, -N removed, M unchanged}

SECTION 변경:
  {section-id} [{v1.status} → {v2.status}]
    Claim: {UNCHANGED | CHANGED}
      {if changed:}
      {v1}: "{old claim}"
      {v2}: "{new claim}"
      변화: {semantic description of change}
    Qualifier: {old} → {new} ({강화|약화|동일})
    Grounds: {+N 추가, -M 제거}
    Rebuttal: {+N 추가}

  {next section...}

{If new sections in v2:}
NEW SECTIONS:
  {section-id} [v2에서 추가]
    Status: {status}
    Claim: "{claim}"

RESEARCH:
  파인딩: {v1.total} → {v2.total} ({diff})
----------------------------------------
```

### Claim 변화 의미 분석

Claim이 변경된 경우, Claude가 자연어로 의미적 차이를 설명한다.

**예시:**
- "정량화를 통한 구체화" (added quantification)
- "범위 축소 (기업 → 스타트업)" (narrowed scope)
- "근본적 방향 전환" (fundamental direction change)
- "조건부 표현 추가" (added conditional)
- "인과 관계 명시화" (made causal relationship explicit)

### Qualifier 변화 판정

| 변화 방향 | 판정 |
|-----------|------|
| `definitely` → `usually` | 약화 |
| `possibly` → `usually` | 강화 |
| 동일 | 동일 |

---

## Sub-command: restore

**위험한 작업** — 전체 안전 프로토콜 적용.

### 절차

1. 대상 스냅샷 로드: `snapshots/v{version}/snapshot.json`
   - 없으면 → `❌ 스냅샷을 찾을 수 없습니다: v{version}`

2. 현재 상태와 대상 스냅샷 diff 표시 (sub-command: diff 형식 사용)

3. 자동 백업 스냅샷 생성:
   - label: `"Pre-restore backup"`
   - trigger: `"auto:pre-restore"`
   - 스냅샷 생성 절차 동일하게 수행

4. **[decision] checkpoint**:
   ```
   ⚠️ 복원 확인

   이 복원을 진행하시겠습니까?
   현재 상태는 v{backup}으로 자동 백업되었습니다.

   [1] 진행
   [2] 취소
   ```

   - [2] 선택 시 → `취소됨. 백업 스냅샷 v{backup}은 유지됩니다.`

### --section {section} 지정 시 (부분 복원)

1. 해당 섹션 파일만 복원:
   ```bash
   git show {snapshot.git_commit}:{section_file_path} > {section_file_path}
   ```
2. 섹션 status를 `needs-revision`으로 변경 (config.json + 파일 frontmatter)
3. 복원된 섹션에 대해 스코프 challenge 실행

### --section 없을 때 (전체 복원)

1. 모든 섹션 파일을 git commit에서 복원:
   ```bash
   git show {snapshot.git_commit}:{section_file} > {section_file}
   ```
2. `planning/config.json`의 섹션 status를 스냅샷에서 복원 후 모두 `needs-revision`으로 설정
3. **복원하지 않는 것:**
   - research findings (`research/` 디렉터리)
   - draft 산출물 (`export/` 디렉터리)
   - 스냅샷 자체 (`snapshots/` 디렉터리)

### Git commit

```bash
git add -A
git commit -m "snapshot: restore from v{N} — {label}"
```

### 출력

```
✅ 복원 완료: v{N} → 현재
  백업: v{backup} (자동 생성)
  복원 섹션: {list}
  상태: 모두 needs-revision (재검증 필요)

다음 액션:
  [1] 차이 확인 (/sowhat:snapshot diff v{backup} v{N})
  [2] 섹션 재검증 (/sowhat:settle {section})
  [3] 전체 상태 확인 (/sowhat:progress)
```

---

## Auto-snapshot 연동

다른 워크플로우에서 자동 스냅샷을 트리거하는 패턴. 아래 시점에서 스냅샷 생성 로직을 호출한다.

| 트리거 시점 | trigger 값 | 자동 label |
|------------|-----------|-----------|
| challenge 실행 전 | `"auto:pre-challenge"` | `"Pre-challenge backup"` |
| finalize-planning 완료 후 | `"auto:finalize-planning"` | `"Finalize planning complete"` |
| finalize 완료 후 | `"auto:finalize"` | `"Finalize complete"` |
| add-argument 추가 후 | `"auto:add-argument"` | `"After add-argument: {argument name}"` |
| restore 실행 전 | `"auto:pre-restore"` | `"Pre-restore backup"` |

### 자동 스냅샷 생성 방법

`planning/config.json`의 `snapshots.auto_snapshot`이 `true`일 때만 실행.

동일한 create 절차를 따르되:
- `trigger` 필드를 위 표의 값으로 설정
- `label`을 위 표의 자동 label로 설정
- Git commit 메시지: `snapshot(v{N}): [auto] {label}`

### 다른 워크플로우에서의 호출 패턴

```
# 자동 스냅샷 호출 (다른 워크플로우 내부에서)
1. config.json의 snapshots.auto_snapshot 확인 (없으면 true 기본값)
2. snapshots/snapshots-index.json에서 다음 버전 번호 결정
3. 현재 논증 상태를 snapshot.json으로 캡처
4. snapshots-index.json 업데이트
5. config.json snapshots 필드 업데이트
6. git add snapshots/ planning/config.json
7. git commit -m "snapshot(v{N}): [auto] {label}"
```

---

## 핵심 원칙

- **의미적 캡처** — git diff가 아닌 논증의 의미(Claim, Warrant, Qualifier 등)를 저장
- **안전한 복원** — restore 전 자동 백업 + 사용자 확인 필수
- **needs-revision 강제** — 복원된 섹션은 반드시 재검증 필요
- **research 보존** — 복원 시에도 리서치 결과는 유지 (시간 투자 보호)
- **자동 스냅샷** — 주요 전환점에서 자동으로 상태 기록
- **Claude 의미 분석** — diff에서 Claim 변화를 자연어로 설명
