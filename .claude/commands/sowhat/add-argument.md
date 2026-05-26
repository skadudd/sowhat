---
name: sowhat:add-argument
description: thesis에 새 Key Argument를 추가하고 대응 섹션을 자동 생성한다. "논거 추가", "add-argument", "KA 추가", "새 논거", "새 주장", "argument 추가", "섹션 추가" 등 기존 thesis에 새로운 Key Argument를 더하고 싶을 때 사용. planning 레이어에서만 가능.
argument-hint: "[KA text]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
thesis에 새 Key Argument를 추가하고, 대응 섹션 파일·config·GitHub Issue·thesis 체크리스트를 자동 스캐폴딩한다.
</objective>

## When to Apply

- 기존 논증 트리에 새 Key Argument를 추가할 때
- thesis Answer를 보강하는 새 섹션이 필요할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- settled 논증 트리에서 구조 변경 (challenge 먼저)
- 기존 섹션 수정 목적 (revise 사용)

## Methodology

1. 새 Key Argument 정의
2. 섹션 번호 결정
3. 섹션 파일 생성 (draft 상태)
4. thesis Key Arguments 업데이트
5. expand로 이어서 전개

## Output Format

```
✅ 새 섹션 추가됨

  섹션: {N}-{section-name}
  상태: draft
  KA 추가: "{key_argument}"

다음: /sowhat:expand {N}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/add-argument.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the add-argument workflow end-to-end.
Preserve all workflow gates.
</process>
</output>
