---
name: sowhat:autonomous
description: 모든 미완성 섹션을 자동으로 전개·검증·확정한다. "자동", "autonomous", "전부 다 해줘", "자동 전개", "알아서 해줘", "한번에 다 해" 등 AI가 전체 논증을 자동으로 구성할 때 사용. 인간 checkpoint는 critical 이슈 발견 시에만.
argument-hint: "[--skip-debate] [--max-rounds N]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
license: MIT
compatibility: "Claude Code >=2.1.3"
disable-model-invocation: true
---
<objective>
모든 미완성 섹션(draft, needs-revision, discussing)을 자동으로 expand→mini-debate→settle→strength-check 파이프라인으로 처리한다. Human checkpoint는 thesis 방향 변경, critical 이슈, claim broken, 3회 연속 settle 실패 시에만 발동한다. 완료 후 자동으로 전체 challenge를 실행한다.
</objective>

## When to Apply

- 논증 트리 전체를 자동으로 진행시킬 때
- 사람 개입 없이 expand→settle→challenge 루프를 돌릴 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 논증 트리가 없는 초기 상태 (init 먼저)
- 사용자가 직접 핑퐁 참여를 선호하는 경우
- 복잡한 도메인 (AI fabrication 위험 높음)

## Methodology

1. 실행 범위 결정 (전체 / 특정 섹션)
2. expand → settle → challenge 자동 루프
3. 각 단계 결과 로그 기록
4. 완료 후 인간 검토 요청

## Output Format

```
🤖 Autonomous 실행 중

  진행: {N}/{total} 섹션
  현재: /sowhat:expand {section}

완료 시:
  ✅ 자동 실행 완료 — 인간 검토 필요
  [1] 결과 확인 (/sowhat:progress)
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/autonomous.md
@.claude/sowhat-core/references/strength-scoring.md
@.claude/sowhat-core/references/source-credibility.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/walton-schemes.md
@.claude/sowhat-core/references/challenge-algorithm.md
@.claude/sowhat-core/references/checkpoints.md
@.claude/sowhat-core/references/ai-content-boundary.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the autonomous workflow end-to-end.
Preserve all human checkpoints.
Display progress dashboard between each section.
Run post-autonomous challenge on completion.
</process>
