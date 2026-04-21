# /sowhat:critic — 대상 콘텐츠 비평

<!--
@metadata
checkpoints:
  - type: decision
    when: "약점 주입 대상 선택"
config_reads: [mode, source, layer, sections]
config_writes: []
continuation:
  primary: "/sowhat:debate {section} --stance critique"
  alternatives: ["/sowhat:expand {section}", "/sowhat:inject {section}"]
status_transitions: ["settled → needs-revision (inject 시)"]
-->

이 커맨드는 대상 콘텐츠의 논증 구조를 5차원으로 비평하고, 약점을 식별하여 사용자 섹션에 주입을 제안한다. content-critique 모드(`/sowhat:init --from`)로 시작한 프로젝트에서만 사용 가능하다.

## 인자 파싱

```
/sowhat:critic [--inject]
```

| 인자 | 의미 |
|------|------|
| (없음) | 비평만 수행, 리포트 생성 |
| `--inject` | 비평 후 약점을 사용자 섹션에 자동 주입 제안 |

## 사전 검증

1. `planning/config.json` 로드
2. `mode` 필드 확인: `"content-critique"` → 계속
3. `source` 필드 존재 확인
4. `00-thesis.md` 로드 → `## Source Content` 섹션에서 대상 Toulmin 분석 추출
   - Source Content 섹션이 없으면: `❌ 00-thesis.md에 Source Content 섹션이 없습니다. /sowhat:init --from으로 다시 시작하세요.`
5. 모든 섹션 파일 로드 (주입 매핑용)
6. 디렉터리 생성:
   ```bash
   mkdir -p critic
   ```
7. 세션 로그 생성

## L1 Fabrication 차단 (필수)

이 워크플로우가 **AI가 생성하는** 비평 근거·인용에는 구체 수치·기관명·연도·인물명·URL 같은 fabrication 가능 고유값을 포함하지 않는다.

5차원 비평의 findings는 **대상 콘텐츠의 구체적 부분을 인용**해야 하며(이는 실재 인용), AI가 비평을 강화하려고 외부 기관명·수치를 만들어 넣는 것은 금지. 외부 비교가 필요하면 research-agent를 스폰.

상세: `references/fabrication-prevention.md`.

## Step 1: 대상 콘텐츠 로드

`00-thesis.md`의 `## Source Content` → `### 대상 Toulmin 분석` 테이블에서 다음을 추출한다:
- `target_claim`, `target_grounds`, `target_warrant`, `target_qualifier`, `target_rebuttal`

소스 URL/파일 경로는 `config.json`의 `source` 필드에서 가져온다.

필요 시 원본 콘텐츠를 다시 가져올 수 있다:
- URL → `WebFetch`
- 파일 → `Read`

## Step 2: 5차원 비평

`sowhat-critic-agent`를 Task로 스폰하거나, 오케스트레이터가 직접 분석한다.

### 차원 1: Toulmin 완전성

대상 논증의 각 Toulmin 필드 상태를 평가한다:

| 필드 | 상태 | 의미 |
|------|------|------|
| Claim | `present` \| `implicit` \| `missing` | 핵심 주장이 명시적인가 |
| Grounds | `present` \| `implicit` \| `missing` | 근거가 제시되었는가 |
| Warrant | `present` \| `implicit` \| `missing` | 논리적 연결이 명시적인가 |
| Backing | `present` \| `implicit` \| `missing` | Warrant 지지 근거가 있는가 |
| Qualifier | `present` \| `implicit` \| `missing` | 확실성 수준이 명시되었는가 |
| Rebuttal | `present` \| `implicit` \| `missing` | 반론 조건이 인정되었는가 |

`implicit`이나 `missing`인 필드는 finding으로 기록한다.

### 차원 2: Warrant 유효성

challenge-algorithm.md의 Warrant 검증과 동일한 기준:
- **Non-sequitur**: Grounds → Claim 논리적 연결 없음
- **Missing link**: 중간 단계 생략 (A → C, B 없음)
- **Circular**: Warrant가 Claim을 반복

### 차원 3: 근거 품질

source-credibility.md의 T1-T4 기준으로 대상의 각 근거를 평가:
- T1: 학술 논문, 공식 통계
- T2: 업계 보고서, 전문 매체
- T3: 일반 뉴스, 블로그
- T4: 개인 의견, 출처 미명시

데이터 현재성, 표본 크기, 방법론도 점검한다.

### 차원 4: Qualifier 적정성

대상의 주장 확실성이 근거 강도에 비해 적절한가:
- **Overclaiming**: 강한 주장 + 약한 근거 → finding
- **적정**: 근거 강도에 맞는 확실성
- Qualifier 척도: definitely(0) > usually(1) > in most cases(2) > presumably(3) > possibly(4)

### 차원 5: Rebuttal 커버리지

대상이 놓치고 있는 반론(blind spot)을 탐색:
- 대상의 Claim이 거짓이 되는 조건은?
- 언급되지 않은 반례는?
- Scope 외부에서 발생하는 문제는?

## Step 3: 심각도 분류

