---
source: "Walton, Reed, Macagno, Argumentation Schemes (Cambridge, 2008); Walton, Methods of Argumentation (Cambridge, 2013)"
version: "3.0.0"
---

# Walton Argumentation Schemes

sowhat v3.0.0부터 Toulmin 6필드(claim/grounds/warrant/backing/qualifier/rebuttal)를 대체한다.
각 scheme은 추론 *종류*를 식별하고, 그 종류에 적합한 Critical Questions(CQs)를 제공한다.

## Defeasible Reasoning 원칙

Walton scheme은 **defeasible** — 반박 가능한 추론을 다룬다.
CQ에 답하지 못한다고 해서 주장이 틀린 것이 아니라, 그 주장의 **강도가 약해진다**.
settle 게이트는 이 강도를 confidence 점수(0-4)로 측정한다. → `@calibration-guide.md`

## Scheme 분류 규칙 (D1 — 하이브리드)

1. **Writer가 scheme 1개 이상 명시** (필수 — expand 스텝 2에서)
2. **LLM이 추가 scheme 후보 제안** ("Y scheme도 가능, 두 CQs 모두 활성화할까요?")
3. **Writer가 최종 확정** (단일 또는 복합)
4. 복합 scheme 확정 시 → 모든 scheme의 CQs를 다 적용

함정 및 복합 패턴 → `@walton-pitfalls.md`

---

## 10 Scheme 카탈로그

### 1. Expert Opinion (전문가 인용)
전문가 E가 P를 주장한다 → P를 채택할 이유가 있다.

**Pattern**: E는 D 분야 전문가 + E는 P를 주장한다 → P를 채택해야 한다

**CQs**:
1. E는 D 분야의 진짜 전문가인가? (자격·경력 확인 가능?)
2. E는 실제로 P를 주장했는가? (인용 정확성)
3. 해당 분야 다른 전문가들도 P에 동의하는가?
4. P에 대해 E에게 이해관계나 편향이 있지 않은가?
5. E의 주장이 검증 가능한 증거에 기반하는가?

**복합 주의**: E가 인과 관계를 주장하면 → Expert Opinion + Cause to Effect 동시 적용

---

### 2. Sample to Population (통계·데이터 일반화)
표본에서 관찰된 비율·패턴이 모집단에서도 성립한다.

**Pattern**: 표본 S에서 r비율로 F 속성 관찰 → 모집단에서도 r비율로 F 속성 추정

**CQs**:
1. 표본 크기가 통계적으로 충분한가?
2. 표본이 모집단을 대표하는가? (선택 편향 없음)
3. 교란 변수를 통제했는가?
4. 측정 방법이 일관됐는가?
5. 결과가 통계적으로 유의한가? (신뢰구간·p-value)

---

### 3. Cause to Effect (인과 추론)
원인 C가 발생하면 결과 E가 발생한다.

**Pattern**: C가 일반적으로 E를 유발한다 + 이 경우 C가 발생했다 → E가 발생할 것이다

**CQs**:
1. C가 실제로 E의 원인인가? (correlation ≠ causation)
2. C가 E의 충분 조건인가, 필요 조건인가?
3. 다른 원인이 E를 유발할 수 없는가?
4. C→E 메커니즘이 이 맥락에서도 작동하는가?

---

### 4. Effect to Cause (역 인과·진단)
결과 E가 관찰된다 → 원인 C가 있었을 것이다.

**Pattern**: E가 관찰된다 + C가 일반적으로 E를 유발한다 → C가 있었을 것이다

**CQs**:
1. E를 유발할 수 있는 다른 원인들이 없는가?
2. C→E 관계가 이 맥락에서 성립하는가?
3. E의 관찰 자체가 신뢰할 만한가?
4. C의 존재를 독립적으로 확인할 수 있는가?

---

### 5. Analogy (유추)
A와 B가 관련 측면에서 유사하다 → A에서 P가 성립하면 B에서도 P가 성립한다.

