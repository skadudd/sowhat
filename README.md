<div align="center">

# SOWHAT

**"So What?" — 주장을 증명하고, 글로 만든다.**

**A structured argumentation skill for Claude Code. Build attack-tested arguments with Toulmin, Walton, and Minto Pyramid frameworks, then produce rigorous documents, PRDs, critique reports, and more.**

[![npm version](https://img.shields.io/npm/v/sowhat-cc)](https://www.npmjs.com/package/sowhat-cc)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

```bash
npx sowhat-cc@latest
```

[왜 만들었나](#왜-만들었나) · [어떻게 동작하나](#어떻게-동작하나) · [시작하기](#시작하기) · [커맨드](#커맨드) · [이론적 토대](#이론적-토대)

</div>

---

## 왜 만들었나

AI에게 글을 쓰게 하면 그럴듯한 문장이 나온다. 하지만 **논리적으로 맞는 글**인지는 보장되지 않는다.

- 주장에 근거가 없다
- 근거와 주장 사이의 연결 고리(Warrant)가 빠져 있다
- 반론을 고려하지 않았다
- "확실히"라고 썼지만 출처가 하나뿐이다

sowhat은 이 문제를 해결한다. **글을 쓰기 전에 논증을 먼저 구축하고, AI 에이전트가 논증을 공격해서, 살아남은 주장만 글이 된다.**

### 무엇을 만들 수 있나

| 산출물 | 설명 |
|--------|------|
| `DOCUMENT.md` | Minto Pyramid 기반 서술형 문서 (리포트, 에세이, 칼럼) |
| `PRD.md` | 구조화된 제품 요구사항 문서 |
| `ARGUMENT-MAP.md` | 텍스트 기반 논증 트리 (감사용) |
| `CRITIQUE-REPORT.md` | 외부 콘텐츠 5차원 비평 리포트 |
| `PROJECT.md` + `REQUIREMENTS.md` | GSD 구현용 export (선택) |

하나의 논증 구조에서 **목적에 맞는 다양한 산출물**을 생성한다. 제품 스펙으로 export하는 것은 여러 활용 중 하나일 뿐이다.

---

## 어떻게 동작하나

### 핵심 원칙

1. **논리가 먼저다** — 완벽하지 않은 논증에서 만든 글은 가치가 없다
2. **Claude는 질문만 한다** — 내용을 대신 채우지 않는다. 인간이 답한 것을 구조화한다
3. **완료는 인간이 선언한다** — Claude가 완료를 판단하지 않는다
4. **상위 논리가 우선한다** — 하위가 settled되어도 thesis에 반하면 되돌아간다

### 2-레이어 구조

```
기획 레이어 (Planning Layer)         명세 레이어 (Spec Layer, 선택)
─────────────────────────────        ──────────────────────────────
00. Thesis (SCQA 프레임)             04. Actors & Personas
01. Key Argument 1                   05. Functional Requirements
02. Key Argument 2                   06. Data Model
03. Key Argument 3                   07. API Design
                                     08. Edge Cases
                                     09. Acceptance Criteria
```

**기획 레이어**는 모든 프로젝트에서 사용된다 — 글을 쓰든, 제품을 만들든. **명세 레이어**는 제품 개발이 목적일 때만 선택적으로 진입한다.

### 섹션 생명주기

```
draft → discussing → settled
                       ↓  challenge 수용 또는 revision
                 needs-revision → discussing → settled
                       ↓  상위 논리 붕괴 시 연쇄
                  invalidated
```

각 섹션은 GitHub Issue와 1:1 연결. settle이 이슈를 닫고, revise가 다시 연다.

### 기본 워크플로

```
/sowhat:init                 # Thesis 수립 (SCQA 핑퐁)
    ↓
/sowhat:expand 01            # 섹션을 Toulmin 구조로 전개
/sowhat:debate 01            # 3-에이전트 변증법으로 공격 (선택)
/sowhat:settle 01            # 검증 후 확정
    ↓  (02, 03 반복)
/sowhat:challenge            # 전체 논증 트리 감사
    ↓
/sowhat:draft                # 문서 생성 (DOCUMENT / PRD / MAP)
```

명세 레이어가 필요하면:

```
/sowhat:finalize-planning    # 명세 레이어 자동 생성
/sowhat:spec 05              # 명세 섹션 전개
/sowhat:settle 05            # (반복)
/sowhat:finalize             # export 생성
```

---

## 설치

```bash
npx sowhat-cc@latest
```

설치 위치:
- **Global** (`--global`): `~/.claude/` — 모든 프로젝트에서 사용
- **Local** (`--local`): `./.claude/` — 현재 프로젝트 전용

```bash
# 비대화형 설치
npx sowhat-cc --global
npx sowhat-cc --local

# 제거
npx sowhat-cc --global --uninstall
npx sowhat-cc --local --uninstall
```

설치 후 Claude Code에서 `/sowhat:progress`로 확인.

---

## 시작하기

### 모드 1: 아이디어에서 출발 (Top-Down)

```
/sowhat:init
```

아이디어 → IBIS Issue 프레이밍 → SCQA 핑퐁 → Thesis 수립 → Key Arguments → 섹션 전개.

### 모드 2: 외부 콘텐츠 비평

```
/sowhat:init --from <url 또는 파일>
```

외부 글/보고서를 Toulmin 분석 → 내 입장 선택(반박/비평/대안/부분 동의) → 5차원 비평 구조 구축.

### 모드 3: 자료에서 출발 (Bottom-Up)

```
/sowhat:init --research [--auto]
```

자료 수집(URL/파일/폴더/토픽) → 분석·종합 → 인간 인사이트 주입 → Thesis 후보 도출 → 논증 구조화.

`--auto` 옵션: 소스 수집만 대화형, 나머지 전체 자동(thesis 선택 → expand → debate → settle → draft). critical checkpoint에서만 멈춤.

---

## 커맨드

### 논증 구축

| 커맨드 | 설명 |
|--------|------|
| `/sowhat:init` | 프로젝트 초기화 + Thesis 수립 (SCQA 핑퐁) |
| `/sowhat:init --from <url\|file>` | 외부 콘텐츠 기반 비평 모드 |
| `/sowhat:init --research [--auto]` | 자료 수집 → Bottom-Up thesis 도출 |
| `/sowhat:expand [섹션]` | 섹션을 Toulmin 구조로 step-by-step 전개 |
| `/sowhat:settle [섹션]` | Stub detection + 교차 검증 후 확정 |
| `/sowhat:revise [섹션]` | 확정된 섹션 수정 + 오염 범위 자동 탐지 |
| `/sowhat:add-argument` | Thesis에 새 Key Argument 추가 → 섹션 자동 생성 |
| `/sowhat:autonomous` | 모든 미완성 섹션 자동 전개·검증·확정 |

### 논증 검증·강화

| 커맨드 | 설명 |
|--------|------|
| `/sowhat:challenge` | 전체 논증 트리 7단계 감사 (thesis 정합 → So What → Why So → MECE) |
| `/sowhat:debate [섹션]` | 3-에이전트 변증법 (Con 공격 → Pro 방어 → Research 증거 수집) |
| `/sowhat:steelman [섹션]` | 현재 논증의 최강 반대 논증 트리 자동 생성 |
| `/sowhat:branch [섹션]` | 대안 논증 경로 생성·비교 |
| `/sowhat:research [--deep] <대상>` | 외부 리서치 + T1~T4 Tier 신뢰도 평가 |
| `/sowhat:inject [섹션] [출처]` | 외부 자료를 특정 Toulmin 필드에 직접 주입 |
| `/sowhat:critic` | 대상 콘텐츠 5차원 비평 (content-critique 모드) |

### 산출물 생성

| 커맨드 | 설명 |
|--------|------|
| `/sowhat:draft [type]` | 문서 생성 — `document` / `prd` / `map` / `all` |
| `/sowhat:character` | 글쓰기 캐릭터(Voice DNA) 생성·관리. draft에 적용 |
| `/sowhat:map [섹션]` | 논증 흐름 Mermaid 다이어그램 |
| `/sowhat:snapshot` | 논증 상태 의미적 스냅샷 캡처 |

### 명세 레이어 (선택)

| 커맨드 | 설명 |
|--------|------|
| `/sowhat:finalize-planning` | 기획 레이어 완료 → 명세 레이어 자동 생성 |
| `/sowhat:spec [섹션]` | 명세 섹션 전개 (actors, requirements, data model 등) |
| `/sowhat:finalize` | 명세 완료 → export 생성 (PROJECT.md, REQUIREMENTS.md) |

### 세션 & 설정

| 커맨드 | 설명 |
|--------|------|
| `/sowhat:progress` | 현재 상태 대시보드 + 논증 부채 추적 + 다음 액션 |
| `/sowhat:resume` | 이전 세션 재개 (handoff → session → git log 우선순위) |
| `/sowhat:sync` | GitHub 변경사항 감지 및 로컬 반영 |
| `/sowhat:config` | API 키, 기능 토글, 모델 설정 |
| `/sowhat:note [텍스트]` | 작업 중 아이디어 즉시 메모 |
| `/sowhat:series` | 시리즈 콘텐츠 관리 (에피소드 간 맥락 연결) |

---

## 이론적 토대

sowhat은 4가지 검증된 논증 이론을 계층적으로 통합한다.

```
Layer 4: IBIS — 문제를 Issue-Position-Argument로 구조화
Layer 3: Walton — 8가지 논증 스킴 + 스킴별 Critical Questions
Layer 2: Pragma-Dialectics — 토론의 절차적 규칙 (assertion/challenge/defense/concession)
Layer 1: Toulmin — 모든 섹션의 기본 단위 (Claim/Grounds/Warrant/Backing/Qualifier/Rebuttal)
```

### Toulmin 모델 (기본 단위)

모든 섹션은 6개 필드를 채워야 settle 가능:

| 필드 | 역할 | 예시 |
|------|------|------|
| **Claim** | 주장 | "이 시장은 연 30% 성장한다" |
| **Grounds** | 사실적 근거 | "IDC 2024: CAGR 28%" |
| **Warrant** | Grounds→Claim 연결 원리 | "CAGR은 미래 성장 예측에 유효한 지표" |
| **Backing** | Warrant 자체의 근거 | "업계 10년 CAGR 추적 정확도 85%" |
| **Qualifier** | 확신 강도 | definitely / usually / presumably / possibly |
| **Rebuttal** | Claim이 무너지는 조건 | "단, 규제 도입 시 성장률 급감 가능" |

### Walton 논증 스킴 (8종)

각 스킴마다 고유한 Critical Questions로 논증의 약점을 체계적으로 공격:

`authority` · `analogy` · `cause-effect` · `statistics` · `example` · `sign` · `principle` · `consequence`

### Minto Pyramid (산출물 구조)

draft 산출물은 Barbara Minto의 피라미드 원칙을 따른다:
- **Answer First** — 결론을 먼저 제시
- **SCQA** — Situation → Complication → Question → Answer
- **MECE** — Key Arguments는 상호 배타적이고 전체를 포괄

---

## 에이전트

논증 검증에 5개 전문 에이전트가 동원된다:

| 에이전트 | 역할 |
|----------|------|
| **Research** | WebSearch + Perplexity로 외부 근거 수집. T1~T4 Tier 신뢰도 평가 |
| **Con** | 섹션 논증 공격. Walton Critical Questions 기반 |
| **Pro** | 논증 방어. 유효한 공격과 허위 공격 구분 |
| **Challenge** | 7단계 논증 계층 독립 검증 (Thesis → Key Args → Grounds) |
| **Critic** | 외부 콘텐츠 5차원 비평 |

### 3-에이전트 변증법 (`/sowhat:debate`)

```
Con Agent (공격)
    → Pro Agent (방어)
        → Research Agent (증거 수집)
            → 결과를 섹션에 반영
```

모든 이동은 Decision ID와 함께 Argument Log에 기록된다. 인간의 반박을 Claude가 무조건 수용하지 않는다 — 반박이 논리적으로 타당한지 재검증하고, 타당하지 않으면 재공격한다.

---

## 품질 보증

| 메커니즘 | 동작 시점 | 설명 |
|----------|-----------|------|
| **Stub Detection** | settle | 형식만 채운 빈 논증 탐지 (구체적 출처 없는 Grounds, 동어반복 Warrant 등) |
| **Cross-Section Regression** | settle | 기존 settled 섹션과의 논증 일관성 검증 |
| **Verification Debt Tracking** | progress | 미해결 논증 부채 추적 (미수정 challenge, 미확인 출처 등) |
| **Discussion Audit Trail** | expand, debate, revise | 모든 핑퐁·라운드를 `logs/discussion/`에 구조화 보존 |
| **Decision IDs** | expand → settle → challenge | 모든 결정에 `D-{section}-{seq}` 부여. 취약점의 원인 추적 |

---

## Character System

레퍼런스 텍스트에서 **Voice DNA**를 추출하여 draft에 일관된 작가 톤을 적용한다.

```
/sowhat:character create <이름>    # 레퍼런스 텍스트 → 5층 캐릭터 정의
/sowhat:draft --character <이름>   # 캐릭터 적용 문서 생성
```

- **5층 정의**: 대표 문단(few-shot) + 문장 골격 + 어휘 팔레트 + 대조쌍 + 사고 습관
- **2-pass 생성**: Pass 1(내용 정확성) → Pass 2(캐릭터 리라이트). 톤 드리프트 방지
- **캘리브레이션**: 짧은 샘플 + 긴 샘플 2단계 검증

---

## 프로젝트 구조

```
{project}/
├── planning/config.json       ← 상태 추적 (단일 소스)
├── 00-thesis.md               ← SCQA + Key Arguments
├── 01-{section}.md            ← Toulmin 구조 섹션
├── 02-{section}.md
├── research/                  ← 리서치 파인딩 + SYNTHESIS.md
├── logs/
│   ├── argument-log.md        ← 추가 전용 감사 로그
│   ├── discussion/            ← 핑퐁·라운드 구조화 로그
│   ├── handoff.json           ← 세션 핸드오프
│   └── notes.md               ← 아이디어 캡처
├── maps/                      ← Excalidraw 논증 트리
├── critic/                    ← 비평 리포트 (content-critique 모드)
└── export/                    ← 산출물
    ├── DOCUMENT.md            ← 서술형 문서
    ├── PRD.md                 ← 제품 요구사항
    ├── ARGUMENT-MAP.md        ← 논증 트리
    ├── PROJECT.md             ← GSD export (선택)
    └── REQUIREMENTS.md        ← GSD export (선택)
```

---

## 요구사항

- Node.js >= 18.0.0
- Claude Code

선택 사항:
- `GITHUB_TOKEN` — GitHub Issue 연동
- `PERPLEXITY_API_KEY` — Deep Research 기능 (`/sowhat:research --deep`)

---

## 라이선스

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**글은 논증이다. 논증이 부실하면 글도 부실하다.**

**sowhat은 Claude Code에서 논증을 구축하고, 공격하고, 증명하는 시스템이다.**

*Architecture inspired by [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done)*

</div>
