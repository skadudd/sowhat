# /sowhat:spec — 명세 섹션 핑퐁

<!--
@metadata
checkpoints:
  - type: decision
    when: "명세 필드 구성 중 선택"
  - type: human-input
    when: "도메인 전문 지식 필요 시"
config_reads: [layer, sections]
config_writes: [sections]
continuation:
  primary: "/sowhat:settle {section}"
  alternatives: ["/sowhat:challenge"]
status_transitions: ["draft → discussing"]
-->

이 커맨드는 명세 레이어의 섹션을 핑퐁 방식으로 전개한다. **기획 섹션의 Claim/Grounds/Scope에서 질문을 파생**시켜 기획→명세 정합성을 보장한다. `$ARGUMENTS`에 섹션 이름 또는 번호가 전달된다.

## 사전 검증

1. `planning/config.json` 로드
2. `layer`가 `"spec"`인지 확인
   - `"planning"` → `❌ 아직 기획 레이어입니다. /sowhat:finalize-planning을 먼저 실행하세요.`
   - `"finalized"` → `❌ 이미 완료된 프로젝트입니다.`
3. 대상 섹션 파일 확인:
   - `$ARGUMENTS`가 숫자 → `{N}-*.md` 패턴 (04~09 범위)
   - `$ARGUMENTS`가 이름 → `*-{name}.md` 패턴
   - 유효한 명세 섹션(04~09)이 아니면 → `❌ 유효한 명세 섹션이 아닙니다. (04~09)`
4. 섹션 status 확인:
   - `settled` → `❌ 이미 settled된 섹션입니다. /sowhat:challenge로 재검토하세요.`
   - `invalidated` → `❌ invalidated 상태입니다.`

## 컨텍스트 로드 (1회만 — 이후 재로드 금지)

명세 섹션 핑퐁 전에 반드시 로드:

1. `00-thesis.md` — thesis_answer, key_arguments 추출
2. **기획 섹션 전체** (01~03) — 각 섹션의 Claim, Grounds, Scope, Acceptance Criteria 추출
3. 대상 명세 섹션 파일 — 현재 내용 로드
4. `research/` 디렉터리 확인:
   - 해당 섹션과 관련된 `status: unreviewed` 파인딩이 있으면:
     `ℹ️ 이 섹션과 관련된 미검토 리서치가 {N}건 있습니다. /sowhat:research review {section}`

추출한 기획 내용을 **명세 전체에서 재사용할 변수**로 저장한다:

```
planning_claims[]    ← 각 기획 섹션의 Claim
planning_grounds[]   ← 각 기획 섹션의 Grounds (데이터, 사례 포함)
planning_scope_in[]  ← 각 기획 섹션의 Scope > In
planning_scope_out[] ← 각 기획 섹션의 Scope > Out (Non-Goals)
planning_ac[]        ← 각 기획 섹션의 Acceptance Criteria
planning_edge[]      ← 각 기획 섹션의 Edge Cases (있으면)
planning_actors[]    ← Grounds에서 언급된 사용자/시스템/외부 연동
planning_data[]      ← Grounds에서 언급된 데이터/엔티티/속성
planning_interfaces[] ← Grounds에서 언급된 API/인터페이스/프로토콜
```

---

## 기획→명세 역추적 원칙

모든 명세 내용은 기획 섹션에서 파생되어야 한다. 파생 관계를 명시적으로 추적한다.

```
기획 Claim       →  명세의 기능 요구사항 (05)
기획 Grounds     →  명세의 데이터 모델 (06), API 계약 (07)
기획 Scope       →  명세의 Edge Cases (08) 경계
기획 AC          →  명세의 인수 기준 (09) 기반
기획에서 언급된 주체  →  명세의 Actors (04)
```

**역추적 태그**: 명세에 기록하는 모든 항목에 출처 기획 섹션을 표시한다.

```markdown
### 로그인 기능 (← 01-problem Claim: "사용자 인증이 핵심 병목")
```

---

## 섹션별 핑퐁 (기획 파생 질문)

### 04-actors

**기획에서 추출**: `planning_actors[]` + Grounds에 등장하는 모든 주체

질문 파생 순서:

1. 추출된 actor 목록 제시:
   ```
   기획에서 식별된 주체:
   - {actor_1} (← {section} Grounds에서 언급)
   - {actor_2} (← {section} Claim에서 언급)
   - ...

   이 목록이 완전합니까?
   [1] 완전하다
   [2] 추가할 주체가 있다 — 누구?
   ```
2. 각 actor에 대해: "이 주체의 역할과 권한은?" (← 기획의 어떤 Claim을 실행하는가)
3. actor 간 상호작용: "기획 {section}에서 {actor_A}와 {actor_B}가 함께 등장합니다. 어떻게 상호작용합니까?"
4. 외부 연동: "기획의 Grounds에서 외부 시스템({system})이 언급됩니다. 연동 방식은?"

