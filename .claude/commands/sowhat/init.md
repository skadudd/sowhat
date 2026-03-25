---
name: sowhat:init
description: sowhat 프로젝트를 초기화하고 Thesis를 핑퐁으로 확정한다. "프로젝트 시작", "새 프로젝트", "초기화", "thesis 설정", "기획 시작" 등 새 논증 작업을 시작할 때 사용. 아이디어나 문제의식이 있고 구조화된 논증을 만들고 싶을 때 반드시 이 커맨드부터 시작하라. --from 옵션으로 기존 콘텐츠를 분석 대상으로 삼을 수 있다.
argument-hint: "[--from <url|file>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - WebFetch
---
<objective>
sowhat 프로젝트를 초기화한다. idea 모드(기본)는 사용자의 아이디어에서 시작하고, content-critique 모드(--from)는 외부 콘텐츠를 분석 대상으로 삼아 사용자가 입장을 세운다. IBIS Issue 프레이밍과 SCQ 핑퐁으로 Thesis를 확정하고, 디렉터리 구조와 config.json을 생성한 뒤 GitHub에 연결한다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/init.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the init workflow end-to-end.
Preserve all workflow gates.
</process>
