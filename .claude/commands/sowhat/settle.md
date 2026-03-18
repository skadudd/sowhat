---
model: claude-haiku-4-5-20251001
---
# /sowhat:settle — 완료 선언

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
3. **Grounds 존재 여부** — 최소 1개의 근거가 있어야 함 (기획 섹션: Supporting Arguments, 명세 섹션: 해당 필드)
4. **Warrant 존재 및 품질** — Warrant가 존재하는가? `"Implicit"` 또는 비어있으면 **경고** (거부는 아니지만 표시)
5. **Qualifier 설정 여부** — 비어있으면 거부
6. **Rebuttal 처리 여부** — 반론이 addressed되었거나 Open Question으로 명시되어 있는가?
7. **Open Questions** — 미해결 항목이 있으면 거부
8. **scheme 필드** — 설정되어 있어야 함

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

### 8. 맵 스냅샷 저장 (선택)

`maps/` 디렉터리가 존재하고 `maps/overview.excalidraw`가 있으면:

```bash
date -u +"%Y%m%d-%H%M"
# maps/snapshots/overview-{YYYYMMDD-HHMM}.excalidraw 에 복사
```

### 9. 완료 안내

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ settled: {섹션 이름}
  Claim:     {한 줄 요약}
  Scheme:    {scheme}
  Qualifier: {qualifier}
  Warrant:   {명시됨 | ⚠️ Implicit — 나중에 명시 권장}
  Issue #{N} closed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  컨텍스트 관리 권장
  세션이 길어졌을 수 있습니다.

  [1] /clear 후 재시작 (상태는 파일에 저장됨)
  [2] /compact (압축 요약)
  [3] 계속 진행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다음: /sowhat:expand {next} | /sowhat:challenge | /sowhat:debate {section}
```

## 핵심 원칙

- **완료는 인간이 선언한다** — Claude가 자동으로 settle하지 않는다
- **검증은 Claude가 한다** — 논리적 정합성 + Toulmin 구조 완결성을 확인한다
- **검증 실패 시 거부** — 무엇을 해소해야 하는지 명시한다
- **Warrant "Implicit"은 경고** — 거부까지는 아니지만 약한 논증임을 표시한다
