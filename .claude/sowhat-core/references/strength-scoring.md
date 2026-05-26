# Argument Strength Scoring — 논증 강도 정량화

각 섹션과 전체 논증 트리의 강도를 0-100 점수로 정량화한다.
progress, challenge, settle 워크플로우가 이 문서를 참조한다.

---

## 섹션 강도 점수 (Section Strength Score)

각 섹션은 4개 차원의 가중 합으로 점수가 결정된다.

### 차원별 배점

| 차원 | 가중치 | 만점 | 측정 대상 |
|------|:------:|:----:|-----------|
| **근거 강도** (Evidence) | 35% | 35 | Grounds 수 × Tier 가중치 × 유형 가중치 |
| **논리 연결** (Logic) | 30% | 30 | CQ 충족률 + CQ 답변 quality |
| **반박 커버리지** (Defense) | 20% | 20 | 미충족 CQ 수 + Steelman 대응 |
| **Confidence 정합성** (Calibration) | 15% | 15 | Confidence band와 근거 강도 일치도 |

### 근거 강도 (0-35)

```
FOR EACH ground IN section.Grounds:
  base_score:
    정량 데이터 (통계, 수치, 연구결과) → 10
    복수 사례/비교 분석 → 7
    단일 사례/인터뷰 → 4
    주장만 (출처 없는 assertion) → 1

  tier_multiplier (source-credibility.md 참조):
    T1 → 1.5
    T2 → 1.0
    T3 → 0.7
    T4 → 0.3
    출처 미명시 → 0.5

  ground_score = base_score × tier_multiplier

evidence_raw = sum(ground_scores)
evidence_score = min(35, evidence_raw)  # 35점 상한
```

### 논리 연결 (0-30)

```
cq_completeness_score (0-15):
  scheme 미설정 → 0
  scheme 설정 + CQ 미대응 (2개 이상 미답변) → 5
  scheme 설정 + CQ 일부 대응 (1개 미답변) → 10
  scheme 설정 + CQ 전체 대응 → 15

cq_quality_score (0-15):
  scheme 미설정 또는 CQ 전혀 없음 → 0
  CQ confidence 평균 ≤1 (추측 수준) → 3
  CQ confidence 평균 2-2.9 (약한 근거) → 8
  CQ confidence 평균 ≥3 (충분한 근거) → 15

logic_score = cq_completeness_score + cq_quality_score
```

### 반박 커버리지 (0-20)

```
unmet_cq_score:
  미충족 CQ(confidence ≤1) 3개+ → 0
  미충족 CQ 2개 → 4
  미충족 CQ 1개 → 8
  미충족 CQ 0개 → 12

steelman_score:
  최강 반론 미대응 → 0
  최강 반론 부분 대응 → 4
  최강 반론 완전 대응 → 8

defense_score = unmet_cq_score + steelman_score
```

### Confidence 정합성 (0-15)

```
# challenge-algorithm.md Stage 6의 적정 범위와 비교 (calibration-guide.md 참조)
IF confidence IN 적정 범위:
  calibration_score = 15
ELIF overclaiming (1단계 차이):
  calibration_score = 8
ELIF overclaiming (2단계+ 차이):
  calibration_score = 0
ELIF underclaiming:
  calibration_score = 10  # underclaiming은 overclaiming보다 덜 심각
```

### 섹션 총점

```
section_score = evidence_score + logic_score + defense_score + calibration_score
# Range: 0-100
```

---

## 전체 논증 강도 (Tree Strength Score)

```
tree_score = weighted_average(각 섹션의 section_score)

가중치:
  - settled 섹션: 1.0
  - discussing 섹션: 0.7
  - needs-revision 섹션: 0.3
  - draft 섹션: 0.1
  - invalidated 섹션: 0.0 (제외)

weakest_link = min(settled 섹션들의 section_score)

# 전체 점수는 평균과 최약 고리 중 낮은 쪽의 영향을 받음
final_tree_score = tree_score × 0.7 + weakest_link × 0.3
```

---

## 등급 분류

| 점수 | 등급 | 시각화 | 의미 |
|------|------|--------|------|
| 90-100 | A | `[██████████]` | 매우 강함 — 출판/발표 가능 |
| 75-89 | B | `[████████░░]` | 강함 — minor 보완 후 출판 가능 |
| 60-74 | C | `[██████░░░░]` | 보통 — major 이슈 해결 필요 |
| 40-59 | D | `[████░░░░░░]` | 약함 — 구조적 보완 필요 |
| 0-39 | F | `[██░░░░░░░░]` | 매우 약함 — 재구성 필요 |

---

## 출력 형식

### 섹션별 강도 (settle, expand 완료 시)

```
📊 논증 강도: {section_score}/100 [{등급}]
  근거     {evidence_bar} {evidence_score}/35
  논리     {logic_bar}    {logic_score}/30
  방어     {defense_bar}  {defense_score}/20
  보정     {calibration_bar} {calibration_score}/15
  {최약 차원이 있으면: ⚠️ 최약 고리: {차원명} — {구체적 이유}}
```

바 형식: 10칸 기준, `█` (채움) + `░` (빔)
예: 24/35 → `[███████░░░]`

### 전체 트리 (progress, challenge 완료 시)

```
📊 전체 논증 강도: {final_tree_score}/100 [{등급}]
  [{bar}]

  섹션별:
  {section_name}  {score}/100 [{등급}] {emoji}
  {section_name}  {score}/100 [{등급}] {emoji}
  ...

  ⚠️ 최약 고리: {weakest section} ({weakest_score}/100)
    → {약한 이유: 근거 부족|CQ 미응답|Confidence 과대설정|...}
```

emoji 규칙:
- 90+ → 💪
- 75-89 → ✅
- 60-74 → ⚠️
- 40-59 → 🔴
- 0-39 → ❌

---

## 워크플로우 연동

### progress
- 대시보드에 전체 트리 점수 + 섹션별 점수 표시
- 가장 약한 섹션을 다음 권장 액션에 반영

### settle
- settle 완료 후 섹션 강도 점수 표시
- 60 미만이면 경고: `⚠️ 논증 강도가 낮습니다 ({score}/100). debate로 강화를 권장합니다.`

### challenge
- 기존 challenge score (통과율)와 함께 strength score도 표시
- challenge 통과 + strength 60 미만: `ℹ️ 논리 결함은 없으나 논증이 약합니다. 근거 보강을 권장합니다.`

### expand
- 각 스텝 완료 시 해당 차원 점수 변화를 표시
- 예: Grounds 추가 후 `근거 강도: 15 → 24 (+9)`

### autonomous (Phase 3에서 구현)
- strength score를 기준으로 다음 작업 결정
- 가장 약한 차원부터 자동 보강

---

## 점수 변경 추적

`logs/argument-log.md`에 점수 변경을 기록한다:

```markdown
## [{datetime}] strength-change({section})
  Before: {old_score}/100
  After: {new_score}/100
  Delta: {차원별 변화}
  Trigger: {expand|debate|revise|challenge}
```

---

## 핵심 원칙

- **점수는 가이드이지 절대 기준이 아니다** — 90점이어도 challenge에서 critical이 나올 수 있음
- **최약 고리가 전체를 결정** — 평균이 높아도 한 섹션이 약하면 전체가 약함
- **Tier가 점수에 직접 영향** — 출처 품질이 논증 품질의 기반
- **overclaiming은 underclaiming보다 심각** — 강한 주장 + 약한 근거가 가장 위험
- **점수는 상대적** — 절대 기준보다 시간에 따른 변화가 더 의미 있음
