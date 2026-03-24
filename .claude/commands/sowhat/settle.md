---
name: sowhat:settle
description: 섹션 논증을 검증하고 settled로 확정한다. "완료", "settle", "섹션 완료", "논증 확정", "이 섹션 끝냈어", "settled로 바꿔", "완성됐어", "마무리" 등 섹션 전개가 충분히 됐고 완료 선언이 필요할 때 사용. 자동 검증 후 조건 미충족 시 거부.
argument-hint: "<section>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
<objective>
지정 섹션의 Toulmin 구조 완성도를 자동 검증하고 조건 충족 시 status를 settled로 확정한다. GitHub Issue label도 settled로 업데이트한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/settle.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/checkpoints.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the settle workflow end-to-end.
Preserve all workflow gates.
</process>
