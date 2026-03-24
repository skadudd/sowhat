# /sowhat:revise — 논증 수정 + 영향 전파

<!--
@metadata
checkpoints:
  - type: decision
    when: "역전파 범위 결정"
  - type: human-input
    when: "수정할 필드 내용 제공"
config_reads: [layer, sections]
config_writes: [sections]
continuation:
  primary: "/sowhat:settle {section}"
  alternatives: ["/sowhat:challenge", "/sowhat:debate {section}"]
status_transitions: ["settled → needs-revision", "(cascading) → invalidated"]
-->

settled 또는 discussing 섹션의 논증을 수정하고, 영향받는 논증을 자동으로 점검한다. `$ARGUMENTS`

워크플로우: **요약 → 수정 → 저장 → 스코프 challenge → 오염 섹션 표시**

---

## 인자 파싱

```
/sowhat:revise {section} [{field}]
```

| 인자 | 의미 |
|------|------|
| `{section}` | 섹션 번호 또는 이름 (필수) |
| `{field}` | 수정할 필드명 (생략하면 요약 출력 후 선택) |

Field 값: `claim` / `grounds` / `warrant` / `qualifier` / `rebuttal` / `backing` / `open-questions`

섹션 없이 실행하면 → `❌ 섹션을 지정하세요. 예: /sowhat:revise 02`

---

## 사전 준비

1. `planning/config.json` 로드
2. `00-thesis.md` 로드
3. 대상 섹션 파일 확인:
   - 숫자 → `{N}-*.md` 패턴
   - 이름 → `*-{name}.md` 패턴
   - 없으면 → `❌ 섹션을 찾을 수 없습니다: {section}`
4. status 확인:
   - `draft` → `❌ draft 상태입니다. /sowhat:expand로 먼저 전개하세요.`
   - `invalidated` → 수정 가능 (오히려 수정이 목적)
   - `settled`, `discussing`, `needs-revision` → 정상 진행
5. `logs/session.md` 저장:
   ```markdown
   ---
   command: revise
   section: {N}-{section}
   step: field-selection
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   revise 시작 — {N}-{section} 수정 중. 현재 논증 구조 출력 완료. 수정할 필드 선택 대기 중.

   ## 재개 시 첫 질문
   어떤 부분을 수정하시겠습니까?
   ```

---

## 단계 1: 현재 논증 구조 출력

섹션의 전체 논증 구조를 인라인으로 출력한다.

```
━━━ {섹션 이름} [{status}] ━━━

🧩 Key Argument
  {thesis_argument — 이 섹션이 지지하는 상위 논거}

📌 Claim  [{scheme} / {qualifier}]
  {Claim 전문}

🔍 Grounds
  {Grounds 전문}

🔗 Warrant
  {Warrant 전문 | ⚠️ Implicit}

📚 Backing
  {Backing | 없음}

⚡ Rebuttal
  {Rebuttal | 없음}

❓ Open Questions
  {Open Questions | 없음}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

field 인자가 없으면 선택지를 출력한다:

```
어떤 부분을 수정하시겠습니까?
  [1] Claim
  [2] Grounds
  [3] Warrant
  [4] Qualifier (현재: {qualifier})
  [5] Rebuttal
  [6] Backing
  [7] Open Questions
  [취소] 입력 없이 엔터
```

---

## 단계 2: 수정 입력 받기

선택된 field의 현재 내용을 보여준 뒤 새 내용을 대화로 받는다.

```
현재 {Field}:
───────────────
{현재 내용}
───────────────
새 내용을 입력해주세요.
(Qualifier 수정 시: definitely / usually / in most cases / presumably / possibly 중 선택)
```

사용자가 수정 내용을 제시하면 Claude가 즉시 파일에 반영한다.
**여러 필드를 순차적으로 수정하고 싶으면 "계속 수정" 응답으로 반복 가능.**

---

## 단계 3: 저장 + 상태 처리

### 파일 업데이트

- 수정된 필드 내용 반영
- status 처리:
  - 기존 `settled` → `needs-revision`으로 변경
  - 기존 `needs-revision` / `discussing` → 그대로 유지
- `updated: {current_datetime}` 업데이트

### Git commit

```bash
git add {section_file}
git commit -m "revise({section}): {수정된 field} 변경"
```

### config.json 업데이트

해당 섹션 status 반영.

### logs/argument-log.md 추가

```markdown
## [{datetime}] revise({section})
  Field: {수정된 field}
  Before: {이전 내용 한 줄 요약}
  After: {새 내용 한 줄 요약}
  Status: settled → needs-revision
