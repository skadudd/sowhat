---
name: sowhat:progress
description: 현재 프로젝트 상태를 대시보드로 보여주고 다음 액션을 안내한다. "진행 상황", "현재 상태", "어디까지 했어", "다음 뭐 해", "progress", "현황 확인", "상태 보기", "얼마나 됐어" 등 프로젝트 전체 현황이 궁금할 때 사용.
argument-hint: "(no arguments)"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
config.json과 모든 섹션 파일을 읽어 전체 진행 상황 대시보드를 출력하고, 현재 상태에 맞는 다음 액션을 안내한다.
</objective>

## When to Apply

- 현재 프로젝트 진행 상황을 확인할 때
- 어디까지 했는지 파악할 때

## Anti-triggers

(없음 — 언제든 실행 가능)

## Methodology

1. config.json + 모든 섹션 로드
2. 상태별 섹션 집계
3. 완료율 + 다음 액션 표시

## Output Format

```
📈 진행 현황

  완료: {N}개 settled | {M}개 discussing | {K}개 draft

  Layer: {layer}
  완료율: ██████░░░░ {N}%

다음 권장: /sowhat:expand {next_section}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/references/ux-detection-boundary.md
@.claude/sowhat-core/workflows/progress.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/strength-scoring.md
@.claude/sowhat-core/references/source-credibility.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the progress workflow end-to-end.
Preserve all workflow gates.
</process>
