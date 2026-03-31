---
name: sowhat:series
description: 시리즈 콘텐츠를 관리한다. 에피소드 간 맥락 연결, 공유 리서치, 용어 일관성, 서사 흐름을 추적한다. "시리즈", "series", "에피소드", "episode", "연재", "시리즈 관리", "맥락 연결", "시리즈 생성", "시리즈 목록" 등 크로스 프로젝트 시리즈 콘텐츠를 관리할 때 사용.
argument-hint: "<sub-command> [name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
<objective>
시리즈 콘텐츠를 생성·관리한다. 에피소드 간 맥락 연결, 공유 리서치, 용어 일관성, 서사 흐름을 추적한다.

서브커맨드:
- `/sowhat:series create {name}` — 시리즈 생성
- `/sowhat:series list` — 시리즈 목록
- `/sowhat:series add {series-name}` — 현재 프로젝트를 시리즈에 에피소드로 등록
- `/sowhat:series digest [episode]` — 에피소드 다이제스트 생성/재생성
- `/sowhat:series arc [series-name]` — 서사 흐름 보기/편집
- `/sowhat:series terms [series-name]` — 용어 사전 보기/편집
- `/sowhat:series check [series-name]` — 크로스 에피소드 일관성 검사
- `/sowhat:series status [series-name]` — 시리즈 현황 대시보드
</objective>

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/series.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the series workflow end-to-end.
Preserve all workflow gates.
</process>
