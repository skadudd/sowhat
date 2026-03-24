---
name: sowhat:challenge
description: 전체 논증 트리를 7단계 논리 검증으로 공격한다(Toulmin + Walton + Pragma-Dialectics). "전체 검증", "논리 점검", "challenge", "논증 공격", "최종 검토", "품질 검사" 등 모든 섹션을 settled하기 전이나 finalize 전 최종 검증 시 반드시 사용하라. 부분 공격 없음 — 항상 전체 트리 대상.
argument-hint: "[--force]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---
<objective>
전체 논증 트리를 7단계(MECE→Toulmin→Walton→Pragma→Qualify→Scope→Synthesis) 검증으로 공격한다. 각 스테이지를 sowhat-challenge-agent Task로 순차 실행한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/challenge.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/challenge-algorithm.md
@.claude/sowhat-core/references/checkpoints.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the challenge workflow end-to-end.
Preserve all workflow gates.
</process>
