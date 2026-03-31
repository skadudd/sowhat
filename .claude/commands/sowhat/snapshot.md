---
name: sowhat:snapshot
description: 논증 상태를 의미적 스냅샷으로 캡처하고, 버전 간 논증 진화를 비교한다. "스냅샷", "snapshot", "버전", "version", "논증 이력", "변경 이력", "rollback", "복원", "되돌리기" 등 논증의 의미적 상태를 저장하거나 이전 상태와 비교·복원할 때 사용.
argument-hint: '"label" | list | diff v1 v2 | restore v1 [--section {section}]'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
<objective>
논증의 의미적 상태를 스냅샷으로 캡처하고, 버전 간 논증 진화를 비교하며, 필요 시 이전 상태로 복원한다.
</objective>

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/snapshot.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the snapshot workflow end-to-end.
Preserve all workflow gates.
</process>
