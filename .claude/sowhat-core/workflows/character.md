# /sowhat:character — 글쓰기 캐릭터 생성·관리

<!--
@metadata
checkpoints:
  - type: decision
    when: "메인 메뉴 선택 (새 캐릭터 / 관리 / 목록)"
  - type: decision
    when: "대표 문단 교차 검증 시 사용자 선택"
  - type: human-input
    when: "캘리브레이션 피드백"
config_reads: []
config_writes: []
continuation:
  primary: "/sowhat:draft"
  alternatives: ["/sowhat:progress"]
status_transitions: []
-->

레퍼런스 텍스트를 3차원(Voice/Flow/Persona)으로 분석하여 5층 캐릭터 프로파일을 생성·관리한다. `references/character-system.md`의 전체 파이프라인을 따른다.

> **AI Content Boundary**: 이 워크플로우의 AI 생성물은 `references/ai-content-boundary.md` 원칙을 따른다 — 3차원 분석(Voice/Flow/Persona)은 원본 레퍼런스 인용만, 외부 기관 비유·정량 수치 금지. 유형 기술(`"간결하고 직설적인 문체"`)은 `[source:inference]`.

## 메인 메뉴 (항상 표시)

인자 유무와 관계없이 메뉴부터 시작한다.

```
글쓰기 캐릭터

[1] 새 캐릭터 만들기
[2] 기존 캐릭터 관리
[3] 캐릭터 목록 보기
```

---

## [1] 새 캐릭터 만들기

`character-system.md` Phase 1-5를 순서대로 실행한다.

### Step 1: 이름 + 레퍼런스 수집 (Phase 1)

1. 캐릭터 이름 입력받기 (kebab-case)
2. 레퍼런스 수집 — 파일(file:path), 폴더(dir:path), 직접 붙여넣기 중 선택
3. 최소 3개 권장, 2개도 가능
4. `~/.claude/sowhat-characters/{name}/` 디렉터리 생성
5. 각 레퍼런스를 `references/pending/ref-NNN.md`로 저장 (원문 + 메타데이터)

### Step 2: 대표 문단 선정 + 3차원 분석 (Phase 2)

각 레퍼런스에 대해:

1. **대표 문단 선정** — 도입/전개/마무리/증거/감정 중 3~5개, 선정 이유 기록
2. **3차원 분석**:
   - Voice (문장): 길이 경향, 어휘, 종결, 임팩트 장치
   - Flow (문단): 도입 패턴, 전환, 증거 삽입, 마무리
   - Persona (관계): 호칭, 감정 처리, 질문 사용, 거리감
3. **보조 4층 추출**: 문장 골격, 어휘 팔레트, 대조쌍, 사고 습관
4. `references/pending/` → `references/analyzed/`로 이동, 분석 결과 기록

**정량 수치 사용 금지** — "평균 14.2자" 대신 "짧은 문장 위주"로 기술

### Step 3: 교차 검증 (Phase 3)

복수 레퍼런스의 패턴을 대조하여 character.md의 5개 층을 확정:

- **모든 레퍼런스 공통** → 확정
- **일부에서만** → 사용자에게 선택 질문
- **하나에서만** → 맥락적 선택으로 판단, 제외

최종 확정:
- 대표 문단 5~8개
- 문장 골격 5~8개
- 어휘 팔레트 (선호/금기어)
- 대조쌍 2~3개
- 사고 습관 3~4개

### Step 4: 캘리브레이션 (Phase 4)

1. **짧은 샘플 (3문단)** 생성 → 사용자 확인
   - [1] 맞다 → 긴 샘플로
   - [2] 부분 조정
   - [3] 전체 다시
2. **긴 샘플 (10문단)** 생성 → 후반부 톤 유지 확인
   - [1] 일관 → 저장
   - [2] 후반부 변질 → 규칙 추가 → 재샘플
   - [3] 부분 조정
3. 캘리브레이션 결과를 `calibrations/cal-NNN.md`에 저장

**긴 샘플 통과 필수** — 통과하지 않으면 캐릭터 저장 불가

### Step 5: 최종 저장 (Phase 5)

1. `character.md` 확정 (5층 구조, ~2100자)
2. `changelog.md`에 v1 기록
3. Git commit: `feat(character): create {name} v1`
4. 완료 안내

---

## [2] 기존 캐릭터 관리

1. `~/.claude/sowhat-characters/` 스캔 → 캐릭터 선택
2. 서브 메뉴:

```
{name} 관리

[1] 레퍼런스 추가 — 신규 분석 → 교차 검증 → 캘리브레이션
[2] 피드백 리뷰 — calibrations/ 축적 피드백 확인 → 반영 여부 결정
[3] 캘리브레이션 재실행 — 현재 character.md로 재검증
[4] 수동 수정 — character.md 직접 편집
[5] 캐릭터 삭제
```

- 변경 시 character.md version +1
- changelog.md에 변경 기록

---

## [3] 캐릭터 목록 보기

`~/.claude/sowhat-characters/` 스캔 → 이름, 버전, 레퍼런스 수, 마지막 캘리브레이션 날짜 표시.

---

## Draft 연동

draft 워크플로우에서 캐릭터를 사용할 때:

1. **Pass 1**: 내용 정확성 (캐릭터 없이)
2. **Pass 2**: character.md를 주입하여 리라이트
3. **사후 감사**: 금기어 grep + 톤 비교

피드백이 있으면 `calibrations/`에 기록만 — character.md는 인간 리뷰 시에만 변경.

---

## 핵심 원칙

- **대표 문단이 핵심** — 규칙 나열보다 few-shot이 효과적
- **정량 수치 금지** — 거짓 정밀도 배제
- **Positive only** — 대조쌍(정답+오답)은 허용, 단독 금지 예시는 불가
- **2-pass 생성** — 내용과 스타일 관심사 분리
- **3차원 분석** — Voice(문장), Flow(문단), Persona(관계)
- **인간이 변경을 결정** — 피드백은 축적, 반영은 리뷰 시
