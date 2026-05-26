---
name: sowhat:critic
description: 대상 콘텐츠의 논증 구조를 5차원으로 분석하고 논리적 약점을 식별한다. "비평", "critic", "약점 분석", "대상 분석", "콘텐츠 비평", "논증 약점", "대상 비판" 등 content-critique 모드에서 대상 콘텐츠의 논리적 결함을 체계적으로 분석할 때 사용. init --from으로 시작한 프로젝트에서만 사용 가능.
argument-hint: "[--inject]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
대상 콘텐츠의 Walton 논증 구조를 5차원(완전성/CQ 응답 품질/근거 품질/Confidence 적정성/CQ 미응답 커버리지)으로 비평하고, critic/CRITIQUE-REPORT.md를 생성한 뒤, 사용자 섹션에 약점 주입을 제안한다.
</objective>

## When to Apply

- 외부 URL/문서의 논증 구조를 5차원으로 분석할 때
- 경쟁 콘텐츠의 약점을 내 논증에 활용할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 사용자 자신의 논증 비평 목적 (self-critic 사용)
- 분석할 외부 URL/콘텐츠 없음
- 단순 요약 목적

## Methodology

1. 대상 URL/콘텐츠 로드
2. Walton 구조 추출
3. sowhat-critic-agent 스폰 (5차원 분석)
4. 약점 리포트 출력
5. 주입 가능 섹션 안내

## Output Format

```
🔍 Critic 분석 결과 — {URL/title}

| # | 약점 | 심각도 | 차원 | 주입 가능 섹션 |
|---|---|---|---|---|
| W1 | {description} | critical | scheme CQ | 02.SchemeCQ |

----------------------------------------
다음 액션:

[1] 약점 주입 (/sowhat:inject)
[2] 다른 URL 분석
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/critic.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/source-credibility.md
@.claude/sowhat-core/references/challenge-algorithm.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the critic workflow end-to-end.
Preserve all workflow gates.
</process>
