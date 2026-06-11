---
name: sowhat:config
description: sowhat 설정을 관리한다. API 키, 기능 토글, 모델 선택 등. "설정", "config", "API 키", "퍼플렉시티", "perplexity", "deep research 설정", "기능 켜기", "기능 끄기" 등 sowhat 프로젝트 설정을 변경할 때 사용.
argument-hint: "(인자 없음 — 대화형 메뉴)"
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
sowhat 설정을 사용자 친화적으로 관리한다. Claude Code 내부 구조(settings.json, 환경변수 등)를 사용자가 몰라도 되도록 추상화한다.
</objective>

## When to Apply

- API 키 설정 (Perplexity, Gemini Deep Research)
- 기능 토글 (deep research on/off)
- 모델 선택

## Anti-triggers

(없음 — 언제든 실행 가능)

## Methodology

1. 현재 설정 로드
2. 변경 항목 핑퐁
3. settings.local.json 업데이트

## Output Format

```
✅ 설정 완료

  항목: {key}
  값: {value}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/references/config-schema.md
@.claude/sowhat-core/workflows/config.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
CRITICAL: Do NOT use the Skill tool. Do NOT delegate to update-config or any other skill. This command handles ALL settings directly using Read/Write/Edit tools. API 키는 .claude/settings.local.json에 직접 Write한다.
Execute the config workflow end-to-end.
</process>
</output>
