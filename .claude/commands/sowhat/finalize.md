---
name: sowhat:finalize
description: 명세 레이어를 최종 검증하고 종결한다. "완료", "finalize", "마무리", "구현 시작 준비", "최종 검증" 등 모든 명세 섹션이 settled 된 후 실행. challenge 자동 실행 후 layer를 finalized로 전환. 파일 생성은 하지 않으며 산출물은 /sowhat:draft로 생성한다.
argument-hint: "[--force]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
license: MIT
compatibility: "Claude Code >=2.1.3"
disable-model-invocation: true
---
<objective>
모든 명세 섹션(04~09)이 settled인지 확인하고 최종 challenge를 실행한 뒤 layer를 finalized로 전환한다. 파일은 생성하지 않는다.
</objective>

## When to Apply

- 명세 레이어(04~09 섹션)가 모두 settled된 상태에서 프로젝트를 종결할 때
- spec layer를 finalized로 전환할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- planning 레이어 (finalize-planning 먼저)
- 이미 finalized 상태인 프로젝트
- 명세 섹션(04~09) 중 미완성(unsettled) 섹션 존재

## Methodology

1. 미리보기 게이트 (예상 작업 확인 후 승인)
2. Challenge 자동 실행 (전체 트리 검증)
3. Argument Log 기록
4. config.json layer → finalized 업데이트
5. git commit

## Output Format

```
✅ 명세 레이어 종결 완료

  layer: finalized

----------------------------------------
다음 액션:

[1] 산출물 생성 (/sowhat:draft)
[2] 전체 현황 확인 (/sowhat:map)
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/finalize.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/walton-schemes.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the finalize workflow end-to-end.
Preserve all workflow gates.
</process>
