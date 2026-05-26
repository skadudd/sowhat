---
name: sowhat:debate
description: 3-에이전트 변증법 구조(Con/Pro/Research)로 섹션 논증을 공격·방어한다. "debate", "논증 강화", "반론 테스트", "약점 검증", "섹션 논쟁", "논거 테스트" 등 특정 섹션의 논리적 강도를 높이거나 약점을 발견하고 싶을 때 사용. Thesis가 무너질 수 있으며 그것이 올바른 결과일 수 있다.
argument-hint: "[section|--global] [--rounds N|--until-stable|--until-broken] [--stance persuade|consensus]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
Con/Pro/Research 세 에이전트를 Task로 병렬 스폰하여 지정 섹션 논증을 공격·방어한다. 라운드 반복으로 논증 강도를 높이거나 치명적 약점을 발견한다.
</objective>

## When to Apply

- 특정 섹션의 논증을 Pro/Con 대립으로 심화 검증할 때
- challenge 통과 후 추가 강화가 필요할 때
- 외부 콘텐츠 비교 분석이 필요할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- settled 섹션이 없는 상태
- challenge 실행 전 (challenge가 선행해야 의미 있음)
- 단순 정보 확인 목적

## Methodology

1. 모드 결정 (thesis-argument / content-critique)
2. stance 확인 (기본: critique — 양측 동등)
3. Pro/Con 에이전트 스폰
4. N라운드 논쟁 진행
5. Research-Agent 근거 수집 (필요 시)
6. 최종 판정 및 섹션 업데이트 권고

## Output Format

```
## Debate 결과 — {N}-{section}

Round 1/3:
✅ Pro 통과 | Con 공격: {summary}

Round 2/3:
✅ Round 2 pass

Round 3/3:
⚠️ Con 공격 유효: {issue}

----------------------------------------
판정: {outcome}
권고: /sowhat:revise {section} — {field} 강화
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/debate.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/walton-schemes.md
@.claude/sowhat-core/references/walton-pitfalls.md
@.claude/sowhat-core/references/checkpoints.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the debate workflow end-to-end.
Preserve all workflow gates.
</process>
