---
name: sowhat:note
description: 작업 중 아이디어를 즉시 메모한다. append로 추가, list로 목록 확인, promote로 섹션 Open Question에 승격. "메모", "note", "아이디어", "나중에", "잊지 말고", "기록" 등 작업 흐름을 끊지 않고 아이디어를 캡처할 때 사용.
argument-hint: "[<text>|list|promote <N> <section>]"
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
작업 흐름을 끊지 않고 아이디어를 즉시 캡처하거나, 누적된 노트를 관리한다.
</objective>

## When to Apply

- 작업 중 메모, 아이디어, 결정 사항을 기록할 때
- 섹션에 Open Question을 추가할 때

## Anti-triggers

(없음 — 언제든 실행 가능)

## Methodology

1. 노트 유형 결정 (general / open-question / decision)
2. 대상 섹션 확인 (선택적)
3. logs/notes.md 또는 섹션 파일에 기록

## Output Format

```
✅ 노트 저장됨

  유형: {type}
  내용: "{note 40자}"
  대상: {section or general}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/note.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the note workflow end-to-end.
</process>
</output>
