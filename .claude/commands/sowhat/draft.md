---
name: sowhat:draft
description: settled 섹션들을 종합해 인간이 읽는 문서를 생성한다. "문서 만들어", "draft", "PRD 생성", "제안서 작성", "보고서", "문서화", "정리해서 써줘", "executive summary", "투자 제안서" 등 논증 결과를 외부 공유용 문서로 변환할 때 사용. 형식과 독자 맞춤 선택 지원.
argument-hint: "[--format <format>] [--output <all|document|prd|argument-map>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
<objective>
settled 섹션들의 논증 구조를 종합하여 지정한 형식(PRD/proposal/report/executive-summary)과 독자에 맞는 외부 공유용 문서를 생성한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/draft.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the draft workflow end-to-end.
Preserve all workflow gates.
</process>
