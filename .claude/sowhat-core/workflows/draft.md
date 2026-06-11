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
     team-prd            팀 공유용 PRD        2024-01-10

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

       [1] 기획 레이어만으로 초안 생성 (PRD 불가)
       [2] 취소 (/sowhat:finalize-planning 먼저 실행)
     ```
     - [2] 선택 시 종료
     - [1] 선택 시: `prd` deliverable 불가 안내

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

6.6. **Anchor corpus 수집 (Step 5 렌더링 준비 + Step 5.5b 검증 기반)**:

   Step 5에서 생성물에 구체값을 옮길 때 source tag를 보존하고, Step 5.5b 환각 탐지의 anchor로 사용하기 위한 사전 준비:

   1. 각 settled 섹션의 Grounds/Claim에서 `[source:user]` / `[source:#NNN]` / `[source:sub-research]` / `[source:file:*]` 태그가 붙은 불릿을 수집 → `planning_sourced_items[]`에 저장 (`{section, field, bullet_index, text, source_tag}` 구조)

   2. **anchor_corpus** 구성 — Step 5.5b 환각 탐지에 사용되는 전체 anchor 범위:

      ```
      anchor_corpus = {
        sourced_items:  planning_sourced_items[] (source 태그 불릿, 위 1번)
        settled_bodies: planning/*.md 본문 전체 — Claim/Grounds/CQ Responses/Confidence/Scope 텍스트
        thesis_body:    00-thesis.md 본문
        raw_sources:    planning/config.json의 source.path 필드가 가리키는 파일(들)
                        — 파일 부재 또는 config에 source.path 없으면 skip
      }
      ```

      `planning/config.json`의 `source.path` 필드를 읽어 원본 파일을 anchor에 포함한다. 파일이 없거나 config에 해당 필드가 없으면 raw_sources는 빈 집합.

   3. `planning_sourced_items[]`가 source tag 각주 부착(Step 5 렌더링)에 사용되고, `anchor_corpus` 전체가 Step 5.5b literal 1차 매칭 대상이다.

   AI가 anchor_corpus에 없는 구체값을 산출물에 추가하려 하면 Step 5.5b 검증에서 차단된다. cycle 1-6의 L4 Unverified 게이트와 L1 렌더링 검증 정규식 차집합은 cycle 7에서 폐기 — source tag가 모든 구체값을 사전에 추적하므로 사후 탐지·차집합이 불필요 (`references/ai-content-boundary.md`).

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

## 미리보기 게이트 (Preview Gate)

`--force` 또는 `--no-preview` 플래그가 있으면 이 단계 건너뜀.
`--profile {id}` 재생성 모드일 때는 이미 사용자 승인된 프로파일이므로 건너뜀.

사전 검증이 완료된 직후, 실제 파일 생성 전에 예상 작업을 미리 보여준다:

```
> [draft > 미리보기 게이트]

📋 예상 생성 파일:
  export/{profile-id}/*.md  (settled 섹션 {N}개 기준 — 정확한 파일 수는 브리프 완료 후 결정)

📊 예상 작업:
  settled 섹션 {N}개 → 산출물 생성
  status 전이 없음

[1] 계속 진행 (브리프 작성)
[2] 취소
```

- `[1]` → Step 1으로 진행
- `[2]` → 종료
- 그 외 텍스트 입력 → 수정 요청으로 처리, 재확인 후 진행

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

**구조화 산출물:**
  [18] PRD                  — PM 도구 (Jira/Linear) 입력용
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
  [4] 학술형   — 전체 Walton 구조 + 출처 명시 (논문, 백서)
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
      - {미충족 CQ 대응 요약}

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

**Walton 렌더링**:
- 불릿 포인트 나열이 아닌, 읽히는 서술형
- Confidence 언어 적절히 사용: "virtually certain", "very likely", "likely", "uncertain"
- 미충족 CQ를 자연스러운 반론 대응으로: "물론 …라는 우려도 있다. 그러나 …"

**증거 깊이별 렌더링**:
- Level 1 (주장 중심): Claim + 핵심 Grounds 1개 인라인
- Level 2 (균형형): Claim + 핵심 Grounds 1-2개 + CQ 대응 1문장
- Level 3 (근거 상세): Claim + 전체 Grounds + scheme + CQ Responses 상세
- Level 4 (학술형): 전체 Walton 구조 + 출처 정식 인용 + 방법론 + 한계점

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

**프레임워크별 구조 생성 지침:** 선택된 framework(Pyramid/Narrative/Problem-Solution/Comparative/PREP/Academic)의 구조 생성 템플릿은 **`references/draft-frameworks.md`의 해당 섹션을 읽고 그대로 렌더**한다.

**시리즈 산출물**(시리즈 모드)일 때 파트별 템플릿(도입편/본편/결론편)은 **`references/draft-series.md`** 참조.

### 채널별 특수 형식

채널 산출물(Instagram 캐러셀 / Twitter 스레드 / Slide deck+Script / Video·Podcast 스크립트)의 출력 포맷은 **`references/draft-channels.md`의 해당 채널 섹션을 읽고 렌더**한다.

### 구조화 산출물

산출물이 PRD(`prd`)일 때의 전체 구조 템플릿은 **`references/draft-prd.md`를 읽고 렌더**한다.

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
LOG="logs/parser/draft-{datetime}.json"
node .claude/sowhat-core/bin/source-tag-parser.js validate --all planning/ --project . --strict \
  --json > "$LOG"
cat "$LOG"
# 로그 생성 여부 확인 (PowerShell 환경에서 tee silent fail 방지)
test -f "$LOG" || echo "⚠️ parser 로그 미생성 — 호출 누락 또는 파일 시스템 권한 문제. logs/parser/ 디렉토리를 확인하세요."
```

`planning/` 디렉토리가 없으면(init 직후) parser는 exit 2. 이 경우 "입력 섹션 없음"으로 판단하고 Step 5.5b만 진행.

Parser가 errors 보고 시(exit 1) draft 중단. `logs/parser/draft-{datetime}.json`에 영구 저장된 리포트를 사용자에게 보여주고 `/sowhat:revise {section}` 안내. `--strict`로 warnings도 차단(draft는 외부 공유용이므로 보수적).

> **cross-platform 주의**: `tee` 대신 `> "$LOG"` + `cat "$LOG"` 패턴 사용 (PowerShell 호환). `test -f` 명령으로 로그 생성 여부 최종 확인.

### 5.5b. 산출물 구체값 매칭 (literal-first + 보수적 LLM-semantic)

Step 5로 생성된 산출물에 대해 planning에 없는 신규 구체값이 삽입되지 않았는지 확인.

**Step 1. 구체값 추출 — 정규식 패턴 4종**

산출물 전체에서 아래 패턴에 해당하는 후보를 모두 추출한다:

| 카테고리 | 패턴 | 예 |
|---------|------|-----|
| 비율·배수·조건 수치 | `\d+%`, `\d+배`, `\d+(이하\|이상\|미만\|초과)` | "5% 이하", "4배", "95% 이상" |
| 절대 수치 + 단위 | `\d+(명\|건\|개\|주\|분\|회\|년\|월)` | "3명", "27개", "4배" |
| 고유 사례 명사구 | `20\d\d-Q\d`, 따옴표·인용부 안의 *구체 사례명* | "2025-Q1 경쟁사 X 런칭", "2025-여름 계절성" |
| 외부 출처 토큰 | URL, DOI, 기관명, 보고서명, 인물명 | "McKinsey 2024" |

**Step 2. 각 후보에 대해 2단계 매칭**

```
2a. literal 1차: anchor_corpus(Step 6.6에서 구성)에서 {value}가 *그대로* substring 출현하는가?
    - 출현 → matched (pass, 즉시 source 각주 부착 후 다음 후보로)
    - 미출현 → 2b로

2b. LLM 2차 (보수적 판정):
    System prompt에 다음 제약을 명시하여 호출:
    """
    산출물 구체값: {value}
    산출물 맥락: {surrounding_sentence}
    anchor 후보 (literal partial match top-K): {anchor_passages}

    판정 기준 — 엄격하게 적용:
    - anchor에 동일 *구체 사실*(같은 숫자·이름·날짜·기관)이 명시되어 있는가?
    - 추상 frame이 산출물 구체값을 paraphrase-cover한다고 판정 금지.
      (예: anchor "쿼리 비용 발생" → 산출물 "5% 이하" = paraphrase-cover 아님 → unmatched)
    - "근사 수치"(예: anchor "4배", 산출물 "5배")는 unmatched.
    - "암묵적 추론"(anchor에서 도출 가능하지만 명시 없음)도 unmatched.
    
    출력: matched | unmatched (판정 근거 한 줄 포함)
    """
    
    결과:
    - matched → pass (source 각주 부착)
    - unmatched → 차단 대상으로 수집
```

**Step 3. 차단 처리**

unmatched 후보가 1개 이상이면:

```
🔴 산출물 source 검증 실패

기획 섹션에 없는 구체값이 산출물에 나타났습니다:
  - 산출물 위치 {para/line}: "{문제 문장}"
    · 신규 구체값: {value}
    · literal 1차: 미일치
    · LLM 2차 판정: unmatched ({reason 한 줄})
    · anchor 검사 범위:
      - sourced_items: {N}개
      - settled bodies: {M} sections
      - 00-thesis: 있음
      - raw sources: {config.source.path 또는 "없음"}

해소:
  [1] 해당 문장 삭제 후 draft 재생성
  [2] 기획 섹션에 해당 구체값 추가 (/sowhat:revise) 후 재draft
  [3] --force (우회, 사용자 책임)
```

`--force` 모드에서는 차단 없이 경고만 출력 후 진행.

**배경 (왜 이 방식인가)**

dogfood-cycle7 분석에서 anchor set이 `planning_sourced_items[]`(source 태그 불릿)만일 때, settled 본문이 추상 frame 위주여서 anchor set이 거의 비어있고, 이전 paraphrase 허용 매칭이 환각 수치("5% 이하")와 환각 사례("2025-Q1 경쟁사 X 런칭")를 통과시켰다. anchor_corpus 확장 + literal-first 매칭이 이 경로를 차단한다.

5.5a의 parser가 정적 구조를 검증하고, 5.5b의 literal-first + 보수적 LLM이 의미 수준을 검증한다.

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

전체 절차(사전검증 → diff 추출 → 변경 분류 → 논리 정합성 검사 → 캐릭터 뉘앙스 학습 → 결과 요약·원본 업데이트)는 **`references/draft-review-algorithm.md`를 읽고 그대로 따른다.** 이 분기는 draft 본 생성 경로와 독립이므로, 해당 reference를 로드한 뒤 실행한다.

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
[6] 최종 종결 (/sowhat:finalize)
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
- planning 레이어에서 prd 선택 시:
  ```
  ⚠️  현재 planning 레이어입니다. PRD는 명세 레이어 완료 후 생성 가능합니다.
  /sowhat:finalize-planning 을 먼저 실행하세요.
  다른 산출물 유형을 선택하시겠습니까?
  ```
