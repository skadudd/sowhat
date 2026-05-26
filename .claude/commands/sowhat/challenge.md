---
name: sowhat:challenge
description: 논증 트리를 8단계(Stage 0 사실검증 + Stage 1-7 논리검증)로 공격한다. Stage 0은 Grounds의 수치·사실·사례를 1차 출처 대조로 검증하고, Stage 1-7은 Walton Argument Schemes 논리 검증을 수행한다. 섹션 지정 시 해당 섹션만 부분 검증, 미지정 시 전체 트리 검증. "전체 검증", "논리 점검", "challenge", "논증 공격", "최종 검토", "품질 검사", "팩트체크" 등 settled 전이나 finalize 전 최종 검증 시 사용하라.
argument-hint: "[<section>] [--force]"
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
전체 논증 트리를 8단계(Stage 0 사실검증 + Stage 1-7 논리검증)로 공격한다. Stage 0은 sowhat-research-agent(WebSearch/WebFetch)로, Stage 1-7은 sowhat-challenge-agent로 순차 실행한다.
</objective>

## When to Apply

- settled/discussing 섹션의 논리 구조를 검증할 때
- finalize/finalize-planning 전 최종 검증
- 특정 섹션의 집중 공격이 필요할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- settled 섹션이 0개인 상태
- draft 상태만 존재하는 논증 트리
- 논증 구조 없이 단순 사실 확인 목적

## Methodology

1. 전체/부분 모드 결정
2. 모든 섹션 파일 1회 로드
3. Stage 0: Grounds 사실 검증 (research-agent 스폰)
4. Stage 1-7: 논리 검증 (challenge-agent 스폰)
5. 인간 반박/수용 결정
6. 역전파 처리 (필요 시)
7. 통과/실패 리포트 출력

## Output Format

```
✅ Challenge 통과

  [Factual]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Scheme]    {N}건 발견 / {M}건 철회 / {K}건 수용
  [Warrant]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Qualifier] {N}건 발견 / {M}건 철회 / {K}건 수용

  모든 섹션 검증 완료
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/challenge.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/challenge-algorithm.md
@.claude/sowhat-core/references/checkpoints.md
@.claude/sowhat-core/references/source-credibility.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the challenge workflow end-to-end.
Preserve all workflow gates.
</process>
