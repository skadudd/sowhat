# sowhat — 설계 문서

> "So What?" 으로 시작해서 "Get Shit Done." 으로 끝난다.

```
sowhat  →  gsd
기획        실행
Why/What    How
```

Claude Code command로 인간과 Claude가 함께 PRD/Spec을 만들어가는 시스템.
산출물은 GSD(get-shit-done)가 소비한다.

---

## 핵심 원칙

1. **목적과 논리가 먼저다** — 완벽하지 않은 기획에서 만들어진 명세는 가치가 없다
2. **Claude는 질문만 한다** — 내용을 대신 채우지 않는다. 인간이 답한 것을 구조화한다
3. **완료는 인간이 선언한다** — Claude가 완료를 판단하지 않는다
4. **최상위 논리가 항상 우선이다** — 하위 결정이 settled되어도 thesis에 반하면 되돌아간다
5. **기획 레이어 완성 전 명세 레이어 진입 불가** — 게이트가 강제한다

> **원칙 2의 구현** (cycle 7, Plan A+G): AI는 구조(Stasis/Scheme/Claim 형식/Warrant 논리/Qualifier/Rebuttal 구조)만 자동 생성하며, 내용(수치·기관명·연도·인물명·URL 등 구체값)은 retrieval 경로로만 유입된다. 모든 항목에 `[source:...]` 태그가 강제되어 사용자 입력과 AI 구조화가 항상 구별된다. 상세: `sowhat-core/references/ai-content-boundary.md`.

---

## 논증 이론 기반

sowhat은 4개의 논증 이론을 계층적으로 적용한다.

```
Layer 4: IBIS (Issue-Based Information System)
         ┌─ 복잡한 문제를 Issue-Position-Argument 구조로 분해
         └─ 모든 논의는 핵심 Issue 질문에서 시작 (/sowhat:init Step 2)

Layer 3: Walton's Argument Schemes
         ┌─ 8가지 논증 유형: authority / analogy / cause-effect /
         │  statistics / example / sign / principle / consequence
         ├─ 각 유형별 Critical Questions (어떤 반박이 유효한가)
         └─ 섹션 frontmatter의 `scheme` 필드로 명시

Layer 2: Pragma-Dialectics
         ┌─ 토론의 절차적 규칙
         ├─ Valid moves: assertion / challenge / defense / concession
         └─ /sowhat:debate 에서 라운드 기반 토론 진행

Layer 1: Toulmin Model (기본 단위)
         ┌─ Claim: 이 섹션의 주장
         ├─ Grounds: 근거 (증거)
         ├─ Warrant: Grounds → Claim 연결 원칙
         ├─ Backing: Warrant를 강화하는 근거
         ├─ Qualifier: 주장의 확실성 (definitely / usually / presumably)
         └─ Rebuttal: 반론 조건 및 대응
```

논증 강도 순서: `definitely` > `usually` > `presumably` > `in most cases` > `possibly`

---

## 문서 작성 방법론

바바라 민토의 피라미드 원칙을 따른다.

```
최상위 주장 (So What?)
    ├── 핵심 논거 1  →  섹션 파일
    ├── 핵심 논거 2  →  섹션 파일
    └── 핵심 논거 3  →  섹션 파일
```

하위 노드가 settled되어도 상위 노드가 흔들리면 하위 전체가 invalidated.

검증 순서 (고정):
```
1. thesis 정합성  ← 내용 정합성
2. So What        ← 형식 논리
3. Why So         ← 형식 논리
4. MECE           ← 형식 논리
```

---

## 진입 모드

sowhat은 세 가지 진입 모드를 지원한다.

```
                          sowhat init
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
     init (기본)        init --from         init --research
     Top-Down            비평/반박           Bottom-Up
     아이디어 →          콘텐츠 →            자료 수집 →
     thesis              입장 선택            근거에서 thesis 도출
```

### idea 모드 (기본)

사용자의 아이디어에서 시작하여 논증을 구축한다. Top-down.

### content-critique 모드 (`--from`)

외부 콘텐츠(글, 기사, 보고서)를 분석 대상으로 삼아, 사용자가 이에 대한 입장을 논증으로 구축한다.

