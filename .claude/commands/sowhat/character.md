---
name: sowhat:character
description: 글쓰기 캐릭터(목소리)를 생성·관리한다. 레퍼런스 텍스트에서 Voice DNA를 추출하여 draft 산출물에 일관된 톤과 스타일을 적용한다. "캐릭터", "character", "글쓰기 스타일", "톤", "voice", "문체", "어투" 등 산출물의 글쓰기 목소리를 설정할 때 사용.
argument-hint: ""
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
레퍼런스 텍스트를 3차원(Voice/Flow/Persona) 분석하여 작가의 Voice DNA를 추출하고, 5층 캐릭터 프로파일을 생성·관리한다. draft 산출물에 일관된 톤과 스타일을 적용한다.
</objective>

## When to Apply

- 시리즈 산출물의 일관된 보이스/캐릭터를 설정할 때
- 특정 페르소나로 콘텐츠를 생성할 때

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- series 미설정 상태
- 단일 문서 프로젝트

## Methodology

1. 시리즈 파일 로드
2. 캐릭터 속성 설정 (톤/보이스/전문성)
3. 캐릭터 파일 저장

## Output Format

```
✅ 캐릭터 설정 완료

  시리즈: {series_name}
  캐릭터: {character_name}
  톤: {tone}
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/references/character-system.md
</execution_context>

<context>
Arguments: $ARGUMENTS
Character storage: ~/.claude/sowhat-characters/
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices.
CRITICAL: Do NOT use the Skill tool. Handle all file operations directly.

항상 대화형 메뉴부터 시작한다. 인자가 있어도 메뉴를 건너뛰지 않는다.

## 메인 메뉴

```
글쓰기 캐릭터

[1] 새 캐릭터 만들기
[2] 기존 캐릭터 관리
[3] 캐릭터 목록 보기
```

[1] 선택 시: character-system.md의 레퍼런스 분석 파이프라인 Phase 1-5 실행
[2] 선택 시: 캐릭터 선택 → 레퍼런스 추가, 캘리브레이션, 감사 등
[3] 선택 시: ~/.claude/sowhat-characters/ 스캔 → 목록 표시

레퍼런스 분석은 character-system.md에 정의된 3차원 분석(Voice/Flow/Persona)을 빠짐없이 수행한다.
교차 검증, 캘리브레이션, drift-anchors 생성까지 완료해야 캐릭터가 저장된다.
</process>
</output>
