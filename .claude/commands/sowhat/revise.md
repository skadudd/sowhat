---
name: sowhat:revise
description: settled 섹션의 논증을 수정하고 영향받는 섹션을 자동 점검한다. "수정", "revise", "논증 고치기", "claim 바꾸기", "warrant 수정", "grounds 추가", "open question 해결", "내용 변경" 등 이미 전개된 섹션의 특정 필드를 고치고 싶을 때 사용. 수정 후 오염 범위 자동 탐지.
argument-hint: "<section> [<field>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
license: MIT
compatibility: "Claude Code >=2.1.3"
disable-model-invocation: true
---
<objective>
settled/discussing 섹션의 특정 필드를 대화로 수정하고, 영향받는 오염 섹션을 자동 탐지하여 스코프 challenge를 실행한다.
</objective>

## When to Apply

- challenge/debate에서 needs-revision으로 플래그된 섹션 수정
- 사실 오류, Warrant 문제, Qualifier 과대주장 수정 시
- 섹션의 특정 Toulmin 필드만 업데이트할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- settled 상태 섹션 (challenge 먼저 — 자동 needs-revision 전환)
- 전체 구조 재설계 목적 (expand로 재시작)
- 논증 목적 없는 단순 텍스트 편집

## Methodology

1. 대상 섹션과 수정 필드 확인
2. 현재 섹션 내용 로드
3. 수정 사항 핑퐁 (필드별 점진적 수정)
4. source tag 검증
5. 섹션 status → discussing 전환 + 저장

## Output Format

```
✅ {N}-{section} 수정 완료

  수정 필드: {field}
  변경 전: "{이전 내용 40자}"
  변경 후: "{새 내용 40자}"

----------------------------------------
다음 액션:

[1] 다시 settle (/sowhat:settle {section})
[2] challenge로 재검증 (/sowhat:challenge {section})
[3] 추가 수정
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/revise.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Execute the revise workflow end-to-end.
Preserve all workflow gates.
</process>
