---
model: claude-sonnet-4-6
description: 명세 레이어 섹션을 핑퐁으로 전개한다. "명세", "spec", "스펙 작성", "기능 요구사항", "데이터 모델", "API 설계", "엣지 케이스", "인수 기준", "actors 정의" 등 finalize-planning 이후 명세 섹션(04~09)을 구체화할 때 사용. 기획 내용과의 정합성 유지.
---
# /sowhat:spec — 명세 섹션 핑퐁

이 커맨드는 명세 레이어의 섹션을 핑퐁 방식으로 전개한다. `$ARGUMENTS`에 섹션 이름 또는 번호가 전달된다.

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

## 컨텍스트 로드

명세 섹션 핑퐁 전에 반드시 로드:
1. `00-thesis.md` — 최상위 논리
2. 관련 기획 섹션들 — 명세의 근거가 되는 기획 내용
3. 대상 명세 섹션 파일
4. `research/` 디렉터리 확인:
   - 해당 섹션과 관련된 `status: unreviewed` 파인딩이 있으면:
     `ℹ️ 이 섹션과 관련된 미검토 리서치가 {N}건 있습니다. /sowhat:research review {section}`

## 섹션별 핑퐁 가이드

### 04-actors

- "이 시스템의 주요 액터(사용자/시스템)는 누구입니까?"
- "각 액터의 역할과 권한은?"
- "액터 간 상호작용은?"
- "시스템 외부 연동이 필요한 액터는?"

### 05-functional-requirements

- "이 기능이 구체적으로 어떻게 동작해야 합니까?"
- "입력과 출력은 무엇입니까?"
- "정상 흐름(happy path)은?"
- "비정상 흐름(error path)은?"
- "각 기능의 우선순위는?"

### 06-data-model

- "핵심 엔티티와 속성은?"
- "엔티티 간 관계는?"
- "데이터 제약조건(필수, 유일, 범위)은?"
- "데이터 생명주기(생성, 수정, 삭제)는?"

### 07-api-contract

- "어떤 API 엔드포인트가 필요합니까?"
- "각 엔드포인트의 요청/응답 형식은?"
- "인증/인가 방식은?"
- "에러 응답 형식은?"
- "버전 관리 전략은?"

### 08-edge-cases

- 기획 섹션에서 수집된 edge case들을 재검토
- "추가로 고려해야 할 경계 조건은?"
- "동시성 문제는?"
- "데이터 정합성 문제는?"
- 각 edge case에 대한 처리 방안 도출

### 09-acceptance-criteria

- 기획 섹션에서 수집된 AC들을 재검토
- "각 AC가 검증 가능한 형태입니까?"
- "누락된 AC는?"
- "AC의 우선순위는?"
- 각 AC를 Given-When-Then 형식으로 구조화

## 파일 업데이트

핑퐁 중 인간이 답한 내용을 즉시 섹션 파일에 반영한다.

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

- `status`를 `discussing`으로 변경 (draft였으면)
- `updated`를 현재 datetime으로 변경
- 인간의 답변을 해당 섹션에 구조화하여 기록

## Argument Log 업데이트

각 핑퐁 라운드 완료 후 `logs/argument-log.md`에 append:

```markdown
## [{datetime}] spec({section})
  Step: {현재 스텝: actors|requirements|data-model|api|edge-cases|acceptance}
  Decided: {이번 라운드에서 확정된 내용 한 줄}
```

## 세션 저장

각 핑퐁 질문 제시 후 `logs/session.md`를 Write 도구로 덮어쓴다:

```markdown
---
command: spec
section: {N}-{section}
step: {현재 질문 키워드: actors|requirements|data-model|api|edge-cases|acceptance}
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

인간이 충분하다고 판단하면 핑퐁을 종료한다.

```
✅ 명세 섹션 {N}-{name} 전개 완료 (status: discussing)

다음: /sowhat:settle {section} → 이 섹션 완료 선언
      /sowhat:spec {other} → 다른 명세 섹션 전개
      /sowhat:challenge → 전체 트리 검증
```

## 핵심 원칙

- **Claude는 질문만 한다** — 명세 내용을 대신 채우지 않는다
- **기획 내용과의 정합성 유지** — 명세가 기획을 벗어나면 안 된다
- **한 번에 하나의 질문**
- **구체적이고 검증 가능한 형태**로 구조화
