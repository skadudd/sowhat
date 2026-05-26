---
name: sowhat:inject
description: 외부 자료를 특정 섹션의 특정 Toulmin 필드에 직접 주입한다. "증거 추가", "자료 주입", "inject", "URL 넣기", "파일 넣기", "폴더 넣기", "데이터 추가", "근거 추가", "backing 추가" 등 사용자가 가진 자료를 논증에 직접 반영할 때 사용.
argument-hint: "<section> [<url>|file:<path>|dir:<path> [--glob <pattern>]]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
외부 자료(URL, 로컬 파일, 폴더, 직접 텍스트)를 분석하고, Tier 판정 후, 사용자가 지정한 섹션의 Toulmin 필드에 직접 주입한다. 폴더 모드(dir:)는 내부 파일을 일괄 분석하여 통합 요약 후 주입한다. 파인딩 파일을 생성하여 출처를 추적한다.
</objective>

## When to Apply

- research finding을 섹션의 Grounds/Backing에 주입할 때
- critic 분석 결과를 내 논증에 통합할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 주입할 finding 없음 (research 먼저)
- invalidated 섹션

## Methodology

1. 주입할 finding 선택
2. 대상 섹션 + 필드 결정
3. source tag 확인
4. 섹션 파일 업데이트

## Output Format

```
✅ Finding 주입 완료

  Finding: #{NNN}
  대상: {section}.{field}
  Source tag: [source:#{NNN}]
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/inject.md
@.claude/sowhat-core/references/source-credibility.md
@.claude/sowhat-core/references/strength-scoring.md
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
Execute the inject workflow end-to-end.
Preserve all workflow gates.
</process>