```
/sowhat:init --from <url|file>
  → 대상 콘텐츠 Toulmin 분석 (Claim/Grounds/Warrant/Qualifier/Rebuttal 추출)
  → 입장 선택 (반박 / 비평 / 대안 제시 / 부분 동의)
  → SCQ 핑퐁 (대상 콘텐츠 기반)
  → 00-thesis.md 생성 (Source Content 섹션 포함)

/sowhat:critic
  → 대상 콘텐츠 5차원 비평 (완전성/Warrant/근거품질/Qualifier/Rebuttal)
  → critic/CRITIQUE-REPORT.md 생성
  → 약점 → 사용자 섹션 주입 제안

/sowhat:debate --stance <persuade|consensus>
  → persuade: 기존 debate + 대상 콘텐츠를 Con/Pro 참고 소재로 제공
  → consensus: 양측 통합 제안 vs 피상성 공격
```

### research 모드 (`--research`)

자료를 먼저 수집·분석하여 근거로부터 thesis를 bottom-up으로 도출한다. "자료는 있는데 뭘 주장해야 할지 모르겠다"는 상황에 적합.

```
/sowhat:init --research
  → R-1 자료 수집 (URL, 파일, 폴더, 토픽 검색 — 대화형, 혼합 가능)
  → R-2 자료 분석 (각 소스 Tier 판정 + 데이터 포인트 추출)
  → R-3 종합 (합의점/충돌점/패턴/갭 → research/SYNTHESIS.md)
  → R-4A 종합 결과 제시 (사실만, thesis 없이)
  → R-4B 인간 인사이트 주입 (직감, 경험, 가설 — 자료와 충돌해도 OK)
  → R-4C Thesis 후보 제안 (근거 + 인사이트 결합, 근거 강도 바 표시)
  → R-5 Key Arguments 자동 매핑 (파인딩 → 논거 클러스터링)
  → R-6 역 SCQ (Answer에서 Situation/Complication/Question 역도출)
  → 이후 기존 흐름 합류 (expand 시 매핑된 파인딩 Grounds 자동 제시)
```

**`--auto` 옵션**: 소스 수집만 대화형, 나머지 전체 자동:

```
/sowhat:init --research --auto [--profile <type>]
  → [인간] 소스 수집 → 수집 완료
  → [자동] 분석 → 종합 → thesis 자동 선택 → autonomous → challenge → draft
  → 완료: drafts/{filename}
```

critical checkpoint(thesis 방향 변경, claim broken 등)에서만 일시정지.

config.json 추가 필드: `mode` ("idea" | "content-critique" | "research"), `source`, `research_sources` (config-schema.md 참조)

---

## 아키텍처

```
{project}/                           ← 독립 Git repo (자동 생성 + GitHub remote 자동 연결)
├── .claude/
│   ├── commands/sowhat/              ← sowhat 커맨드들
│   └── hooks/                        ← 세션 시작/종료 자동 실행
├── planning/
│   └── config.json                   ← 상태 추적
├── research/
│   ├── log.md                        ← 리서치 타임라인 (append-only)
│   ├── SYNTHESIS.md                  ← research 모드 종합 결과
│   ├── 001-{slug}.md                 ← 개별 파인딩
│   └── ...
├── maps/
│   ├── overview.excalidraw           ← 전체 논증 트리 (항상 최신)
│   ├── snapshots/
│   │   └── overview-{YYYYMMDD-HHMM}.excalidraw
│   ├── local/
│   │   └── {section}-{field}.excalidraw
│   └── debate/
│       └── debate-{section}-r{N}.excalidraw
├── logs/
│   ├── session.md                    ← 단일 슬롯 체크포인트 (덮어쓰기)
│   ├── handoff.json                  ← 구조화된 세션 핸드오프
│   ├── argument-log.md               ← append-only 논증 이력
│   ├── notes.md                      ← /sowhat:note 아이디어 메모
│   ├── discussion/                   ← 핑퐁/라운드 구조화 로그
│   │   ├── {section}-expand.md
│   │   ├── {section}-debate-{datetime}.md
│   │   └── {section}-revise-{datetime}.md
│   └── debate/
│       └── {section}-round-{N}.md
├── [기획 레이어]
│   ├── 00-thesis.md
│   ├── 01-{section}.md
│   ├── 02-{section}.md
│   └── ...
├── [명세 레이어] (finalize-planning 이후 생성)
│   ├── 04-actors.md
│   ├── 05-functional-requirements.md
│   ├── 06-data-model.md
│   ├── 07-api-contract.md
│   ├── 08-edge-cases.md
│   └── 09-acceptance-criteria.md
├── critic/                          ← /sowhat:critic 생성 (content-critique 모드)
│   ├── CRITIQUE-REPORT.md           ← 대상 콘텐츠 5차원 비평 리포트
│   └── DEBATE-ANALYSIS.md           ← debate --stance critique 결과 (선택적)
└── export/
    ├── DOCUMENT.md                   ← /sowhat:draft 생성 (인간용 서술)
    ├── PRD.md                        ← /sowhat:draft 생성
    ├── ARGUMENT-MAP.md               ← /sowhat:draft 생성 (텍스트 논증 트리)
    ├── PROJECT.md                    ← /sowhat:finalize 생성 (GSD용)
    └── REQUIREMENTS.md               ← /sowhat:finalize 생성 (GSD용)
```

