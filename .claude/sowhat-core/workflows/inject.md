# /sowhat:inject — 증거 직접 주입

<!--
@metadata
checkpoints:
  - type: decision
    when: "필드 매핑 선택 (Grounds/Backing/Rebuttal/Warrant)"
  - type: decision
    when: "settled 섹션 강등 확인"
config_reads: [layer, sections, research, credibility]
config_writes: [sections, research]
continuation:
  primary: "/sowhat:expand {section} 또는 /sowhat:settle {section}"
  alternatives: ["/sowhat:challenge {section}", "/sowhat:debate {section}"]
status_transitions: ["settled → needs-revision (주입 시)"]
-->

이 커맨드는 외부 자료(URL, 파일, 텍스트)를 특정 섹션의 특정 Toulmin 필드에 직접 주입한다.
research와 달리 "어떤 섹션의 어떤 필드"에 넣을지 사용자가 지정한다.

## 인자 파싱

`$ARGUMENTS` 형식: `{section} {source}`

| 인자 패턴 | source 유형 |
|-----------|------------|
| `{section} https://...` | URL 분석 후 주입 |
| `{section} file:{path}` | 로컬 파일 읽기 후 주입 |
| `{section} dir:{path}` | 폴더 내 파일 일괄 분석 후 통합 주입 |
| `{section} dir:{path} --glob {pattern}` | 폴더 내 특정 패턴 파일만 분석 후 통합 주입 |
| `{section}` (source 없음) | 텍스트 직접 입력 모드 |

section이 없으면 → `❌ 섹션을 지정하세요. 예: /sowhat:inject 02-solution https://...`

---

## 사전 준비

1. `planning/config.json` 로드
2. `00-thesis.md` 로드
3. 대상 섹션 파일 로드 → 현재 Toulmin 필드 상태 파악
4. 섹션 status 확인:
   - `invalidated` → `❌ invalidated 상태입니다. 상위 논거가 먼저 revision되어야 합니다.`
   - `settled` → 경고: `⚠️ settled 상태입니다. inject하면 needs-revision으로 강등됩니다. 계속? [Y/N]`
   - 기타 → 진행
5. `research/` 디렉터리 확인 (없으면 생성)
6. `logs/session.md` 저장:
   ```markdown
   ---
   command: inject
   section: {N}-{section}
   step: source-analysis
   status: in_progress
   saved: {current_datetime}
   ---
   ```

---

## L1 Fabrication 차단 (필수)

inject는 사용자가 **명시 제공한 자료**(URL/파일/폴더/직접입력)를 섹션에 주입한다. AI의 역할은 **자료 내용을 추출·요약**하는 것이며, 요약 과정에서 원본에 없는 수치·기관명·연도·인물명을 **생성하거나 보간하지 않는다**.

예시:
- 원본에 `"시장이 성장 중"`만 있는데 AI가 `"시장 28% 성장"`으로 요약 — ❌ 금지
- 원본 수치를 그대로 인용 — ✅ 허용
- 원본에 출처가 있으면 함께 기재 — ✅ 권장

원본에 구체 값이 없으면 요약도 정성 기술로 유지한다.

상세: `references/fabrication-prevention.md`.

---

## Step 1: 소스 분석

### URL 모드
1. `WebFetch`로 URL 내용 추출
2. `references/source-credibility.md`로 Tier 판정
3. 핵심 데이터 포인트, 주장, 통계 추출

### 파일 모드
1. `Read`로 로컬 파일 내용 읽기
2. PDF, markdown, 텍스트 지원
3. 내용 분석 후 핵심 추출
4. Tier 판정: 파일 유형에 따라
   - 학술 논문 PDF → T1
   - 공식 보고서 → T1~T2
   - 기타 → 내용 기반 판정

### 폴더 모드
1. `Glob`으로 폴더 내 파일 목록 수집
   - `--glob` 옵션 있으면 해당 패턴 사용 (예: `--glob *.pdf`)
   - 없으면 기본 패턴: `*.md`, `*.pdf`, `*.txt`, `*.csv`, `*.json`
2. 파일 수 확인:
   - 0개 → `❌ {path}에서 지원 파일을 찾지 못했습니다.`
   - 20개 초과 → `⚠️ {N}개 파일 발견. 처음 20개만 처리합니다. --glob으로 범위를 좁혀주세요.`
3. 각 파일을 `Read`로 읽고 핵심 데이터 포인트 추출 (파일당 3~5줄 요약)
4. 파일별 요약을 **통합 요약**으로 합성:
   ```
   ----------------------------------------
   📁 폴더 분석 결과: {path}
   📄 파일 {N}개 분석 완료

   **통합 요약:**
   {전체 파일에서 추출한 핵심 주장·데이터·패턴 5~10개}

   **개별 파일:**
   - {파일1}: {1줄 요약}
   - {파일2}: {1줄 요약}
   ...
   ----------------------------------------
   ```
5. Tier 판정: 폴더 내 파일 유형 종합 판단
   - 학술 논문 폴더 → T1
   - 혼합 자료 → 가장 낮은 Tier 적용
   - 출처 불명 → T3~T4
6. 통합 요약을 Step 2(필드 매핑)로 전달 — 이후 흐름은 단일 파일과 동일

### 텍스트 직접 입력 모드
1. 사용자에게 텍스트 입력 요청:
   ```
   ----------------------------------------
   ❓ 주입할 내용을 입력하세요.

   데이터, 경험, 내부 자료 등 자유 형식으로 입력 가능합니다.
   출처가 있다면 함께 기재하세요.
   ----------------------------------------
   ```
