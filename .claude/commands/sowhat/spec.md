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
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
지정된 명세 섹션(04~09)을 섹션별 가이드라인에 따라 핑퐁 방식으로 전개한다. 기획 내용과의 정합성을 유지하며 구체적이고 검증 가능한 형태로 구조화한다.
</objective>

## When to Apply

- 명세 레이어 섹션(04~09)을 전개할 때
- finalize-planning 이후 명세 초안을 구체화할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- planning 레이어 미완성 상태
- finalize-planning 미실행

## Methodology

1. 대상 명세 섹션 결정
2. 기획 섹션에서 내용 추출
3. 명세 구조로 변환 (actors/FR/data-model 등)
4. 핑퐁으로 구체화
5. settled 전환 (settle 커맨드로)

## Output Format

```
> [spec > {section_name}]

{명세 구조 핑퐁}

✅ {section} 명세 초안 완성
다음: /sowhat:settle {section}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/spec.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/walton-schemes.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the spec workflow end-to-end.
Preserve all workflow gates.
</process>
