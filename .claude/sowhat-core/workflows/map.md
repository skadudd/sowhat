# /sowhat:map — 논증 구조 조회

<!--
@metadata
checkpoints: []
config_reads: [sections]
config_writes: []
continuation:
  primary: "(맵 출력 후 이전 작업 재개)"
  alternatives: []
status_transitions: []
-->

논증 구조를 **터미널 인라인 텍스트**로 즉시 출력한다.
Mermaid나 외부 도구 없이, 인덴트 기반 텍스트로 논리 구조를 빠르게 파악한다.

---

## 인자 파싱

```
/sowhat:map [section] [--export]
```

| 인자 | 의미 |
|------|------|
| 인자 없음 | 전체 논증 구조 (Global) |
| `{section}` (번호 또는 이름) | 해당 섹션 Walton 상세 (Local) |
| `--export` | `export/ARGUMENT-MAP.md`로 정식 스냅샷 저장 |

---

## 사전 준비

1. `planning/config.json` 로드
2. `00-thesis.md` 로드
3. 각 섹션 파일 로드 (frontmatter + Walton 필드)

---

## Global 모드 (인자 없음)

### 데이터 수집

`00-thesis.md`에서:
- Answer, Key Arguments 목록

각 섹션 파일에서:
- `status`, Claim, Grounds 핵심, scheme, CQ 미충족 수, Confidence

### 출력 형식

```
----------------------------------------
{project} — 논증 구조
{settled}/{total} settled
----------------------------------------

Thesis: "{Answer}"

  01 {section-name} [{status}]
     Claim: {Claim 한 줄}
     Grounds: {Grounds 핵심 — 50자}
     CQ 미충족: {미충족 CQ 수}개
     Confidence: {Tetlock band}

  02 {section-name} [{status}]
     Claim: {Claim 한 줄}
     Grounds: (미완성)

  03 {section-name} [{status}]
     (미전개)

----------------------------------------
```

**출력 규칙:**

- **Thesis**: Answer 전문. 80자 초과 시 줄바꿈
- **섹션 헤더**: `  {번호} {이름} [{status}]` — 인덴트 2칸
- **섹션 필드**: 인덴트 5칸. 값이 있는 필드만 출력
- **필드값**: 50자 초과 시 `...` 으로 자름
- **미전개 섹션** (`draft` + 필드 없음): `(미전개)` 한 줄로 축약
- **status 표기**: `[settled]` `[discussing]` `[draft]` `[needs-revision]` `[invalidated]`
- **미충족 CQ**: confidence ≤ 1인 CQ 수 표시. 0이면 생략

### 출력 예시

```
----------------------------------------
{project-name} — 논증 구조
{M}/{N} settled
----------------------------------------

Thesis: "{thesis answer 40자}"

  01 {section-a} [settled]
     Claim: {섹션 a 주장 요약}
     Grounds: {근거 요약}
     CQ 미충족: {수}개
     Confidence: {Tetlock band}

  02 {section-b} [settled]
     Claim: {섹션 b 주장 요약}
     Grounds: {근거 요약}
     scheme: {scheme명}

  03 {section-c} [discussing]
     Claim: {섹션 c 주장 요약}
     Grounds: {근거 요약}

----------------------------------------
```

> 예시의 `{중괄호}` 값은 실제 섹션 파일에서 렌더링 시점에 치환된다. AI가 자체로 구체 수치·출처를 생성해 넣으면 fabrication이다. `references/ai-content-boundary.md` 참조.

---

## Local 모드 (섹션 지정)

특정 섹션의 Walton 구조 전체를 상세히 출력한다.

### 섹션 파일 확인

- 숫자 → `{N}-*.md` 패턴 검색
- 이름 → `*-{name}.md` 패턴 검색
- 없으면 → `❌ 섹션을 찾을 수 없습니다: {section}`

### 출력 형식

```
----------------------------------------
{N}-{section-name} [{status}]
Scheme: {scheme} | Confidence: {confidence}
----------------------------------------

Thesis: "{Answer}"
Key Argument: "{thesis_argument}"

Claim:
  {Claim 전문}

Grounds:
  1. {Ground 1}
  2. {Ground 2}
  3. {Ground 3}

CQ Responses:
  {CQ Responses 테이블 요약 — 미충족 CQ 강조}

Confidence: {Tetlock anchor}

Open Questions:
  - {미해결 질문 1}
  - {미해결 질문 2}

----------------------------------------
```

**출력 규칙:**

