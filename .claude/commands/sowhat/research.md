---
name: sowhat:research
description: 외부 리서치를 수행하고 결과를 섹션에 반영한다. "리서치", "데이터 조사", "근거 수집", "URL 분석", "시장 조사", "외부 자료 찾기", "open question 해결" 등 논증에 필요한 외부 근거나 데이터가 필요할 때 사용. URL 직접 분석, 토픽 검색, 자율 리서치 모드 지원.
argument-hint: "[<url>|<topic>|review|review <section>|accept <N>|reject <N>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
---
<objective>
URL 분석, 토픽 검색, 자율 리서치 세 가지 모드로 외부 근거를 수집하고 research/ 파인딩 파일로 저장한다. 결정은 항상 인간이 accept/reject한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/research.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the research workflow end-to-end.
Preserve all workflow gates.
</process>
