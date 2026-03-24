# /sowhat:resume — 세션 재개

<!--
@metadata
checkpoints: []
config_reads: [project, layer, sections, research]
config_writes: []
continuation:
  primary: "(세션 복원 후 이전 커맨드 재개)"
  alternatives: ["/sowhat:progress"]
status_transitions: []
-->

세션이 강제로 끊어진 후 재개할 때 사용한다. 중단된 작업을 감지하고, 어떤 내용이었는지 복구하여 바로 이어서 진행할 수 있도록 안내한다.

인수 없음. 세션 시작 시 호출한다.

---

## 1. 프로젝트 확인

`planning/config.json` 로드.
- 파일 없으면: `❌ sowhat 프로젝트가 아닙니다. /sowhat:init으로 초기화하세요.` 종료.

---

## 2. 중단 지점 감지

다음을 **병렬**로 수집한다:

### A. session.md 파싱 (있으면)

```bash
cat logs/session.md 2>/dev/null
```

frontmatter에서 추출:
- `command`: 실행 중이던 커맨드 (expand / debate / spec / challenge)
- `section`: 작업 중이던 섹션
- `step`: 진행 중이던 단계
- `status`: `in_progress` 또는 `complete`
- `saved`: 저장 시각

`status: in_progress`이면 → **중단된 작업 존재**

### B. git log로 최근 작업 파악

```bash
git log --oneline -20 2>/dev/null
```

최근 커밋에서 패턴 매칭:
- `wip({section}): add {step}` → expand 진행 중
- `debate({section}): round-{N}` → debate 진행 중
- `expand({section}): complete` → expand 완료
- `debate({section}): merge` → debate 완료

마지막 wip 커밋 이후 complete 커밋이 없으면 → **미완성 작업**

### C. discussing 상태 섹션 탐지

모든 섹션 파일의 frontmatter에서 `status: discussing`인 것을 수집.

### D. 열린 debate 브랜치 확인

```bash
git branch 2>/dev/null | grep "debate/"
```

### E. 미커밋 변경사항

```bash
git status --porcelain 2>/dev/null
```

---

## 3. 중단 지점 재구성

감지된 정보를 종합하여 "어디서 멈췄나"를 판단한다.

### 우선순위

1. `session.md`의 `status: in_progress` → 가장 정확한 정보
2. git log의 미완성 wip 커밋
3. `discussing` 상태 섹션 (expand 또는 spec 핑퐁 중단)
4. 열린 debate 브랜치 (debate 중단)

### 재개 컨텍스트 구성

`session.md`가 있으면 `## 마지막 컨텍스트` 섹션을 그대로 표시한다.

없으면:
- 섹션 파일의 현재 상태(어떤 필드가 채워져 있고 어떤 필드가 비어있는지)로 추론
- git log의 마지막 wip 커밋 메시지로 단계 파악

---

## 4. 상태 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 {project} — 세션 재개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 중단된 작업이 있을 때

```
⚠️  중단된 작업 감지

  커맨드: /sowhat:{command}
  섹션:  {N}-{section}
  단계:  {step}
  저장:  {saved} ({relative time} 전)

  마지막 컨텍스트:
  ─────────────────────
  {session.md의 ## 마지막 컨텍스트 내용}
  ─────────────────────

  재개 시 첫 질문:
  {session.md의 ## 재개 시 첫 질문 내용, 또는 단계에서 추론}
```

열린 debate 브랜치가 있으면 추가:
```
🌿 진행 중인 Debate Branch
  {branch-name} (미merge)
```

미커밋 변경사항이 있으면 추가:
```
⚠️  미커밋 변경사항 있음
  [S] git add -A && git commit -m "wip: save before resume"
```

### 전체 진행 현황 (간략)

```
📊 진행 현황
  [{진행률 바}] {settled_count}/{total_count} 섹션 settled
  기획: {기획_이모지_문자열}
  명세: {명세_이모지_문자열}
```

---

## 5. 재개 옵션 제시

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
재개 옵션:
```

중단된 작업이 있으면:
```
  [R] /sowhat:{command} {section}    ← 중단 지점에서 재개 (권장)
```

미커밋이 있으면:
```
  [S] 저장 후 재개
```

debate 브랜치가 있으면:
```
  [M] debate/{branch} merge
  [D] debate/{branch} delete
