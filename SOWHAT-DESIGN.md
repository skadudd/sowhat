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

## 아키텍처

```
Obsidian Vault/
└── projects/{project-name}/        ← 독립 Git repo (자동 생성 + GitHub remote 자동 연결)
    ├── .claude/
    │   ├── commands/sowhat/         ← sowhat 커맨드들
    │   └── hooks/                   ← 세션 시작/종료 자동 실행
    ├── .planning/
    │   └── config.json              ← 상태 추적
    ├── .research/                       ← 외부 리서치 파인딩
    │   ├── log.md                       ← 리서치 타임라인 (append-only)
    │   ├── 001-{slug}.md                ← 개별 파인딩
    │   └── ...
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
    └── export/                      ← GSD 소비 산출물
        ├── PROJECT.md
        └── REQUIREMENTS.md
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

### `{N}-{section}.md` (기획 섹션)

```markdown
---
status: draft | discussing | settled | needs-revision | invalidated
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

## Supporting Arguments

### {근거 1}

### {근거 2}

## Scope
### In
-
### Out (Non-Goals)
-

## Edge Cases
-

## Acceptance Criteria
- [ ]

## GitHub Edits
> GitHub에서 직접 수정된 내용. 반영 여부는 인간이 결정.

## Open Questions
- [ ]

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
| `/sowhat:init` | repo 생성 + GitHub 연결 + thesis 핑퐁 시작 |
| `/sowhat:expand [section]` | 섹션 bottom-up 전개 (핑퐁) |
| `/sowhat:settle [section]` | 완료 선언 → Git commit + Issue close |
| `/sowhat:challenge` | 전체 트리 공격 (thesis 우선 → 민토) |
| `/sowhat:finalize-planning` | 게이트 통과 + 명세 레이어 초안 자동 생성 |

### 명세 레이어

| 커맨드 | 역할 |
|--------|------|
| `/sowhat:spec [section]` | 명세 섹션 핑퐁 |
| `/sowhat:settle [section]` | 동일 커맨드 재사용 |
| `/sowhat:challenge` | 기획+명세 전체 트리 검증 |
| `/sowhat:finalize` | GSD export 생성 |

### 인프라

| 커맨드 | 역할 |
|--------|------|
| `/sowhat:research [url\|topic]` | 외부 리서치 → 섹션 수정/추가 제안 |
| `/sowhat:sync` | GitHub 변경 감지 → 로컬 반영 (hook 자동 실행) |

---

## 커맨드 상세 동작

### `/sowhat:init`

```
1. 인간: project name + rough idea 입력
2. Claude: Situation/Complication/Question 추출을 위한 핑퐁
   - "이 문제가 해결되지 않으면 어떤 일이 생기는가?"
   - "지금 이 시점에 이것을 만드는 이유는?"
   - "성공한다면 무엇이 달라지는가?"
3. Answer(So What?) 도출 → 인간 확인
4. Key Arguments 초안 제안 → 인간 수정/확정
5. 00-thesis.md 생성
6. Git repo 초기화
7. GitHub repo 자동 생성 + remote 연결
8. GitHub Issues 생성 (thesis = Issue #1)
9. /sowhat:settle thesis 대기 상태
```

Answer 확정 전까지 thesis settled 불가.
Claude가 Answer의 명확성을 검증 — 모호하면 재핑퐁.

---

### `/sowhat:expand [section]`

```
1. 00-thesis.md 로드 (항상)
2. 해당 섹션 파일 로드 (없으면 생성)
3. thesis_argument 필드 확인 → 없으면 인간이 지정
4. Claim 핑퐁
   - "이 논거가 thesis의 Answer를 어떻게 지지하는가?"
5. Supporting Arguments 핑퐁
   - "이 주장의 근거는?"
   - "반례가 있다면?"
   - "이것이 없으면 Claim이 성립하지 않는가?"
6. Edge Cases → Scope → AC 순서로 전개
7. 인간이 충분하다고 판단하면 /sowhat:settle [section] 호출
```

