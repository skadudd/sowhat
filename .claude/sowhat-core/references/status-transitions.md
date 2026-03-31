# Status Transitions

Valid status values, transition rules, and cascading invalidation algorithm for sowhat sections.

## Status Values

| Status | Meaning | Can be changed to |
|--------|---------|-------------------|
| `draft` | Initial state. Structure exists but content not developed. | `discussing` (via expand) |
| `discussing` | Actively being developed via expand/debate. | `settled`, `needs-revision` |
| `settled` | Argument complete and confirmed. | `needs-revision`, `invalidated` (via challenge/revise) |
| `needs-revision` | Was settled but a problem was found. Must be reworked. | `discussing`, `settled` |
| `invalidated` | Upstream section changed; this section's argument is now invalid. | `discussing` (after upstream fixed) |

## Transition Rules

### Forward (progress)
- `draft` → `discussing`: expand command begins section development
- `discussing` → `settled`: settle command after validation passes

### Backward (degradation)
- Any status → `needs-revision`: challenge/revise finds a problem in this section directly
  - **단, revise에서는 `substantive` 또는 `structural` 분류일 때만 상태 변경 발생**
  - `cosmetic` / `reinforcing` 분류의 수정은 현재 상태를 유지함 (settled → settled)
- Any status → `invalidated`: upstream section was revised, cascading effect
  - **단, `structural` 분류의 수정에서만 전체 전파(cascading) 발생**
  - `substantive` 분류는 스코프 검증만 수행하고 자동 invalidation 없음
  - `cosmetic` / `reinforcing` 분류는 전파 자체를 수행하지 않음
- `needs-revision` / `invalidated` → `discussing`: expand restarts development

### Gates
- `settled` requires: Claim + Grounds + Warrant + Qualifier + Rebuttal + Scheme all non-empty
- `finalize-planning` requires: all planning sections (01-03) settled
- `finalize` requires: all spec sections (04-09) settled

---

## Revision Classification (수정 분류 시스템)

수정의 성격에 따라 4단계로 분류하여, 사소한 수정이 전체 논증 트리를 무효화하는 것을 방지한다.

### 분류 유형

| 유형 | 설명 | 예시 | 상태 변경 | 전파 |
|------|------|------|----------|------|
| `cosmetic` | 오타, 포맷팅, 인용 형식 수정 | 맞춤법 교정, 마크다운 형식 변경, open-questions 수정 | 없음 (settled 유지) | 없음 |
| `reinforcing` | 기존 논증을 강화하는 추가 | Backing 추가, Claim 불변인 Grounds 보강, 증거 추가 | 없음 (settled 유지) | 없음 |
| `substantive` | 논증 구조의 실질적 변경 (의미는 보존) | Claim 재표현 (의미 동일), Qualifier 축소, Rebuttal 추가 | settled → needs-revision | 스코프 검증만 (자동 invalidation 없음) |
| `structural` | 논증의 의미나 방향 자체 변경 | Claim 의미 변경, thesis_argument 변경, Scheme 변경 | settled → needs-revision | 전체 전파 (cascading invalidation) |

### 자동 감지 알고리즘

분류는 수정된 필드와 변경 내용을 기반으로 자동 감지된다:

| 수정 필드 | 조건 | 분류 |
|-----------|------|------|
| 모든 필드 | 포맷팅/오타만 변경 (의미 동일) | `cosmetic` |
| `backing` | 항상 | `reinforcing` |
| `open-questions` | 항상 | `cosmetic` |
| `grounds` | Claim 변경 없음 | `reinforcing` |
| `grounds` | Claim도 변경됨 | `structural` |
| `claim` | 의미 동일한 재표현 | `substantive` |
| `claim` | 의미 변경 | `structural` |
| `warrant` | Claim 변경 없음 | `substantive` |
| `warrant` | Claim도 변경됨 | `structural` |
| `qualifier` | 항상 | `substantive` |
| `rebuttal` | 항상 | `substantive` |

**감지 원칙:** 판단이 모호할 때는 항상 상위 등급으로 분류한다 (safe-by-default).

### 상태 변경 규칙

```
IF classification IN [cosmetic, reinforcing]:
  status 변경 없음
  전파 없음
  오염 범위 탐지 건너뜀

IF classification == substantive:
  settled → needs-revision
  스코프 검증 실행 (수정된 섹션만 Toulmin 재검증)
  오염 섹션 표시하되 자동 invalidation 없음

IF classification == structural:
  settled → needs-revision
  전체 전파 실행 (기존 Cascading Invalidation Algorithm 적용)
```

### 사용자 오버라이드 규칙

- 자동 감지 결과는 사용자에게 표시되며, 사용자가 오버라이드할 수 있다
- **상향 조정** (예: cosmetic → structural): 즉시 허용
- **하향 조정** (예: structural → cosmetic): 경고 표시 후 허용
  - 사용자가 자신의 수정 의도를 가장 잘 알기 때문에 최종 결정은 사용자에게 있다
  - 단, 하향 조정 시 "오염 검사가 생략됩니다" 경고를 반드시 표시
- 오버라이드 이력은 argument-log 및 discussion audit trail에 기록된다

### 전파 동작 요약

