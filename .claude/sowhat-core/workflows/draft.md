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

`$ARGUMENTS` 파싱:
- `--profile {id}`: 저장된 프로파일로 즉시 재생성
- `--list`: 저장된 프로파일 목록 출력 후 종료
- `--edit {id}`: 기존 프로파일 수정 모드
- `--output all|document|prd|argument-map`: 레거시 호환 출력 대상

---

## 사전 검증

1. `planning/config.json` 로드
   - 파일 없으면: `❌ sowhat 프로젝트가 아닙니다. /sowhat:init으로 초기화하세요.`

2. **`--list` 처리**: `$ARGUMENTS`에 `--list`가 있으면:
   - `export/profiles/` 디렉터리 스캔
   - 프로파일별 요약 출력 후 종료:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     📋 저장된 산출물 프로파일

     ID                  산출물              마지막 생성
     ─────────────────────────────────────────────────────
     linkedin-series     링크드인 시리즈      2024-01-15
     investor-deck       투자 제안서          (미생성)
     gsd-prd             GSD PRD             2024-01-10

     ──── 사용 ────
       /sowhat:draft --profile linkedin-series
       /sowhat:draft --edit investor-deck
       /sowhat:draft                          (새 프로파일 생성)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```

3. **`--profile {id}` 처리**: 해당 프로파일 파일 로드 → Step 4로 직행 (구조 확인 스킵)

4. **`--edit {id}` 처리**: 해당 프로파일 파일 로드 → Step 1로 가되 기존값을 기본값으로 표시

5. `layer` 확인:
   - `"planning"` → 경고 후 진행 여부 질문:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ⚠️  현재 레이어: planning

     명세 레이어가 아직 완성되지 않았습니다.
     기획 논거만으로 초안을 생성하면 기술 명세 섹션이 누락됩니다.

     ──── 제안 ────
       [1] 기획 레이어만으로 초안 생성 (PRD/GSD export 불가)
       [2] 취소 (/sowhat:finalize-planning 먼저 실행)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ```
     - [2] 선택 시 종료
     - [1] 선택 시: `prd`, `gsd-export` deliverable 불가 안내

   - `"spec"` 또는 `"finalized"` → 명세 섹션(04~09) 상태 확인:
     - unsettled 섹션이 하나라도 있으면:
       ```
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⚠️  미완성 명세 섹션 발견

       다음 섹션이 settled 상태가 아닙니다:
         - {section}: {status}

       ──── 제안 ────
         [1] unsettled 섹션 포함하여 생성 (불완전할 수 있음)
         [2] settled 섹션만으로 생성
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ```

6. 섹션 파일 로드:
   - `00-thesis.md` (필수)
   - `planning/` 디렉터리의 모든 `*.md` 파일 (01-*.md, 02-*.md, …)
   - layer가 spec/finalized이면: `04-actors.md` ~ `09-acceptance-criteria.md`
   - status가 `invalidated`인 섹션은 제외
   - [2] 선택 시 `draft`, `discussing`, `needs-revision` 상태인 섹션도 제외

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 어떤 산출물을 만듭니까?

──── 비즈니스 문서 ────
  [1] 임원/보고용 요약      — 핵심 결론 + 최소 근거
  [2] 제안서/기획서          — 논증 전체 + 상세 근거
  [3] 투자/IR 자료           — 문제-시장-솔루션-요청
  [4] 의사결정 문서          — 옵션 비교 + 권고
  [5] 백서                   — 전문가 대상 심층 분석

──── 디지털 콘텐츠 ────
  [6] 블로그 포스트          — SEO 친화적 장문
  [7] 링크드인 포스트/아티클  — B2B 전문 콘텐츠
  [8] 트위터/X 스레드        — 280자 단위 분할
  [9] 인스타그램 캐러셀      — 슬라이드 단위 핵심 메시지
  [10] 뉴스레터              — 이메일 구독자 대상

──── 프레젠테이션/영상 ────
  [11] 슬라이드 덱           — 프레젠테이션 스크립트
  [12] 피치덱               — 투자/사업 발표
  [13] 영상 스크립트          — 유튜브/강의 내레이션
  [14] 팟캐스트 스크립트      — 음성 콘텐츠

──── 학술/연구 ────
  [15] 연구 기획서           — 방법론 + 문헌 기반
  [16] 논문 초안             — 학술 형식
  [17] 문헌 검토             — 선행 연구 정리

