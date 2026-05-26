---
name: sowhat:branch
description: 섹션의 대안적 논증 경로를 생성하고 비교한다. "분기", "branch", "대안", "비교", "다른 방향", "A vs B", "두 가지 방향" 등 하나의 섹션에서 여러 논증 방향을 탐색하고 싶을 때 사용.
argument-hint: "[<section>] | [compare <section>] | [merge <section> <branch>] | [delete <section> <branch>]"
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
지정된 섹션에서 대안적 논증 경로(branch)를 생성·비교·병합·삭제한다. 현재 논증을 보존하면서 다른 방향을 탐색할 수 있게 한다.
</objective>

## When to Apply

- debate 브랜치에서 논증 변형을 실험할 때
- 복수 논증 방향을 병렬로 탐색할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- main 브랜치에서 구조 변경 목적 (branch 전략 이해 필요)

## Methodology

1. 브랜치 유형 결정
2. git branch 생성
3. 논증 변형 작업
4. 비교 후 merge 또는 abandon

## Output Format

```
✅ 브랜치 생성

  브랜치: {branch-name}
  기반: {base-branch}
  목적: {purpose}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/branch.md
@.claude/sowhat-core/references/strength-scoring.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the branch workflow end-to-end.
Preserve all workflow gates and checkpoints.
</process>
