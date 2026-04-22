# /sowhat:draft — 산출물 생성 파이프라인

<!--
@metadata
checkpoints:
  - type: decision
    when: "산출물 브리프 작성 (Step 1)"
  - type: decision
    when: "구조 프레임워크 확인 (Step 3)"
config_reads: [layer, sections, draft_profiles]
config_writes: [draft_profiles]
continuation:
  primary: "/sowhat:draft --profile {id}"
  alternatives: ["/sowhat:draft --list", "/sowhat:debate {section}"]
status_transitions: []
-->

이 커맨드는 settled된 논증을 **구체적인 산출물**로 변환한다.
바바라 민토의 피라미드 원칙을 기반으로 구조를 제안하고, 목적·독자·채널에 최적화된 문서를 생성한다.

## AI Content Boundary (cycle 7)

draft는 외부 공유용 산출물을 생성한다. AI는 산출물에서 **기획·명세 섹션의 내용을 그대로 또는 paraphrase만** 가능. 구체값(수치·기관명·연도·인물명·URL)은 섹션 파일에 이미 `[source:...]` 태그로 추적되며, 산출물에서도 태그를 보존한다.

- 기획 섹션의 구체값은 **source tag와 함께** 산출물로 옮겨진다 (아래 Step 5 공통 원칙 참조)
- AI가 섹션에 없던 새 구체값을 산출물에 추가하면 parser가 drop (Step 6의 렌더링 검증)
- 원본에 없는 수치가 필요하면 → 사용자에게 `/sowhat:research` 또는 `/sowhat:inject` 경로 안내 후 재draft

상세: `references/ai-content-boundary.md`.

`$ARGUMENTS` 파싱:
- `--profile {id}`: 저장된 프로파일로 즉시 재생성
- `--list`: 저장된 프로파일 목록 출력 후 종료
- `--edit {id}`: 기존 프로파일 수정 모드
- `--output all|document|prd|argument-map`: 레거시 호환 출력 대상
- `--review {id}`: 인간의 수정 사항을 분석하고 피드백 루프 실행

---

## 사전 검증

1. `planning/config.json` 로드
   - 파일 없으면: `❌ sowhat 프로젝트가 아닙니다. /sowhat:init으로 초기화하세요.`

2. **`--list` 처리**: `$ARGUMENTS`에 `--list`가 있으면:
   - `export/profiles/` 디렉터리 스캔
   - 프로파일별 요약 출력 후 종료:
     ```
     ----------------------------------------
     📋 저장된 산출물 프로파일

     ID                  산출물              마지막 생성
     ----------------------------------------
     linkedin-series     링크드인 시리즈      2024-01-15
     investor-deck       투자 제안서          (미생성)
     gsd-prd             GSD PRD             2024-01-10

     **사용:**
       /sowhat:draft --profile linkedin-series
       /sowhat:draft --edit investor-deck
       /sowhat:draft                          (새 프로파일 생성)
     ----------------------------------------
     ```

3. **`--profile {id}` 처리**: 해당 프로파일 파일 로드 → Step 4로 직행 (구조 확인 스킵)

4. **`--edit {id}` 처리**: 해당 프로파일 파일 로드 → Step 1로 가되 기존값을 기본값으로 표시

5. `layer` 확인:
   - `"planning"` → 경고 후 진행 여부 질문:
     ```
     ⚠️  현재 레이어: planning

     명세 레이어가 아직 완성되지 않았습니다.
     기획 논거만으로 초안을 생성하면 기술 명세 섹션이 누락됩니다.

       [1] 기획 레이어만으로 초안 생성 (PRD/GSD export 불가)
       [2] 취소 (/sowhat:finalize-planning 먼저 실행)
     ```
     - [2] 선택 시 종료
     - [1] 선택 시: `prd`, `gsd-export` deliverable 불가 안내

   - `"spec"` 또는 `"finalized"` → 명세 섹션(04~09) 상태 확인:
     - unsettled 섹션이 하나라도 있으면:
       ```
       ⚠️  미완성 명세 섹션 발견

       다음 섹션이 settled 상태가 아닙니다:
         - {section}: {status}

         [1] unsettled 섹션 포함하여 생성 (불완전할 수 있음)
         [2] settled 섹션만으로 생성
       ```

6. 섹션 파일 로드:
   - `00-thesis.md` (필수)
   - `planning/` 디렉터리의 모든 `*.md` 파일 (01-*.md, 02-*.md, …)
   - layer가 spec/finalized이면: `04-actors.md` ~ `09-acceptance-criteria.md`
   - status가 `invalidated`인 섹션은 제외
   - [2] 선택 시 `draft`, `discussing`, `needs-revision` 상태인 섹션도 제외

6.5. **Layer 순서 강제**:

   draft는 외부 공유용이므로 planning 레이어 미확정 상태에서는 차단한다.

   절차:
   1. `planning/config.json`의 `layer` 필드 확인
   2. `layer == "planning"` AND `/sowhat:finalize-planning` 한 번도 실행 안 됨:

      ```
      🔴 Draft 차단 — 기획 레이어 미확정

      draft는 finalize-planning 이후에만 실행할 수 있습니다.

      다음 중 선택:
        [1] /sowhat:finalize-planning 실행 후 draft 재시도 (권장)
        [2] --force (escape hatch)
      ```

   3. `layer == "spec"` 또는 `"finalized"` → 통과, 단계 6.6으로 진행

6.6. **Source tag 수집 (Step 5 렌더링 준비)**:

   Step 5에서 생성물에 구체값을 옮길 때 source tag를 보존하기 위한 사전 준비:

   1. 각 settled 섹션의 Grounds/Claim/Backing/Warrant에서 `[source:user]` / `[source:#NNN]` / `[source:sub-research]` / `[source:file:*]` 태그가 붙은 불릿을 수집
   2. 변수 `planning_sourced_items[]`에 저장 — `{section, field, bullet_index, text, source_tag}` 구조
   3. 이 목록이 Step 5 렌더링 시 산출물에 구체값이 등장할 수 있는 **유일한 출처**

   AI가 이 목록에 없는 구체값을 산출물에 추가하려 하면 Step 6 검증에서 drop된다. cycle 1-6의 L4 Unverified 게이트(`unverified_items` 집계)와 L1 렌더링 검증 정규식 차집합은 cycle 7에서 폐기 — source tag가 모든 구체값을 사전에 추적하므로 사후 탐지·차집합이 불필요 (`references/ai-content-boundary.md`).

7. 시리즈 확인 (config.json에 `series` 필드가 있으면):
   - 시리즈 캐릭터가 지정되어 있으면 자동 적용 (사용자가 다른 캐릭터를 선택하지 않는 한)
   - `~/.claude/sowhat-series/{series.name}/terminology.json` 로드하여 용어 일관성 검사에 사용
   - draft 생성 시 "시리즈 연결 메모" 섹션을 문서 끝에 추가:
     ```
     ---
     *이 글은 [{series_title}] 시리즈의 {episode}편입니다.*
     *이전 편: [{prev_title}]({prev_link})*
     *다음 편: [{next_title}] (예정)*
     ```
   - 이전/다음 편 정보는 `series.json`의 에피소드 목록에서 추출
   - 첫 편이면 "이전 편" 생략, 마지막 편이면 "다음 편" 생략

