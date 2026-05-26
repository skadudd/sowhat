---
name: sowhat:sync
description: GitHub 변경사항을 감지하고 로컬에 반영한다. "sync", "동기화", "GitHub 반영", "변경사항 가져오기", "label 업데이트" 등 GitHub에서 직접 이슈를 수정했거나 팀원이 변경했을 때 로컬과 맞추기 위해 사용. GitHub이 source-of-truth — 충돌 시 확인 요구.
argument-hint: "(no arguments)"
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
GitHub Issues의 label/status 변경을 감지하고 로컬 섹션 파일에 반영한다. GitHub이 source-of-truth이며 충돌 시 사용자 확인을 요구한다.
</objective>

## When to Apply

- 빌드 산출물을 `.claude/`와 동기화할 때
- npm publish 전 빌드 확인

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 빌드 시스템 없는 환경

## Methodology

1. scripts/build.js 실행
2. `.claude/` → 루트 `commands/` 동기화 확인
3. 불일치 보고

## Output Format

```
✅ 동기화 완료

  업데이트된 파일: {N}개
  스킵: {M}개
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/sync.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the sync workflow end-to-end.
Preserve all workflow gates.
</process>
