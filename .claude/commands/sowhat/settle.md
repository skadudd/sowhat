---
name: sowhat:settle
description: 섹션 논증을 검증하고 settled로 확정한다. "완료", "settle", "섹션 완료", "논증 확정", "이 섹션 끝냈어", "settled로 바꿔", "완성됐어", "마무리" 등 섹션 전개가 충분히 됐고 완료 선언이 필요할 때 사용. 자동 검증 후 조건 미충족 시 거부.
argument-hint: "<section>"
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
지정 섹션의 Walton 구조 완성도를 자동 검증하고 조건 충족 시 status를 settled로 확정한다. GitHub Issue label도 settled로 업데이트한다.
</objective>

## When to Apply

- Walton 구조가 완성된 섹션을 확정할 때
- expand 핑퐁이 완료되어 모든 필드가 채워진 상태

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- draft 상태 섹션 (expand 먼저)
- invalidated 상태 섹션
- 이미 settled된 섹션
- Open Questions가 미해결된 상태
- Filler stub이 탐지된 섹션

## Methodology

1. 대상 섹션 및 상태 확인
2. Toulmin 완전성 자동 검증 (Claim/Grounds/Warrant/Qualifier/Rebuttal/scheme)
3. Filler stub 탐지
4. Source tag parser 실행
5. Cross-section regression 확인
6. Claim Tier 게이트 (Tier-A: T1/T2 출처 필수)
7. verify-argument 체크포인트 → 인간 승인
8. status → settled 전환 + git commit

## Output Format

```
**[verify-argument]** {N}-{section}

> 자동 검증 결과:
> ✅ Claim ↔ Thesis 정합성
> ✅ Grounds: {N}개
> ✅ Warrant: 명시적
> ✅ Qualifier: {level}
> ✅ Rebuttal 처리됨

[1] 승인 — settle 진행
[2] 수정 필요 — 어떤 부분?
[3] 건너뛰기
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/settle.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
@.claude/sowhat-core/references/checkpoints.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the settle workflow end-to-end.
Preserve all workflow gates.
</process>
