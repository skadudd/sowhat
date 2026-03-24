---
name: sowhat:map
description: 논증 흐름을 Mermaid 다이어그램으로 즉시 시각화한다. "논증 맵", "시각화", "map", "다이어그램", "구조 보기", "흐름 보여줘", "어떻게 연결돼", "트리 그려줘" 등 현재 논증 구조를 한눈에 확인하고 싶을 때 사용. 전체 트리 또는 특정 섹션 상세 맵 선택 가능.
argument-hint: "[section] [--save]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---
<objective>
config.json과 모든 섹션 파일을 읽어 논증 트리의 Mermaid 다이어그램을 인라인으로 즉시 출력한다. 파일로 저장하지 않는다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/map.md
@.claude/sowhat-core/references/session-protocol.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the map workflow end-to-end.
Preserve all workflow gates.
</process>
