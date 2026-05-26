# Source Credibility — 출처 신뢰도 등급

리서치 파인딩의 출처를 4단계 Tier로 분류하고, Tier에 따라 논증 내 사용 범위를 제한한다.
모든 리서치 워크플로우와 challenge 검증이 이 문서를 참조한다.

---

## Tier 정의

| Tier | 이름 | 기준 | Grounds 가중치 | 단독 Grounds 사용 |
|------|------|------|:---:|:---:|
| **T1** | 1차 출처 | 학술 논문(peer-reviewed), 정부/공공기관 통계, 국제기구 보고서(UN/OECD/WHO), 공식 기업 IR/SEC filing, 법률/판례 | **20** | ✅ |
| **T2** | 전문 출처 | 주요 산업 리포트(Gartner/McKinsey/IDC), 공신력 있는 언론(Reuters/Bloomberg/NYT/조선일보/한겨레), 공식 기술 문서, 전문 저널(HBR/MIT Tech Review) | **15** | ✅ |
| **T3** | 준전문 출처 | 전문가 개인 블로그(도메인 전문성 입증), Medium 검증된 저자, Stack Overflow 고평판 답변, 산업 컨퍼런스 발표 자료, 위키피디아(출처 체인 확인 시) | **8** | ⚠️ 2개 이상 교차검증 시만 |
| **T4** | 비검증 출처 | 개인 블로그(네이버 블로그, Tistory, Velog 등), 커뮤니티 게시글(Reddit, Quora, 디시인사이드, 클리앙), SNS(Twitter/X, Facebook), 익명 출처, 출처 불명 기사 | **3** | ❌ 보조 인용 전용 |

---

## 출처 계층 (Source Layer)

Tier(신뢰도 등급)와 별도로, 출처가 데이터의 **원본 생산자인지 가공/보도자인지**를 구분한다.
이 구분은 Stage 0(사실 검증)에서 1차 출처 역추적 여부를 결정하는 데 사용된다.

| 계층 | 정의 | 예시 | 정량 데이터 인용 시 |
|------|------|------|---------------------|
| **Primary** | 데이터 원본 생산자. 직접 수집·측정·공시한 주체 | 통계청 KOSIS, 한국은행 경제통계시스템, 실거래가 공개시스템, 금감원 DART, 국토교통부 고시, Census Bureau, BLS, SEC EDGAR | 그대로 인용 가능 |
| **Secondary** | 원본 데이터를 가공·분석·보도. 원본을 해석하여 전달 | 뉴스 기사, 산업 리포트, 분석 블로그, 학술 리뷰 논문 | 1차 출처 교차검증 권고 |

### 판정 규칙

```
FUNCTION classify_source_layer(source_url, source_content):

  1. Primary 패턴 매칭:
     - 정부 통계 포탈: kosis.kr, kostat.go.kr, data.go.kr, census.gov, bls.gov
     - 공식 DB: rt.molit.go.kr (실거래가), dart.fss.or.kr, sec.gov/edgar
     - 중앙은행: bok.or.kr, federalreserve.gov, ecb.europa.eu
     - 국제기구 데이터: data.worldbank.org, stats.oecd.org
     - 학술 원저: 직접 실험/조사한 논문 (review/meta-analysis 제외)
     매칭 → Primary

  2. Secondary 판정:
     - 위 패턴 미매칭 + 콘텐츠가 다른 출처의 데이터를 인용/분석
     - 뉴스 기사에서 "~에 따르면", "~가 발표한 자료에 의하면" 표현 포함
     → Secondary

  RETURN { layer: "Primary" | "Secondary" }
```

### Tier × Layer 조합 가이드

| Tier | Layer | 정량 데이터 인용 | 정성적 주장 인용 |
|------|-------|:---:|:---:|
| T1 | Primary | ✅ 최고 신뢰 | ✅ |
| T1 | Secondary | ✅ (1차 출처 확인 권고) | ✅ |
| T2 | Primary | ✅ (기업 IR 등) | ✅ |
| T2 | Secondary | ⚠️ 1차 출처 교차검증 필요 (정량 데이터) | ✅ |
| T3 | Secondary | ❌ 교차검증 없이 단독 사용 불가 | ⚠️ 조건부 |
| T4 | Secondary | ❌ | ❌ 보조 인용 전용 |

> **핵심 원칙**: 정량 데이터를 2차 출처에서 인용할 때는, 해당 수치의 1차 출처를 확인하는 것이 기본이다. 뉴스 헤드라인의 수치를 그대로 Grounds에 넣지 않는다.

---

## Tier 판정 알고리즘