---

## session.md 저장 (사전 검증 완료 후)

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: draft
section: export
step: brief-intake
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
draft 시작 — 사전 검증 완료. 산출물 브리프 작성 대기 중.

## 재개 시 첫 질문
/sowhat:draft → 브리프 작성부터 재시작
```

---

## Step 1: 산출물 브리프 (Brief Intake)

이전의 단순한 "형식 선택 + 독자 선택" 대신, **구체적인 산출물 정의**를 수집한다.

### 1a. 산출물 유형

```
❓ 어떤 산출물을 만듭니까?

**비즈니스 문서:**
  [1] 임원/보고용 요약      — 핵심 결론 + 최소 근거
  [2] 제안서/기획서          — 논증 전체 + 상세 근거
  [3] 투자/IR 자료           — 문제-시장-솔루션-요청
  [4] 의사결정 문서          — 옵션 비교 + 권고
  [5] 백서                   — 전문가 대상 심층 분석

**디지털 콘텐츠:**
  [6] 블로그 포스트          — SEO 친화적 장문
  [7] 링크드인 포스트/아티클  — B2B 전문 콘텐츠
  [8] 트위터/X 스레드        — 280자 단위 분할
  [9] 인스타그램 캐러셀      — 슬라이드 단위 핵심 메시지
  [10] 뉴스레터              — 이메일 구독자 대상

**프레젠테이션/영상:**
  [11] 슬라이드 덱           — 프레젠테이션 스크립트
  [12] 피치덱               — 투자/사업 발표
  [13] 영상 스크립트          — 유튜브/강의 내레이션
  [14] 팟캐스트 스크립트      — 음성 콘텐츠

**학술/연구:**
  [15] 연구 기획서           — 방법론 + 문헌 기반
  [16] 논문 초안             — 학술 형식
  [17] 문헌 검토             — 선행 연구 정리

**파이프라인 연동:**
  [18] GSD PRD              — /gsd:new-project 입력용
  [19] 사용자 스토리          — Jira/Linear/GitHub Issues
  [20] API 명세서            — OpenAPI/Swagger 형식

  [0] 직접 정의
```

[0] 선택 시: 사용자가 산출물 유형을 직접 서술.
선택된 유형을 `DELIVERABLE`로 기억한다.

### 1b. 목적과 목표

선택된 유형에 맞는 추천 목적을 제시하되, 사용자 입력을 우선한다:

```
❓ 이 {DELIVERABLE}의 목적과 목표는?

  [1] 추천 수락                                                    ← 추천
      목적: {유형별 기본 목적 제안}
      목표: {유형별 기본 목표 제안}
  [2] 직접 입력
```

유형별 기본 목적/목표 추천:
- `executive-summary`: 목적="의사결정자에게 핵심 결론 전달" / 목표="승인 또는 다음 단계 결정"
- `blog-post`: 목적="잠재 고객에게 문제 인식 + 전문성 입증" / 목표="사이트 유입 및 신뢰 구축"
- `linkedin-post`: 목적="B2B 전문가 네트워크에 인사이트 공유" / 목표="프로필 방문 + 연결 요청 증가"
- `investment-deck`: 목적="투자자에게 기회 제시" / 목표="후속 미팅 확보"
- `prd`: 목적="개발팀에 구현 범위 전달" / 목표="구현 착수 가능한 명세 확보"
- (기타 유형도 유사하게)

### 1c. 타겟 독자

```
❓ 이 {DELIVERABLE}의 핵심 독자는?

구체적으로 정의할수록 더 좋은 문서가 됩니다.

  누구: (직책, 역할, 업종)
  이미 아는 것: (배경지식, 전제)
  모르는 것: (이 문서에서 전달할 새로운 정보)
  관심사: (이 사람이 신경쓰는 것)

**빠른 선택:**
  [1] 경영진 (기술 배경 없음, 결론 + ROI 우선)
  [2] 투자자 (시장 + 팀 + 수익 모델 중심)
  [3] 개발팀 (기술 상세 + 구현 가능성)
  [4] 일반 대중 (쉬운 언어, 공감 중심)
  [5] 직접 입력
```

[5] 선택 시: 4개 항목을 각각 입력받는다.
[1]~[4] 선택 시: 기본값으로 채우되, 사용자가 수정 가능.

### 1d. 증거 제시 깊이

```
❓ 증거/근거를 얼마나 상세히 제시합니까?

  [1] 주장 중심 — Claim + 핵심 수치만 (소셜, 슬라이드)
  [2] 균형형   — Claim + 핵심 근거 1-2개 (블로그, 보고서)     ← 추천: {유형별}
  [3] 근거 상세 — 전체 근거 + 논리 연결 (제안서, 의사결정)
  [4] 학술형   — 전체 Toulmin + 출처 명시 (논문, 백서)
```

`← 추천:` 표시는 `references/output-profiles.md`의 산출물 유형별 기본 증거 깊이를 참조.

---

## Step 2: 길이 및 시리즈 설정

### 2a. 단일 vs 시리즈

```
❓ 단일 콘텐츠입니까, 시리즈입니까?

  [1] 단일 콘텐츠 — 하나의 완결된 문서/포스트
  [2] 시리즈     — 여러 편으로 나누어 발행

  현재 Key Arguments: {KA 수}개
  추천: {KA ≤ 2 → "단일" | KA ≥ 3 → "시리즈({KA+2}편)도 고려"}
```

### 2b. [1] 단일 선택 시: 길이

```
❓ 목표 분량은?

  [1] 추천: {유형별 기본 단어 수} 단어 (약 {페이지 수}페이지)  ← 추천
  [2] 직접 입력 (예: 2000, "A4 3장", "5분 분량")
```

### 2c. [2] 시리즈 선택 시: 시리즈 설정

```
❓ 시리즈 구성

  추천 편수: {자동 계산값}편
  추천 편당 분량: {유형별 기본값} 단어

  편수 (0=자동):
  편당 분량:
  시리즈 제목 (선택):
  다음 편 예고 포함: [Y/n]
