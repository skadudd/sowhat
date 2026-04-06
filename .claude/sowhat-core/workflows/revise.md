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
status_transitions: ["settled → needs-revision (substantive/structural only)", "(cascading) → invalidated (structural only)", "cosmetic/reinforcing → no status change"]
-->

settled 또는 discussing 섹션의 논증을 수정하고, 영향받는 논증을 자동으로 점검한다. `$ARGUMENTS`

워크플로우: **요약 → 수정 → 분류 → 저장 → 스코프 challenge → 오염 섹션 표시**

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
----------------------------------------
> {섹션 이름} [{status}]

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
----------------------------------------
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
  [0] 취소
```

---

## 단계 2: 수정 입력 받기

선택된 field의 현재 내용을 보여준 뒤 새 내용을 대화로 받는다.

```
현재 {Field}:
----------------------------------------
{현재 내용}
----------------------------------------
새 내용을 입력해주세요.
(Qualifier 수정 시: definitely / usually / in most cases / presumably / possibly 중 선택)
```

사용자가 수정 내용을 제시하면 Claude가 즉시 파일에 반영한다.
**여러 필드를 순차적으로 수정하고 싶으면 "계속 수정" 응답으로 반복 가능.**

---

## 단계 3: 수정 분류 (Revision Classification)

수정의 이전/이후 내용을 비교하여 4단계 중 하나로 자동 분류한다.

### 분류 유형

| 유형 | 의미 | 상태 변경 | 전파 |
|------|------|----------|------|
| `cosmetic` | 오타, 포맷팅, 인용 형식 수정 | 없음 (settled 유지) | 없음 |
| `reinforcing` | Backing 추가, Claim 불변인 Grounds 보강, Warrant 보강 증거 추가 | 없음 (settled 유지) | 없음 |
| `substantive` | Claim 재표현 (의미 동일), Qualifier 축소, Rebuttal 추가 | settled → needs-revision | 스코프 검증만 (자동 invalidation 없음) |
| `structural` | Claim 의미 변경, thesis_argument 변경, Scheme 변경 | settled → needs-revision | 전체 전파 (기존 동작) |

### 자동 감지 알고리즘

```
FUNCTION classify_revision(field, old_content, new_content, claim_changed):

  # 1. 포맷팅/오타만 변경된 경우 (모든 필드)
  IF strip_formatting(old_content) == strip_formatting(new_content):
    RETURN "cosmetic"

  # 2. 필드별 분류
  SWITCH field:
    CASE "backing":
      RETURN "reinforcing"  # Backing 추가/수정은 항상 보강

    CASE "open-questions":
      RETURN "cosmetic"  # Open Questions 변경은 논증 구조에 영향 없음

    CASE "grounds":
      IF NOT claim_changed:
        RETURN "reinforcing"  # Claim 불변 + Grounds 변경 = 보강
      ELSE:
        RETURN "structural"  # Claim도 변경됨 = 구조적

    CASE "claim":
      IF semantic_equivalent(old_content, new_content):
        RETURN "substantive"  # 의미 동일한 재표현
      ELSE:
        RETURN "structural"  # 의미 변경

    CASE "warrant":
      IF NOT claim_changed:
        RETURN "substantive"  # Claim 불변 + Warrant 변경 = 실질적
      ELSE:
        RETURN "structural"

    CASE "qualifier":
      RETURN "substantive"  # Qualifier 변경은 항상 재검증 필요

    CASE "rebuttal":
      RETURN "substantive"  # 새로운 방어 각도

  # 기본값: 판단 불가 시 상위 등급으로
  RETURN "substantive"
```

**감지 원칙:** 판단이 모호할 때는 항상 상위 등급으로 분류한다 (cosmetic보다 reinforcing, reinforcing보다 substantive).

### 사용자 확인 + 오버라이드

분류 결과를 사용자에게 보여주고 오버라이드를 허용한다.

```
수정 분류: {type} ({한국어 설명})

  필드: {field}
  이전: {이전 내용 한 줄 요약}
  이후: {새 내용 한 줄 요약}
  판정 근거: {왜 이 유형으로 분류했는지}

이 분류가 맞습니까?
  [1] 확인
  [2] cosmetic으로 변경 (포맷팅/오타 수정)
  [3] reinforcing으로 변경 (논증 보강)
  [4] substantive로 변경 (실질적 수정)
  [5] structural로 변경 (구조적 변경)
```

**오버라이드 규칙:**
- 상향 조정 (예: cosmetic → structural): 즉시 허용
- 하향 조정 (예: structural → cosmetic): 경고 표시 후 허용
  ```
  ⚠️ 하향 조정: structural → cosmetic
  이 수정이 다른 섹션의 논증 전제를 변경하지 않는 것이 확실합니까?
  하향 조정 시 오염 검사가 생략됩니다.
  [1] 확인 / [2] 취소
  ```
- 사용자가 자신의 수정 의도를 가장 잘 알기 때문에 최종 결정은 사용자에게 있다.

---

## 단계 4: 저장 + 상태 처리

### 파일 업데이트

- 수정된 필드 내용 반영
- status 처리 (분류 유형에 따라 분기):
  - **cosmetic / reinforcing**: status 변경 없음 (settled이면 settled 유지)
  - **substantive / structural**: 기존 `settled` → `needs-revision`으로 변경
  - 기존 `needs-revision` / `discussing` → 그대로 유지 (모든 유형)
- `updated: {current_datetime}` 업데이트

### Git commit

```bash
git add {section_file}
git commit -m "revise({section}): {수정된 field} 변경 [{classification}]"
```

### config.json 업데이트

해당 섹션 status 반영.

### logs/argument-log.md 추가

```markdown
## [{datetime}] revise({section})
  Field: {수정된 field}
  Classification: {cosmetic | reinforcing | substantive | structural}
  Before: {이전 내용 한 줄 요약}
  After: {새 내용 한 줄 요약}
  Status: {이전 상태} → {이후 상태} (또는 "변경 없음" for cosmetic/reinforcing)
  Override: {없음 | "사용자가 {원래} → {변경}으로 오버라이드"}
