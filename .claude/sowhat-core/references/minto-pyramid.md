# Minto Pyramid Principle — 문서 구조 프레임워크

sowhat의 문서 산출물(draft)은 바바라 민토의 피라미드 원칙을 기본 구조 이론으로 사용한다.
Toulmin 모델이 **논증의 품질**을 보장한다면, 민토 피라미드는 **전달의 구조**를 보장한다.

---

## 핵심 원리

### 1. Top-Down Communication (결론 선행)

독자가 가장 먼저 알아야 할 것은 **결론(Answer)**이다.
근거와 세부사항은 결론을 뒷받침하기 위해 아래로 전개된다.

```
Level 0: Answer (Thesis Answer)
Level 1: Key Arguments (Supporting Points)
Level 2: Grounds/Evidence (Details per Argument)
Level 3: Data/Examples (Specific evidence items)
```

**sowhat 매핑**:
- Level 0 = `00-thesis.md`의 Answer
- Level 1 = 각 섹션의 Claim (Key Arguments)
- Level 2 = 각 섹션의 Grounds + Warrant
- Level 3 = Research findings, Backing

### 2. SCQA Framework (도입부 구조)

모든 문서의 도입부는 SCQA로 구성한다:

| 요소 | 정의 | sowhat 매핑 |
|------|------|------------|
| **S**ituation | 독자가 이미 알고 있는 사실 | `00-thesis.md` Situation |
| **C**omplication | 상황을 흔드는 변화/문제 | `00-thesis.md` Complication |
| **Q**uestion | Complication이 제기하는 핵심 질문 | `00-thesis.md` Question |
| **A**nswer | 질문에 대한 답 (=결론) | `00-thesis.md` Answer |

**도입부 변형**:
- **표준형 (SCQA)**: 설득이 필요한 독자 → S→C→Q→A 순서
- **직접형 (AQSC)**: 결론을 아는 독자 → A→Q→S→C (임원 보고)
- **관심형 (QSCA)**: 호기심 유발 → Q→S→C→A (블로그, 소셜)
- **스토리형 (SCAQ)**: 서사적 전개 → S→C→A→Q→A2 (영상, 프레젠테이션)

### 3. Grouping Logic (논거 그룹화)

Level 1의 Key Arguments는 반드시 **논리적 순서**로 배열한다.
민토는 3가지 그룹화 원칙을 제시한다:

| 원칙 | 설명 | 적합한 경우 | 예시 |
|------|------|-----------|------|
| **시간 순서** (Chronological) | 선후관계, 단계적 진행 | 프로세스, 로드맵, 역사적 맥락 | "1단계→2단계→3단계" |
| **구조 순서** (Structural) | 전체를 부분으로 나눈 것 | 시스템 분석, 조직 구조, MECE 분해 | "기술/시장/팀" |
| **중요도 순서** (Degree) | 중요한 것부터 덜 중요한 것 | 우선순위 결정, 자원 배분 | "핵심→부가→선택" |

**MECE 검증**: 어떤 그룹화를 선택하든, Key Arguments는 MECE여야 한다.
- Mutually Exclusive: 논거 간 중복 없음
- Collectively Exhaustive: 합치면 Answer를 완전히 뒷받침

### 4. Pyramid Layers (피라미드 계층)

```
          ┌─────────┐
          │ Answer  │ ← 핵심 메시지 (1개)
          └────┬────┘
     ┌─────────┼─────────┐
     │         │         │
┌────┴───┐┌───┴────┐┌───┴────┐
│ KA 1   ││ KA 2   ││ KA 3   │ ← Key Arguments (2-5개)
└────┬───┘└───┬────┘└───┬────┘
  ┌──┴──┐  ┌──┴──┐  ┌──┴──┐
  │G1 G2│  │G3 G4│  │G5 G6│ ← Grounds/Evidence
  └─────┘  └─────┘  └─────┘
```

**계층 규칙**:
- 각 레벨은 아래 레벨의 **요약**이어야 한다
- 같은 레벨의 항목은 **동일한 추상화 수준**이어야 한다
- 각 그룹은 **2~5개** 항목으로 구성 (인지 부하 제한)

---

## 문서 구조 프레임워크