```

자동 계산은 `references/output-profiles.md`의 "자동 분할 알고리즘" 참조.

---

## Step 3: 구조 프레임워크 제안 및 조정

이 단계에서 민토 피라미드 원칙에 기반한 **문서 구조를 제안**하고, 사용자가 조정할 수 있게 한다.

### 3a. 구조 제안

수집된 브리프를 기반으로 최적 구조를 자동 결정:

**도입부 SCQA 변형 결정 로직**:
- 독자가 결론을 이미 아는 경우 (경영진 내부 보고) → `direct` (AQSC)
- 독자의 호기심을 유발해야 하는 경우 (블로그, 소셜) → `curiosity` (QSCA)
- 설득이 필요한 경우 (제안서, 투자) → `standard` (SCQA)
- 스토리텔링이 필요한 경우 (영상, 프레젠테이션) → `story` (SCAQ)

**그룹화 원칙 결정 로직**:
- 단계적 실행 계획이 핵심 → `chronological`
- MECE 분해가 핵심 → `structural`
- 우선순위/임팩트가 핵심 → `importance`

**프레임워크 결정 로직**:
- 비즈니스 의사결정 → `pyramid`
- 디지털 콘텐츠 → `narrative`
- 투자/컨설팅 → `problem-solution`
- 기술 선택/비교 → `comparative`
- 짧은 콘텐츠 → `prep`
- 학술/연구 → `academic`

제안 출력:

```
📐 제안 구조

  프레임워크: {framework_name}
  도입부: {scqa_variant} ({SCQA 순서 설명})
  논거 배열: {grouping} ({그룹화 설명})
  증거 깊이: Level {N} ({level_name})

**목차 미리보기:**

  {구조별 목차를 실제 섹션 내용 기반으로 렌더링}

  예시 (pyramid + standard SCQA + importance):
  I.  도입: {Situation 요약} → {Complication} → {Question}
      핵심 결론: {Answer 1문장}

  II. {KA1 제목} (가장 중요)
      - {Ground 1.1 요약}
      - {Ground 1.2 요약}

  III. {KA2 제목}
      - {Ground 2.1 요약}

  IV. {KA3 제목}
      - {Ground 3.1 요약}

  V.  반론과 대응
      - {Rebuttal 요약}

  VI. 결론 및 제언
      - {CTA}

  [부록: 열린 질문들]

**조정:**

  [1] 이대로 진행
  [2] 구조 조정 (프레임워크/순서/섹션 변경)
```

### 3b. [2] 구조 조정

사용자가 [2]를 선택하면 대화형으로 조정:

```
🔧 구조 조정

  [1] 프레임워크 변경: {현재} → pyramid | narrative | problem-solution | comparative | prep | academic
  [2] 도입부 변형: {현재} → standard | direct | curiosity | story
  [3] 논거 순서: {현재 KA 순서} → 재배열
  [4] 그룹화 원칙: {현재} → chronological | structural | importance
  [5] 섹션 추가: TL;DR, FAQ, 용어집, 참고문헌 등
  [6] 섹션 제거: 현재 목차에서 제거
  [7] KA 병합: 2개 KA를 하나로 합치기
  [8] 완료 — 조정 끝

무엇을 조정합니까?
```

[8] 선택 시 또는 조정 완료 후 → Step 4로 진행.
각 조정 선택 시 해당 항목만 변경하고 목차를 다시 보여준다.

### 3c. 시리즈인 경우: 파트별 구조

시리즈(`length.mode: "series"`)일 때 추가 출력:

```
📐 시리즈 구조 ({N}편)

  Part 1: 도입 — "{시리즈 제목}: 왜 지금인가"
    >SCQA 전체 + 시리즈 로드맵

  Part 2: {KA1 제목}
    >미니 SCQA + {Ground 요약}

  Part 3: {KA2 제목}
    >미니 SCQA + {Ground 요약}

  ...

  Part {N}: 결론 — "그래서 어떻게 해야 하는가"
    >전체 요약 + 통합 반론 대응 + CTA

**조정:**

  [1] 이대로 진행
  [2] 파트 구성 변경 (병합/분리/순서)
```

---

## Step 4: 프로파일 저장

구조 확정 후, 프로파일을 저장한다.

### 4a. 프로파일 ID 입력

```
💾 프로파일 저장

  프로파일 ID (kebab-case, 예: linkedin-series):
  프로파일 이름 (한글 가능, 예: 링크드인 시리즈):
```

`--edit` 모드일 때는 기존 ID를 유지하고 이름만 수정 가능.

### 4b. 프로파일 파일 생성

```bash
mkdir -p export/profiles
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`export/profiles/{profile-id}.yml` 파일을 Write 도구로 생성:

```yaml
id: "{profile-id}"
name: "{profile-name}"

deliverable: "{DELIVERABLE}"
purpose: "{사용자 입력 목적}"
goal: "{사용자 입력 목표}"
target_audience:
  who: "{누구}"
  knows: "{이미 아는 것}"
  doesnt_know: "{모르는 것}"
  cares_about: "{관심사}"

structure:
  framework: "{framework}"
  scqa_variant: "{variant}"
  grouping: "{grouping}"
  evidence_depth: {N}
  custom_sections:
    prepend: [{추가 앞 섹션}]
    append: [{추가 뒤 섹션}]

length:
  mode: "{single|series}"
  target_words: {N}
  series_config:
    parts: {N}
    words_per_part: {N}
    series_title: "{제목}"
    cliffhanger: {true|false}

tone: "{tone}"
language: "ko"

created: "{current_datetime}"
updated: "{current_datetime}"
last_generated: null
generation_count: 0
```

### 4c. config.json 업데이트

`planning/config.json`의 `draft_profiles` 필드에 추가:

```json
"draft_profiles": {
  "{profile-id}": {
    "file": "export/profiles/{profile-id}.yml",
    "last_generated": null,
    "generation_count": 0
  }
}
```

`draft_profiles` 필드가 없으면 새로 생성.

---

## Step 5: 문서 생성

`export/generated/{profile-id}/` 디렉터리 생성:
```bash
mkdir -p export/generated/{profile-id}
```

### 공통 생성 원칙

**민토 피라미드 적용**:
1. **결론 선행**: Answer를 문서의 가장 앞에 배치 (direct/curiosity 변형 제외)
2. **위에서 아래로**: 추상 → 구체 순서로 전개
3. **그룹화 준수**: 선택된 grouping 원칙에 따라 KA 배열
4. **동일 추상화**: 같은 레벨의 내용은 같은 깊이로 서술
5. **MECE 유지**: 중복 없이, 빠짐 없이

**Source tag 보존 (cycle 7)**:
- 산출물에 구체값(수치·기관명·연도·URL)을 옮길 때는 `planning_sourced_items[]`의 항목만 사용
- 각 구체값에 각주 형식으로 source 표기:
  ```markdown
  이탈률은 34%에 달한다.¹
  ---
  ¹ 출처: #003 (research/003-saas-churn.md) — 검증된 finding
  ```
- `[source:placeholder]` / `[source:inference]` 항목은 구체값 없이 일반 텍스트로 렌더링 (각주 없음)
- `planning_sourced_items[]`에 없는 구체값을 AI가 추가하면 Step 6 검증에서 감지되어 drop

### 시리즈 에피소드 생성 시 추가 컨텍스트

config.json에 `series` 필드가 있으면 생성 시 다음을 추가로 고려:

