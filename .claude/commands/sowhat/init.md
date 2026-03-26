---
name: sowhat:init
description: sowhat 프로젝트를 초기화하고 Thesis를 핑퐁으로 확정한다. "프로젝트 시작", "새 프로젝트", "초기화", "thesis 설정", "기획 시작" 등 새 논증 작업을 시작할 때 사용. 아이디어나 문제의식이 있고 구조화된 논증을 만들고 싶을 때 반드시 이 커맨드부터 시작하라. --from 옵션으로 기존 콘텐츠를 분석 대상으로 삼을 수 있고, --research 옵션으로 자료를 먼저 모아 근거 기반으로 thesis를 도출할 수 있다.
argument-hint: "[--from <url|file>] [--research <url|file:path|dir:path> ...]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - Task
---
<objective>
sowhat 프로젝트를 초기화한다. 세 가지 모드: idea 모드(기본)는 아이디어에서 top-down으로, content-critique 모드(--from)는 외부 콘텐츠 분석으로, research 모드(--research)는 자료를 먼저 수집·분석하여 bottom-up으로 thesis를 도출한다.
</objective>

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/init.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/source-credibility.md
@.claude/sowhat-core/references/research-lifecycle.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the init workflow end-to-end.
Preserve all workflow gates.
</process>