```
cosmetic     →  저장만 (상태 유지, 전파 없음)
reinforcing  →  저장만 (상태 유지, 전파 없음)
substantive  →  저장 + 상태 강등 + 스코프 검증 (자동 invalidation 없음)
structural   →  저장 + 상태 강등 + 전체 전파 (Cascading Invalidation Algorithm)
```

---

## Dependency Graph (섹션 간 참조 관계)

### 의존성 정의

섹션 B가 섹션 A에 **의존**한다는 것은 다음 중 하나를 의미한다:

1. **thesis_argument 의존**: B의 thesis_argument가 A의 Claim을 전제로 함
2. **Grounds 인용**: B의 Grounds가 A의 Claim 또는 Grounds를 직접 인용함
3. **Warrant 참조**: B의 Warrant가 A의 결론을 논리적 전제로 사용함
4. **암묵적 순서**: 번호 순서상 A < B이고, B가 A의 결론 위에 논증을 구축함

### 의존성 추출 알고리즘

```
FOR EACH section B:
  dependencies[B] = []

  1. B의 Grounds에서 다른 섹션을 명시적으로 언급하는가?
     - "01-problem에서 확인한 바와 같이..." → dependencies[B].append("01-problem")
     - 파일명, 섹션 번호, 섹션 이름 패턴 매칭

  2. B의 Warrant가 다른 섹션의 Claim을 전제하는가?
     - B.Warrant에 A.Claim의 핵심 키워드가 포함 → dependencies[B].append(A)

  3. B의 thesis_argument가 A의 thesis_argument와 논리적 선후 관계인가?
     - 같은 Key Argument를 지지하는 섹션들 중 번호가 앞선 것 → 잠재적 의존

  결과: dependencies[B] = [A1, A2, ...]  (B가 의존하는 섹션 목록)
```

### 의존성 그래프 예시

```
thesis (00)
  ├── 01-problem (thesis 의존)
  │     └── 02-solution (01 의존: "문제가 존재하므로 솔루션이 필요")
  │           └── 03-market (02 의존: "솔루션이 있으므로 시장이 존재")
  └── 04-actors (01, 02 의존 — spec layer)
```

---

## Cascading Invalidation Algorithm

### 트리거

섹션 A의 status가 `needs-revision` 또는 `invalidated`로 변경될 때 실행.

트리거 소스: challenge, revise, debate (broken), sync

### 알고리즘

```
FUNCTION cascade(section_A, reason):

  1. downstream = find_dependents(section_A)
     # section_A에 의존하는 모든 섹션 (직접 + 간접)

  2. IF downstream is empty:
     RETURN  # 전파 대상 없음

  3. 영향 범위 표시:
     **[decision]** 역전파 범위

     > 수정 대상: {section_A}
     > 이유: {reason}
     > 직접 영향: {direct_dependents 목록}
     > 간접 영향: {indirect_dependents 목록}

     [1] 전체 역전파 (위 섹션 모두 invalidated)
     [2] 직접 영향만 (간접은 유지)
     [3] 해당 섹션만 (역전파 없음)
     [4] 취소

  4. 인간의 선택에 따라:
     [1] → invalidate(direct + indirect)
     [2] → invalidate(direct only)
     [3] → 역전파 없음 (section_A만 변경)
     [4] → 전체 취소

  5. invalidate(sections):
     FOR EACH section IN sections:
       IF section.status IN [settled, discussing]:
         section.status = invalidated
         section.updated = current_datetime
         config.json 업데이트
         GitHub Issue reopen + label 변경
```

### find_dependents (의존 섹션 탐색)

```
FUNCTION find_dependents(section_A):
  direct = []
  indirect = []

  # 직접 의존: A를 직접 참조하는 섹션
  FOR EACH section B IN all_sections:
    IF A IN dependencies[B]:
      direct.append(B)

  # 간접 의존: 직접 의존 섹션에 다시 의존하는 섹션 (BFS)
  queue = copy(direct)
  WHILE queue is not empty:
    current = queue.pop()
    FOR EACH section C IN all_sections:
      IF current IN dependencies[C] AND C NOT IN direct AND C NOT IN indirect:
        indirect.append(C)
        queue.append(C)

  RETURN { direct, indirect }
```

### 순환 의존 방지

```
IF section A IN find_dependents(A):
  # 순환 감지
  ⚠️ 순환 의존 감지: {cycle_path}
  역전파를 중단하고 인간에게 보고
```

---

## 전파 순서

역전파 실행 시 반드시 **의존 방향 순서**로 실행한다:

```
직접 의존 → 간접 의존 (BFS 순서)

예: A가 변경되면
  1. B (A 직접 의존) invalidated
  2. C (B 직접 의존 = A 간접 의존) invalidated
  3. D (C 직접 의존 = A 간접 의존) invalidated
```

역순서로 실행하면 안 됨 (D를 먼저 invalidate하면 C 검사 시 D 상태가 이미 변경됨).

---

## config.json Tracking

```json
{
  "sections": {
    "01-problem": { "issue": 1, "status": "settled" },
    "02-solution": { "issue": 2, "status": "discussing" }
  }
}
```

섹션 파일 frontmatter의 status와 config.json의 status는 항상 동기화되어야 한다.
불일치 감지 시 `/sowhat:resume`의 Fallback Recovery가 수정을 제안한다 (`references/checkpoints.md` 참조).