2. Tier 판정: 사용자 제공 정보
   - 출처 URL 포함 → 해당 URL로 Tier 판정
   - 내부 데이터/경험 → T3 (전문가 판단으로 간주)
   - 출처 없는 주장 → T4

---

## Step 2: 필드 매핑 제안

분석된 내용을 Toulmin 필드에 매핑 제안한다:

```
----------------------------------------
📊 신뢰도: {Tier} ({tier_reason})

📎 이 자료를 다음과 같이 주입할 수 있습니다:

[1] Grounds에 추가
    "{추출된 데이터/사실 요약}"
    {Tier가 T4면: ⚠️ T4 출처 — Grounds 단독 사용 불가}

[2] Backing에 추가
    "{추출된 보강 자료 요약}"

[3] Rebuttal 대응에 추가
    "{반박 조건에 대한 대응으로 활용}"

[4] Warrant 보강
    "{논리적 연결을 강화하는 근거}"

[5] 직접 지정 — 필드와 내용을 직접 입력

**현재 섹션 상태:**
  Claim: {현재 Claim 요약}
  Grounds: {현재 Grounds 수}개
  Warrant: {있음|Implicit|없음}
  Qualifier: {현재 Qualifier}
----------------------------------------
```

### T4 출처 제한

T4 출처인 경우 [1] Grounds 옵션에 잠금:
```
[1] Grounds에 추가  🔒 T4 출처 — Backing으로만 사용 가능
```
[1] 선택 시: `❌ T4 출처는 Grounds에 단독 사용할 수 없습니다. [2] Backing을 선택하세요.`

---

## Step 3: 주입 실행

사용자 선택에 따라 섹션 파일을 수정한다:

### Grounds 주입
```markdown
## Grounds
{기존 Grounds}
- {새 근거} — 출처: {URL/파일} (📊 {Tier})
```

### Backing 주입
```markdown
## Backing
{기존 Backing}
- {새 보강 자료} — 출처: {URL/파일} (📊 {Tier})
```

### Rebuttal 주입
```markdown
## Rebuttal
{기존 Rebuttal}
- 대응: {반박 대응 내용} — 근거: {URL/파일} (📊 {Tier})
```

### Warrant 주입
```markdown
## Warrant
{기존 또는 강화된 Warrant}
  ↳ 보강: {Warrant 지지 자료} — 출처: {URL/파일}
```

---

## Step 4: 파인딩 파일 생성

`research/{NNN}-inject-{section}-{slug}.md` 파일을 생성한다:

```markdown
---
id: {N}
type: manual
source: "{URL 또는 '사용자 직접 입력'}"
tier: {Tier}
tier_reasons:
  - "{판정 이유}"
created: {current_datetime}
relevant_sections:
  - "{section_id}"
status: applied
applied_to: "{section_id}.{field}"
citations:
  - "{section_id}.{field}[{index}]"
---

## 출처
{URL/파일경로/폴더경로/직접입력}

## 주입 내용
{실제 주입된 내용}

## 소스 파일 (폴더 모드 시)
{폴더 모드인 경우 개별 파일 목록과 각 파일에서 추출한 핵심 요약 기재. 단일 파일/URL/텍스트 모드면 생략}

## 주입 위치
{section_id} — {Grounds|Backing|Rebuttal|Warrant}
```

---

## Step 5: 정합성 검증

주입 후 즉시 간이 검증을 수행한다:

1. **Claim-Grounds 연결**: 새 Ground가 Claim을 지지하는가?
2. **Warrant 유효성**: 새 Ground 추가로 Warrant가 여전히 유효한가?
3. **Qualifier 적정성**: 근거가 강화되었으면 Qualifier 상향 제안 가능

```
----------------------------------------
✅ 주입 완료: {section} — {field}

📊 논증 강도 변화: {before}/100 → {after}/100 ({delta})
  근거 강도: {before} → {after}
  {강도가 올랐으면: 💪 근거 강화됨}
  {Qualifier 상향 가능하면: ℹ️ Qualifier 상향 가능: {현재} → {제안}}

파인딩: research/{NNN}-inject-{slug}.md
----------------------------------------
```

---

## Step 6: settled 섹션 처리

settled 상태에서 inject한 경우:
1. 섹션 status → `needs-revision`
2. config.json 업데이트
3. GitHub Issue reopen + label 변경
4. 역전파 필요 여부 확인 (cascading invalidation)

---

## Git 커밋

```bash
git add {section_file} research/{finding_file}
git commit -m "inject({section}): add {field} from {source_type} ({Tier})"
# source_type: url | file | dir({N}files) | text
```

---

## logs 업데이트

### argument-log.md
```markdown
## [{datetime}] inject({section})
  Field: {Grounds|Backing|Rebuttal|Warrant}
  Source: {URL/파일/직접입력}
  Tier: {T1|T2|T3|T4}
  Strength: {before} → {after}
```

### session.md
```markdown
---
command: inject
section: {N}-{section}
step: complete
status: complete
saved: {current_datetime}
---
```

---

## 종료 안내

```
----------------------------------------
다음 액션:

[1] 논증 전개 (/sowhat:expand {section})
[2] 논증 확정 (/sowhat:settle {section})
[3] 주입 후 부분 검증 (/sowhat:challenge {section})
[4] 변증법 강화 (/sowhat:debate {section})
----------------------------------------


```

---

## 핵심 원칙

- **주입은 즉시 반영** — research와 달리 accept/reject 없이 바로 적용
- **Tier 제한은 동일** — inject라도 T4는 Backing 전용
- **파인딩 파일 생성 필수** — 출처 추적을 위해 항상 기록
- **settled 섹션 주입은 강등 유발** — 의도적 선택임을 확인
- **정합성 즉시 검증** — 주입이 논증을 약화시키면 경고