### 기본 3단 구조 (모든 형식의 뼈대)

```
I.  도입부 (Introduction)
    - SCQA 변형 중 하나로 구성
    - 독자의 주의를 잡고 핵심 메시지 전달

II. 전개부 (Body)
    - Key Arguments를 그룹화 원칙에 따라 배열
    - 각 KA 아래에 Grounds + Warrant + Backing
    - 반론 대응 (Rebuttal) 포함

III. 결론부 (Conclusion)
    - Answer 재강조
    - Call-to-Action 또는 시사점
    - Open Questions (선택적)
```

### 확장 구조 (장문 콘텐츠)

```
I.   도입부
II.  배경/맥락 (Situation + Complication 상세)
III. 핵심 주장 1 (KA1 + Grounds + Rebuttal)
IV.  핵심 주장 2 (KA2 + Grounds + Rebuttal)
V.   핵심 주장 3 (KA3 + Grounds + Rebuttal)
VI.  종합 분석 (Cross-cutting insights)
VII. 결론 및 제언
VIII.부록 (Open Questions, 참고자료)
```

### 시리즈 구조 (멀티파트 콘텐츠)

```
Part 1: 도입 + 문제 정의 (SCQA)
Part 2~N-1: 각 Key Argument를 독립 콘텐츠로
Part N: 종합 + 결론 + CTA

각 파트는 자체적으로 SCQA 미니 구조를 가짐:
  S: 전편 요약 / 시리즈 맥락
  C: 이 파트에서 다룰 긴장
  Q: 이 파트의 핵심 질문
  A: 이 파트의 답
```

---

## 증거 제시 깊이 (Evidence Depth)

문서의 목적과 독자에 따라 증거 제시 수준을 조절한다:

| 레벨 | 이름 | 설명 | 사용 시 |
|------|------|------|--------|
| 1 | **주장 중심** (Claim-heavy) | Claim만, Grounds 최소 인용 | 소셜미디어, 슬라이드, 요약 |
| 2 | **균형형** (Balanced) | Claim + 핵심 Grounds 1-2개 | 블로그, 뉴스레터, 임원 보고 |
| 3 | **근거 상세** (Evidence-rich) | Claim + 전체 Grounds + Warrant | 제안서, 의사결정 문서 |
| 4 | **학술형** (Academic) | 전체 Toulmin 구조 + 출처 명시 + 방법론 | 논문, 연구 기획서, 백서 |

---

## Toulmin ↔ Minto 통합

sowhat에서 두 프레임워크는 상호보완적으로 작동한다:

| Toulmin (논증 품질) | Minto (전달 구조) | 역할 |
|-------------------|-----------------|------|
| Claim | Key Argument heading | 무엇을 주장하는가 |
| Grounds | Evidence paragraphs | 왜 믿어야 하는가 |
| Warrant | Transition/Connection | 어떻게 연결되는가 |
| Backing | Footnote/Appendix | 깊이 파고들 때 |
| Qualifier | Hedging language | 얼마나 확실한가 |
| Rebuttal | Counter-response section | 반론은 어떻게 되는가 |
| Answer (Thesis) | Pyramid apex | 핵심 메시지 |
| SCQ (Thesis) | SCQA opening | 도입부 구조 |

---

## 구조 조정 가이드

사용자가 제안된 구조를 조정할 때 허용되는 변경:

1. **SCQA 순서 변경**: 4가지 변형 중 선택
2. **그룹화 원칙 변경**: 시간→구조→중요도 간 전환
3. **KA 순서 재배열**: 같은 그룹화 원칙 내에서 순서 변경
4. **섹션 병합/분리**: 2개 KA를 하나로 합치거나, 1개를 2개로 분할
5. **증거 깊이 조절**: 전체 또는 섹션별로 레벨 변경
6. **부가 섹션 추가/제거**: 부록, FAQ, 용어집, 참고문헌 등

변경 **불가**:
- Answer 자체 변경 (→ `/sowhat:revise 00-thesis` 사용)
- Grounds 내용 변경 (→ `/sowhat:revise {section}` 사용)
- 새로운 Key Argument 추가 (→ `/sowhat:expand` 사용)