- 필드 라벨은 볼드 없이 `Label:` 형식
- 값이 비어있는 필드 블록은 통째로 생략
- Grounds는 번호 매기기 (복수일 때)
- Open Questions가 없으면 블록 생략
- Claim/CQ Responses/Confidence는 전문 출력 (잘라내지 않음)

### 출력 예시

```
----------------------------------------
{N}-{섹션} [settled]
Scheme: {scheme} | Confidence: {confidence}
----------------------------------------

Thesis: "{thesis answer 40자}"
Key Argument: "{thesis_argument}"

Claim:
  {Claim 전문}

Grounds:
  1. {Ground 1 — 출처/수치/사례}
  2. {Ground 2 — 출처/수치/사례}
  3. {Ground 3 — 출처/수치/사례}

CQ Responses:
  {CQ 테이블 요약}

Confidence: {Tetlock anchor}

----------------------------------------
```

> 예시의 `{중괄호}` 값은 실제 섹션 파일에서 렌더링 시점에 치환된다. AI가 자체로 구체 수치·출처를 생성해 넣으면 fabrication이다. `references/ai-content-boundary.md` 참조.

---

## Debate 비교 (자동 호출)

`/sowhat:debate` 라운드 완료 시 자동 호출.
이전 상태는 git에서 가져온다:

```bash
git show HEAD~1:{section-file}.md
```

### 출력 형식

```
----------------------------------------
debate 변화 — {섹션} 라운드 {N}
----------------------------------------

Before:
  Claim: {이전 Claim}
  미충족 CQ: {이전 미충족 CQ 수}

After:
  Claim: {현재 Claim}
  미충족 CQ: {현재 미충족 CQ 수}

변경점:
  - {변경된 필드}: {변경 요약}
  - {변경된 필드}: {변경 요약}

----------------------------------------
```

변경되지 않은 필드는 생략한다. 변경된 필드만 Before/After에 포함.

---

## `--export` 모드: ARGUMENT-MAP.md 생성

`--export` 플래그가 있으면 터미널 출력에 더해 `export/ARGUMENT-MAP.md`를 생성한다.
이 파일은 논증의 **Walton 구조 전체 스냅샷**으로, draft 산출물과 독립적으로 관리된다.

```bash
mkdir -p export
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```markdown
# Argument Map: {project}

<!-- 생성: {현재 datetime} -->

## Thesis

**Answer**: {00-thesis.md Answer}

**Confidence**: {섹션별 Confidence 중 최저값}

**SCQ**:
- Situation: {Situation}
- Complication: {Complication}
- Question: {Question}

## Logic Tree

{각 섹션을 번호 순서대로:}

### {N}-{section-name} [{status}]

- **Scheme**: {scheme}
- **Confidence**: {confidence}
- **Claim**: {Claim 내용}
- **Grounds**: {Grounds 핵심 요약 — 1-2문장}
- **scheme**: {scheme명} — CQ 응답 {N}개, 미충족 {M}개
- **미충족 CQ**: {confidence ≤ 1인 CQ 수}개
- **GitHub Issue**: {github_issue 있으면 #N, 없으면 —}

---

{반복}

## Invalidated Arguments

{status가 invalidated인 섹션 목록}
- {N}-{section}: {무효화 사유 — Decision Log에서 추출}

(없으면 이 섹션 생략)

## Debate History

{logs/debate/ 디렉터리가 존재하고 파일이 있으면:}
{각 debate 파일의 핵심 결론 요약}

(logs/debate/ 없거나 비어있으면 이 섹션 생략)

## Research Used

{research/ 디렉터리에서 status가 accepted인 파인딩:}
- [{파일명}] {finding 핵심 — 1문장} → {관련 섹션}

(없으면: "리서치 파인딩 없음")
```

```bash
git add export/ARGUMENT-MAP.md
git commit -m "map: export argument map snapshot"
```

**용도**: 논증 구조 자체를 공유·아카이브·비교할 때 사용.
여러 시점에서 `--export`를 실행하면 논증 진화 과정을 추적할 수 있다.

---

## 핵심 원칙

- **터미널 인라인** — 외부 도구 없이 즉시 확인 가능한 텍스트 출력
- **인덴트 기반 계층** — 특수문자 없이 공백 인덴트만으로 구조 표현
- **명제 중심** — 파일명이 아닌 실제 주장·근거·반박 문장을 표시
- **생략 원칙** — 비어있는 필드/블록은 출력하지 않음
- **`--export`는 정식 산출물** — `export/ARGUMENT-MAP.md`로 저장하는 유일한 경로
