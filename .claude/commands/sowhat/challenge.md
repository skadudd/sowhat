---
model: claude-opus-4-6
---
# /sowhat:challenge — 전체 트리 공격

이 커맨드는 전체 문서 트리를 논리적으로 검증(공격)한다. 부분 공격은 없다 — 항상 전체를 대상으로 한다.

## 사전 준비

1. `.planning/config.json` 로드
2. `00-thesis.md` 로드
3. 모든 섹션 파일 로드 (숫자 순서대로)
4. `settled` 또는 `discussing` 상태 섹션만 대상
   - `draft`, `invalidated` 섹션은 건너뛴다

현재 layer가 `"spec"`이면 기획 + 명세 전체를 대상으로 한다.

## 검증 순서 (고정 — 순서 변경 불가)

### [1단계] Thesis 정합성

각 섹션의 `thesis_argument`가 thesis의 Answer를 **실제로** 지지하는지 검증한다.

질문:
- 이 섹션의 Claim이 제거되면 thesis Answer가 흔들리는가?
- settled 섹션들이 합쳐졌을 때 Answer를 **완전히** 커버하는가?
- 빠진 논거가 있지 않은가?

### [2단계] So What

각 Supporting Argument가 해당 Claim을 지지하는지 검증한다.

질문:
- 이 근거가 있으면 Claim이 자연스럽게 도출되는가?
- "So What?"에 답할 수 있는가?
- Claim이 상위 Key Argument를 지지하는가?

### [3단계] Why So

각 Claim이 충분한 근거를 가지는지 검증한다.

질문:
- "왜 이 Claim이 맞는가?"에 답할 수 있는가?
- 근거가 Claim을 **논리적으로** 도출하는가?
- 비약이 있지 않은가?

### [4단계] MECE

전체 구조의 중복과 누락을 검증한다.

질문:
- Key Arguments 간 중복이 있는가?
- 빠진 논거가 있는가?
- 섹션 간 범위(Scope) 충돌이 있는가?

### [참고] 리서치 교차검증

`.research/` 내 `status: accepted` 파인딩이 있으면, MECE 분석에서 발견된 갭과 교차검증한다:
- 리서치 파인딩이 동일한 갭을 식별했으면 함께 보고: `리서치 #{NNN}에서도 이 갭을 확인함: {요약}`
- 리서치 파인딩이 없거나 관련 없으면 건너뛴다

## 공격 리포트 출력

문제가 발견되면 다음 형식으로 출력한다:

```
🔴 Challenge Report

[1] Thesis 정합성
  - 위치: 02-growth-strategy
  - 문제: Claim이 thesis Answer와 직접적 연결이 약함
  - 근거: Answer는 "X를 통해 Y를 달성한다"인데, 이 섹션은 Z를 다루고 있음
  - 영향: 없음 (하위 섹션 없음)

[2] MECE — 누락
  - 위치: thesis Key Arguments
  - 문제: {specific_gap} 관련 논거가 없음
  - 근거: Answer 달성을 위해 필요하지만 어떤 섹션에서도 다루지 않음
  - 영향: thesis 커버리지 불완전

문제 없는 검증:
  ✅ So What — 모든 섹션 통과
  ✅ Why So — 모든 섹션 통과
```

문제가 없으면:
```
✅ Challenge 통과 — 전체 트리 정합성 확인됨
```

## 인간 응답 처리

각 공격에 대해 인간이 응답한다:

### 반박하는 경우

인간의 반박이 **논리적으로 타당한지** Claude가 재검증한다.
- 타당하면 → 해당 공격 **철회**
- 타당하지 않으면 → **재공격** (구체적 이유와 함께)

**인간의 반박을 무조건 수용하지 않는다.** 품질이 최우선이다.

### 수용하는 경우

역전파를 실행한다:

1. 해당 섹션 `status: needs-revision`
2. 하위 의존 섹션 `status: invalidated`
3. GitHub Issue reopen + label 변경:
   ```bash
   gh issue reopen {issue_number}
   gh issue edit {issue_number} --add-label "needs-revision" --remove-label "settled"
   ```
4. `config.json` 업데이트
5. `00-thesis.md` Key Arguments 체크박스 해제 (해당되면)
6. Git commit:
   ```bash
   git add -A
   git commit -m "challenge: invalidate({sections}) - {이유 한 줄}"
   ```

## 완료 안내

모든 공격이 처리되면:

```
✅ Challenge 완료
  - 철회: {N}건
  - 수용 (역전파): {N}건
  - 영향받은 섹션: {list}

다음: /sowhat:expand {section} → 역전파된 섹션 재전개
      /sowhat:finalize-planning → 기획 완료 (모든 settled 필요)
```

## 핵심 원칙

- **항상 전체 트리 공격** — 부분 공격 없음
- **검증 순서 고정** — thesis 정합성 → So What → Why So → MECE
- **인간의 반박을 무조건 수용하지 않는다** — 논리적 타당성 재검증
- **품질 우선** — 타협하지 않는다
- **역전파는 즉시 실행** — 수용 시 하위 전체에 영향
