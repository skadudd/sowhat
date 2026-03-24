---
name: sowhat:spec
description: 명세 레이어 섹션을 핑퐁으로 전개한다. "명세", "spec", "스펙 작성", "기능 요구사항", "데이터 모델", "API 설계", "엣지 케이스", "인수 기준", "actors 정의" 등 finalize-planning 이후 명세 섹션(04~09)을 구체화할 때 사용. 기획 내용과의 정합성 유지.
argument-hint: "<section-name> [--reset]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
<objective>
지정된 명세 섹션(04~09)을 섹션별 가이드라인에 따라 핑퐁 방식으로 전개한다. 기획 내용과의 정합성을 유지하며 구체적이고 검증 가능한 형태로 구조화한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/spec.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the spec workflow end-to-end.
Preserve all workflow gates.
</process>
