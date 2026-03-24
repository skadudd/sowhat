---
name: sowhat:debate
description: 3-에이전트 변증법 구조(Con/Pro/Research)로 섹션 논증을 공격·방어한다. "debate", "논증 강화", "반론 테스트", "약점 검증", "섹션 논쟁", "논거 테스트" 등 특정 섹션의 논리적 강도를 높이거나 약점을 발견하고 싶을 때 사용. Thesis가 무너질 수 있으며 그것이 올바른 결과일 수 있다.
argument-hint: "[section|--global] [--rounds N|--until-stable|--until-broken]"
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
Con/Pro/Research 세 에이전트를 Task로 병렬 스폰하여 지정 섹션 논증을 공격·방어한다. 라운드 반복으로 논증 강도를 높이거나 치명적 약점을 발견한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/debate.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/checkpoints.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the debate workflow end-to-end.
Preserve all workflow gates.
</process>