──── 파이프라인 연동 ────
  [18] GSD PRD              — /gsd:new-project 입력용
  [19] 사용자 스토리          — Jira/Linear/GitHub Issues
  [20] API 명세서            — OpenAPI/Swagger 형식

──── 기타 ────
  [0] 직접 정의
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[0] 선택 시: 사용자가 산출물 유형을 직접 서술.
선택된 유형을 `DELIVERABLE`로 기억한다.

### 1b. 목적과 목표

선택된 유형에 맞는 추천 목적을 제시하되, 사용자 입력을 우선한다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 이 {DELIVERABLE}의 목적과 목표는?

──── 추천 (수정 가능) ────
  목적: {유형별 기본 목적 제안}
  목표: {유형별 기본 목표 제안}

직접 입력하거나, Enter로 추천을 수락하세요.

  목적 (왜 만드는가):
  목표 (독자가 이걸 읽고 무엇을 하길 원하는가):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 이 {DELIVERABLE}의 핵심 독자는?

구체적으로 정의할수록 더 좋은 문서가 됩니다.

  누구: (직책, 역할, 업종)
  이미 아는 것: (배경지식, 전제)
  모르는 것: (이 문서에서 전달할 새로운 정보)
  관심사: (이 사람이 신경쓰는 것)

──── 빠른 선택 ────
  [1] 경영진 (기술 배경 없음, 결론 + ROI 우선)
  [2] 투자자 (시장 + 팀 + 수익 모델 중심)
  [3] 개발팀 (기술 상세 + 구현 가능성)
  [4] 일반 대중 (쉬운 언어, 공감 중심)
  [5] 직접 입력
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[5] 선택 시: 4개 항목을 각각 입력받는다.
[1]~[4] 선택 시: 기본값으로 채우되, 사용자가 수정 가능.

### 1d. 증거 제시 깊이

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 증거/근거를 얼마나 상세히 제시합니까?

  [1] 주장 중심 — Claim + 핵심 수치만 (소셜, 슬라이드)
  [2] 균형형   — Claim + 핵심 근거 1-2개 (블로그, 보고서)     ← 추천: {유형별}
  [3] 근거 상세 — 전체 근거 + 논리 연결 (제안서, 의사결정)
  [4] 학술형   — 전체 Toulmin + 출처 명시 (논문, 백서)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

`← 추천:` 표시는 `references/output-profiles.md`의 산출물 유형별 기본 증거 깊이를 참조.

---

## Step 2: 길이 및 시리즈 설정

