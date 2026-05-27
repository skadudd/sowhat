# Critique Dimensions — 5차원 논증 비평 기준

sowhat-critic-agent와 sowhat-self-critic-agent가 공유하는 논증 비평 5차원 정의.
v3.0.0부터 Toulmin 5차원 → Walton Argumentation Schemes 기반으로 재정의.

---

## 호출 맥락

| Agent | 대상 | 차원 | 주 용도 |
|---|---|---|---|
| critic | 외부 타겟 콘텐츠 | 5차원 전체 | 약점 주입 → debate 연계 |
| self-critic | 사용자 자신의 논증 | 5차원 전체 | 초안 진단 → revise/expand 연계 |

> content-critique 모드에서 critic과 self-critic의 동시 호출은 중복 — critic을 우선 실행, self-critic은 critic 피드백 반영 후에만 호출.

---

## 1. Walton Scheme 완전성 (Scheme Completeness)

논증이 Walton scheme 구조를 갖추고 있는가?

- **Scheme 선택**: scheme 필드가 명시되어 있는가? (`walton-schemes.md` 10개 + Custom)
- **CQ 응답 존재**: `## CQ Responses` 섹션에 해당 scheme의 CQs가 모두 열거되었는가?
- **복합 scheme 처리**: 복합 scheme인 경우(예: Expert Opinion + Cause to Effect) 두 scheme의 CQs가 모두 포함되었는가?
- **depth cap 준수**: CQ 답변 depth가 2를 초과하지 않았는가?

각 항목을 `complete` | `partial` | `missing` 으로 분류한다.

## 2. CQ 응답 품질 (CQ Response Quality)

각 CQ 답변이 충분한 근거를 갖추고 있는가?

- **confidence 분포**: 각 CQ의 confidence 점수(0-4) 확인 — confidence ≤1은 미충족
- **미충족 CQ 수**: scheme별 허용 상한(`calibration-guide.md`)과 비교
  - Cause to Effect, Classification: 미충족 0개 허용 (엄격)
  - Expert Opinion, Sample to Population, Analogy, Practical Reasoning: 1개 허용
  - Sign, Position to Know, Popular Opinion: 2개 허용 (여유)
- **depth 2 항복 처리**: 항복 선언된 CQ가 미충족으로 카운트되었는가?
- **순환 답변**: CQ 답변이 원래 Claim을 반복하지 않는가?

## 3. 근거 품질 (Evidence Quality)

`source-credibility.md`의 T1-T4 기준 적용:

- T1 (학술/공식 데이터): 동료 심사, 정부 통계
- T2 (업계 보고서): 리서치 기관, 전문 매체
- T3 (일반 매체): 뉴스, 블로그, 인터뷰
- T4 (의견/추정): 개인 의견, 출처 없는 주장

각 근거를 T1-T4로 평가. 방법론, 표본 크기, 데이터 현재성도 점검.
CQ 답변에 사용된 출처도 동일 기준으로 평가한다.

## 4. Confidence 적정성 (Calibration)

Tetlock probability band(`calibration-guide.md`)가 근거·CQ 강도에 비해 적절한가?

- **Overclaiming**: `virtually certain` 또는 `very likely` + 약한 grounds 또는 다수 미충족 CQ
- **Underclaiming**: T1 grounds + 모든 CQ 충족인데 `uncertain` 이하 → 불필요한 약화
- Confidence band 척도: `virtually certain (95%+)` > `very likely (80-95%)` > `likely (60-80%)` > `uncertain (40-60%)` > `unlikely (20-40%)`
- Primary claim(≥60%): T1/T2 grounds 필요. Supporting claim(<60%): T3/T4 허용

## 5. CQ 미응답 커버리지 (Blind Spot Coverage)

인지하지 못한 반론과 미응답 CQ가 드러내는 취약점 탐색:

- **미충족 CQ 함의**: confidence ≤1인 CQ가 지적하는 논증의 실질적 약점은?
- **scheme 미적용 영역**: 선택한 scheme 외에 추가로 적용 가능한 scheme과 그 CQs가 있는가? (복합 scheme 누락 점검)
- **Scope 외부 문제**: 어떤 조건에서 Claim이 깨지는가? Scope 바깥의 반례는?
- **depth 항복 지점**: depth 2에서 항복한 CQ가 남긴 미해결 논점은?

---

## 심각도 기준 (Severity)

| 수준 | 정의 |
|------|------|
| **critical** | 논증 구조적 실패. Scheme 미선택, CQs 전혀 미응답, 미충족 CQ가 임계값을 크게 초과(2개 이상 초과). Claim이 무너질 수 있다. |
| **major** | 중요한 약점. Confidence 과대설정(Overclaiming), T4 grounds 의존, 핵심 CQ 미응답 (임계값 1개 초과). 주장을 약화시키나 즉시 무너뜨리지는 않는다. |
| **minor** | 개선 가능한 부분. CQ depth 2 근접, 오래된 데이터, Confidence 약간 과대설정, 복합 scheme 누락 가능성. 실질적 영향 적음. |