각 finding에 심각도를 부여한다:

- **critical**: 논증 구조적 실패 — Warrant 부재, 순환 논증, 근거 없는 핵심 주장
- **major**: 중요한 약점 — Qualifier 과대주장, T4 근거 의존, 핵심 반론 미대응
- **minor**: 개선 가능 — 암묵적 Warrant, 오래된 데이터, 사소한 scope 문제

## Step 4: CRITIQUE-REPORT.md 생성

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`critic/CRITIQUE-REPORT.md`를 생성한다:

```markdown
---
target: {URL 또는 파일 경로}
stance: {사용자의 stance}
created: {current_datetime}
findings: {총 finding 수}
critical: {N}
major: {N}
minor: {N}
---

# Critique Report: {대상 제목 또는 URL}

## 대상 논증 구조

| Field | Content |
|-------|---------|
| Claim | {target_claim} |
| Grounds | {target_grounds} |
| Warrant | {target_warrant} |
| Qualifier | {target_qualifier} |
| Rebuttal | {target_rebuttal} |

## 비평 결과

### 1. Toulmin 완전성
{각 필드 상태 + finding}

### 2. Warrant 유효성
{Non-sequitur/Missing link/Circular 분석}

### 3. 근거 품질
{각 근거 T1-T4 평가}

### 4. Qualifier 적정성
{Overclaiming 여부}

### 5. Rebuttal 커버리지
{blind spot 목록}

## 약점 요약

| # | 약점 | 심각도 | 차원 | 주입 가능 섹션 |
|---|------|--------|------|---------------|
| W1 | {description} | {severity} | {dimension} | {section}.{field} |
| W2 | ... | ... | ... | ... |

## 종합 평가
{대상 논증의 전반적 강도 평가}
```

## Step 5: 주입 매핑 제안

약점을 사용자의 섹션에 매핑한다. 매핑 규칙:
- Warrant 약점 → 사용자 섹션의 **Grounds** (대상 논리 결함을 자신의 근거로 활용)
- 근거 품질 약점 → 사용자 섹션의 **Grounds** (대상 근거의 취약함을 지적)
- Rebuttal blind spot → 사용자 섹션의 **Rebuttal** (대상이 놓친 반론을 자신의 방어에 활용)
- Qualifier 과대주장 → 사용자 섹션의 **Warrant** (대상의 과대주장을 논거 연결에 활용)

```
----------------------------------------
비평 완료: {N} findings (critical: {N}, major: {N}, minor: {N})

  약점 → 섹션 매핑 제안:

  [W1] {약점 요약} → {section} {field}에 추가
  [W2] {약점 요약} → {section} {field}에 추가
  [W3] {약점 요약} → {section} {field}에 추가

  [1] 전체 주입 — 모든 제안 적용
  [2] 선택 주입 — 번호 선택 (예: W1 W3)
  [3] 주입 보류 — 리포트만 저장
----------------------------------------
```

`--inject` 인자가 있으면 자동으로 [1]을 선택한다.

## Step 6: 주입 실행 (인간이 [1] 또는 [2] 선택 시)

선택된 약점에 대해:
1. 대상 섹션 파일을 읽는다
2. 해당 필드(Grounds/Rebuttal/Warrant)에 약점 내용을 추가한다
   - 추가 형식: `### [Critic] {약점 제목}` + 내용
3. `updated` 타임스탬프를 갱신한다
4. 섹션이 `settled` 상태였으면 `needs-revision`으로 변경한다
   - config.json도 동기화

## Step 7: 커밋 + 세션 로그

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```bash
git add critic/CRITIQUE-REPORT.md {수정된 섹션 파일들}
git commit -m "critic: analyze target content - {N} findings ({critical}C/{major}M/{minor}m)"
```

`logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: critic
section: target-content
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
critic 완료 — {N} findings 발견 ({critical} critical, {major} major, {minor} minor). {injected}건 주입됨.

## 재개 시 첫 질문
/sowhat:debate {가장 약점 주입이 많은 섹션} --stance persuade
```

## 완료 안내

```
✅ 대상 콘텐츠 비평 완료
  - critic/CRITIQUE-REPORT.md 생성
  - Findings: {N} (critical: {N}, major: {N}, minor: {N})
  - 주입됨: {N}건

----------------------------------------
다음 액션:

[1] 주입된 약점을 활용해 논증 전개 (/sowhat:expand {section})
[2] 대상 논증을 debate로 공격 (/sowhat:debate {section} --stance critique)
[3] 합의점 탐색 (/sowhat:debate {section} --stance consensus)
----------------------------------------


```

## 핵심 원칙

- **대상 논증을 분석한다** — 사용자의 논증이 아니다
- **공정하게 분석한다** — 약점을 조작하지 않는다
- **모든 finding은 근거 기반** — 대상 콘텐츠의 구체적 부분을 인용한다
- **심각도는 실질적 영향 기준** — 논증에 미치는 실제 영향으로 판단
- **강점도 인정한다** — 종합 평가에서 대상의 강점도 언급한다
