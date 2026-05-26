---
name: sowhat:snapshot
description: 논증 상태를 의미적 스냅샷으로 캡처하고, 버전 간 논증 진화를 비교한다. "스냅샷", "snapshot", "버전", "version", "논증 이력", "변경 이력", "rollback", "복원", "되돌리기" 등 논증의 의미적 상태를 저장하거나 이전 상태와 비교·복원할 때 사용.
argument-hint: '"label" | list | diff v1 v2 | restore v1 [--section {section}]'
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
논증의 의미적 상태를 스냅샷으로 캡처하고, 버전 간 논증 진화를 비교하며, 필요 시 이전 상태로 복원한다.
</objective>

## When to Apply

- 현재 논증 상태를 스냅샷으로 저장할 때
- 실험적 변경 전 복구 지점 확보

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 변경사항 없는 상태 (git clean)

## Methodology

1. 현재 상태 git tag/stash
2. 스냅샷 메타데이터 기록
3. 복구 방법 안내

## Output Format

```
✅ 스냅샷 저장됨

  이름: {snapshot-name}
  SHA: {git-sha}
  복구: /sowhat:snapshot restore {name}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/snapshot.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/walton-schemes.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the snapshot workflow end-to-end.
Preserve all workflow gates.
</process>
