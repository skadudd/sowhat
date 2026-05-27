# Session Protocol

All sowhat commands that have multi-step workflows MUST save `logs/session.md` at start AND at completion.

## Start Save Pattern

Save at the beginning of each command (after initial validation, before first user-facing step):

```
---
command: {command-name}
section: {section-name or (auto)/(url)/(search)}
step: {current-step-name}
status: in_progress
saved: {current_datetime_ISO8601}
next_session_memo: "{현재 열려 있는 파일 경로·라인 번호·진입점 — 재개 시 즉시 참조할 구체 컨텍스트}"
---

## 마지막 컨텍스트
{1-2 sentences describing current state and what was just decided}

## 재개 시 첫 질문
{exact question or action to resume from this point}
```

## Completion Save Pattern

Overwrite session.md when command finishes:

```
---
command: {command-name}
section: {section-name}
step: complete
status: complete
saved: {current_datetime_ISO8601}
next_session_memo: "{다음 세션에서 즉시 필요한 파일 경로·라인 번호·연결 지점 — 없으면 생략 가능}"
---

## 마지막 컨텍스트
{command} 완료 — {1 sentence summary of what was achieved}

## 재개 시 첫 질문
{next suggested command}
```

> `next_session_memo`는 선택 필드이지만 권장된다. resume이 session.md를 1차 참조할 때 이 필드가 있으면 수동 탐색 없이 정확한 컨텍스트로 복원할 수 있다. 구체적일수록 유효하다. 예: `"planning/02-market.md:47 — Grounds G3 미완, Sub-Research 결과 대기 중"`.


## Optional Extension Fields

Workflows may add extra frontmatter fields beyond the base schema:

| Field | Used by | Meaning |
|-------|---------|---------|
| `sub_research_pending` | expand | `true` if Sub-Research agent was triggered and results are pending |
| `checkpoint_type` | settle, challenge | `verify-argument`, `decision`, or `human-input` when status is `awaiting_checkpoint` |
| `preview_event` | draft, finalize, finalize-planning | `preview_approved` / `preview_canceled` / `preview_revised` — 미리보기 게이트 결과 |

### Preview Gate event_type 정의

| event_type | 발생 조건 | 의미 |
|---|---|---|
| `preview_approved` | 사용자가 `[1]`로 미리보기 게이트 통과 | 계획대로 실행 진행 |
| `preview_canceled` | 사용자가 `[2]`로 취소 | 실행 중단 |
| `preview_revised` | 사용자가 수정 요청 자유 입력 후 재생성 | 미리보기 갱신 후 진행 |

draft/finalize/finalize-planning 실행 시 session.md의 `preview_event` 필드에 결과를 기록한다.

## Structured Handoff (세션 종료 시)

세션 종료(complete) 시 `logs/handoff.json`을 machine-readable로 생성한다. resume의 복원 정확도를 높이기 위한 보조 파일.

### 생성 시점

- `session.md`의 `status: complete`로 업데이트하는 시점에 함께 생성
- `status: in_progress`인 상태에서 세션이 끊기면 생성되지 않음 (session.md + git log fallback 사용)

### 형식

```json
{
  "last_command": "expand",
  "target_section": "02-market",
  "stopped_at": "complete",
  "completed_fields": ["stasis", "scheme", "claim", "grounds", "cq_responses", "confidence"],
  "pending_decisions": [],
  "active_research": [],
  "open_questions_count": 0,
  "verification_debt": {
    "challenge_unresolved": 0,
    "stub_suspects": 0,
    "debate_weakened": 0
  },
  "notes_pending": 2,
  "next_action": "/sowhat:settle 02-market",
  "decision_ids": ["D-02-001", "D-02-002", "D-02-003"],
  "next_session_memo": "planning/02-market.md:47 — Grounds G3 미완, Sub-Research 결과 대기 중",
  "saved": "2026-03-26T10:30:00Z"
}
```

### 필드 설명

| 필드 | 설명 |
|------|------|
| `last_command` | 마지막 실행 커맨드 |
| `target_section` | 작업 대상 섹션 |
| `stopped_at` | 중단 지점 (step name 또는 "complete") |
| `completed_fields` | 이 세션에서 완료된 섹션 필드 목록 |
| `pending_decisions` | 미결정 사항 (Decision ID + 설명) |
| `active_research` | 미리뷰 대기 중인 research finding 파일 목록 |
| `open_questions_count` | 현재 섹션의 미해결 Open Questions 수 |
| `verification_debt` | 논증 부채 요약 |
| `notes_pending` | 미처리 노트 수 |
| `next_action` | 다음 권장 커맨드 |
| `decision_ids` | 이 세션에서 생성된 Decision ID 목록 |
| `next_session_memo` | 다음 세션에서 즉시 참조할 파일 경로·라인 번호·연결 지점 (선택, 권장) |
| `saved` | 생성 시각 (ISO 8601) |

### resume에서의 활용

`/sowhat:resume` 실행 시 `logs/handoff.json`이 존재하면:
1. `session.md`보다 **handoff.json을 우선** 참조 (더 구조화된 정보)
2. `pending_decisions`, `active_research`, `verification_debt`를 기반으로 정확한 재개 지점 결정
3. `decision_ids`를 사용하여 이전 세션의 결정 맥락 복원

---

## Rules

- Always overwrite (not append) — session.md is a single-slot checkpoint
- `saved` field MUST use real system time: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- Update step field as workflow progresses through major stages
- Commands that are read-only (progress, map, resume, note) do NOT need session.md saves
- session.md is the primary input for `/sowhat:resume`, handoff.json is supplementary
- handoff.json is generated at command completion, not during execution
