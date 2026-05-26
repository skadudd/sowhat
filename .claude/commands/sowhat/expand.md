---
name: sowhat:expand
description: 특정 섹션을 Walton scheme 기반으로 bottom-up 전개한다. "섹션 전개", "논거 작성", "섹션 채우기", "claim 작성", "grounds 추가", "논증 구체화" 등 개별 섹션의 주장과 근거를 핑퐁으로 발전시킬 때 사용. draft 또는 needs-revision 상태 섹션에 반드시 사용하라.
argument-hint: "<section> [--force] [--no-advisor]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
license: MIT
compatibility: "Claude Code >=2.1.3"
---
<objective>
지정된 섹션을 Walton scheme 기반 구조(stasis→scheme 선택→claim→grounds→CQ 응답→confidence→scope)로 핑퐁 전개한다. Sub-Research Semi-Async 패턴으로 근거를 수집한다.
</objective>

## When to Apply

- 기획/명세 섹션을 처음 전개하거나 needs-revision 상태에서 재작업할 때
- Walton 구조(Claim/Grounds/scheme/CQ Responses/Confidence)를 구축할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- 이미 settled된 섹션 (challenge 또는 revise를 먼저 실행)
- thesis(00-thesis.md)가 없는 상태
- invalidated 상태의 섹션

## Methodology

1. 섹션 파일 로드 또는 신규 생성
2. Stasis 유형 결정 (Step 1.5)
3. Argument Scheme 선택 (Step 2)
4. Claim Tier 설정 (Step 2.5)
5. Claim 핑퐁 (Step 3)
6. Grounds 수집 (Step 4)
7. CQ 응답 작성 (Step 5)
8. Confidence Band 확정 (Step 6)
9. 섹션 status → discussing 전환

## Output Format

각 스텝마다 컨텍스트 배너 + 질문 + 선택지 3-블록 패턴.
최종 완료:

```
✅ {N}-{section} 전개 완료

  Claim: "{주장 40자}"
  Grounds: {N}개 | CQ 응답: ✅ | Confidence: {level}

----------------------------------------
다음 액션:

[1] 섹션 확정 (/sowhat:settle {section})
[2] 논리 검증 (/sowhat:challenge {section})
[3] 다음 섹션 전개 (/sowhat:expand {next})
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/expand.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/ai-content-boundary.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the expand workflow end-to-end.
Preserve all workflow gates.
</process>