---

## 섹션 파일 구조

### `00-thesis.md`

```markdown
---
status: draft | discussing | settled
version: 1
created: {date}
updated: {date}
---

## Issue (IBIS)
> 핵심 문제 질문. "어떻게 하면 X를 달성할 수 있는가?"

## Situation
> 현재 상황. 독자가 동의할 수 있는 사실.

## Complication
> 상황에서 발생한 문제 또는 긴장. "그런데..."

## Question
> Complication이 유발하는 핵심 질문. "그렇다면 어떻게?"

## Answer (So What?)
> 이 PRD의 최상위 주장. 한 문장.

## Key Arguments
> Answer를 지지하는 핵심 논거들. 각 논거가 하위 섹션 파일로 전개됨.

- [ ] 논거 1 → 01-{section}.md
- [ ] 논거 2 → 02-{section}.md
- [ ] 논거 3 → 03-{section}.md

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 | init | {date} |

## Open Questions
- [ ]
```

### `{N}-{section}.md` (기획/명세 섹션 — Toulmin 구조)

```markdown
---
status: draft | discussing | settled | needs-revision | invalidated
scheme: authority | analogy | cause-effect | statistics | example | sign | principle | consequence
qualifier: definitely | usually | presumably | in most cases | possibly
version: 1
section: {N}
title: {section-name}
thesis_argument: {thesis의 어떤 논거를 지지하는가 - 한 줄}
github_issue: {issue number}
created: {date}
updated: {date}
---

## Claim
> 이 섹션의 주장. thesis의 논거를 지지하는 한 문장.

## Grounds (근거)

### {근거 1}

### {근거 2}

## Warrant (논거 연결)
> Grounds에서 Claim이 도출되는 원칙 또는 규칙.

## Backing (Warrant 강화)
> Warrant 자체를 지지하는 추가 근거.

## Qualifier
> 주장의 확실성. 예: "통상적으로", "아마도", "반드시"

## Rebuttal (반론 대응)
> 이 Claim이 성립하지 않는 조건과 그에 대한 대응.

## Scope
### In
-
### Out (Non-Goals)
-

## Acceptance Criteria
- [ ]

## GitHub Edits
> GitHub에서 직접 수정된 내용. 반영 여부는 인간이 결정.

## Open Questions
- [ ]

## Argument Log
| round | datetime | move | agent | outcome |
|-------|----------|------|-------|---------|

## Decision Log
| v | 변경 내용 | 이유 | 날짜 |
|---|---------|------|------|
| 1 | 초안 | | {date} |
```

`invalidated` 상태의 섹션은 편집 불가. 상위 논거가 먼저 revision되어야 재개 가능.

---

## 상태 흐름

```
draft → discussing → settled
                        ↓  challenge 수용 또는 GitHub label 변경
                  needs-revision → discussing → settled
                        ↓  상위 논리 붕괴 시 연쇄
                   invalidated
```

---

## 커맨드 전체 목록

### 기획 레이어

| 커맨드 | 역할 |
|--------|------|
| `/sowhat:init` | repo 생성 + GitHub 연결 + IBIS Issue 프레이밍 + thesis 핑퐁 |
| `/sowhat:init --from` | 외부 콘텐츠 분석 → 입장 구축 (content-critique 모드) |
| `/sowhat:init --research` | 자료 수집·분석 → 근거 기반 thesis 도출 (bottom-up) |
| `/sowhat:init --research --auto` | 소스 수집 후 draft까지 완전 자동 |
| `/sowhat:expand [section]` | 섹션 bottom-up 전개 (핑퐁). Advisor mode + Discussion audit trail |
| `/sowhat:settle [section]` | 완료 선언 → Stub detection + Cross-section regression + Git commit + Issue close |
| `/sowhat:challenge` | 전체 트리 공격 (thesis 우선 → 민토) + Decision ID 추적 |
| `/sowhat:finalize-planning` | 게이트 통과 + 명세 레이어 초안 자동 생성 |

