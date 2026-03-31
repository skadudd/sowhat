# /sowhat:add-argument — 새 Key Argument 추가 + 섹션 자동 생성

<!--
@metadata
checkpoints:
  - type: decision
    when: "새 Key Argument 확정"
  - type: human-input
    when: "KA 텍스트 입력"
config_reads: [layer, sections, project]
config_writes: [sections]
continuation:
  primary: "/sowhat:expand {new-section}"
  alternatives: ["/sowhat:progress", "/sowhat:snapshot 'Added KA: {name}'"]
status_transitions: ["(none) → draft"]
-->

thesis에 새 Key Argument를 추가하고, 대응 섹션 파일·config·GitHub Issue·thesis 체크리스트를 자동 스캐폴딩한다. `$ARGUMENTS`

워크플로우: **인자 파싱 → 사전 준비 → 현재 구조 출력 → KA 입력 → 검증 → 섹션 생성 → thesis 업데이트 → config 업데이트 → GitHub Issue → Git Commit → Auto-snapshot → 완료 안내**

---

## 인자 파싱

```
/sowhat:add-argument [{KA text}]
```

| 인자 | 의미 |
|------|------|
| `{KA text}` | 추가할 Key Argument 텍스트 (생략하면 대화로 수집) |

---

## 사전 준비

1. `planning/config.json` 로드
2. `00-thesis.md` 로드
3. Layer 확인:
   - `"spec"` or `"finalized"` → `❌ 현재 레이어: {layer}. planning 레이어에서만 논거를 추가할 수 있습니다. /sowhat:revise로 기존 논거를 수정하세요.`
4. Spec 섹션 존재 확인:
   - `planning/04-*.md` 파일이 존재하면 → `❌ 명세 섹션이 이미 존재합니다. finalize-planning 이후에는 논거를 추가할 수 없습니다.`
5. 현재 섹션 목록 추출 (planning layer sections만: 01~03 범위)
6. `logs/session.md` 저장:
   ```markdown
   ---
   command: add-argument
   section: (new)
   step: preparation
   status: in_progress
   saved: {current_datetime}
   ---
   ```

---

## 단계 1: 현재 논증 구조 출력

00-thesis.md에서 Answer와 Key Arguments를 추출하여 표시한다.

```
----------------------------------------
> 현재 Thesis

📌 Answer
  {Answer 전문}

📋 Key Arguments ({N}개)
  [x] {KA1} → 01-{name}.md [{status}]
  [x] {KA2} → 02-{name}.md [{status}]
  [ ] {KA3} → 03-{name}.md [{status}]
----------------------------------------
```

각 KA의 status는 config.json의 sections에서 가져온다.

---

## 단계 2: 새 Key Argument 입력

인자로 KA text가 전달되었으면 바로 사용한다.

없으면 대화로 수집:

```
❓ 추가할 Key Argument를 입력하세요.

  Answer를 지지하는 새로운 논거를 한 문장으로 표현해주세요.
  (기존 논거와 겹치지 않는 독립적인 관점이어야 합니다)
```

사용자 입력을 대기한다.

---

## 단계 3: 검증

### 3-1. So What 테스트

새 KA가 thesis Answer를 직접 지지하는지 판단한다.

- Answer: `{Answer 전문}`
- 새 KA: `{new KA text}`

**지지 관계가 불명확하면:**

```
⚠️ 이 논거가 Answer를 직접 지지하지 않는 것으로 보입니다.

  Answer: {Answer 요약}
  새 KA: {new KA text}

  연결 고리를 설명해주시겠습니까?
```

사용자의 설명을 받은 후 진행 여부를 결정한다. 설명이 납득 가능하면 진행, 아니면 재입력을 요청한다.

**So What 테스트 통과 불가 시 → 진행 불가.** 사용자에게 KA 재작성을 요청한다.

### 3-2. MECE 검사

기존 KA들과 새 KA의 의미적 중복을 확인한다.

중복 발견 시:

```
⚠️ MECE 경고: 기존 논거와 부분적으로 겹칩니다.

  기존: "{existing KA}" (0{N}-{name})
  신규: "{new KA}"
  겹침: {겹치는 영역 설명}

[1] 그래도 추가 (독립 논거로 진행)
[2] 수정 후 재시도
[3] 취소
```

- [1] → 경고를 기록하고 진행
- [2] → 단계 2로 돌아감
- [3] → 워크플로우 종료

중복 없으면 그대로 진행.

### 3-3. 구조적 균형 검사

현재 KA 수가 3개 이상이면:

```
ℹ️  현재 {N}개 논거 보유. 추가하면 {N+1}개.
    논거가 많으면 구조가 복잡해집니다. 계속하시겠습니까?

[1] 계속 진행
[2] 취소
```

3개 미만이면 생략.

---

## 단계 4: 섹션 생성