**턴 상한: actor당 2턴, 전체 최대 8턴**

### 05-functional-requirements

**기획에서 추출**: `planning_claims[]` — 각 Claim이 하나의 기능 요구사항 후보

질문 파생 순서:

1. Claim→기능 매핑 제시:
   ```
   기획 Claim에서 도출된 기능 요구사항 후보:
   - FR-1: {claim_1 기반 기능} (← {section_1} Claim)
   - FR-2: {claim_2 기반 기능} (← {section_2} Claim)
   - ...

   이 매핑이 적절합니까?
   [1] 적절하다
   [2] 수정 필요 — 어떤 부분?
   [3] 추가 기능이 있다
   ```
2. 각 FR에 대해:
   - "구체적으로 어떻게 동작해야 합니까?" (← {section}의 Grounds에서 힌트 제시)
   - "입력과 출력은?" (← Grounds의 데이터 포인트 기반)
   - "정상 흐름(happy path)은?"
   - "비정상 흐름은?" (← {section}의 Rebuttal 조건에서 파생)
3. 우선순위: "기획에서의 논거 강도(strength score)를 참고하면 {FR-1}이 가장 핵심입니다. 동의하십니까?"

**턴 상한: FR당 3턴, 전체 최대 12턴**

### 06-data-model

**기획에서 추출**: `planning_data[]` + `planning_grounds[]`에서 언급된 엔티티/속성

질문 파생 순서:

1. 추출된 엔티티 목록 제시:
   ```
   기획 Grounds에서 식별된 데이터 엔티티:
   - {entity_1} (← {section} Grounds: "{관련 문장}")
   - {entity_2} (← {section} Grounds: "{관련 문장}")

   이 목록이 완전합니까?
   ```
2. 각 엔티티에 대해: "핵심 속성은?" + "필수/선택 구분은?"
3. 엔티티 간 관계: "기획 {section_A}와 {section_B}에서 {entity_1}과 {entity_2}가 함께 등장합니다. 관계는?"
4. 제약조건: "기획의 Scope.Out에서 제외된 {항목}은 데이터 모델에서도 제외합니까?"
5. 생명주기: "이 데이터는 언제 생성되고 언제 삭제됩니까?"

**턴 상한: 엔티티당 2턴, 전체 최대 10턴**

### 07-api-contract

**기획에서 추출**: `planning_interfaces[]` + 05-functional-requirements에서 확정된 FR 목록

질문 파생 순서:

1. FR→API 매핑 제시:
   ```
   기능 요구사항에서 도출된 API 엔드포인트 후보:
   - {FR-1} → POST /api/... (← 05 FR-1)
   - {FR-2} → GET /api/... (← 05 FR-2)

   이 매핑이 적절합니까?
   ```
2. 각 엔드포인트에 대해: "요청/응답 형식은?" (← 06 데이터 모델 참조)
3. 인증/인가: "04-actors에서 정의된 역할별 접근 권한은?"
4. 에러 응답: "05에서 정의된 비정상 흐름에 대한 에러 코드는?"
5. 버전 관리: "기획의 Scope.In 범위 내에서 변경 가능성이 높은 API는?"

**턴 상한: 엔드포인트당 2턴, 전체 최대 10턴**

### 08-edge-cases

**기획에서 추출**: `planning_edge[]` + 각 섹션의 Rebuttal 조건

질문 파생 순서:

1. 기획에서 수집된 edge case 제시:
   ```
   기획에서 식별된 경계 조건:
   - {edge_1} (← {section} Rebuttal: "{조건}")
   - {edge_2} (← {section} Scope.Out: "{비목표}")
   - {edge_3} (← {section} Edge Cases 필드)

   추가로 고려해야 할 경계 조건이 있습니까?
   ```
2. 각 edge case에 대해: "이 조건이 발생했을 때 시스템은 어떻게 동작해야 합니까?"
3. 교차 검증: "기획의 Scope.Out에 명시된 {항목}이 edge case로 들어오면 어떻게 처리합니까?"
4. 동시성/정합성: 06 데이터 모델 기반 — "여러 actor가 동시에 {entity}를 수정하면?"

**턴 상한: edge case당 1턴, 전체 최대 8턴**

### 09-acceptance-criteria

**기획에서 추출**: `planning_ac[]` — 각 기획 섹션의 AC가 기반

질문 파생 순서:

1. 기획 AC 기반 초안 제시:
   ```
   기획에서 수집된 인수 기준:
   - AC-1: {ac_text} (← {section})
   - AC-2: {ac_text} (← {section})

   Given-When-Then 형식으로 구조화합니다.
   ```