```

기타:
```
  [1] /sowhat:{next_recommended}     ← {사유}
  [P] /sowhat:progress               ← 전체 상태 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. 상호작용 처리

- `[R]` 또는 "r": 중단된 커맨드 직접 실행 (컨텍스트 포함하여 재개)
- `[S]` 또는 "s": `git add -A && git commit -m "wip: save before resume"` 실행 후 `[R]`로 진행
- `[M]` 또는 "m": debate 브랜치 merge 안내
- `[D]` 또는 "d": debate 브랜치 삭제 확인
- `[P]` 또는 "p": `/sowhat:progress` 실행
- `[1]`~`[5]`: 해당 커맨드 안내

---

## 빠른 재개 (quick resume)

사용자가 "계속", "continue", "go", "이어서" 라고만 입력했을 때:
- session.md의 `status: in_progress` 항목을 찾으면
- 옵션 제시 없이 바로 `[R]` 실행

```
{section} {step} 재개 중...
```

---

## 엣지 케이스

- `session.md` 없음 + git log도 wip 없음: "최근 중단된 작업이 없습니다." → `[P]` /sowhat:progress로 라우팅
- `discussing` 섹션이 여러 개: 가장 최근 수정된 것을 우선 표시
- debate 브랜치가 여러 개: 모두 표시
- git 없음: B, D 단계 생략

---

## session.md 없이 상태 재구성 (Fallback Recovery)

session.md가 유실되었을 때 파일 상태 + git log로 최대한 복구한다.

### 복구 알고리즘

```
1. config.json에서 전체 섹션 목록 + status 로드
2. 각 섹션 파일의 frontmatter에서 실제 status 확인 (config.json과 불일치 감지)
3. git log --oneline -30 에서 패턴 매칭:

   커밋 패턴 → 추론 결과:
   - "wip({section}): add {field}" → expand 진행 중, {field} 단계
   - "expand({section}): complete" → expand 완료, settle 대기
   - "debate({section}): round-{N}" → debate round {N} 완료
   - "debate({section}): merge" → debate 완료, merge됨
   - "settle({section})" → settle 완료
   - "challenge: invalidate" → challenge 후 역전파 실행됨
   - "challenge: stage-{N}" → challenge 부분 완료 (partial 파일 확인)

4. 섹션 파일 필드 점검:
   - Claim 있고 Grounds 없음 → expand Step 3 완료, Step 4 대기
   - Claim + Grounds + Warrant 없음 → expand Step 4 완료, Step 5 대기
   - 모든 Toulmin 필드 있고 status=discussing → settle 대기

5. challenge partial 결과 확인:
   - logs/challenge-*-partial.md 존재 → challenge 중단, 부분 결과 있음
   - 어느 stage까지 완료되었는지 파일 내용으로 확인

6. debate 브랜치 상태:
   - debate/{section}-* 브랜치 존재 → 미merge debate
   - 해당 브랜치의 logs/debate/{section}-round-*.md 파일 수 → 진행 라운드 수
```

### 복구 출력

```
⚠️  session.md 유실 — 파일 상태로 복구됨

  추론 근거:
  - git log: {마지막 관련 커밋 메시지}
  - 섹션 파일: {어떤 필드까지 채워져 있는지}
  - debate 브랜치: {있으면 표시}

  추론 결과:
  - 마지막 작업: {command} on {section}, {step} 단계
  - 신뢰도: {높음|보통|낮음}

  {신뢰도가 "낮음"이면}
  ⚠️  추론이 불확실합니다. 섹션 상태를 직접 확인해주세요.
```

### 불일치 감지 및 자동 수정

config.json status와 섹션 파일 status가 다른 경우:

```
⚠️  상태 불일치 감지

  {section}: config.json={status_a}, 파일={status_b}

  [1] 파일 기준으로 config 수정 (권장 — 파일이 더 정확)
  [2] config 기준으로 파일 수정
  [3] 무시
```

---

## 핵심 원칙

- **session.md가 있으면 무조건 우선** — 가장 정확한 컨텍스트
- **없으면 파일 상태 + git log로 추론** — 최선을 다해 복구
- **추론 불확실하면 명시** — "어떤 단계에서 멈췄는지 정확히 알 수 없습니다. 섹션 상태를 보면 {step}까지 완료된 것으로 보입니다."
- **progress와 중복하지 않는다** — 전체 대시보드는 /sowhat:progress에 위임
