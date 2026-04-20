# Output Profiles — 산출물 프로파일 시스템

sowhat의 논증 결과를 다양한 파이프라인으로 내보내기 위한 프로파일 정의.
하나의 프로젝트에서 여러 프로파일을 생성·저장·재사용할 수 있다.

---

## 프로파일 개념

sowhat 프로젝트는 **완벽한 논증**을 구성하는 것이 목적이다.
프로파일은 이 논증을 **특정 목적·독자·채널에 맞게 변환**하는 설정이다.

```
sowhat 논증 (Toulmin + Minto)
    ├─→ Profile A: 투자 유치 IR 자료 (PDF 제안서)
    ├─→ Profile B: 링크드인 시리즈 (5편)
    ├─→ Profile C: GSD 구현용 PRD
    ├─→ Profile D: 팀 보고서 (주간 리포트)
    └─→ Profile E: 학술 논문 초안
```

---

## 프로파일 스키마

### 필수 필드

```yaml
# export/profiles/{profile-id}.yml
id: "linkedin-series"           # kebab-case 고유 ID
name: "링크드인 시리즈 콘텐츠"     # 사람이 읽는 이름

# ── 산출물 정의 ──
deliverable: "linkedin-post"    # 구체적 산출물 유형 (아래 목록 참조)
purpose: "B2B SaaS 의사결정자에게 문제 인식을 심고 리드 확보"  # 왜 만드는가
goal: "시리즈 완독 후 데모 신청 전환"                         # 성공 기준
target_audience:                # 구체적 독자 정의
  who: "B2B SaaS 기업의 VP of Engineering"
  knows: "소프트웨어 아키텍처, 팀 관리, 기술 부채"
  doesnt_know: "우리 솔루션의 존재와 구체적 가치"
  cares_about: "팀 생산성, 비용 절감, 기술적 리스크 최소화"

# ── 구조 설정 ──
structure:
  scqa_variant: "standard"      # standard | direct | curiosity | story
  grouping: "importance"        # chronological | structural | importance
  evidence_depth: 2             # 1=주장중심 | 2=균형 | 3=근거상세 | 4=학술
  intro_style: "hook"           # hook | context | question | direct

# ── 길이/시리즈 설정 ──
length:
  mode: "series"                # single | series
  target_words: 1500            # single일 때: 전체 목표 단어 수
  series_config:                # series일 때만
    parts: 5                    # 파트 수 (0=자동 계산)
    words_per_part: 1200        # 파트당 목표 단어 수
    series_title: "왜 X가 Y를 바꾸는가"
    cliffhanger: true           # 다음 편 예고 포함 여부
```

### 선택 필드

```yaml
# ── 톤/스타일 ──
tone: "professional-warm"       # formal | professional-warm | conversational | academic | provocative
language: "ko"                  # ko | en | mixed (한영 혼합)

# ── 구조 커스터마이즈 ──
custom_sections:                # 기본 3단 구조 외 추가/제거
  prepend: ["요약 (TL;DR)"]
  append: ["FAQ", "참고자료"]
  exclude: ["부록"]

# ── 채널별 제약 ──
channel_constraints:
  max_chars: 3000               # 글자 수 제한 (소셜)
  hashtags: true                # 해시태그 포함
  cta_type: "link"              # link | button | question | none
  visual_cues: true             # 시각자료 큐 포함

# ── 메타데이터 ──
created: "2024-01-15T14:30:45Z"
updated: "2024-01-15T14:30:45Z"
last_generated: null            # 마지막 생성 시각
generation_count: 0             # 이 프로파일로 생성한 횟수
```

---

## 산출물 유형 (deliverable)

### 비즈니스 문서
| 유형 | 설명 | 기본 길이 | 기본 증거 깊이 |
|------|------|----------|--------------|
| `executive-summary` | 임원용 핵심 요약 | 1000-1500 words | 2 (균형) |
| `proposal` | 상세 제안서/기획서 | 3000-5000 words | 3 (근거상세) |
| `investment-deck` | 투자 유치 자료 | 2000-3000 words | 2 (균형) |
| `decision-doc` | 내부 의사결정 문서 | 2000-4000 words | 3 (근거상세) |
| `whitepaper` | 백서 | 5000-8000 words | 4 (학술) |
| `report` | 보고서 (주간/월간/분기) | 1500-3000 words | 2 (균형) |