1. 다음 섹션 번호 결정: 기존 planning 섹션 중 최대 번호 + 1 (2자리 패딩)
2. 섹션 이름을 KA에서 추출 (kebab-case, 영문, 핵심 키워드 2-3개)
3. 섹션 파일 생성: `planning/{NN}-{name}.md`

섹션 템플릿:

```markdown
---
thesis_argument: "{new KA text}"
status: draft
scheme: ""
qualifier: ""
version: 1
created: {current_datetime}
updated: {current_datetime}
---

# {NN}-{name}

## Claim



## Grounds



## Warrant



## Backing



## Rebuttal



## Open Questions

- 이 논거의 핵심 증거는 무엇인가?
```

`{current_datetime}`은 `date -u +"%Y-%m-%dT%H:%M:%SZ"` 명령으로 얻는다.

---

## 단계 5: Thesis 업데이트

`00-thesis.md`의 Key Arguments 체크리스트 마지막에 새 항목을 추가한다:

```
- [ ] {new KA text} → {NN}-{name}.md
```

기존 체크리스트 형식을 따른다. `- [x]` 또는 `- [ ]` 패턴을 찾아 마지막 항목 뒤에 삽입.

---

## 단계 6: Config 업데이트

`planning/config.json`의 `sections` 객체에 새 항목을 추가한다:

```json
"{NN}-{name}": { "issue": null, "status": "draft" }
```

---

## 단계 7: GitHub Issue 생성

```bash
remote_url=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$remote_url" == *"automazeio/ccpm"* ]] || [[ "$remote_url" == *"automazeio/ccpm.git"* ]]; then
  echo "❌ ERROR: CCPM 템플릿 저장소에는 이슈를 생성할 수 없습니다."
  # Issue 생성 건너뜀
else
  REPO=$(echo "$remote_url" | sed 's|.*github.com[:/]||' | sed 's|\.git$||')
  [ -z "$REPO" ] && REPO="user/repo"
  ISSUE_NUM=$(gh issue create --repo "$REPO" \
    --title "[sowhat] {NN}-{name}: {KA text 요약}" \
    --body "## Key Argument

{new KA text}

## Toulmin Fields

- Claim: (미작성)
- Grounds: (미작성)
- Warrant: (미작성)

## Status

draft — /sowhat:expand {NN}으로 전개 필요" \
    --label "sowhat,draft" 2>&1 | grep -o '[0-9]*$')
fi
```

Issue 번호를 `planning/config.json`의 해당 섹션 `issue` 필드에 업데이트:

```json
"{NN}-{name}": { "issue": {ISSUE_NUM}, "status": "draft" }
```

gh 명령 실패 시: `⚠️ GitHub Issue 생성 실패. 나중에 /sowhat:sync로 동기화하세요.` — 워크플로우는 계속 진행.

---

## 단계 8: Git Commit

```bash
git add planning/{NN}-{name}.md 00-thesis.md planning/config.json
git commit -m "add-argument({NN}-{name}): {KA text 요약}"
```

---

## 단계 9: Auto-snapshot (선택)

config.json에 `snapshots` 필드가 있고 `auto_snapshot: true`이면:

1. 스냅샷 생성 로직 실행 (snapshot workflow의 create sub-command 참조)
2. label: `"Added KA: {name}"`
3. trigger: `"auto:add-argument"`

`snapshots` 필드가 없거나 `auto_snapshot`이 false이면 건너뛴다.

---

## 단계 10: Discussion audit trail 기록

`logs/argument-log.md` 파일에 추가 기록한다. 파일이 없으면 생성.

```markdown
## [{current_datetime}] add-argument({NN}-{name})
  Action: Key Argument 추가
  KA: {new KA text}
  Section: {NN}-{name}
  Total KAs: {N+1}
  MECE warning: {있음/없음}
```

---

## 단계 11: 완료 안내

```
✅ 논거 추가 완료: {NN}-{name}

  Key Argument: {new KA text}
  섹션 파일: planning/{NN}-{name}.md
  상태: draft
  Issue: #{issue_number}

----------------------------------------
다음 액션:

[1] 새 섹션 전개 (/sowhat:expand {NN})
[2] 전체 상태 확인 (/sowhat:progress)
[3] 논증 시각화 (/sowhat:map)
----------------------------------------
```

Issue 생성에 실패했으면 `Issue: (미생성 — /sowhat:sync로 동기화)` 로 표시.

---

## 핵심 원칙

- **planning 레이어 전용** — spec/finalized에서는 차단
- **MECE 경고, 차단 아님** — 사용자가 겹침을 알고도 추가할 수 있음
- **So What 필수** — Answer와의 연결이 없으면 진행 불가
- **자동 스캐폴딩** — 파일, config, GitHub Issue, thesis 체크리스트 모두 자동 처리
- **Discussion audit trail 기록** — `logs/argument-log.md`에 추가 기록
