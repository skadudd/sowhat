---
name: sowhat:self-critic
description: 사용자 자신의 논증을 5차원으로 비평한다. "내 논증 비평해줘", "self-critic", "내 주장 약점", "논증 검토", "내 섹션 점검" 등 자신의 논증 구조를 객관적으로 검토하고 싶을 때 사용. challenge와 달리 논리 공격이 아닌 구조적 약점 식별과 개선 방향 제시에 집중.
argument-hint: "[section] [--dimension {1-5|all}]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
지정된 섹션의 Walton 논증 구조를 5차원(완전성, CQ 응답 품질, 근거 품질, Confidence 적정성, CQ 미응답 커버리지)으로 비평하고 개선 방향을 제시한다.
</objective>

## When to Apply

- 사용자 자신의 섹션 논증 구조를 5차원으로 점검할 때
- challenge 통과 후 구조적 약점을 추가 진단할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 외부 콘텐츠 비평 목적 (critic 사용)
- settled 섹션 없음

## Methodology

1. 대상 섹션 선택
2. thesis + 섹션 파일 로드
3. sowhat-self-critic-agent 스폰 (5차원 분석)
4. 약점 + 강점 리포트 출력
5. 후속 액션 안내

## Output Format

```
🪞 Self-Critic 분석 결과 — {section_name}

| # | 약점 | 심각도 | 차원 | 개선 방향 |
|---|---|---|---|---|
| W1 | {description} | major | scheme CQ | {action} |

----------------------------------------
다음 액션:

[1] 약점 수정 (/sowhat:revise {section})
[2] 근거 강화 (/sowhat:expand {section})
[3] debate로 심화 검증
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/self-critic.md
@.claude/sowhat-core/references/session-protocol.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D.
Execute the self-critic workflow end-to-end.
</process>
