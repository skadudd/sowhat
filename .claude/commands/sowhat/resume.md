---
name: sowhat:resume
description: 중단된 작업 세션을 재개하고 컨텍스트를 복원한다. "계속", "이어서", "세션 재개", "어디까지 했지", "작업 복원", "resume" 등 이전 작업을 이어서 하고 싶을 때 사용. session.md, git log, 미완료 섹션, 활성 debate 브랜치를 자동 감지해 재진입 경로를 제시한다.
argument-hint: "(no arguments)"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
logs/session.md, git log, 섹션 상태, debate 브랜치를 분석하여 중단된 작업 컨텍스트를 복원하고 다음 실행할 커맨드를 제시한다.
</objective>

## When to Apply

- 이전 세션에서 중단된 작업을 이어서 할 때
- 컨텍스트를 잃어버리고 어디서부터 시작할지 모를 때

## Anti-triggers

(없음 — 언제든 실행 가능)

## Methodology

1. logs/session.md 로드
2. logs/handoff.json 로드 (존재 시 우선)
3. git log로 최근 변경 확인
4. 재개 지점 결정 + 다음 액션 안내

## Output Format

```
🔄 세션 재개

  마지막 작업: {command} — {section}
  중단 지점: {step}

----------------------------------------
다음 액션:

[1] {last_action} 이어서
[2] 전체 현황 확인 (/sowhat:progress)
[3] 처음부터 다시 계획
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/resume.md
@.claude/sowhat-core/references/session-protocol.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the resume workflow end-to-end.
Preserve all workflow gates.
</process>