1. **용어 일관성**: terminology.json의 정의를 따른다
2. **이전 편 참조**: 이전 에피소드에서 확립된 결론을 "이전 편에서 살펴본 바와 같이" 형태로 자연스럽게 연결
3. **다음 편 예고**: 에피소드 마지막에 다음 편에서 다룰 내용을 암시
4. **독립 가독성**: 이 편만 읽어도 이해 가능하도록 핵심 전제는 간략히 재설명
5. **시리즈 내비게이션**: 문서 상단/하단에 시리즈 내비게이션 추가

**Toulmin 렌더링**:
- 불릿 포인트 나열이 아닌, 읽히는 서술형
- Qualifier 언어 적절히 사용: "확실히", "대체로", "대부분의 경우", "추정컨대"
- Rebuttal을 자연스러운 반론 대응으로: "물론 …라는 우려도 있다. 그러나 …"

**증거 깊이별 렌더링**:
- Level 1 (주장 중심): Claim + 가장 강한 Ground 1개 인라인
- Level 2 (균형형): Claim + 핵심 Grounds 1-2개 + Rebuttal 1문장
- Level 3 (근거 상세): Claim + 전체 Grounds + Warrant + Backing + 상세 Rebuttal
- Level 4 (학술형): 전체 Toulmin + 출처 정식 인용 + 방법론 + 한계점

### 단일 콘텐츠 생성

프레임워크별 구조에 따라 `export/generated/{profile-id}/DOCUMENT.md` 생성.

**파일 상단 메타데이터:**
```markdown
<!--
  프로파일: {profile-id}
  생성: {현재 datetime}
  산출물: {deliverable}
  목적: {purpose}
  목표: {goal}
  독자: {target_audience.who}
  프레임워크: {framework}
  증거 깊이: Level {N}
  레이어: {layer}
  Settled 섹션: {N}개
-->
```

**프레임워크별 구조 생성 지침:**

#### Pyramid (피라미드형)

```markdown
# {제목}

{SCQA 변형에 따른 도입부}

## {KA1 — grouping 순서에 따라 가장 먼저}

{evidence_depth에 맞춰 Grounds 렌더링}
{Warrant를 자연스러운 연결 문장으로}

## {KA2}

{동일 깊이로 렌더링}

## {KAN}

{동일 깊이로 렌더링}

## 반론과 대응

{각 섹션 Rebuttal 종합 — evidence_depth 3 이상이면 개별 대응, 이하면 통합}

## 결론

{Answer 재강조 + 목표에 맞는 CTA}
```

#### Narrative (서사형)

```markdown
# {Hook — 독자 관심 포착}

{Situation → 독자가 공감할 배경}

{Complication → 긴장/갈등}

## {KA1을 스토리 비트로}

{Grounds를 사례/일화 중심으로 서술}

## {KA2를 스토리 비트로}

{전환점으로서의 반론 → 대응}

## {결말 — Answer + CTA}
```

#### Problem-Solution (문제-해결형)

```markdown
# {제목}

## 문제

{Complication 중심 — 얼마나 심각한가}

## 문제의 영향

{Grounds 중 정량적 데이터}

## 원인 분석

{Warrant — 왜 이 문제가 발생하는가}

## 해결책

{Answer — 구체적 솔루션}

## 효과 증명

{Backing + 사례 Grounds}

## 다음 단계

{CTA}
```

#### Comparative (비교형)

```markdown
# {제목}: 의사결정 분석

## 배경

{SCQA}

## 비교 대상

{KA별로 옵션으로 재구성}

## 평가 기준

{Warrant에서 추출한 판단 기준}

## 분석

{Grounds를 기준별로 매핑}

## 권고

{Answer}

## 근거

{Backing}
```

#### PREP (Point-Reason-Example-Point)

```markdown
# {Point — Answer 한 문장}

{Reason — Warrant 기반}

{Example — 가장 강한 Ground}

{Point 재강조 — CTA}
```

#### Academic (학술형)

```markdown
# {제목}

## Abstract

{Answer + 주요 발견 요약 — 200-300 words}

## 1. 서론

{SCQA + 연구 질문}

## 2. 선행 연구

{Backing + Research findings — 출처 정식 인용}

## 3. 방법론

{research/ 디렉터리의 접근 방식 기술}

## 4. 주요 발견

{각 KA = 하위 섹션, 전체 Toulmin 구조 기술}

### 4.1 {KA1}
{Claim + Grounds + Warrant + Qualifier 명시}

### 4.2 {KA2}
{동일}

## 5. 논의

{Rebuttal 상세 분석 + 한계점}

## 6. 결론

{Answer + 시사점 + 후속 연구 제안}

## 참고문헌

{research/ findings에서 APA 형식으로}
```

### 시리즈 콘텐츠 생성

시리즈인 경우 파트별로 개별 파일 생성:

`export/generated/{profile-id}/part-{N}.md`

**Part 1 (도입편):**
```markdown
<!--
  시리즈: {series_title}
  파트: 1/{total_parts}
  프로파일: {profile-id}
-->

# {시리즈 제목}: {Part 1 부제}

{SCQA — 전체 시리즈의 맥락 설정}

## 이 시리즈에서 다룰 것

{KA별 1줄 예고 — 시리즈 로드맵}

## {Part 1 핵심 메시지 — Answer의 맛보기}

{evidence_depth에 맞춰 가장 강한 Ground 1개}

---
*다음 편: {Part 2 제목} — {Part 2 미니 Q}*
```

**Part 2~N-1 (본편):**
```markdown
<!--
  시리즈: {series_title}
  파트: {M}/{total_parts}
-->

# {시리즈 제목}: {Part M 부제}

> 지난 편 요약: {이전 파트 Answer 1문장}

{미니 SCQA — 이 파트만의 맥락}

## {이 파트의 KA Claim}

{evidence_depth에 맞춘 Grounds 렌더링}

## 그래서?

{이 KA가 전체 Answer에 기여하는 방식 — Warrant}

{Rebuttal 대응 (있으면)}

---
*다음 편: {Part M+1 제목} — {예고}*
```

cliffhanger=false이면 "다음 편" 라인 생략.

**Part N (결론편):**
```markdown
<!--
  시리즈: {series_title}
  파트: {N}/{N}
-->

# {시리즈 제목}: {결론 부제}

## 지금까지의 여정

{각 파트 핵심 1문장씩 요약}

## 종합: {Answer}

{Answer 상세 서술 — 시리즈 전체의 논거 종합}

## "하지만..."

{통합 Rebuttal + 대응}

## 결론: {CTA}

{목표에 맞는 행동 촉구}
```

### 채널별 특수 형식

#### 인스타그램 캐러셀 (`instagram-carousel`)

