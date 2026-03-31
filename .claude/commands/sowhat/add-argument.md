---
name: sowhat:add-argument
description: thesis에 새 Key Argument를 추가하고 대응 섹션을 자동 생성한다. "논거 추가", "add-argument", "KA 추가", "새 논거", "새 주장", "argument 추가", "섹션 추가" 등 기존 thesis에 새로운 Key Argument를 더하고 싶을 때 사용. planning 레이어에서만 가능.
argument-hint: "[KA text]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
<objective>
thesis에 새 Key Argument를 추가하고, 대응 섹션 파일·config·GitHub Issue·thesis 체크리스트를 자동 스캐폴딩한다.
</objective>

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/add-argument.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the add-argument workflow end-to-end.
Preserve all workflow gates.
</process>
</output>