### 명세 레이어

| 커맨드 | 역할 |
|--------|------|
| `/sowhat:spec [section]` | 명세 섹션 핑퐁 |
| `/sowhat:settle [section]` | 동일 커맨드 재사용 |
| `/sowhat:challenge` | 기획+명세 전체 트리 검증 |
| `/sowhat:finalize` | GSD export 생성 |

### 심화 논증

| 커맨드 | 역할 |
|--------|------|
| `/sowhat:debate [section]` | Git branch 기반 변증법적 토론 루프. `--stance` 옵션으로 설득/합의/비평 모드 선택. Discussion audit trail |
| `/sowhat:steelman` | 현재 논증의 최강 반대 논증 트리 자동 생성 |
| `/sowhat:branch [section]` | 섹션의 대안적 논증 경로 생성·비교 |
| `/sowhat:critic` | 대상 콘텐츠 5차원 비평 (content-critique 모드 전용) |
| `/sowhat:autonomous` | 모든 미완성 섹션 자동 전개·검증·확정. Stub detection 내장 |
| `/sowhat:draft [type]` | 인간용 문서 합성. 민토 피라미드 기반 구조 + 프로파일 시스템 |

### 인프라

| 커맨드 | 역할 |
|--------|------|
| `/sowhat:research [--deep] [url\|file\|dir\|topic]` | 외부 리서치 → 섹션 수정/추가 제안. URL·파일·폴더·토픽 검색 지원. `--deep`으로 Perplexity Deep Research 활성화 (선택적) |
| `/sowhat:inject [section] [source]` | 외부 자료를 Toulmin 필드에 직접 주입 |
| `/sowhat:note [text\|list\|promote]` | 작업 중 아이디어 즉시 캡처 → Open Question 승격 |
| `/sowhat:revise [section]` | settled 섹션 수정 + 오염 범위 자동 탐지. Discussion audit trail |
| `/sowhat:sync` | GitHub 변경 감지 → 로컬 반영 |
| `/sowhat:map [section]` | Mermaid로 논증 트리 시각화 |
| `/sowhat:progress` | 현재 상태 대시보드 + 논증 부채 추적 + 다음 액션 안내 |
| `/sowhat:resume` | 세션 재개 (handoff.json → session.md → git log 우선순위) |
| `/sowhat:config` | API 키·기능 토글·모델 설정. 단계적 메뉴 안내 |
| `/sowhat:character` | 글쓰기 캐릭터(Voice DNA) 생성·관리. 레퍼런스 텍스트에서 7차원 분석으로 추출. draft 시 적용 |

---

## 커맨드 상세 동작

### `/sowhat:init [--from | --research [--auto]]`

**idea 모드 (기본):**
```
1. 인간: project name + rough idea 입력
2. Claude: IBIS Issue 프레이밍
3. SCQ 핑퐁 → Answer(So What?) 도출
4. Key Arguments 구성
5. 파일 생성 + Git + GitHub
```

**content-critique 모드 (`--from`):**
```
1. 대상 콘텐츠 Toulmin 분석
2. 입장 선택 (반박/비평/대안/부분동의)
3. SCQ 핑퐁 (대상 기반)
4. 이후 동일
```

**research 모드 (`--research`):**
```
1. 관심 영역 입력
2. 자료 수집 (URL/파일/폴더/토픽 — 대화형, 혼합 가능)
3. 자료 분석 + 종합 → research/SYNTHESIS.md
4. 인간 인사이트 주입 (자료와 충돌 허용)
5. Thesis 후보 제안 (근거 + 인사이트 결합, 근거 강도 표시)
6. Key Arguments 자동 매핑 (파인딩 → 논거 클러스터링)
7. 역 SCQ (Answer → S/C/Q 역도출)
8. 파일 생성 + Git + GitHub
```

**research auto 모드 (`--research --auto`):**
```
1. [인간] 자료 수집 → "수집 완료"
2. [자동] 분석 → 종합 → thesis 자동 선택 → autonomous → challenge → draft
3. critical checkpoint에서만 일시정지
```

---

### `/sowhat:expand [section]`