```markdown
<!-- Slide 1: Cover -->
# {Hook 제목}
{서브타이틀 — Answer 압축}

<!-- Slide 2: Problem -->
{Complication — 공감 유발 1문장}

<!-- Slide 3~N-1: Key Points -->
💡 {KA Claim}
📊 {가장 강한 Ground 1개}

<!-- Slide N: CTA -->
{Answer 재강조}
{CTA: 저장/공유/댓글}
```

#### 트위터/X 스레드 (`twitter-thread`)

```markdown
🧵 1/{N}
{Hook — Answer를 흥미롭게 재구성, 280자 이내}

2/{N}
배경: {Situation + Complication 압축}

3/{N} ~ {N-2}/{N}
💡 {KA Claim}
📊 {가장 강한 Ground}

{N-1}/{N}
⚠️ "하지만 {Rebuttal}?"
→ {대응}

{N}/{N}
결론: {Answer}
{해시태그 3-5개}
```

#### 슬라이드 덱 (`slide-deck`, `pitch-deck`)

슬라이드 산출물은 **2개 파일**로 분리 생성한다:

**파일 1: `SLIDES.md`** — 슬라이드 내용 (발표자가 아닌 청중이 보는 화면)

```markdown
<!-- Slide 1: Title -->
# {제목}
{Situation 한 줄}

<!-- Slide 2: Problem/Opportunity -->
## {Complication}
- {bullet 1}
- {bullet 2}
- {bullet 3}

<!-- Slide 3~N: Arguments -->
## {KA Claim}
- {핵심 Ground 1}
- {핵심 Ground 2}
[시각자료 제안: {차트/그래프/다이어그램 유형}]

<!-- Slide N+1: Counter -->
## "하지만..." → "그럼에도"
{Rebuttal 요약 → 대응}

<!-- Slide N+2: Conclusion -->
## {Answer}
{CTA — 구체적 다음 단계}
```

**파일 2: `SCRIPT.md`** — 발표자 스크립트 (슬라이드별 대사 + 타이밍)

```markdown
## 발표 스크립트: {제목}
예상 시간: {N}분

### Slide 1 — Title (0:00-0:30)
"{Situation 기반 오프닝 멘트. 청중의 관심을 잡는 질문이나 통계로 시작.}"

### Slide 2 — Problem (0:30-{M}:00)
"{Complication을 청중이 공감할 수 있게 풀어서 설명. 왜 이것이 문제인지 맥락 제공.}"

### Slide 3~N — Arguments ({M}:00-{M+K}:00)
"{KA Claim을 자연스러운 말투로. Grounds 데이터를 언급하며 시각자료를 가리킴.}"
[전환] "{다음 슬라이드로 넘기는 브릿지 문장}"

### Slide N+1 — Counter
"물론 이런 우려도 있습니다. {Rebuttal}. 하지만 {대응}."

### Slide N+2 — Conclusion
"{Answer 재강조}. {CTA — 구체적 요청}."
[마무리] "감사합니다. 질문 받겠습니다."
```

**Git 커밋 시 2파일 함께:**
```bash
git add export/generated/{profile-id}/SLIDES.md export/generated/{profile-id}/SCRIPT.md
git commit -m "draft({profile-id}): generate slide deck + speaker script"
```

#### 영상/팟캐스트 스크립트 (`youtube-script`, `podcast-script`)

```markdown
## 스크립트: {제목}
예상 길이: {분}분

### 도입 (0:00-0:30)
[화면/BGM] {시각자료 설명}
[내레이션] "{Hook — Situation 기반 오프닝}"

### 본론 1: {KA1} (0:30-{M}:00)
[화면] {데이터 시각화 / B-roll}
[내레이션] "{Claim}. {Grounds 기반 설명}."
[자막] {핵심 수치}

### 반론 대응 ({M}:00-{M+1}:00)
[내레이션] "물론 {Rebuttal}이라는 의견도 있습니다. 하지만..."

### 마무리
[내레이션] "{Answer}. {CTA}."
[화면] {구독/좋아요/다음 영상 예고}
```

### GSD/파이프라인 연동 산출물

#### PRD (`prd`)

`export/generated/{profile-id}/PRD.md` 생성:

```markdown
# {project} — Product Requirements Document

<!-- 프로파일: {profile-id} | 생성: {현재 datetime} | 레이어: {layer} -->

## Overview

{00-thesis.md의 Answer — 2-3문장}

{Situation을 1문장으로 압축한 맥락}

## Problem Statement

**Situation**: {Situation 전체}

**Complication**: {Complication 전체}

**Question**: {Question}

## Goals & Success Metrics

{각 Key Argument를 목표로, 해당 섹션의 Acceptance Criteria를 측정 지표로}

| Goal | Success Metric |
|------|----------------|
| {KA 1} | {AC from 섹션} |
| {KA 2} | {AC from 섹션} |

## Users & Stakeholders

{04-actors.md 내용 — actors, roles, needs}

(04-actors.md 없는 경우: "명세 레이어 완료 후 작성 예정")

## Features & Requirements

{05-functional-requirements.md 내용 — 우선순위별 기능 목록}

(없는 경우: 기획 섹션 Key Arguments에서 기능 요구사항 추론하여 기술)

## Data Model

{06-data-model.md 내용}

(없는 경우: 생략 또는 "TBD — 명세 레이어에서 정의 예정")

## API Contract

{07-api-contract.md 내용}

(없는 경우: 생략 또는 "TBD")

## Edge Cases & Constraints

{08-edge-cases.md 내용}

(없는 경우: 각 섹션의 Rebuttal에서 제약 조건 추출)

## Acceptance Criteria

{09-acceptance-criteria.md 내용 — Given/When/Then 형식}

(없는 경우: 각 섹션의 Acceptance Criteria를 통합)

## Out of Scope

{모든 섹션의 Scope.Out 항목 통합}

## Open Questions

{모든 섹션의 Open Questions 중 미해결 항목}

| 질문 | 섹션 | 우선순위 |
|------|------|---------|
| {질문} | {섹션} | High/Medium/Low |
```

#### GSD Export (`gsd-export`)

`export/generated/{profile-id}/PROJECT.md` + `export/generated/{profile-id}/REQUIREMENTS.md` 생성.
구조는 기존 `finalize.md` 워크플로우의 산출물과 동일.

### ARGUMENT-MAP.md

Argument Map은 draft의 산출물이 아니다. `/sowhat:map --export`로 생성한다.
draft에서 argument-map 요청이 들어오면 안내만 한다:

```
ℹ️ ARGUMENT-MAP.md는 /sowhat:map --export 로 생성합니다.
```

### 원본 보존 (자동)

생성된 산출물의 원본을 `.original.md` 접미사로 자동 보존한다. 인간의 수정 사항을 추적하기 위한 기준선.

- 단일: `DOCUMENT.md` 생성 후 → `DOCUMENT.original.md`로 복사
- 시리즈: `part-N.md` 생성 후 → `part-N.original.md`로 복사

```bash
# 단일 산출물
cp export/generated/{profile}/DOCUMENT.md export/generated/{profile}/DOCUMENT.original.md

# 시리즈
for f in export/generated/{profile}/part-*.md; do
  cp "$f" "${f%.md}.original.md"
done
```