2. 각 AC를 Given-When-Then으로 변환 제시 → 인간이 확인/수정:
   ```
   AC-1 → Given: {전제 조건}
          When: {행위}
          Then: {기대 결과}

   이 구조가 맞습니까?
   [1] 맞다
   [2] 수정 필요
   ```
3. 누락 AC: "기획 {section}의 Claim '{claim}'에 대한 AC가 없습니다. 추가하시겠습니까?"
4. 검증 가능성: "이 AC는 자동 테스트로 검증 가능합니까, 수동 검증이 필요합니까?"

**턴 상한: AC당 2턴, 전체 최대 10턴**

---

## 턴 상한 관리

각 섹션에 턴 상한이 설정되어 있다. 상한에 도달하면:

```
ℹ️  턴 상한 도달 ({current}/{max})

[1] 추가 턴 진행 (최대 {max + 3}턴까지)
[2] 현재 내용으로 마무리 → settle 안내
```

**강제 종료**: 상한 + 3턴 초과 시 자동 종료하고 settle 안내.

---

## 기획 정합성 검증 (핑퐁 중 상시)

핑퐁 중 인간의 답변이 기획과 충돌하면 즉시 경고한다:

```
⚠️  기획 정합성 경고

  입력: "{인간의 답변 요약}"
  충돌: {section}의 Scope.Out에 "{항목}"이 명시적으로 제외되어 있습니다.

  [1] 기획이 맞다 — 입력 철회
  [2] 명세가 맞다 — 기획 수정 필요 (revise 안내)
  [3] 양립 가능 — 이유 설명
```

검증 대상:
- Scope.Out에 포함된 항목이 명세에 등장
- 기획 Claim의 방향과 반대되는 기능 요구
- 기획에서 언급되지 않은 완전 새로운 엔티티/기능 (추가 자체는 허용하되 경고)

---

## 파일 업데이트

핑퐁 중 인간이 답한 내용을 즉시 섹션 파일에 반영한다.

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

- `status`를 `discussing`으로 변경 (draft였으면)
- `updated`를 현재 datetime으로 변경
- 인간의 답변을 해당 섹션에 구조화하여 기록
- **역추적 태그 포함**: 각 항목에 `(← {section} {field})` 출처 표시

각 핑퐁 질문에서 인간이 답변하면 즉시 커밋:

```bash
git add {section_file}
git commit -m "wip({section}): add {현재 항목 키워드}"
```

## Argument Log 업데이트

각 핑퐁 라운드 완료 후 `logs/argument-log.md`에 append:

```markdown
## [{datetime}] spec({section})
  Step: {현재 스텝: actors|requirements|data-model|api|edge-cases|acceptance}
  Decided: {이번 라운드에서 확정된 내용 한 줄}
  Source: ← {기획 섹션 출처}
```

## 세션 저장

각 핑퐁 질문 제시 후 `logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: spec
section: {N}-{section}
step: {현재 질문 키워드: actors|requirements|data-model|api|edge-cases|acceptance}
turn: {현재 턴}/{최대 턴}
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
{지금까지 핑퐁에서 나온 핵심 결정사항 2~3문장. 예: "05-functional-requirements 전개 중. 로그인 플로우의 happy path 정의 완료. 현재 에러 플로우 정의 중. OAuth 실패 시 처리 방식 논의 중"}

## 재개 시 첫 질문
{다음 질문 그대로}
```

핑퐁 완료 커밋 직전에 `status: complete`로 업데이트한다.

---

## 종료

인간이 충분하다고 판단하거나 턴 상한 도달 시 핑퐁을 종료한다.

```
✅ 명세 섹션 {N}-{name} 전개 완료 (status: discussing)

  기획 커버리지: {커버된 기획 항목 수}/{전체 기획 항목 수}
  {미커버 항목이 있으면: ⚠️ 미반영 기획 항목: {목록}}

----------------------------------------
다음 액션:

[1] 이 섹션 완료 선언 (/sowhat:settle {section})
[2] 다른 명세 섹션 전개 (/sowhat:spec {other})
[3] 전체 트리 검증 (/sowhat:challenge)
----------------------------------------
```

## 핵심 원칙

- **Claude는 질문만 한다** — 명세 내용을 대신 채우지 않는다
- **기획이 명세의 원천이다** — 모든 질문은 기획 Claim/Grounds/Scope에서 파생
- **역추적 태그 필수** — 명세 항목마다 출처 기획 섹션 표시
- **한 번에 하나의 질문**
- **턴 상한 준수** — 섹션별 상한 도달 시 마무리 유도
- **정합성 상시 검증** — 기획 Scope.Out 위반 즉시 경고
- **구체적이고 검증 가능한 형태**로 구조화
