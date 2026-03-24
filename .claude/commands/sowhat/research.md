---
model: claude-opus-4-6
description: 외부 리서치를 수행하고 결과를 섹션에 반영한다. "리서치", "데이터 조사", "근거 수집", "URL 분석", "시장 조사", "외부 자료 찾기", "open question 해결" 등 논증에 필요한 외부 근거나 데이터가 필요할 때 사용. URL 직접 분석, 토픽 검색, 자율 리서치 모드 지원.
---
# /sowhat:research — 외부 리서치 + 섹션 제안

이 커맨드는 외부 정보를 조사하여 기존 논리 트리(기획/명세)에 대한 수정 및 추가를 제안한다.

**예외 원칙**: 이 커맨드에서만 Claude가 정보를 가져온다. 단, 결정은 여전히 인간이 한다.

## 인자 파싱

`$ARGUMENTS`에 따라 모드가 결정된다:

| 인자 | 모드 |
|------|------|
| `http://...` 또는 `https://...` | URL 분석 |
| URL이 아닌 텍스트 | 토픽 검색 |
| `review` | 미검토 파인딩 목록 |
| `review {section}` | 특정 섹션 관련 미검토 파인딩 |
| `accept {N}` | 파인딩 N 수용 |
| `reject {N}` | 파인딩 N 거부 |
| (없음) | 자율 리서치 |

---

## 사전 준비 (모든 모드 공통)

1. `planning/config.json` 로드 → sowhat 프로젝트 확인
2. `00-thesis.md` 로드 (항상)
3. 모든 섹션 파일 로드 (현재 기획 상태 파악)
4. `research/` 디렉터리 생성 (없으면):
   ```bash
   mkdir -p research
   ```
5. 다음 파인딩 번호 결정:
   - `research/` 내 `NNN-*.md` 파일 카운트 + 1
   - 3자리 zero-pad (001, 002, ...)

6. 자율 리서치 모드(`$ARGUMENTS` 없음)인 경우 `logs/session.md` 저장:
   ```markdown
   ---
   command: research
   section: (auto)
   step: planning
   status: in_progress
   saved: {current_datetime}
   ---

   ## 마지막 컨텍스트
   research 자율 모드 시작 — 기획 상태 분석 중. 검색 계획 제안 전.

   ## 재개 시 첫 질문
   /sowhat:research → 자율 리서치 재시작
   ```

---

## URL 분석 모드

`$ARGUMENTS`가 `http://` 또는 `https://`로 시작할 때.

### 1. URL 내용 추출

`WebFetch`로 URL 내용을 가져온다:
- 핵심 주장, 데이터 포인트, 인사이트 추출
- 통계, 방법론, 경쟁 환경, 사용자 행동 데이터, 기술 접근법에 집중

WebFetch 실패 시: `❌ URL 접근 실패: {URL}. 접근 가능한 URL인지 확인하세요.`

### 2. 맥락 대조 분석

추출된 내용을 현재 thesis + 섹션과 대조한다:

- **섹션 관련성**: 어떤 섹션과 관련되는가?
- **지지/반박**: 기존 Claim을 강화하는가, 약화시키는가?
- **Open Questions**: 미해결 질문에 답하는가?
- **MECE 갭**: 누락된 논거를 시사하는가?
- **새 섹션 필요성**: 기존 섹션으로 커버되지 않는 중요 발견인가?

### 3. 파인딩 파일 생성

`research/{NNN}-{slug}.md` 파일을 생성한다:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

```markdown
---
id: {N}
type: url
source: "{URL}"
created: {current_datetime}
relevant_sections:
  - {관련 섹션 목록}
status: unreviewed
---

## 출처
{URL} — {페이지 제목 또는 설명}

## 주요 발견
1. {발견 1}
2. {발견 2}
3. {발견 3}

## 섹션별 제안

### {섹션} — {대상 영역} (Supporting Arguments / Claim / Edge Cases 등)
> 현재: {현재 내용 인용, 존재하면}

제안: {수정/추가 내용과 이유}

## 원본 노트
{압축된 핵심 원문 내용 — 나중에 참조용}
```

### 4. 로그 업데이트

`research/log.md`에 append한다:

```markdown
## [{NNN}] {datetime} — URL 분석
- 출처: {URL}
- 발견: {N}건
- 관련 섹션: {목록}
- 상태: unreviewed
```

`research/log.md`가 없으면 `# 리서치 로그` 헤더와 함께 생성한다.

### 5. 제안 제시

인간에게 결과를 제시한다:

```
리서치 완료: {N}건 발견 ({URL})

기존 섹션 제안:
[1] {섹션} — {대상 영역}
    {구체적 제안 요약}

[2] {섹션} — {대상 영역}
    {구체적 제안 요약}

새 섹션 제안: (해당되면)
[3] NEW — "{제안 섹션명}"
    {thesis 연결 근거}

선택:
  accept [번호]  → 파인딩 수용 (해당 섹션 Open Questions에 추가)
  reject [번호]  → 파인딩 거부
  expand [번호]  → 해당 발견에 대해 상세 논의
  all            → 전체 수용
  none           → 전체 거부
```