Claude는 채우지 않는다. 질문만 한다. 인간이 답한 내용을 구조화해서 파일에 기록.

---

### `/sowhat:settle [section]`

```
1. 해당 섹션 파일 로드
2. 완료 전 자동 검증:
   a. thesis_argument 필드 존재 여부
   b. Claim이 thesis Answer를 지지하는가
   c. Supporting Arguments가 Claim을 뒷받침하는가
   d. Open Questions가 모두 해소되었는가
3. 검증 통과 → status: settled
4. Git commit: "settle({section}): {claim 한 줄}"
5. GitHub Issue close + label: settled
6. 00-thesis.md Key Arguments 체크박스 업데이트
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
   - 각 Supporting Argument가 Claim을 지지하는가
   - Claim이 상위 Key Argument를 지지하는가

   [3단계] Why So
   - 각 Claim이 충분한 근거를 가지는가
   - 근거가 주장을 논리적으로 도출하는가

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

### `/sowhat:finalize-planning`

```
1. 전체 섹션 상태 확인
   - settled되지 않은 섹션 존재 시 → 실행 거부
   - invalidated 섹션 존재 시 → 실행 거부
   - needs-revision 섹션 존재 시 → 실행 거부

2. /sowhat:challenge 자동 실행 (생략 불가)
   - 문제 없을 때만 다음 단계 진행

3. 명세 레이어 고정 섹션 초안 자동 생성:
   04-actors.md                ← thesis Situation의 관계자들
   05-functional-requirements  ← 기획 섹션 Claim들
   06-data-model.md            ← 근거에서 언급된 데이터
   07-api-contract.md          ← 인터페이스 언급된 것들
   08-edge-cases.md            ← 각 섹션 Edge Cases 합산
   09-acceptance-criteria.md   ← 각 섹션 AC 합산

4. .planning/config.json layer: "planning" → "spec"
5. GitHub Issues 생성 (04~09번)
6. Git commit: "planning-complete: generate spec layer"
```

---

### `/sowhat:finalize`

```
1. 명세 레이어 전체 settled 확인
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

4. Git commit: "finalize: export GSD artifacts"
5. GitHub milestone close
```

---

## Hook 동작

### Hook 1: 세션 시작 (블로킹)

```
1. .planning/config.json 확인 → sowhat 프로젝트 검증
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

## `.planning/config.json`

```json
{
  "project": "{project-name}",
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
  }
}
```

`layer` 필드로 현재 레이어 추적.
`/sowhat:finalize-planning` 실행 시 `planning → spec`.
명세 레이어 커맨드가 기획 레이어에서 실행되는 것을 방지.

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

sowhat 내부 구조 (섹션 파일, Issues 등)
→ GSD는 무관. export/ 만 바라봄.
```

---

## 전체 워크플로우

```
[기획 레이어]
/sowhat:init
    └→ thesis 핑퐁 → 00-thesis.md 생성
    └→ Git repo + GitHub repo 자동 생성
    └→ /sowhat:settle thesis

/sowhat:expand [section] × N
    └→ 섹션별 핑퐁
    └→ /sowhat:settle [section]

/sowhat:research [url|topic]          ← 기획/명세 어디서든 사용 가능
    └→ URL 분석 / 토픽 검색 / 자율 리서치
    └→ 섹션별 수정/추가 제안
    └→ 인간이 accept/reject

/sowhat:challenge
    └→ 전체 트리 공격
    └→ 역전파 or 통과

/sowhat:finalize-planning        ← 게이트
    └→ challenge 자동 실행
    └→ 명세 레이어 초안 생성

[명세 레이어]
/sowhat:spec [section] × 6       ← 고정 섹션
    └→ /sowhat:settle [section]

/sowhat:challenge
    └→ 기획+명세 전체 트리 공격

/sowhat:finalize
    └→ export/ 생성
    └→ GSD 인계
```

---

*Claude Code 세션에서 불러오려면:*

```
@SOWHAT-DESIGN.md 이 설계를 숙지하고 /sowhat 커맨드 구현을 시작한다
```
