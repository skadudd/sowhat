---
name: sowhat:expand
description: 특정 섹션을 Toulmin 구조로 bottom-up 전개한다. "섹션 전개", "논거 작성", "섹션 채우기", "claim 작성", "grounds 추가", "논증 구체화" 등 개별 섹션의 주장과 근거를 핑퐁으로 발전시킬 때 사용. draft 또는 needs-revision 상태 섹션에 반드시 사용하라.
argument-hint: "<section> [--force] [--no-advisor]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---
<objective>
지정된 섹션을 Toulmin 9단계 구조(stasis→scheme→claim→grounds→warrant→backing→qualifier→rebuttal→scope)로 핑퐁 전개한다. Sub-Research Semi-Async 패턴으로 근거를 수집한다.
</objective>

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/expand.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/ai-content-boundary.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the expand workflow end-to-end.
Preserve all workflow gates.
</process>
