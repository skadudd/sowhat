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
---
<objective>
GitHub Issues의 label/status 변경을 감지하고 로컬 섹션 파일에 반영한다. GitHub이 source-of-truth이며 충돌 시 사용자 확인을 요구한다.
</objective>

<execution_context>
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