### 2a. 단일 vs 시리즈

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 단일 콘텐츠입니까, 시리즈입니까?

  [1] 단일 콘텐츠 — 하나의 완결된 문서/포스트
  [2] 시리즈     — 여러 편으로 나누어 발행

  현재 Key Arguments: {KA 수}개
  추천: {KA ≤ 2 → "단일" | KA ≥ 3 → "시리즈({KA+2}편)도 고려"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2b. [1] 단일 선택 시: 길이

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 목표 분량은?

  추천: {유형별 기본 단어 수} 단어 (약 {페이지 수}페이지)

  직접 입력하거나 Enter로 추천 수락:
  (예: 2000, "A4 3장", "5분 분량")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2c. [2] 시리즈 선택 시: 시리즈 설정

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ 시리즈 구성

  추천 편수: {자동 계산값}편
  추천 편당 분량: {유형별 기본값} 단어

  편수 (0=자동):
  편당 분량:
  시리즈 제목 (선택):
  다음 편 예고 포함: [Y/n]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 제안 구조

  프레임워크: {framework_name}
  도입부: {scqa_variant} ({SCQA 순서 설명})
  논거 배열: {grouping} ({그룹화 설명})
  증거 깊이: Level {N} ({level_name})

──── 목차 미리보기 ────

  {구조별 목차를 실제 섹션 내용 기반으로 렌더링}

  예시 (pyramid + standard SCQA + importance):
  ─────────────────────────────
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
  ─────────────────────────────

──── 조정 ────
  [1] 이대로 진행
  [2] 구조 조정 (프레임워크/순서/섹션 변경)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3b. [2] 구조 조정

사용자가 [2]를 선택하면 대화형으로 조정:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 구조 조정

──── 변경 가능 ────
  [A] 프레임워크 변경: {현재} → pyramid | narrative | problem-solution | comparative | prep | academic
  [B] 도입부 변형: {현재} → standard | direct | curiosity | story
  [C] 논거 순서: {현재 KA 순서} → 재배열
  [D] 그룹화 원칙: {현재} → chronological | structural | importance
  [E] 섹션 추가: TL;DR, FAQ, 용어집, 참고문헌 등
  [F] 섹션 제거: 현재 목차에서 제거
  [G] KA 병합: 2개 KA를 하나로 합치기
  [H] 완료 — 조정 끝

무엇을 조정합니까?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

[H] 선택 시 또는 조정 완료 후 → Step 4로 진행.
각 조정 선택 시 해당 항목만 변경하고 목차를 다시 보여준다.

### 3c. 시리즈인 경우: 파트별 구조

시리즈(`length.mode: "series"`)일 때 추가 출력:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 시리즈 구조 ({N}편)

  Part 1: 도입 — "{시리즈 제목}: 왜 지금인가"
    └ SCQA 전체 + 시리즈 로드맵

  Part 2: {KA1 제목}
    └ 미니 SCQA + {Ground 요약}

  Part 3: {KA2 제목}
    └ 미니 SCQA + {Ground 요약}

  ...

  Part {N}: 결론 — "그래서 어떻게 해야 하는가"
    └ 전체 요약 + 통합 반론 대응 + CTA

──── 조정 ────
  [1] 이대로 진행
  [2] 파트 구성 변경 (병합/분리/순서)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 4: 프로파일 저장

구조 확정 후, 프로파일을 저장한다.

### 4a. 프로파일 ID 입력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 프로파일 저장

  프로파일 ID (kebab-case, 예: linkedin-series):
  프로파일 이름 (한글 가능, 예: 링크드인 시리즈):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

### ARGUMENT-MAP.md 생성 (프로파일 무관)

모든 draft 실행 시 `export/ARGUMENT-MAP.md`도 갱신 (프로파일과 무관한 공통 산출물):

```markdown
# Argument Map: {project}

<!-- 생성: {현재 datetime} -->

## Thesis

**Answer**: {00-thesis.md Answer}

**Qualifier**: {00-thesis.md qualifier 또는 섹션별 qualifier 종합}

**SCQ**:
- Situation: {Situation}
- Complication: {Complication}
- Question: {Question}

## Logic Tree

{각 섹션을 번호 순서대로:}

### {N}-{section-name} [{status}]

- **Scheme**: {scheme}
- **Qualifier**: {qualifier}
- **Claim**: {Claim 내용}
- **Grounds**: {Grounds 핵심 요약 — 1-2문장}
- **Warrant**: {Warrant 내용}
- **Backing**: {Backing 있을 경우}
- **Rebuttal addressed**: {Rebuttal 내용이 있으면 "예 — {요약}", 없으면 "아니오"}
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

# ARGUMENT-MAP
git add export/ARGUMENT-MAP.md
git commit -m "draft: update argument map"

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
  🗺️ export/ARGUMENT-MAP.md

  Settled 섹션 반영: {N}개
  미반영 섹션: {M}개 ({status 이유})

---

## ▶ 다음

**다른 형태로 재산출** — 같은 논증을 다른 채널/목적으로
`/sowhat:draft`

**기존 프로파일로 재생성** — 논증 수정 후 동일 형식으로
`/sowhat:draft --profile {profile-id}`

<sub>`/clear` 후 실행 → 컨텍스트 초기화</sub>

---

**또한 가능:**
- `/sowhat:draft --list` — 전체 프로파일 목록
- `/sowhat:debate {section}` — 논증 추가 강화
- `/sowhat:finalize` — GSD export 생성 + 최종 완료

---
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

  🗺️ export/ARGUMENT-MAP.md

  총 분량: 약 {총 단어 수} 단어
  Settled 섹션 반영: {N}개

---

## ▶ 다음

**다른 형태로 재산출**
`/sowhat:draft`

**이 시리즈 재생성** (논증 수정 반영)
`/sowhat:draft --profile {profile-id}`

---
```

---

## 레거시 호환

`--output` 인수가 있고 `--profile`이 없으면 레거시 모드 작동:
- `--output all`: 프로파일 없이 기본 형식으로 `export/DOCUMENT.md` + `export/PRD.md` + `export/ARGUMENT-MAP.md` 생성
- `--output document`: `export/DOCUMENT.md`만
- `--output prd`: `export/PRD.md`만
- `--output argument-map`: `export/ARGUMENT-MAP.md`만

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