```
1. 00-thesis.md 로드 (항상)
2. 해당 섹션 파일 로드 (없으면 생성)
3. thesis_argument 필드 확인 → 없으면 인간이 지정
4. Scheme 선택 핑퐁
   - "이 논거의 유형은? (authority / statistics / cause-effect / ...)"
5. Claim 핑퐁
   - "이 논거가 thesis의 Answer를 어떻게 지지하는가?"
6. Grounds 핑퐁
   - "이 주장의 근거는?"
   - "이것이 없으면 Claim이 성립하지 않는가?"
7. Warrant 핑퐁
   - "Grounds에서 Claim이 도출되는 원칙은?"
8. Qualifier 확인
   - "이 주장의 확실성은? (definitely / usually / presumably)"
9. Rebuttal 핑퐁
   - "이 Claim이 성립하지 않는 조건은?"
10. Scope → AC 순서로 전개
11. 인간이 충분하다고 판단하면 /sowhat:settle [section] 호출
```

각 필드 완료 시 `git commit -m "wip({section}): add {field}"`.
Claude는 채우지 않는다. 질문만 한다. 인간이 답한 내용을 구조화해서 파일에 기록.

---

### `/sowhat:settle [section]`

```
1. 해당 섹션 파일 로드
2. 완료 전 자동 검증 (Toulmin 체크리스트):
   a. thesis_argument 필드 존재 여부
   b. Claim이 thesis Answer를 지지하는가
   c. Grounds가 존재하는가 (최소 1개)
   d. Warrant가 존재하며 "Implicit"이 아닌가 (없으면 경고)
   e. Qualifier가 설정되었는가
   f. Rebuttal이 addressed되었는가
   g. Open Questions가 모두 해소되었는가
   h. scheme 필드가 설정되었는가
   i. scheme별 추가 검증 (statistics → 수치 있는가, authority → 출처 있는가)
3. 검증 통과 → status: settled
4. Git commit: "settle({section}): {claim 한 줄}"
5. GitHub Issue close + label: settled
6. 00-thesis.md Key Arguments 체크박스 업데이트
7. logs/argument-log.md 추가
8. maps/snapshots/ 에 스냅샷 저장 (overview.excalidraw가 있으면)
9. 컨텍스트 관리 안내 (/clear or /compact)
```

검증 실패 시 settle 거부. Claude가 이유와 함께 무엇을 해소해야 하는지 명시.

---

### `/sowhat:challenge`

```
1. 전체 파일 로드 (thesis + 모든 섹션)
2. settled/discussing 상태만 대상
3. 검증 순서 (고정):

   [1단계] thesis 정합성
   - 각 섹션의 thesis_argument가 Answer를 실제로 지지하는가
   - settled 섹션들이 합쳐졌을 때 Answer를 완전히 커버하는가

   [2단계] So What
   - 각 Grounds가 Claim을 지지하는가
   - Claim이 상위 Key Argument를 지지하는가
   - Warrant가 Grounds → Claim 연결을 정당화하는가

   [3단계] Why So
   - 각 Claim이 충분한 근거를 가지는가
   - 근거가 주장을 논리적으로 도출하는가
   - scheme별 Critical Questions 적용

   [4단계] MECE
   - Key Arguments 간 중복이 있는가
   - 빠진 논거가 있는가
   - 섹션 간 범위 충돌이 있는가

4. 공격 리포트 출력:
   - 문제 위치 (thesis / 섹션 N)
   - 문제 유형 (정합성 / So What / Why So / MECE)
   - 구체적 근거
   - 영향받는 하위 섹션 목록

5. 인간이 각 공격에 대해:
   - 반박 → Claude가 반박 수용 여부 판단 후 재공격 or 철회
   - 수용 → 영향 섹션 needs-revision 역전파

6. 역전파:
   - 해당 섹션 status: needs-revision
   - GitHub Issue reopen + label 변경
   - 하위 의존 섹션 status: invalidated
   - Git commit: "challenge: invalidate({sections}) - {이유}"
```

인간의 반박을 Claude가 무조건 수용하지 않는다.
반박이 논리적으로 타당한지 재검증. 타당하면 철회, 타당하지 않으면 재공격.
품질 우선: 항상 전체 트리 공격. 부분 공격 없음.

---

### `/sowhat:debate [section]`

Git branch를 사용한 변증법적 토론 루프.

