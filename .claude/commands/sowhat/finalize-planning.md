---
name: sowhat:finalize-planning
description: 기획 레이어를 완료하고 명세 레이어(04~09 섹션)를 자동 생성한다. "기획 완료", "명세 시작", "스펙 생성", "planning 완료", "finalize-planning" 등 모든 기획 섹션이 settled 된 후 명세 작업으로 전환할 때 사용. challenge 실행 후 6개 명세 섹션 draft 자동 생성 + GitHub Issues 생성.
argument-hint: "[--force]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---
<objective>
모든 기획 섹션(01~03)이 settled인지 확인하고 challenge를 실행한 뒤, 6개 명세 섹션(04~09) draft 파일과 GitHub Issues를 자동 생성하여 layer를 spec으로 전환한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/finalize-planning.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the finalize-planning workflow end-to-end.
Preserve all workflow gates.
</process>