`.original.md` 파일은 이후 `--review`에서 비교 기준으로 사용된다. 재생성(`--profile`) 시 `.original.md`도 덮어쓴다.

---

## Step 5.5: 산출물 source 검증 (cycle 7)

두 단계로 검증한다:

### 5.5a. 입력 섹션 parser 사전 검증 (Plan G)

draft 진입 전 `.claude/sowhat-core/bin/source-tag-parser.js` 로 모든 입력 섹션의 source tag 무결성을 정적 검증:

```bash
date -u +"%Y%m%d-%H%M%S"
mkdir -p logs/parser
node .claude/sowhat-core/bin/source-tag-parser.js validate --all planning/ --project . --strict \
  --json | tee logs/parser/draft-{datetime}.json
```

`planning/` 디렉토리가 없으면(init 직후) parser는 exit 2. 이 경우 "입력 섹션 없음"으로 판단하고 Step 5.5b만 진행.

Parser가 errors 보고 시(exit 1) draft 중단. `logs/parser/draft-{datetime}.json`에 영구 저장된 리포트를 사용자에게 보여주고 `/sowhat:revise {section}` 안내. `--strict`로 warnings도 차단(draft는 외부 공유용이므로 보수적).

### 5.5b. 산출물 구체값 매칭 (LLM-semantic)

Step 5로 생성된 산출물에 대해 planning에 없는 신규 구체값이 삽입되지 않았는지 확인:

1. 산출물에서 **구체값**(수치·기관명·연도·인물명·URL·보고서명)을 스캔
2. 각 구체값이 `planning_sourced_items[]`의 항목과 매칭되는지 확인 — 동일 값 literal 또는 동일 맥락 paraphrase
3. 매칭되는 source 항목이 있으면: 해당 source tag로 각주 부착 (예: `¹ 출처: #003`)
4. 매칭 없는 구체값이 있으면:

   ```
   🔴 산출물 source 검증 실패

   기획 섹션에 없는 구체값이 산출물에 나타났습니다:
     - 산출물 위치 {para/line}: "{문제 문장}"
       · 신규 구체값: {value}
       · planning_sourced_items에 매칭 없음

   해소:
     [1] 해당 문장 삭제 후 draft 재생성
     [2] 기획 섹션에 해당 구체값 추가 (/sowhat:revise) 후 재draft
     [3] --force (우회, 사용자 책임)
   ```

5.5a의 parser가 정적 구조를 검증하고, 5.5b의 LLM-semantic이 의미 수준을 검증한다. 두 레이어 조합이 cycle 1-6의 L1 정규식 + LLM 차집합 방식을 대체한다.

---

## Step 6: Git 커밋

생성된 파일별로 개별 커밋:

```bash
# 프로파일 파일
git add export/profiles/{profile-id}.yml
git commit -m "draft: create profile '{profile-id}' ({DELIVERABLE})"

# 단일 문서
git add export/generated/{profile-id}/DOCUMENT.md
git commit -m "draft({profile-id}): generate {DELIVERABLE} for {target_audience.who}"

# 시리즈 (한 번에)
git add export/generated/{profile-id}/
git commit -m "draft({profile-id}): generate {DELIVERABLE} series ({N} parts)"

# PRD (생성된 경우)
git add export/generated/{profile-id}/PRD.md
git commit -m "draft({profile-id}): generate PRD"

# GSD export (생성된 경우)
git add export/generated/{profile-id}/PROJECT.md export/generated/{profile-id}/REQUIREMENTS.md
git commit -m "draft({profile-id}): generate GSD export"

# ARGUMENT-MAP은 /sowhat:map --export 로 별도 생성

# config.json (프로파일 추가 시)
git add planning/config.json
git commit -m "draft: register profile '{profile-id}'"
```

커밋 실패 시:
```
⚠️  git 커밋 실패: {오류 메시지}
파일은 export/ 디렉터리에 저장되었습니다. 수동으로 커밋하세요.
```

---

## logs/argument-log.md 추가

```markdown
## [{current_datetime}] draft
  Profile: {profile-id}
  Deliverable: {DELIVERABLE}
  Purpose: {purpose}
  Target: {target_audience.who}
  Framework: {framework}
  Evidence: Level {N}
  Mode: {single|series}
  Sections: {N}개 settled 반영
  Output: export/generated/{profile-id}/
```

---

## logs/session.md 업데이트

```markdown
---
command: draft
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
draft 완료 — '{profile-id}' 프로파일로 {DELIVERABLE} 생성. export/generated/{profile-id}/ 저장.

## 재개 시 첫 질문
/sowhat:draft --list → 프로파일 목록 확인
```

---

## --review 모드: 인간 수정 분석

`$ARGUMENTS`에 `--review {profile-id}`가 있으면 이 모드로 진입한다.

### 사전 검증

1. `export/generated/{profile}/DOCUMENT.md` 존재 확인
2. `export/generated/{profile}/DOCUMENT.original.md` 존재 확인
   - 없으면: `❌ 원본 파일이 없습니다. --review는 draft 생성 후에만 사용 가능합니다.`
3. 두 파일이 동일한지 확인
   - 동일하면: `ℹ️ 수정 사항이 없습니다. DOCUMENT.md가 원본과 동일합니다.`

### 단계 1: Diff 추출

원본과 수정본을 비교하여 변경 블록을 추출한다.

```bash
diff export/generated/{profile}/DOCUMENT.original.md export/generated/{profile}/DOCUMENT.md
```

변경 블록을 리스트로 수집. 각 블록은:
- `location`: 변경 위치 (줄 번호 범위)
- `original`: 원본 텍스트
- `modified`: 수정된 텍스트
- `type`: (다음 단계에서 분류)

시리즈의 경우 각 `part-N.md`에 대해 반복.

### 단계 2: 변경 분류

각 변경 블록을 4가지 유형으로 분류한다:

| 유형 | 판정 기준 |
|------|----------|
| `stylistic` | 같은 의미, 다른 표현. 어휘 교체, 문장 길이 조절, 어미 변경, 접속사 변경 |
| `structural` | 문단 순서 변경, 섹션 추가/삭제/병합, 소제목 변경 |
| `substantive` | 주장(Claim)의 의미가 변경됨, 수치/데이터가 변경됨, 근거가 삭제/교체됨, qualifier 강도가 변경됨 |
| `additive` | 원본에 없던 새로운 주장, 근거, 사례, 데이터가 추가됨 |

분류 알고리즘:
```
FOR EACH change_block:
  IF original is empty (순수 추가):
    type = additive
  ELIF modified is empty (순수 삭제):
    IF deleted content contains claims/data:
      type = substantive
    ELSE:
      type = structural
  ELIF semantic_similarity(original, modified) > 0.85:
    type = stylistic
  ELIF paragraph_reordering_detected:
    type = structural
  ELIF claims_or_data_changed(original, modified):
    type = substantive
  ELSE:
    type = stylistic  # 기본값은 보수적으로
```