```
1. debate/{section}-r{N} 브랜치 생성
2. 찬성 입장 (thesis 측): 현재 섹션의 Claim + Grounds + Warrant 정리
3. 반대 입장 (anti-thesis 측): Claude가 최강 반론 구성
4. 각 라운드:
   - 반론 제시 (Pragma-Dialectics의 valid move: challenge)
   - 방어/수용 (defense or concession)
   - logs/debate/{section}-round-{N}.md 기록
   - maps/debate/debate-{section}-r{N}.excalidraw 업데이트
5. 라운드 완료 시: git commit "debate({section}): round-{N} - {outcome}"
6. 토론 종료: 브랜치 main에 merge (내용은 섹션 파일에 반영)
7. 결과에 따라:
   - 원래 Claim 강화 → Warrant/Backing 보강 후 settle 가능
   - 수정 필요 → needs-revision 후 /sowhat:expand 재실행
   - 포기 → invalidated
```

---

### `/sowhat:draft [type]`

인간이 읽는 문서를 섹션 파일들로부터 합성한다.

```
type: document | prd | map | all (기본값: all)

document → export/DOCUMENT.md
  - thesis의 SCQ/Answer를 도입부로
  - 각 섹션의 Claim + Grounds를 서술형으로 변환
  - Qualifier와 Rebuttal을 주석/각주로 포함

prd → export/PRD.md
  - 구조화된 제품 요구사항 형식
  - 섹션별 기능 요구사항, 비기능 요구사항, 제약사항

map → export/ARGUMENT-MAP.md
  - 텍스트 기반 논증 트리
  - 모든 Claim/Grounds/Warrant/Qualifier 표시
  - settled/needs-revision 상태 색상 표시

Git commit: "draft: generate {type}"
```

---

### `/sowhat:finalize-planning`

```
1. 전체 섹션 상태 확인
   - settled되지 않은 섹션 존재 시 → 실행 거부
   - invalidated 섹션 존재 시 → 실행 거부
   - needs-revision 섹션 존재 시 → 실행 거부

2. /sowhat:challenge 자동 실행 (생략 불가)
   - 문제 없을 때만 다음 단계 진행

3. 명세 레이어 고정 섹션 초안 자동 생성 (Toulmin 필드 포함):
   04-actors.md                ← thesis Situation의 관계자들
   05-functional-requirements  ← 기획 섹션 Claim들
   06-data-model.md            ← 근거에서 언급된 데이터
   07-api-contract.md          ← 인터페이스 언급된 것들
   08-edge-cases.md            ← 각 섹션 Edge Cases 합산
   09-acceptance-criteria.md   ← 각 섹션 AC 합산

4. planning/config.json layer: "planning" → "spec"
5. GitHub Issues 생성 (04~09번)
6. Git commit: "planning-complete: generate spec layer"
```

---

### `/sowhat:finalize`

```
1. 명세 레이어 전체 settled 확인 (04~09)
2. /sowhat:challenge 자동 실행 (기획+명세 전체)
3. export/ 생성:

   PROJECT.md (GSD용)
   - thesis Answer → 프로젝트 비전
   - Key Arguments → 핵심 목표
   - Scope In/Out 합산

   REQUIREMENTS.md (GSD용)
   - 각 명세 섹션 Claim → requirement
   - AC 항목들 → acceptance criteria
   - Edge Cases → constraints

4. 문서 생성 여부 인간에게 확인:
   - [1] /sowhat:draft 실행 → DOCUMENT.md + PRD.md + ARGUMENT-MAP.md
   - [2] 나중에 생성

5. logs/argument-log.md 최종 요약 추가
6. config.json layer: "spec" → "finalized"
7. Git commit: "finalize: export GSD artifacts"
8. GitHub milestone close
```

---

## 품질 보증 메커니즘

GSD 1.25-1.29에서 차용한 논증 품질 보증 체계.

### Stub Detection (settle, autonomous)

Toulmin 필드가 형식만 채워져 있고 실질 내용이 없는 "논증 stub"을 탐지. settle 시 거부.

| 필드 | Stub 예시 |
|------|----------|
| Grounds | "다양한 연구에서 확인됨" (구체적 출처 없음) |
| Warrant | Claim을 동어반복 |
| Rebuttal | "반론이 있을 수 있으나 극복 가능" (구체적 반론 없음) |

### Cross-Section Regression Gate (settle)

섹션 settle 시 기존 settled 섹션과의 논증 일관성을 검증. Claim 충돌, Grounds 의존 깨짐, thesis 정합성 확인.

### Verification Debt Tracking (progress)