```

---

## 단계 4: 오염 범위 탐지

수정된 섹션이 영향을 미치는 범위를 자동으로 탐지한다.

### 오염 범위 정의

| 범위 | 조건 |
|------|------|
| **직접 오염** | 동일 `thesis_argument`를 가진 섹션 (같은 Key Argument 소속) |
| **간접 오염** | 다른 섹션의 Grounds 또는 Warrant에 이 섹션의 Claim을 인용하는 섹션 |
| **thesis 오염** | 수정된 Claim이 Key Argument → Answer 연결을 약화시킬 가능성 |

탐지 방법:
1. 모든 섹션 파일을 순회하여 `thesis_argument` 값 비교
2. 다른 섹션의 Grounds 텍스트에서 이 섹션 이름/번호 검색
3. thesis Answer와 수정된 Claim의 정합성 확인

---

## 단계 5: 스코프 Challenge 실행

전체 `/sowhat:challenge`가 아닌 **영향 범위만 대상**으로 검증한다.

### 검증 대상

1. **수정된 섹션** — Toulmin 구조 전체 재검증 (7단계 중 관련 단계)
2. **오염 섹션** — Claim → Grounds 흐름에서 이 섹션 의존 여부 확인
3. **thesis 정합성** — 수정 후에도 Key Argument → Answer 연결이 유효한가

### 검증 결과 출력

```
━━━ 스코프 Challenge 결과 ━━━

🔍 수정 섹션: {section}
  {문제 있으면 공격 리포트 / 통과하면 ✅ 통과}

🔗 thesis 정합성
  {Key Argument가 Answer를 여전히 지지하는가 판정}

⚠️  오염 섹션 ({N}개)
  - {섹션 이름}: {오염 이유 한 줄}
  - {섹션 이름}: {오염 이유 한 줄}

🟢 안전한 섹션 ({M}개)
  - {섹션 이름}: 영향 없음
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

오염 섹션이 없으면:
```
✅ 오염 없음 — 이 수정은 다른 섹션에 영향을 주지 않습니다.
```

---

## 단계 6: 오염 섹션 처리

### 오염 섹션이 있을 때

각 오염 섹션의 처리 방향을 제시한다:

```
오염된 섹션을 어떻게 처리하시겠습니까?

[1] 자동 invalidate — 재전개 필요 (status: invalidated)
[2] 직접 검토 — 각 섹션에서 수동 확인
[3] 무시 — 영향 없다고 판단
```

**자동 invalidate 선택 시:**

```bash
# 각 오염 섹션에 대해
# status: invalidated 로 변경
git add -A
git commit -m "revise: invalidate({오염섹션들}) — {수정 섹션} 변경 영향"
```

config.json, 00-thesis.md 체크박스 해제 (해당되는 경우) 업데이트.

---

## 완료 안내

```
✅ revise 완료: {section}
  수정: {field} 변경
  상태: {이전} → {이후}
  오염: {N}개 섹션 처리됨

---

## ▶ 다음

**{오염섹션}: 재전개** — 오염된 섹션을 재전개

`/sowhat:expand {오염섹션}`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---

**또한 가능:**
- `/sowhat:debate {section}` — 수정 내용 논증 강화
- `/sowhat:challenge` — 전체 트리 재검증
- `/sowhat:revise {section}` — 추가 수정

---
```

---

## 핵심 원칙

- **수정은 대화로** — 필드 내용을 대화로 받아 Claude가 직접 파일에 반영
- **settled → needs-revision 자동 강등** — 수정된 섹션은 다시 검증이 필요
- **스코프 challenge** — 전체가 아닌 영향 범위만 검증해 비용 최소화
- **오염 범위 명시** — 어떤 섹션이 왜 영향받는지 사용자에게 투명하게 표시
- **처리 방식은 사용자가 결정** — 자동 invalidate vs 수동 검토 선택권 부여
