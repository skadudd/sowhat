---
name: sowhat:revise
description: settled 섹션의 논증을 수정하고 영향받는 섹션을 자동 점검한다. "수정", "revise", "논증 고치기", "claim 바꾸기", "warrant 수정", "grounds 추가", "open question 해결", "내용 변경" 등 이미 전개된 섹션의 특정 필드를 고치고 싶을 때 사용. 수정 후 오염 범위 자동 탐지.
argument-hint: "<section> [<field>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
<objective>
settled/discussing 섹션의 특정 필드를 대화로 수정하고, 영향받는 오염 섹션을 자동 탐지하여 스코프 challenge를 실행한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/revise.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the revise workflow end-to-end.
Preserve all workflow gates.
</process>
