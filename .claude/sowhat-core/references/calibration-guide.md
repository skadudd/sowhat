---
source: "Tetlock & Gardner, Superforecasting (Crown, 2015)"
version: "3.0.0"
---

# Calibration Guide — Tetlock Probability Bands

sowhat v3.0.0부터 Toulmin의 Qualifier(definitely/usually/possibly)를 대체한다.
모호한 부사 대신 확률 범위 또는 anchor 어휘를 사용한다.

## Anchor 어휘 정의

| 어휘 | 확률 범위 | 사용 기준 |
|---|---|---|
| `virtually certain` | 95%+ | 강한 empirical 증거 + 전문가 합의 |
| `very likely` | 80-95% | 충분한 증거, 반론이 약함 |
| `likely` | 60-80% | 근거 있으나 불확실성 존재 |
| `uncertain` | 40-60% | 증거 불충분 또는 상충 |
| `unlikely` | 20-40% | 반증이 더 강함 |
| `very unlikely` | 5-20% | 반증 충분 |
| `virtually impossible` | <5% | 거의 불가능한 수준의 반증 |

숫자(%)를 직접 써도 된다. anchor 어휘는 숫자 쓰기 어색할 때 대안으로 사용.

## Claim Tier 흡수 (v2.x Tier-A/B → confidence threshold)

v2.x의 `claim_tier: A` / `claim_tier: B`가 다음 기준으로 흡수된다:

| 구분 | confidence | Source 요건 | 의미 |
|---|---|---|---|
| Primary claim (구 Tier-A) | ≥60% (`likely` 이상) | T1/T2 source 필요 | 핵심 주장 |
| Supporting claim (구 Tier-B) | <60% (`uncertain` 이하) | T3/T4 허용 | 보조 주장 |

confidence가 60% 미만이면 → 자동 supporting claim. settle 게이트에서 T1/T2 source를 강제 적용하지 않는다.

## CQ 답변 confidence — D2 기준

Walton scheme의 각 CQ 답변에 confidence 점수를 부여한다.
LLM이 confidence를 판정하는 것을 금지 — **confidence는 writer의 자가 선언**이다.

| 점수 | 의미 |
|---|---|
| 4 | 강한 근거 — T1/T2 source 직접 인용 |
| 3 | 적당 근거 — T3 source 또는 명확한 1차 데이터 |
| 2 | 약한 근거 — T4 source 또는 정황 |
| 1 | 추측 — 근거 없는 의견 |
| 0 | 답할 수 없음 |

**미충족 규칙**: confidence ≤ 1인 CQ는 미충족으로 처리된다.

## Scheme별 미충족 허용 상한 (settle 차단 임계값)

미충족 CQ 수가 아래 상한을 초과하면 → settle 차단.
Writer가 override할 경우 사유 기록 필수.

| Scheme | 미충족 허용 상한 | 비고 |
|---|---|---|
| Expert Opinion | 1개 | |
| Sample to Population | 1개 | |
| Cause to Effect | 0개 | 인과 주장은 엄격 |
| Effect to Cause | 1개 | |
| Analogy | 1개 | |
| Sign | 2개 | 정황 특성상 여유 |
| Classification | 0개 | 정의는 엄격 |
| Practical Reasoning | 1개 | |
| Position to Know | 2개 | 증언 특성상 여유 |
| Popular Opinion | 2개 | |
| Custom | 1개 | 기본값, writer 조정 가능 |

## Source Tier 기준 (참조)

CQ 답변에서 Source Tier를 참조할 때 → `@source-credibility.md`