### 디지털 콘텐츠
| 유형 | 설명 | 기본 길이 | 기본 증거 깊이 |
|------|------|----------|--------------|
| `blog-post` | 블로그 포스트 | 1500-2500 words | 2 (균형) |
| `linkedin-post` | 링크드인 포스트/아티클 | 500-1500 words | 1-2 |
| `twitter-thread` | X/Twitter 스레드 | 10-20 tweets | 1 (주장중심) |
| `instagram-carousel` | 인스타그램 캐러셀 | 8-12 slides | 1 (주장중심) |
| `newsletter` | 이메일 뉴스레터 | 800-1500 words | 2 (균형) |
| `youtube-script` | 유튜브 영상 스크립트 | 분당 150 words | 2 (균형) |
| `podcast-script` | 팟캐스트 스크립트 | 분당 130 words | 2 (균형) |

### 프레젠테이션
| 유형 | 설명 | 기본 길이 | 기본 증거 깊이 |
|------|------|----------|--------------|
| `slide-deck` | 프레젠테이션 슬라이드 | 10-20 slides | 1-2 |
| `pitch-deck` | 피치덱 (투자/사업) | 10-15 slides | 2 (균형) |
| `workshop-material` | 워크숍/교육 자료 | 가변 | 3 (근거상세) |

### 학술/연구
| 유형 | 설명 | 기본 길이 | 기본 증거 깊이 |
|------|------|----------|--------------|
| `research-plan` | 연구 기획서 | 3000-5000 words | 4 (학술) |
| `paper-draft` | 논문 초안 | 5000-10000 words | 4 (학술) |
| `literature-review` | 문헌 검토 | 3000-6000 words | 4 (학술) |

### 파이프라인 연동
| 유형 | 설명 | 대상 시스템 |
|------|------|-----------|
| `prd` | Product Requirements Document | GSD, Jira, Linear |
| `gsd-export` | GSD PROJECT.md + REQUIREMENTS.md | /gsd:new-project |
| `user-story` | 사용자 스토리 모음 | Jira, Linear, GitHub Issues |
| `api-spec` | API 명세서 | Swagger/OpenAPI |

---

## 구조 프레임워크 (Structure Frameworks)

### 프레임워크 목록

각 deliverable에는 기본 구조 프레임워크가 있으며, 사용자가 조정할 수 있다.

#### 1. 피라미드형 (Pyramid) — 기본값

```
Answer (결론)
├── Key Argument 1
│   ├── Ground 1.1
│   └── Ground 1.2
├── Key Argument 2
│   ├── Ground 2.1
│   └── Ground 2.2
└── Key Argument 3
    ├── Ground 3.1
    └── Ground 3.2
```

적합: 제안서, 보고서, 의사결정 문서

#### 2. 서사형 (Narrative)

```
Hook (관심 포착)
→ 배경 (Situation)
→ 갈등/문제 (Complication)
→ 전개 (Key Arguments as story beats)
→ 전환점 (Rebuttal + 대응)
→ 해결 (Answer + CTA)
```

적합: 블로그, 소셜미디어, 영상 스크립트

#### 3. 문제-해결형 (Problem-Solution)

```
Problem (문제 정의)
→ Impact (문제의 영향)
→ Root Cause (원인 분석)
→ Solution (해결책)
→ Evidence (효과 증명)
→ Action (다음 단계)
```

적합: 투자 제안, 컨설팅 보고서, 피치덱

#### 4. 비교형 (Comparative)

```
Context (비교 배경)
→ Option A vs Option B vs Option C
→ Criteria (평가 기준)
→ Analysis (기준별 비교)
→ Recommendation (권고)
→ Rationale (근거)
```

적합: 의사결정 문서, 기술 선택 보고서

#### 5. PREP형 (Point-Reason-Example-Point)

```
Point (핵심 주장)
→ Reason (이유)
→ Example (사례)
→ Point (재강조)
```

적합: 소셜미디어, 짧은 콘텐츠, 엘리베이터 피치

#### 6. 학술형 (Academic)

```
Abstract (요약)
→ Introduction (서론 + 연구 질문)
→ Literature Review (선행 연구)
→ Methodology (방법론)
→ Findings (발견)
→ Discussion (논의)
→ Conclusion (결론)
→ References (참고문헌)
```

적합: 논문, 연구 기획서, 백서

---

## 시리즈 구성 규칙

### 자동 분할 알고리즘

`series_config.parts: 0` (자동)일 때:

