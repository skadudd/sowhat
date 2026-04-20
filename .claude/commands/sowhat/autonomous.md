---
name: sowhat:autonomous
description: 모든 미완성 섹션을 자동으로 전개·검증·확정한다. "자동", "autonomous", "전부 다 해줘", "자동 전개", "알아서 해줘", "한번에 다 해" 등 AI가 전체 논증을 자동으로 구성할 때 사용. 인간 checkpoint는 critical 이슈 발견 시에만.
argument-hint: "[--skip-debate] [--max-rounds N]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
---
<objective>
모든 미완성 섹션(draft, needs-revision, discussing)을 자동으로 expand→mini-debate→settle→strength-check 파이프라인으로 처리한다. Human checkpoint는 thesis 방향 변경, critical 이슈, claim broken, 3회 연속 settle 실패 시에만 발동한다. 완료 후 자동으로 전체 challenge를 실행한다.
</objective>

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/autonomous.md
@.claude/sowhat-core/references/strength-scoring.md
@.claude/sowhat-core/references/source-credibility.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/challenge-algorithm.md
@.claude/sowhat-core/references/checkpoints.md
@.claude/sowhat-core/references/fabrication-prevention.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the autonomous workflow end-to-end.
Preserve all human checkpoints.
Display progress dashboard between each section.
Run post-autonomous challenge on completion.
</process>