```
FUNCTION assess_tier(source_url, source_content):

  1. 도메인 매칭 (domain_whitelist / domain_blacklist):
     - whitelist 매칭 → 해당 Tier 즉시 반환
     - blacklist 매칭 → T4 즉시 반환

  2. 도메인 미매칭 시 콘텐츠 기반 판정:
     a. 저자 자격:
        - 학위/소속기관/업계 경력 명시 → Tier 상향 후보
        - 익명/미상 → T4
     b. 인용/참고문헌:
        - 학술 인용 형식 사용 → T1~T2 후보
        - 인라인 링크만 → T3
        - 인용 없음 → T4
     c. 방법론 기술:
        - 데이터 수집/분석 방법 명시 → T1~T2 후보
        - 주관적 경험만 → T3~T4
     d. 발행 시점:
        - 3년 이내 → 가산 없음
        - 3~5년 → 💡 minor 경고
        - 5년 초과 → ⚠️ major 경고 (통계/시장 데이터에 한해)

  3. 최종 Tier = max(도메인 판정, 콘텐츠 판정)
     - 도메인이 T2이나 콘텐츠가 T3 수준이면 → T2 유지
     - 도메인이 T4이나 콘텐츠가 T2 수준이면 → T3 상향 (T2까지는 불가)

  RETURN { tier, confidence, reasons[] }
```

---

## 도메인 분류 기준

### T1 도메인 패턴 (whitelist)
```
# 학술
*.edu, *.ac.*, scholar.google.com, pubmed.ncbi.nlm.nih.gov,
arxiv.org, doi.org, jstor.org, sciencedirect.com, nature.com,
springer.com, wiley.com, ieee.org

# 정부/공공
*.gov, *.go.kr, *.gov.*, data.gov, census.gov,
kostat.go.kr, kosis.kr, worldbank.org, oecd.org,
who.int, un.org, imf.org, bis.org

# 기업 공시
sec.gov, dart.fss.or.kr, ir.* (기업 IR 페이지)
```

### T2 도메인 패턴
```
# 산업 리포트
gartner.com, mckinsey.com, bcg.com, bain.com,
idc.com, forrester.com, cb-insights.com, statista.com,
pitchbook.com, crunchbase.com

# 주요 언론
reuters.com, bloomberg.com, nytimes.com, wsj.com,
ft.com, economist.com, bbc.com, apnews.com,
chosun.com, hani.co.kr, donga.com, mk.co.kr,
hankyung.com, sedaily.com

# 전문 저널
hbr.org, technologyreview.com, wired.com, arstechnica.com,
techcrunch.com, theverge.com, zdnet.com
```

### T4 도메인 패턴 (blacklist)
```
# 개인 블로그 플랫폼
*.tistory.com, blog.naver.com, *.velog.io,
brunch.co.kr/@*, *.notion.site (개인 페이지)

# 커뮤니티
reddit.com/r/*, quora.com, dcinside.com,
clien.net, ruliweb.com, ppomppu.co.kr, fmkorea.com

# SNS
twitter.com, x.com, facebook.com, instagram.com,
threads.net, linkedin.com/posts/*

# 콘텐츠 팜/어그리게이터
medium.com/@* (비검증 저자), buzzfeed.com
```

### T3 예외 처리

T4 도메인이라도 다음 조건 충족 시 T3으로 상향:
- **Reddit**: r/science, r/askscience 의 top answer + 소스 인용 포함
- **Medium**: 팔로워 10K+, 전문 출판사(publication) 소속
- **LinkedIn**: 공인된 전문가의 장문 분석 글 (프로필 검증 가능)
- **개인 블로그**: 저자가 해당 분야 석박사/현직 전문가임이 명시

---

## 논증 내 사용 제한

### Grounds 사용 규칙

```
Confidence band별 최소 Tier 요구 (v3.0.0 — Tetlock band):

| Confidence | 단독 사용 가능 Tier | T3 허용 조건 | T4 허용 |
|-----------|:------------------:|:------------:|:-------:|
| virtually certain (95%+) | T1만 | T1 2개 + T3 1개 보조 | ❌ |
| very likely (80-95%) | T1, T2 | T2 1개 + T3 보조 | ❌ |
| likely (60-80%) | T1, T2 | T3 2개 교차검증 | ❌ |
| uncertain (40-60%) | T1, T2, T3 | T3 단독 가능 | ❌ |
| unlikely / very unlikely (<40%) | 모든 Tier | 모든 Tier | CQ 보강으로만 |
```

### T4 출처 활용 규칙
- T4는 CQ 보강 목적으로만 허용 (보조 자료, 일화, 사례) — Grounds 단독 사용 금지
- T4 출처임을 명시해야 함: `(비검증 출처)`

### 교차검증 규칙

T3 출처를 Grounds에 단독 사용할 수 없을 때:
```
교차검증 = 동일 주장을 뒷받침하는 독립된 출처 2개 이상
  - 같은 원본을 인용하는 2개 출처는 교차검증이 아님
  - 동일 저자의 다른 글은 교차검증이 아님
```

---

## Confidence × Source Tier 정합성 매트릭스

섹션의 `confidence` band와 출처 Tier 조합이 정합하는지 확인한다. `challenge-algorithm.md` Stage 0, `settle.md`가 이 매트릭스를 참조한다.
v3.0.0: `claim_tier: A/B` → `confidence` Tetlock band로 대체 (`calibration-guide.md`).

