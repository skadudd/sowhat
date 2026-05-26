---
version: "3.0.0"
---

# Walton Argumentation Schemes — 함정 3가지 & Harness 대응 규칙

sowhat v3.0.0 Walton 도입 시 알려진 함정과 harness 차원 대응 규칙.
각 규칙의 설계 결정 식별자: D1·D2·D3.

---

## 함정① — Scheme 오분류가 전체를 오염시킨다

**문제**: scheme type을 잘못 잡으면 엉뚱한 CQ를 던진다. 특히 한 주장이 복합 scheme인 경우(예: "전문가가 인과를 주장" = Expert Opinion + Cause to Effect)가 흔하다. 단일 분류로 강제하면 한쪽 공격 벡터를 놓친다.

**Harness 규칙 D1 — 하이브리드 분류**:

| 단계 | 누가 | 행동 |
|---|---|---|
| 1차 분류 | Writer | 주장 작성 시 scheme 1개 이상 명시 (필수) |
| 보조 제안 | LLM | "X뿐 아니라 Y scheme도 가능, 두 CQs 모두 활성화할까요?" |
| 최종 확정 | Writer | 단일 또는 복합 결정 |

복합 scheme이 확정되면 모든 scheme의 CQs를 **다 적용**한다.

**자주 나타나는 복합 scheme 패턴**:

| 패턴 | 설명 |
|---|---|
| Expert Opinion + Cause to Effect | 전문가가 인과 관계를 주장할 때 |
| Sample to Population + Cause to Effect | 데이터 기반 인과 주장 |
| Analogy + Practical Reasoning | 유사 사례를 근거로 행동 권고 |
| Sign + Effect to Cause | 정황 증거로 원인 진단 |
| Expert Opinion + Classification | 전문가가 분류/정의를 주장 |

---

## 함정② — CQ 답변의 질을 누가 판정하나

**문제**: "E가 전문가인가?"에 "그렇다"고 말하는 것과 실제로 그런 것은 다르다. CQ는 질문을 줄 뿐, 답의 진위를 자동 검증하지 않는다. 자동화의 진짜 한계점.

**Harness 규칙 D2 — confidence 자가 점수**:
- 각 CQ 답변에 confidence 0-4를 부여 (writer 자가 평가)
- confidence ≤ 1 = 미충족
- 미충족 CQ 수 ≥ scheme별 임계값 → settle 차단
- **LLM의 confidence 판정 금지** — confidence는 writer의 자가 선언

→ 자동 검증의 환상을 제거하고, writer가 답변 강도를 명시적으로 평가하게 강제한다.
임계값 및 점수 기준 → `@calibration-guide.md`

---

## 함정③ — CQ 무한 후퇴

**문제**: 모든 CQ 답변은 그 자체가 또 하나의 주장이라 다시 CQ를 부를 수 있다. 끝이 없다. depth limit 없으면 steel-man이 영원히 판다.

**Harness 규칙 D3 — depth=2 cap**:
- CQ 답변(=새 주장)에 대해 후속 CQ는 최대 1회까지만 허용 (총 depth 2)
- depth 2 도달 시: 자동 **미해결 항복 선언**
- 항복 선언된 CQ는 미충족으로 처리 (임계값 카운트 포함)

**depth 예시**:
```
CQ: E가 전문가인가?                         ← depth 1
  답변: "OOO 대학 교수다"
  후속 CQ: 그 대학 교수직이 신뢰할 만한가?   ← depth 2 (허용)
    답변: "QS 100위 대학이다"
    후속 CQ: QS 순위가 이 분야에서...        ← depth 3 → 차단 → 자동 항복
```

---

## 운영 요약

| 함정 | 규칙 | 키 | 적용 위치 |
|---|---|---|---|
| scheme 오분류 | 하이브리드 분류 + 복합 허용 | D1 | expand 스텝 2, LLM 보조 제안 |
| CQ 답변 진위 | confidence 0-4 자가 점수 | D2 | settle 게이트 |
| CQ 무한 후퇴 | depth=2 cap + 자동 항복 | D3 | challenge depth 검사 |