상세 분류 알고리즘은 `references/draft-review-algorithm.md` 참조.

### 단계 3: 분류 결과 출력

```
----------------------------------------
수정 분석: {profile-id}

총 {N}개 변경 감지

  스타일 변경:    {n1}개  → 캐릭터 학습 대상
  구조 변경:      {n2}개  → 캐릭터 학습 대상
  논리 변경:      {n3}개  → 정합성 검사 대상
  추가 콘텐츠:    {n4}개  → 정합성 검사 대상
----------------------------------------
```

사용자에게 상세 확인 여부 질문:

```
[1] 전체 분석 진행 (논리 검사 + 캐릭터 학습)
[2] 논리 검사만
[3] 캐릭터 학습만
[4] 상세 diff 보기
```

### 단계 4: 논리 정합성 검사 (substantive + additive)

각 substantive/additive 변경에 대해 논증 트리와 대조한다.

1. 변경된 내용에 대응하는 섹션의 Toulmin 필드를 찾는다 (draft 생성 시의 source mapping 또는 내용 매칭)
2. 수정된 주장이 원본 섹션의 Claim/Grounds/Warrant와 정합하는지 검사

#### 판정 기준

```
FOR EACH substantive_change:
  original_claim = find_source_claim(change.original)  # 이 문장의 출처 섹션
  
  IF change removes or weakens a claim:
    # 인간이 약화시킴 — 왜?
    check = does_modified_contradict_settled_argument(change.modified, original_claim)
    IF contradicts:
      verdict = "conflict"  # 원본 논증과 충돌
    ELSE:
      verdict = "refinement"  # 표현 조절 (수용 가능)
  
  IF change strengthens or adds a claim:
    # 인간이 강화함 — 근거가 있나?
    check = is_new_claim_supported_by_grounds(change.modified, all_sections)
    IF not_supported:
      verdict = "unsupported"  # 근거 없는 주장 추가
    ELSE:
      verdict = "enhancement"  # 논증 강화 (수용)
  
  IF change modifies numbers/data:
    check = compare_with_grounds(change.modified, section.grounds)
    IF data_mismatch:
      verdict = "data_conflict"  # 데이터 불일치
    ELSE:
      verdict = "data_update"  # 최신 데이터 반영
```

상세 verdict 결정 알고리즘은 `references/draft-review-algorithm.md` 참조.

#### 결과 출력

각 substantive 변경에 대해:

```
----------------------------------------
논리 검사: 변경 #{N}

위치: {section/paragraph}
유형: {substantive | additive}

원본:
  "{original text}"
  출처: {section-id}.{field} — Claim: "{source claim}"

수정:
  "{modified text}"

판정: {verdict}
```

**verdict별 출력:**

`conflict` (인간이 원본 논증과 충돌):
```
⚠️ 원본 논증과 충돌

  원본 논증:
    Claim: "{settled claim}"
    Grounds: "{supporting evidence}"
    Qualifier: {qualifier}
  
  인간의 수정이 이 논증을 약화/부정합니다.
  
  [1] 인간 수정 유지 — 원본 논증에 문제가 있다 → /sowhat:revise {section} 제안
  [2] 원본 유지 — 인간의 수정이 논리적 오류
  [3] 보류 — 나중에 결정
```

`unsupported` (근거 없는 추가):
```
⚠️ 근거 없는 주장 추가

  추가된 내용: "{new text}"
  이 주장을 지지하는 근거가 논증 트리에 없습니다.
  
  [1] 유지 — 근거를 나중에 보강 (/sowhat:inject)
  [2] 삭제 — 근거 없는 주장 제거
  [3] 보류
```

`data_conflict` (데이터 불일치):
```
⚠️ 데이터 불일치

  원본: "{original number/fact}"
  수정: "{modified number/fact}"
  출처: {section}.Grounds
  
  [1] 인간 수정 유지 — 원본 데이터가 틀렸다 → /sowhat:revise {section} grounds
  [2] 원본 유지 — 인간의 수정이 오류
  [3] 보류
```

`refinement` / `enhancement` / `data_update`:
```
✅ 수용 가능한 변경
  {변경 설명}
```

**[1] 선택 시 (인간이 맞다):**
- 해당 섹션의 revise를 제안
- `logs/argument-log.md`에 기록:
  ```
  ## [{datetime}] draft-review({profile})
    Source: human edit in DOCUMENT.md
    Section: {section-id}
    Verdict: conflict — human correction accepted
    Action: revise suggested for {section}.{field}
  ```

**[2] 선택 시 (인간이 틀렸다):**
- 수정본에서 해당 부분을 원본으로 되돌릴지 질문
- `logs/argument-log.md`에 기록

### 단계 5: 캐릭터 뉘앙스 학습 (stylistic + structural)

스타일 변경을 character 시스템의 피드백으로 변환한다.

#### 학습 추출

stylistic 변경에서 다음 패턴을 추출:

1. **어휘 교체 패턴** (Layer 3: Vocabulary Palette)
   ```
   "활용하다" → "쓰다"           # 한자어 → 고유어 선호
   "구현하다" → "만들다"          # 기술 용어 → 일상어 선호
   "따라서" → "그래서"           # 격식체 → 구어체 선호
   ```

2. **문장 구조 패턴** (Layer 2: Sentence Skeletons)
   ```
   긴 복문 → 짧은 단문 2개로 분리    # 문장 길이 선호
   수동태 → 능동태                   # 태(voice) 선호
   명사화 → 동사화                   # 서술 방식 선호
   ```

3. **정보 배치 패턴** (Layer 5: Thinking Habits)
   ```
   결론을 뒤에서 앞으로 이동          # 두괄식 선호
   사례를 주장 앞에 배치              # 귀납적 전개 선호
   ```

4. **대조 쌍 생성** (Layer 4: Contrast Pairs)
   ```
   Claude 생성: "해당 기술의 도입을 통해 생산성 향상이 기대됩니다."
   인간 수정:   "이 기술을 쓰면 일이 빨라진다."
   패턴: 격식체+추상적 → 구어체+구체적
   ```

상세 Layer 매핑은 `references/draft-review-algorithm.md` 참조.

#### 캐릭터 피드백 저장

추출된 패턴을 캐릭터 피드백 파일에 저장:

`~/.claude/sowhat-characters/{character}/feedback/draft-review-{datetime}.md`