progress 대시보드에서 미해결 논증 부채를 추적:
- challenge 미수정 건수
- stub 의심 필드 건수
- debate weakened 미보강 건수
- 출처 미확인 Grounds 건수

### Discussion Audit Trail (expand, debate, revise)

모든 핑퐁·라운드 과정을 `logs/discussion/`에 구조화 로그로 보존. resume 정확도 + revise 시 원래 논의 맥락 참조.

### Decision IDs (expand → settle → challenge)

사용자가 내린 모든 결정에 `D-{section}-{seq}` ID 부여. challenge가 "어떤 결정이 취약점의 원인인가" 추적 가능.

### Advisor Mode (expand)

Claim 선택 시 병렬 research agent를 돌려 판단 근거를 미리 제공. 근거가 부족한 섹션에서 자동 활성화.

### Deep Research (research, debate, challenge)

Perplexity API를 활용한 심층 리서치. `PERPLEXITY_API_KEY` 환경변수 설정 시 자동 활성화 (선택적).

- **`/sowhat:research --deep {토픽}`**: Perplexity `sonar-deep-research` 모델로 다단계 심층 조사
- **debate/challenge**: Research-Agent 스폰 시 자동으로 Deep Research 모드 적용
- **기존 파이프라인 통합**: Finding 형식·Tier 분류·accept/reject 워크플로우 동일
- **Graceful fallback**: API 키 없으면 기본 WebSearch로 동작, 사용자에게 설정 안내
- **핵심 인용 검증**: Perplexity 응답의 T1/T2 출처를 WebFetch로 spot-check (최대 2개)

### Character System (character, draft)

레퍼런스 텍스트에서 Voice DNA를 추출하여 draft 산출물에 일관된 작가 톤을 적용.

- **5층 캐릭터 정의**: 대표 문단(few-shot) + 문장 골격(구조) + 어휘 팔레트(단어) + 대조쌍(차이) + 사고 습관(배치)
- **3차원 분석**: Voice(문장), Flow(문단), Persona(관계)
- **2-pass 생성**: Pass 1(내용 정확성, 캐릭터 없이) → Pass 2(캐릭터 리라이트). 관심사 분리로 드리프트 원천 차단
- **캘리브레이션**: 짧은 샘플(3문단) + 긴 샘플(10문단) 2단계 검증. 후반부 톤 유지 확인
- **붕괴 방지**: 2-pass 분리 + 사후 감사(금기어 grep + 톤 비교) + 사용자 피드백 루프
- **저장**: `~/.claude/sowhat-characters/{name}/` (전역, 프로젝트 독립)

### Structured Handoff (session-protocol, resume)

세션 종료 시 `logs/handoff.json` 생성. 미결정 사항, 논증 부채, Decision IDs 등 구조화된 정보로 resume 정확도 향상.

---

## Git Commit 패턴

| 상황 | 커밋 메시지 |
|------|------------|
| 필드 완료 (핑퐁 중) | `wip({section}): add {field}` |
| 섹션 settle | `settle({section}): {claim}` |
| challenge 역전파 | `challenge: invalidate({sections}) - {reason}` |
| debate 라운드 완료 | `debate({section}): round-{N} - {outcome}` |
| 문서 생성 | `draft: generate {type}` |
| finalize | `finalize: export GSD artifacts` |

---

## Hook 동작

### Hook 1: 세션 시작 (블로킹)

```
1. planning/config.json 확인 → sowhat 프로젝트 검증
2. GitHub API → 모든 Issue 상태 pull
3. 로컬 파일과 비교 후 변경 감지:

   Label 변경 → frontmatter status 업데이트 + 역전파
   댓글 추가  → ## Open Questions에 append
   body 수정  → ## GitHub Edits에 append (반영은 인간 결정)

4. 변경 요약 출력 (변경 없으면 무음)
5. GitHub API 실패 시 경고 출력 후 로컬 상태로 계속
```

### Hook 2: 세션 종료 (논블로킹)

```
1. 미commit 변경사항 자동 commit
   "wip({section}): {변경된 파일 목록}"
2. GitHub push
3. 세션 요약 출력
```

---

## `planning/config.json`