1. Key Arguments 수를 기준으로 분할:
   - KA 1-2개: 3편 시리즈 (도입 + KA합본 + 결론)
   - KA 3개: 5편 (도입 + KA×3 + 결론)
   - KA 4-5개: KA수 + 2편 (도입 + KA별 + 결론)
   - KA 6개 이상: 그룹화하여 3-5 그룹 → 그룹수 + 2편

2. 각 파트 구조:
   ```
   Part 1 (도입편):
     - 시리즈 SCQA (전체 맥락)
     - 시리즈 로드맵 (앞으로 다룰 내용 예고)
     - Part 1 Answer (맛보기)

   Part 2~N-1 (본편):
     - 이전 편 1문장 요약
     - 이 파트의 미니 SCQA
     - Key Argument 전개 (Grounds + Warrant)
     - Rebuttal 대응
     - 다음 편 예고 (cliffhanger=true일 때)

   Part N (결론편):
     - 시리즈 전체 요약
     - Answer 재강조
     - 통합 Rebuttal 대응
     - CTA
   ```

### 수동 분할

사용자가 `parts: N`을 지정하면 KA를 N-2 그룹으로 분배한다.
KA가 N-2보다 적으면 하나의 KA를 Grounds 단위로 세분화한다.

---

## 프로파일 저장 및 재사용

### 디렉터리 구조

```
export/
├── profiles/                    # 프로파일 정의
│   ├── linkedin-series.yml
│   ├── investor-deck.yml
│   └── gsd-prd.yml
├── generated/                   # 생성된 산출물
│   ├── linkedin-series/
│   │   ├── part-1.md
│   │   ├── part-2.md
│   │   └── ...
│   ├── investor-deck/
│   │   └── DOCUMENT.md
│   └── gsd-prd/
│       ├── PROJECT.md
│       └── REQUIREMENTS.md
├── ARGUMENT-MAP.md              # 논증 맵 (/sowhat:map --export 로 생성)
└── PRD.md                       # 레거시 호환 (기본 PRD)
```

### 재생성 흐름

프로젝트 완료(`finalized`) 후에도 재생성 가능:

```
/sowhat:draft                    # 새 프로파일 생성
/sowhat:draft --profile {id}     # 기존 프로파일로 재생성
/sowhat:draft --list             # 저장된 프로파일 목록
/sowhat:draft --edit {id}        # 프로파일 설정 수정 후 재생성
```

### config.json 연동

```json
{
  "draft_profiles": {
    "linkedin-series": {
      "file": "export/profiles/linkedin-series.yml",
      "last_generated": "2024-01-15T14:30:45Z",
      "generation_count": 3
    },
    "investor-deck": {
      "file": "export/profiles/investor-deck.yml",
      "last_generated": null,
      "generation_count": 0
    }
  }
}
```

---

## 증거 깊이별 렌더링 규칙

### Level 1: 주장 중심 (Claim-heavy)

```markdown
## 핵심 인사이트

시장은 연 30% 성장 중이며, 지금이 진입 적기입니다.
```

- Claim만 서술
- Grounds: 가장 강한 1개만 수치/사실로 인라인
- Warrant, Backing: 생략
- Rebuttal: 생략 또는 1문장

### Level 2: 균형형 (Balanced)

```markdown
## {섹션 제목}

{Claim 전문}.

{기관} {연도} 보고서에 따르면 {지표}은 {수치}이며,
{기간 동안} {추세}를 유지할 것으로 전망됩니다.

물론 {반론 조건} 가능성은 있지만, {반론에 대한 대응}.
```

> 예시의 `{중괄호}` 값은 실제 섹션 데이터에서 치환된다. AI가 자체로 구체 수치·출처를 생성하면 fabrication이다. `references/fabrication-prevention.md` 참조.

- Claim + 핵심 Grounds 1-2개
- Warrant: 자연스러운 연결 문장으로
- Rebuttal: 1-2문장 반론 대응

### Level 3: 근거 상세 (Evidence-rich)

- Claim + 전체 Grounds + Warrant 명시
- Backing 포함
- Rebuttal 상세 분석
- 출처 인라인 또는 각주

### Level 4: 학술형 (Academic)

- 전체 Toulmin 구조 명시적 기술
- 모든 출처 정식 인용 (APA/MLA)
- 방법론 설명
- 한계점 별도 섹션
- Qualifier 명시적 표기
