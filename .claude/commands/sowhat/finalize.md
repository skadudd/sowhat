---
name: sowhat:finalize
description: 명세 레이어를 완료하고 GSD 구현용 export를 생성한다. "완료", "export", "finalize", "GSD로 넘기기", "구현 시작 준비", "최종 산출물" 등 모든 명세 섹션이 settled 된 후 구현 단계로 넘어갈 때만 사용. challenge 자동 실행 후 PROJECT.md + REQUIREMENTS.md 생성.
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
모든 명세 섹션(04~09)이 settled인지 확인하고 최종 challenge를 실행한 뒤, GSD 구현용 PROJECT.md와 REQUIREMENTS.md를 생성하여 layer를 finalized로 전환한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/finalize.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the finalize workflow end-to-end.
Preserve all workflow gates.
</process>
