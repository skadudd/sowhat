# Critique Dimensions — 5차원 논증 비평 기준

sowhat-critic-agent와 sowhat-self-critic-agent가 공유하는 논증 비평 5차원 정의.

---

## 1. Toulmin 완전성 (Completeness)

- Missing Claim: 핵심 주장이 명시적인가, 암묵적인가?
- Missing Grounds: 근거가 제시되었는가? 몇 개인가?
- Missing Warrant: Grounds → Claim 연결 원칙이 명시되었는가?
- Missing Backing: Warrant를 지지하는 추가 근거가 있는가?
- Missing Qualifier: 확실성 수준이 명시되었는가?
- Missing Rebuttal: 반론 조건이 인정되었는가?

각 필드를 `present` | `implicit` | `missing` 으로 분류한다.

## 2. Warrant 유효성 (Validity)

`challenge-algorithm.md`의 Warrant 검증과 동일한 기준 적용:

- **Non-sequitur**: Grounds가 Claim을 논리적으로 지지하지 않음
- **Missing link**: A → C 점프, 중간 단계(B) 없음
- **Circular**: Warrant가 Claim을 그대로 반복

## 3. 근거 품질 (Evidence Quality)

`source-credibility.md`의 T1-T4 기준 적용:

- T1 (학술/공식 데이터): 동료 심사, 정부 통계
- T2 (업계 보고서): 리서치 기관, 전문 매체
- T3 (일반 매체): 뉴스, 블로그, 인터뷰
- T4 (의견/추정): 개인 의견, 출처 없는 주장

각 근거를 T1-T4로 평가. 방법론, 표본 크기, 데이터 현재성도 점검.

## 4. Qualifier 적정성 (Appropriateness)

주장 확실성이 근거 강도에 비해 적절한가?

- **Overclaiming**: "반드시" + 약한 근거 → 과대 주장
- **Underclaiming**: 강한 근거인데 "아마도" → 불필요한 약화
- Qualifier 강도 척도: definitely(0) > usually(1) > in most cases(2) > presumably(3) > possibly(4)

## 5. Rebuttal 커버리지 (Coverage)

인지하지 못하는 반론(blind spot) 탐색:

- 어떤 조건에서 Claim이 거짓이 되는가?
- 언급하지 않은 반례는?
- Scope 외부에서 발생하는 문제는?

---

## 심각도 기준 (Severity)

| 수준 | 정의 |
|------|------|
| **critical** | 논증 구조적 실패. Warrant 부재, 순환 논증, 근거 없는 핵심 주장. 주장이 무너질 수 있다. |
| **major** | 중요한 약점. Qualifier 과대주장, T4 근거 의존, 핵심 반론 미대응. 주장을 약화시키나 즉시 무너뜨리지는 않는다. |
| **minor** | 개선 가능한 부분. 암묵적 Warrant, 오래된 데이터, 사소한 scope 문제. 실질적 영향 적음. |
