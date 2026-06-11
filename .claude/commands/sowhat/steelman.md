---
name: sowhat:steelman
description: 현재 논증의 최강 반대 논증 트리를 자동 생성한다. "steelman", "반대 논증", "counter-narrative", "최강 반론", "반대 입장", "스트레스 테스트" 등 논증의 근본적 강도를 시험할 때 사용.
argument-hint: "[--section <section>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - Task
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
현재 thesis에 대한 최강 반대 논증 트리(Anti-Thesis + 섹션별 Counter-Argument)를 자동 생성하고, 원본과 비교하여 취약점을 식별한다.
</objective>

## When to Apply

- 논증의 최강 반대 논증을 생성해 스트레스 테스트할 때
- challenge 통과 후 근본적 강도를 확인할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- settled 섹션 없음
- challenge 실행 전 (논리 검증 먼저)
- 단순 반론 찾기 목적

## Methodology

1. 전체 논증 트리 로드
2. 최강 반대 논증 구조 생성
3. 반대 논증 vs 내 논증 비교
4. 취약 지점 식별 및 권고

## Output Format

```
⚔️ Steelman 분석

반대 논증 핵심: "{counter-thesis}"

취약 지점:
1. {section} → {weakness}
2. {section} → {weakness}

권고: /sowhat:revise {section} 우선
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/steelman.md
@.claude/sowhat-core/references/walton-schemes.md
@.claude/sowhat-core/references/strength-scoring.md
@.claude/sowhat-core/references/source-credibility.md
@.claude/sowhat-core/references/challenge-algorithm.md
@.claude/sowhat-core/references/session-protocol.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the steelman workflow end-to-end.
Generate Anti-Thesis, section-level Counter-Arguments, compare original vs counter, and produce STEELMAN-REPORT.md.
</process>
