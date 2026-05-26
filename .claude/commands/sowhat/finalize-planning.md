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
license: MIT
compatibility: "Claude Code >=2.1.3"
disable-model-invocation: true
---
<objective>
모든 기획 섹션(01~03)이 settled인지 확인하고 challenge를 실행한 뒤, 6개 명세 섹션(04~09) draft 파일과 GitHub Issues를 자동 생성하여 layer를 spec으로 전환한다.
</objective>

## When to Apply

- 기획 섹션(01~03)이 모두 settled된 상태에서 명세 레이어로 전환할 때
- planning → spec layer 전이가 필요할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- unsettled 기획 섹션 존재
- 이미 spec/finalized 레이어인 상태

## Methodology

1. 미리보기 게이트
2. Challenge 자동 실행 (기획 트리 전체)
3. 명세 섹션 초안 6개(04~09) 자동 생성
4. config.json layer → spec 업데이트
5. git commit

## Output Format

```
✅ 기획 레이어 종결 완료

  layer: spec
  명세 초안: 04~09 섹션 6개 생성됨

----------------------------------------
다음 액션:

[1] 첫 명세 섹션 전개 (/sowhat:spec 04-actors)
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
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