```

---

## 단계 5: 오염 범위 탐지

> **cosmetic / reinforcing 분류 시 이 단계를 건너뛴다.** → 단계 8(완료 안내)로 직행.

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

## 단계 6: 스코프 Challenge 실행

> **cosmetic / reinforcing 분류 시 이 단계를 건너뛴다.** → 단계 8(완료 안내)로 직행.
>
> **substantive 분류 시**: 수정된 섹션만 Toulmin 재검증. 오염 섹션은 자동 invalidation 없이 검증 결과만 표시.
>
> **structural 분류 시**: 전체 전파 (기존 동작 그대로).

전체 `/sowhat:challenge`가 아닌 **영향 범위만 대상**으로 검증한다.

### 검증 대상

1. **수정된 섹션** — Toulmin 구조 전체 재검증 (7단계 중 관련 단계)
2. **오염 섹션** — Claim → Grounds 흐름에서 이 섹션 의존 여부 확인
3. **thesis 정합성** — 수정 후에도 Key Argument → Answer 연결이 유효한가

### 검증 결과 출력

```
----------------------------------------
> 스코프 Challenge 결과

🔍 수정 섹션: {section}
  {문제 있으면 공격 리포트 / 통과하면 ✅ 통과}

🔗 thesis 정합성
  {Key Argument가 Answer를 여전히 지지하는가 판정}

⚠️  오염 섹션 ({N}개)
  - {섹션 이름}: {오염 이유 한 줄}
  - {섹션 이름}: {오염 이유 한 줄}

🟢 안전한 섹션 ({M}개)
  - {섹션 이름}: 영향 없음
----------------------------------------
```

오염 섹션이 없으면:
```
✅ 오염 없음 — 이 수정은 다른 섹션에 영향을 주지 않습니다.
```

---

## 단계 7: 오염 섹션 처리

> **cosmetic / reinforcing 분류 시 이 단계를 건너뛴다.**
> **substantive 분류 시**: 검증 결과를 표시하되 자동 invalidation 옵션은 제공하지 않는다. 사용자가 수동으로 `/sowhat:revise`로 개별 수정하도록 안내.

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

## 단계 8: 완료 안내

```
✅ revise 완료: {section}
  수정: {field} 변경
  상태: {이전} → {이후}
  오염: {N}개 섹션 처리됨

----------------------------------------
다음 액션:

[1] 오염 섹션 재전개 (/sowhat:expand {오염섹션})
[2] 수정 내용 논증 강화 (/sowhat:debate {section})
[3] 전체 트리 재검증 (/sowhat:challenge)
[4] 추가 수정 (/sowhat:revise {section})
----------------------------------------


```

---

## Discussion Audit Trail (Revise)

수정 과정을 구조화된 로그로 남긴다.

### 저장 위치

`logs/discussion/{section}-revise-{YYYYMMDD-HHMM}.md`

### 형식

```markdown
# Revise Discussion Log: {section}

## Revision ({datetime})
- Decision ID: D-{section}-{seq}
- Field: {수정된 필드}
- Classification: {cosmetic | reinforcing | substantive | structural}
- Classification Override: {없음 | "사용자가 {원래} → {변경}으로 오버라이드"}
- Before: {이전 내용 요약}
- After: {새 내용 요약}
- Reason: {사용자가 제시한 수정 이유}
- Status Change: {이전 → 이후 | "변경 없음"}
- Pollution detected: {오염 섹션 목록 | 없음 | "건너뜀 (cosmetic/reinforcing)"}
- Pollution action: {invalidate | manual review | ignored | "해당 없음"}
```

---

## 핵심 원칙

- **수정은 대화로** — 필드 내용을 대화로 받아 Claude가 직접 파일에 반영
- **수정 분류 시스템** — 4단계 분류(cosmetic/reinforcing/substantive/structural)로 불필요한 전파 방지
- **비례적 대응** — cosmetic/reinforcing은 상태 유지, substantive는 스코프 검증만, structural만 전체 전파
- **자동 감지 + 사용자 오버라이드** — 알고리즘이 분류하되 최종 결정은 사용자에게 위임
- **스코프 challenge** — 전체가 아닌 영향 범위만 검증해 비용 최소화
- **오염 범위 명시** — 어떤 섹션이 왜 영향받는지 사용자에게 투명하게 표시
- **처리 방식은 사용자가 결정** — 자동 invalidate vs 수동 검토 선택권 부여
- **Discussion audit trail 필수** — 모든 수정 과정을 `logs/discussion/`에 기록 (분류 정보 포함)
- **Decision ID 부여** — 수정 결정마다 ID를 부여하여 추적 가능
