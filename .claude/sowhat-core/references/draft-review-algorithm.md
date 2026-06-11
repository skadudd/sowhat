# Draft Review Algorithm — `--review` 모드 절차

`/sowhat:draft --review {profile-id}` 진입 시의 전체 절차. 인간이 `DOCUMENT.md`를 직접 수정한 내용을 분석하여 (1) 논리 변경은 논증 트리와 정합성 검사, (2) 스타일 변경은 character 시스템 피드백으로 변환한다.

워크플로우(`workflows/draft.md`)는 `--review` 분기에서 이 파일을 읽고 아래 절차를 그대로 따른다.

---

## 사전 검증

1. `export/generated/{profile}/DOCUMENT.md` 존재 확인
2. `export/generated/{profile}/DOCUMENT.original.md` 존재 확인
   - 없으면: `❌ 원본 파일이 없습니다. --review는 draft 생성 후에만 사용 가능합니다.`
3. 두 파일이 동일한지 확인
   - 동일하면: `ℹ️ 수정 사항이 없습니다. DOCUMENT.md가 원본과 동일합니다.`

## 단계 1: Diff 추출

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

## 단계 2: 변경 분류

각 변경 블록을 4가지 유형으로 분류한다:

| 유형 | 판정 기준 |
|------|----------|
| `stylistic` | 같은 의미, 다른 표현. 어휘 교체, 문장 길이 조절, 어미 변경, 접속사 변경 |
| `structural` | 문단 순서 변경, 섹션 추가/삭제/병합, 소제목 변경 |
| `substantive` | 주장(Claim)의 의미가 변경됨, 수치/데이터가 변경됨, 근거가 삭제/교체됨, confidence가 변경됨 |
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

## 단계 3: 분류 결과 출력

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

## 단계 4: 논리 정합성 검사 (substantive + additive)

각 substantive/additive 변경에 대해 논증 트리와 대조한다.

1. 변경된 내용에 대응하는 섹션의 Walton 필드를 찾는다 (draft 생성 시의 source mapping 또는 내용 매칭)
2. 수정된 주장이 원본 섹션의 Claim/Grounds/CQ Responses와 정합하는지 검사

### 판정 기준

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

### 결과 출력

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
    Confidence: {confidence}

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

## 단계 5: 캐릭터 뉘앙스 학습 (stylistic + structural)

스타일 변경을 character 시스템의 피드백으로 변환한다.

### 학습 추출 (Layer 매핑)

stylistic 변경에서 다음 패턴을 추출한다. 각 패턴은 character-system의 Layer에 매핑된다:

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

> Layer 정의 전체는 `references/character-system.md`(5층 캐릭터 프로파일) 참조.

### 캐릭터 피드백 저장

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

### 캐릭터 통합 제안

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

## 단계 6: 결과 요약 + 원본 업데이트

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

## session.md 저장

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

## 핵심 원칙

- **인간의 수정이 우선** — 기본 자세는 "인간이 맞다". 충돌 시에만 경고
- **양방향 피드백** — 논리 변경은 논증 트리로, 스타일 변경은 캐릭터로
- **비파괴적** — 원본 파일을 자동 보존, 언제든 비교 가능
- **점진적 학습** — 매 review마다 캐릭터 피드백이 축적, 다음 생성에 반영
- **source mapping 활용** — draft 생성 시의 섹션-문단 매핑을 활용하여 정확한 출처 추적
