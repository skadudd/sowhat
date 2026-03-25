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
---
<objective>
대상 콘텐츠의 Toulmin 논증 구조를 5차원(완전성/Warrant 유효성/근거 품질/Qualifier 적정성/Rebuttal 커버리지)으로 비평하고, critic/CRITIQUE-REPORT.md를 생성한 뒤, 사용자 섹션에 약점 주입을 제안한다.
</objective>

<execution_context>
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