```markdown
# Draft Review Feedback: {profile-id}
Date: {datetime}
Source: {project} / {profile}

## Vocabulary Corrections ({N}건)
| Claude 생성 | 인간 수정 | 패턴 |
|------------|----------|------|
| 활용하다 | 쓰다 | 한자어 → 고유어 |
| 구현하다 | 만들다 | 기술어 → 일상어 |

## Sentence Structure ({N}건)
| 원본 | 수정 | 패턴 |
|------|------|------|
| "{long sentence}" | "{short1}" + "{short2}" | 복문 → 단문 분리 |

## Information Flow ({N}건)
| 변경 | 패턴 |
|------|------|
| 결론을 첫 문단으로 이동 | 두괄식 선호 |

## Contrast Pairs ({N}건)
| Claude | Human | Delta |
|--------|-------|-------|
| "{generated}" | "{edited}" | {pattern description} |
```

#### 캐릭터 통합 제안

피드백 파일 저장 후:

```
캐릭터 학습 완료: {character}

  어휘 교체: {N}건
  문장 구조: {N}건
  정보 배치: {N}건
  대조 쌍:   {N}건
  
  피드백 저장: ~/.claude/sowhat-characters/{character}/feedback/draft-review-{datetime}.md

  ⚠️ 이 피드백은 다음 draft 생성 시 자동 반영됩니다.
  캐릭터 프로필에 정식 통합하려면:
    /sowhat:character update {character}
```

### 단계 6: 결과 요약 + 원본 업데이트

```
----------------------------------------
수정 분석 완료: {profile-id}

논리 검사:
  ✅ 수용: {n}건
  ⚠️ 충돌: {n}건 → revise 제안 {n}건
  ⚠️ 근거 없음: {n}건

캐릭터 학습:
  패턴 {n}건 추출 → {character} 피드백 저장

다음 액션:
  [1] 원본 갱신 — 현재 수정본을 새 원본으로 설정 (DOCUMENT.original.md 덮어쓰기)
  [2] revise 실행 — 논리 충돌 해소 (/sowhat:revise {sections})
  [3] 재생성 — 캐릭터 학습 반영하여 재생성 (/sowhat:draft --profile {id})
----------------------------------------
```

[1] 선택 시:
```bash
cp export/generated/{profile}/DOCUMENT.md export/generated/{profile}/DOCUMENT.original.md
git add export/generated/{profile}/
git commit -m "draft-review({profile}): accept human edits, update baseline"
```

### session.md 저장

```markdown
---
command: draft --review
section: export
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
draft --review 완료 — {profile} 분석. 논리 충돌 {n}건, 캐릭터 학습 {n}건.

## 재개 시 첫 질문
/sowhat:revise {section} 또는 /sowhat:draft --profile {profile}
```

### 핵심 원칙

- **인간의 수정이 우선** — 기본 자세는 "인간이 맞다". 충돌 시에만 경고
- **양방향 피드백** — 논리 변경은 논증 트리로, 스타일 변경은 캐릭터로
- **비파괴적** — 원본 파일을 자동 보존, 언제든 비교 가능
- **점진적 학습** — 매 review마다 캐릭터 피드백이 축적, 다음 생성에 반영
- **source mapping 활용** — draft 생성 시의 섹션-문단 매핑을 활용하여 정확한 출처 추적

---

## 완료 출력

### 단일 콘텐츠

```
✅ 산출물 생성 완료

  프로파일: {profile-id} ({profile-name})
  산출물: {DELIVERABLE}
  독자: {target_audience.who}
  프레임워크: {framework} + {scqa_variant} SCQA
  증거 깊이: Level {N} ({level_name})

  📄 export/generated/{profile-id}/DOCUMENT.md
  (슬라이드 산출물인 경우:)
  📄 export/generated/{profile-id}/SLIDES.md   (슬라이드 내용)
  📄 export/generated/{profile-id}/SCRIPT.md   (발표자 스크립트)

  Settled 섹션 반영: {N}개
  미반영 섹션: {M}개 ({status 이유})

----------------------------------------
다음 액션:

[1] 다른 형태로 재산출 (draft)
[2] 기존 프로파일로 재생성 (draft --profile {profile-id})
[3] 전체 프로파일 목록 (draft --list)
[4] 논증 구조 맵 생성 (map --export)
[5] 논증 추가 강화 (debate {section})
[6] GSD export + 최종 완료 (finalize)
----------------------------------------
```

### 시리즈 콘텐츠

```
✅ 시리즈 생성 완료

  프로파일: {profile-id} ({profile-name})
  산출물: {DELIVERABLE} 시리즈 ({N}편)
  독자: {target_audience.who}

  📄 export/generated/{profile-id}/
     part-1.md  "{Part 1 제목}"
     part-2.md  "{Part 2 제목}"
     ...
     part-{N}.md "{Part N 제목}"

  총 분량: 약 {총 단어 수} 단어
  Settled 섹션 반영: {N}개

---

----------------------------------------
다음 액션:

[1] 다른 형태로 재산출 (draft)
[2] 이 시리즈 재생성 (draft --profile {profile-id})
----------------------------------------
```

---

## 레거시 호환

`--output` 인수가 있고 `--profile`이 없으면 레거시 모드 작동:
- `--output all`: 프로파일 없이 기본 형식으로 `export/DOCUMENT.md` + `export/PRD.md` 생성
- `--output document`: `export/DOCUMENT.md`만
- `--output prd`: `export/PRD.md`만
- `--output argument-map`: `ℹ️ /sowhat:map --export 로 안내`

레거시 모드에서는 기존처럼 형식 선택(1~11) + 독자 선택 UI를 보여주되, 내부적으로 임시 프로파일을 생성하여 처리.

---

## 엣지 케이스

- `00-thesis.md` 없음 → `❌ 00-thesis.md가 없습니다. /sowhat:init을 먼저 실행하세요.`
- settled 섹션이 0개 → `❌ settled된 섹션이 없습니다. /sowhat:expand 또는 /sowhat:settle로 섹션을 완성하세요.`
- 동일 profile-id 존재 → 덮어쓰기 확인:
  ```
  ⚠️  프로파일 '{profile-id}'가 이미 존재합니다.
    [1] 덮어쓰기
    [2] 다른 ID 입력
    [3] 취소
  ```
- 동일 generated 디렉터리 존재 → 덮어쓰기 전 확인:
  ```
  ⚠️  export/generated/{profile-id}/이 이미 존재합니다.
    [1] 덮어쓰기
    [2] 백업 후 덮어쓰기 ({profile-id}.bak/)
    [3] 취소
  ```
- research 디렉터리에 `status: unreviewed` 파인딩이 있으면, 생성 전 알림:
  ```
  ℹ️  미검토 리서치 {N}건이 있습니다. 반영되지 않을 수 있습니다.
  /sowhat:research review 로 먼저 검토하거나, 계속 진행할 수 있습니다.
    [1] 계속 진행
    [2] 취소 (리서치 먼저 검토)
  ```
- planning 레이어에서 prd/gsd-export 선택 시:
  ```
  ⚠️  현재 planning 레이어입니다. PRD/GSD export는 명세 레이어 완료 후 생성 가능합니다.
  /sowhat:finalize-planning 을 먼저 실행하세요.
  다른 산출물 유형을 선택하시겠습니까?
  ```