```json
{
  "project": "{project-name}",
  "mode": "idea | content-critique | research",
  "github": {
    "repo": "{owner}/{repo-name}",
    "token_env": "GITHUB_TOKEN"
  },
  "layer": "planning | spec | finalized",
  "sections": {
    "00-thesis": { "issue": 1, "status": "settled" },
    "01-problem": { "issue": 2, "status": "discussing" },
    "02-goals":   { "issue": 3, "status": "draft" }
  },
  "last_sync": "{timestamp}",
  "research": {
    "count": 0,
    "unreviewed": 0,
    "last_research": null
  },
  "research_sources": [],
  "features": {
    "sub_research": "enabled",
    "sub_research_engine": "agent-browser",
    "sub_research_fallback": "websearch",
    "deep_research": "auto",
    "deep_research_model": "sonar-deep-research"
  }
}
```

- `mode`: 진입 모드. research 모드에서 expand 시 파인딩 자동 제시 등 동작 분기
- `research_sources`: research 모드에서 수집한 소스 목록
- `layer`: 현재 레이어. finalize-planning 시 `planning → spec`
- `features`: sub-research 엔진 설정 + Deep Research 설정
- `features.deep_research`: `"auto"` (API 키 있으면 활성) | `"enabled"` | `"disabled"`
- `features.deep_research_model`: Perplexity 모델 (`"sonar-deep-research"` | `"sonar-pro"` | `"sonar"`)

---

## GitHub 연동

| GitHub 액션 | 처리 |
|------------|------|
| Label 변경 | 로컬 status 업데이트 + 역전파 |
| 댓글 | Open Questions에 append |
| body 수정 | GitHub Edits에 append (반영 여부 인간 결정) |

- Source of truth: GitHub
- 섹션 파일 1:1 → Issue
- Issue label = 섹션 status
- `/sowhat:settle` → Issue close
- `/sowhat:challenge` 역전파 → Issue reopen

---

## GSD 연계

```
sowhat                        gsd
─────────────────────────────────────────
/sowhat:finalize 실행
    └→ export/PROJECT.md      /gsd:new-project 가 소비
    └→ export/REQUIREMENTS.md /gsd:new-project 가 소비

/sowhat:draft 실행 (선택)
    └→ export/DOCUMENT.md     인간 검토용
    └→ export/PRD.md          인간 검토용
    └→ export/ARGUMENT-MAP.md 논증 감사용

sowhat 내부 구조 (섹션 파일, Issues 등)
→ GSD는 무관. export/ 만 바라봄.
```

---

## 전체 워크플로우

### 수동 모드 (idea / content-critique / research)

```
[초기화]
/sowhat:init                          ← idea: 아이디어 → thesis
/sowhat:init --from <url|file>        ← critique: 콘텐츠 → 입장 → thesis
/sowhat:init --research               ← research: 자료 수집 → 분석 → thesis (bottom-up)
    └→ 00-thesis.md + research/SYNTHESIS.md (research 모드)

[기획 레이어]
/sowhat:settle thesis
/sowhat:expand [section] × N
    └→ Toulmin 구조 핑퐁 (Advisor mode, Discussion audit trail, Decision IDs)
    └→ research 모드: 매핑된 파인딩 Grounds 자동 제시
    └→ /sowhat:settle [section]  ← Stub detection + Cross-section regression

/sowhat:note [text]                   ← 작업 중 아이디어 즉시 메모
/sowhat:research [url|file|dir|topic] ← 기획/명세 어디서든 사용
/sowhat:debate [section]              ← 변증법 토론 루프
/sowhat:steelman                      ← 최강 반대 논증 생성

/sowhat:challenge                     ← 전체 트리 8단계 공격 + Decision ID 추적
/sowhat:finalize-planning             ← 게이트: 명세 레이어 자동 생성

[명세 레이어]
/sowhat:spec [section] × 6
/sowhat:challenge
/sowhat:finalize                      ← GSD export + draft

/sowhat:progress                      ← 논증 부채 추적 + 다음 액션 안내
/sowhat:resume                        ← handoff.json → session.md → git log 복원
```

### 완전 자동 모드 (research + auto)

```
/sowhat:init --research --auto [--profile <type>]
    └→ [인간] 자료 수집 (대화형) → "수집 완료"
    └→ [자동] 분석 → 종합 → thesis 자동 선택
    └→ [자동] settle thesis → autonomous (expand → debate → settle)
    └→ [자동] challenge (이슈 시 자동 revise, 최대 2회)
    └→ [자동] draft (기본: report, --profile로 변경)
    └→ ⚠️ critical checkpoint에서만 일시정지
```

---

*Claude Code 세션에서 불러오려면:*

```
@SOWHAT-DESIGN.md 이 설계를 숙지하고 /sowhat 커맨드 구현을 시작한다
```