**Pattern**: A는 B와 r 측면에서 유사하다 + A에서 P가 성립한다 → B에서도 P가 성립한다

**CQs**:
1. A와 B의 유사성이 실질적인가? (표면적 유사 vs 구조적 유사)
2. P와 관련해서 A와 B의 차이점이 결론을 바꾸지 않는가?
3. A에서 P가 성립한다는 근거가 충분한가?
4. 이 비교를 부적합하게 만드는 차이점이 있지 않은가?

---

### 6. Sign (정황 증거)
징후 A가 관찰된다 → A는 B의 징후다 → B가 존재한다.

**Pattern**: A가 보통 B와 함께 나타난다 + A가 관찰된다 → B가 존재한다

**CQs**:
1. A와 B의 징후 관계가 신뢰할 만한 규칙성인가?
2. A가 B 이외의 것의 징후일 가능성은 없는가?
3. A의 관찰 자체가 신뢰할 만한가?
4. A가 B의 징후가 되려면 다른 조건이 필요하지 않은가?

---

### 7. Classification (정의·분류)
X는 범주 C에 속한다 + C는 특성 F를 가진다 → X는 F를 가진다.

**Pattern**: X는 F를 가진다 + F를 가진 것은 G이다 → X는 G이다

**CQs**:
1. X가 해당 범주에 속한다는 기준이 명확하고 충족되는가?
2. 범주 정의가 이 맥락에서 적합하게 적용되는가?
3. X에게 범주의 특성 F가 적용되지 않는 예외가 없는가?
4. 범주 자체가 이 논증에서 논쟁 대상이 아닌가?

---

### 8. Practical Reasoning (목표 → 수단)
목표 G를 달성하려면 행동 A가 필요하다 → A를 해야 한다.

**Pattern**: 목표 G를 달성하려 한다 + A를 하면 G를 달성할 수 있다 → A를 해야 한다

**CQs**:
1. A가 G를 달성하는 데 실제로 효과적인가?
2. A 이외의 G 달성 수단은 없는가? (더 나은 수단 검토)
3. A가 G 달성을 위해 필요 충분 조건인가?
4. A의 부작용이 G의 이점을 상쇄하지 않는가?
5. G가 달성할 가치 있는 목표인가?

---

### 9. Position to Know (목격·내부자 증언)
P는 A를 직접 알 수 있는 위치에 있다 + P는 A가 맞다고 주장한다 → A가 맞다.

**Pattern**: P는 A가 참인지 알 위치에 있다 + P는 A가 참이라고 말한다 → A가 참이다

**CQs**:
1. P가 실제로 A를 알 수 있는 위치에 있는가?
2. P에게 정직하게 말할 동기가 있는가? (이해관계 검토)
3. P의 기억이나 관찰이 신뢰할 만한가?
4. P의 진술이 다른 증거와 일치하는가?

---

### 10. Popular Opinion (사회 통념)
대부분의 사람들이 A를 받아들인다 → A를 받아들일 이유가 있다.

**Pattern**: 대부분의 사람들이 A를 받아들인다 → A는 참이거나 받아들일 만하다

**CQs**:
1. 실제로 대부분이 A를 믿는가? (통계·증거 존재?)
2. 관련 분야 전문가들도 A를 받아들이는가?
3. 다수 의견이 이 종류의 주장에서 신뢰할 만한 지표인가?
4. 과거에 다수 의견이 유사한 유형의 주장에서 틀린 사례가 있지 않은가?

---

## Custom Fallback

위 10개 scheme에 해당하지 않는 추론이 필요할 때:

```yaml
scheme: Custom
custom_description: "[추론 패턴 한 줄 설명]"
cqs:
  - "[직접 작성한 CQ 1]"
  - "[직접 작성한 CQ 2]"
  - "[직접 작성한 CQ 3]"
```

## 전체 카탈로그

60+ scheme 전체: `references/walton-schemes-full.md` (참고용만 — sowhat 게이트에서 미사용)