인간의 선택에 따라 파인딩 파일의 `status`를 업데이트한다.

`accept` 시: 해당 섹션의 `## Open Questions`에 `- [ ] [리서치 #{NNN}] {제안 요약}` 추가.

---

## 토픽 검색 모드

`$ARGUMENTS`가 URL이 아닌 텍스트일 때.

### 1. 웹 검색

`WebSearch`로 주제를 검색한다.

### 2. 소스 선별 + 추출

검색 결과에서 상위 3~5개 관련 URL을 `WebFetch`로 가져온다.
- thesis 맥락과 관련성이 높은 것 우선
- 접근 실패한 URL은 건너뛰고 다음으로

### 3. 종합

여러 소스를 종합한다:
- 중복 제거
- 합의점 식별 (여러 소스가 동의하는 것)
- 충돌점 식별 (소스 간 상반되는 주장)

### 4. 파인딩 생성

URL 모드와 동일한 형식으로 파인딩 파일을 생성한다.
단, `type: search`, `source: "{검색어}"`.

여러 소스에서 온 발견은 하나의 파인딩 파일에 종합한다.

### 5. 제안 제시

URL 모드와 동일.

---

## 자율 리서치 모드

`$ARGUMENTS`가 비어있을 때.

### 1. 현재 기획 상태 분석

다음을 분석한다:
- `draft` 또는 `discussing` 상태 섹션 — 아직 미완성
- 모든 섹션의 `## Open Questions` — 미해결 질문
- MECE 갭 분석 — Key Arguments가 Answer를 완전히 커버하는가
- Supporting Arguments가 약한 Claim — 근거가 부족한 주장

### 2. 검색 계획 제시

**인간에게 먼저 승인을 받는다**:

```
현재 기획 상태 분석 결과, 다음 리서치를 제안합니다:

[1] "{검색어 1}"
    관련: {섹션} — 이유: {왜 이 검색이 필요한가}

[2] "{검색어 2}"
    관련: {섹션} — 이유: {왜 이 검색이 필요한가}

[3] "{검색어 3}"
    관련: {섹션} — 이유: {왜 이 검색이 필요한가}

어떤 것을 조사할까요? (all / 번호 / none)
```

### 3. 승인된 검색 실행

인간이 선택한 항목만 토픽 검색 모드로 실행한다.

### 4. 결과 종합

각 검색별 파인딩을 생성하고, 전체 제안을 한번에 제시한다.

---

## 서브커맨드

### `review`

`research/` 내 `status: unreviewed`인 파인딩을 요약 표시한다:

```
미검토 리서치 {N}건:

[001] URL 분석 — {source 요약}
      관련: {섹션 목록}
      발견: {주요 발견 한 줄 요약}

[002] 토픽 검색 — "{검색어}"
      관련: {섹션 목록}
      발견: {주요 발견 한 줄 요약}
```

미검토 파인딩이 없으면: `✅ 미검토 리서치가 없습니다.`

### `review {section}`

특정 섹션과 관련된 `unreviewed` 파인딩만 표시한다.
파인딩 frontmatter의 `relevant_sections`에 해당 섹션이 포함된 것만 필터.

### `accept {N}`

파인딩 `{N}`의 `status`를 `accepted`로 변경한다.
해당 파인딩의 제안을 관련 섹션의 `## Open Questions`에 추가한다:
```
- [ ] [리서치 #{NNN}] {제안 요약}
```

`logs/argument-log.md`에 append한다 (파일이 없으면 `# Argument Log` 헤더와 함께 생성):

```markdown
## [{current_datetime}] research:accept({N})
  Finding: {source summary}
  Applied to: {sections}
  Added to Open Questions: {section} #{open_question_number}
```

### `reject {N}`

파인딩 `{N}`의 `status`를 `rejected`로 변경한다.
섹션 파일은 수정하지 않는다.

---

## config.json 업데이트

리서치 실행 후 `planning/config.json`에 `research` 필드를 업데이트한다:

```json
"research": {
  "count": {총 파인딩 수},
  "unreviewed": {미검토 수},
  "last_research": "{datetime}"
}
```

`research` 필드가 없으면 추가한다.

---

## 종료 안내

```
✅ 리서치 완료
  - 파인딩: {N}건 생성
  - 수용: {N}건 / 거부: {N}건 / 미검토: {N}건

다음: /sowhat:research review → 미검토 파인딩 확인
      /sowhat:expand {section} → 리서치 기반 섹션 전개
      /sowhat:challenge → 전체 트리 검증
```

---

## 핵심 원칙

- **리서치는 제안이다** — 자동 반영 없음. 인간이 accept/reject
- **자율 모드는 승인 후 실행** — 검색 계획을 먼저 제시
- **항상 섹션에 매핑** — 떠다니는 정보 없음. 모든 발견은 섹션과 연결
- **누적 가능** — 여러 리서치 세션의 결과가 `research/`에 축적
- **thesis 맥락 필수** — 모든 분석은 현재 thesis를 기준으로