| Confidence | 출처 Tier | 결과 | 비고 |
|:---:|:---:|---|---|
| **Primary** (≥60%, `likely` 이상) | T1 | ✅ 완전 정합 | — |
| **Primary** (≥60%) | T2 | ✅ 허용 | — |
| **Primary** (≥60%) | T3 | ⚠️ major 경고 | 교차검증 2개 이상 시 조건부 허용 |
| **Primary** (≥60%) | T4 | ❌ settle 거부 | Grounds에 T4 단독 불가 |
| **Primary** (≥60%) | 출처 없음 | ⚠️ major | 출처 추가 또는 confidence 하향 검토 |
| **Supporting** (<60%, `uncertain` 이하) | T1-T2 | ✅ 완전 정합 | — |
| **Supporting** (<60%) | T3 | ✅ 허용 | 단독 사용 가능 (confidence 하향 권장) |
| **Supporting** (<60%) | T4 | ⚠️ minor 경고 | confidence `uncertain` 이하 강제 |
| **Supporting** (<60%) | 출처 없음 | 💡 minor | confidence `unlikely` 이면 허용. `likely` 이상 시 major |

> **핵심**: Primary 주장(≥60%)은 T1/T2 수준 출처가 필요하다. Supporting 주장(<60%)은 confidence를 충분히 낮추면 T3/T4 또는 출처 없는 inference도 허용된다 (`[source:inference]` 태그 사용).

---

## Challenge 연동

### Stage 5 (Why So) 강화

기존 근거 유형 평가에 Tier 가중치를 추가한다:

```
기존:
  - 정량 데이터 → strength +2
  - 복수 사례 → strength +1
  - 단일 사례 → strength +0
  - 주장만 → strength -1

Tier 보정:
  각 ground의 strength에 Tier 보정을 적용:
  - T1 출처 기반 → strength × 1.5 (올림)
  - T2 출처 기반 → strength × 1.0 (변경 없음)
  - T3 출처 기반 → strength × 0.7 (내림)
  - T4 출처 기반 → strength × 0.3 (내림)
  - 출처 미명시 → strength × 0.5

  total_strength = sum(각 ground의 보정된 strength)
```

### Stage 6 (Confidence 보정) 강화

Tier를 고려한 적정 Confidence 범위 추정:

```
highest_tier = min(각 ground의 tier)  # 가장 좋은 출처
tier_penalty:
  - 모든 Grounds가 T1/T2 → 0 (감점 없음)
  - T3 비율 > 50% → Confidence 1단계 하향 압력
    (예: very likely → likely, likely → uncertain)
  - T4가 Grounds에 있음 → ⚠️ 사용 위반 경고 + Confidence 강제 하향

adjusted_range = 기존 적정 범위 + tier_penalty
```

---

## Research 워크플로우 연동

### 파인딩 파일 Tier 필드

모든 파인딩 파일 frontmatter에 `tier` 필드를 추가한다:

```yaml
---
id: NNN
type: url | topic | auto | debate | manual
source: "{URL 또는 검색어}"
tier: T1 | T2 | T3 | T4
tier_reasons:
  - "{판정 이유 1}"
  - "{판정 이유 2}"
created: "{ISO8601}"
relevant_sections: ["{section_id}", ...]
status: unreviewed
applied_to: null
stale_reason: null
---
```

### 리서치 출력에 Tier 표시

```
리서치 완료: {N}건 발견 ({source})

[1] {발견} — {source}
    📊 신뢰도: T2 (산업 리포트) — Grounds 사용 가능

[2] {발견} — {source}
    📊 신뢰도: T4 (개인 블로그) — ⚠️ 보조 인용 전용
```

### accept 시 Tier 경고

```
T4 출처를 accept할 때:
  ⚠️ 이 파인딩은 T4 (비검증 출처)입니다.
  Grounds에 단독 사용할 수 없으며, CQ 보강으로만 활용됩니다.
  [1] CQ 보강으로 accept
  [2] reject
```

---

## config.json 연동

```json
"credibility": {
  "custom_whitelist": [],
  "custom_blacklist": [],
  "strict_mode": false
}
```

- `custom_whitelist`: 사용자가 추가하는 T1/T2 도메인
- `custom_blacklist`: 사용자가 추가하는 T4 강제 도메인
- `strict_mode`: `true`이면 T3도 Grounds 단독 사용 불가 (학술 수준)

---

## 핵심 원칙

- **출처 없는 근거는 근거가 아니다** — 출처 미명시 Grounds는 challenge에서 자동 플래그
- **Tier는 도메인 + 콘텐츠 복합 판정** — 도메인만으로 자동 분류하지 않음
- **T4도 가치가 있다** — CQ 보조 인용, 일화, 사용자 목소리 등으로 활용
- **인간이 최종 판단** — Tier는 자동 판정하되, 사용자가 override 가능
- **교차검증은 독립성이 핵심** — 같은 원본 인용은 교차검증이 아님
