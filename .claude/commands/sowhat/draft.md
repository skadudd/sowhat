---
name: sowhat:draft
description: settled 섹션들을 종합해 구체적 산출물을 생성한다. 민토 피라미드 원칙 기반 구조 제안, 목적·독자·채널별 최적화, 시리즈 구성, 프로파일 저장·재사용 지원. "문서 만들어", "draft", "PRD 생성", "제안서", "보고서", "블로그", "링크드인", "인스타", "슬라이드", "영상 스크립트", "논문", "뉴스레터", "시리즈", "재산출", "다른 형식으로" 등 논증 결과를 외부 공유용 산출물로 변환할 때 사용.
argument-hint: "[--profile <id>] [--list] [--edit <id>] [--output <all|document|prd|argument-map>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
license: MIT
compatibility: "Claude Code >=2.1.3"
disable-model-invocation: true
---
<objective>
settled 섹션들의 논증 구조를 종합하여, 바바라 민토의 피라미드 원칙에 기반한 구조 프레임워크를 제안하고, 구체적인 산출물(제안서/블로그/소셜미디어/슬라이드/논문/PRD 등)로 변환한다. 목적·목표·타겟 독자·증거 깊이·길이·시리즈 여부를 정의하는 프로파일을 생성·저장하여, 프로젝트 종료 후에도 다양한 형식으로 재산출할 수 있다.
</objective>

## When to Apply

- settled 논증을 외부 공유용 산출물로 변환할 때
- 블로그/제안서/링크드인/PRD 등 특정 형식이 필요할 때
- finalize-planning 이후 (planning 레이어 기준)

## Anti-triggers

공통 패턴: `@.claude/sowhat-core/references/anti-triggers.md`

- finalize-planning 미실행 상태 (--force 제외)
- settled 섹션이 없는 상태
- 논증 목적 없이 단순 문서 작성

## Methodology

1. 미리보기 게이트 (예상 파일 목록 확인 후 승인)
2. 산출물 브리프 수집 (형식/독자/채널)
3. 구조 프레임워크 설계 (민토 피라미드)
4. 섹션별 콘텐츠 렌더링 (source tag 보존)
5. 환각 검증 (anchor corpus 대조)
6. 파일 저장 + git commit

## Output Format

```
✅ 산출물 생성 완료

  프로파일: {profile-id}
  파일: export/{profile-id}/*.md ({N}개)

  논증 적용:
  ✅ 01-{section} → {output-section}
  ✅ 02-{section} → {output-section}

----------------------------------------
다음 액션:

[1] 산출물 검토
[2] 다른 형식으로 재생성
[3] 시리즈 다음 편 (/sowhat:draft --profile {next})
----------------------------------------
```

<execution_context>
@.claude/sowhat-core/references/ux-standards.md
@.claude/sowhat-core/workflows/draft.md
@.claude/sowhat-core/references/minto-pyramid.md
@.claude/sowhat-core/references/output-profiles.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/walton-schemes.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
CRITICAL: Do NOT use AskUserQuestion tool. Present choices as text, then wait for user free-text input.
CRITICAL: Choices must be numbered [1] [2] [3] — NEVER use A/B/C/D. NEVER use tables for choices. Follow workflow templates exactly as written.
Execute the draft workflow end-to-end.

Key workflow steps:
1. Brief intake — 산출물 유형, 목적/목표, 타겟 독자, 증거 깊이
2. Length/series — 단일 vs 시리즈, 분량 설정
3. Structure framework — 민토 피라미드 기반 구조 제안 + 사용자 조정
4. Profile save — 설정을 프로파일로 저장
5. Document generation — 프레임워크에 따라 산출물 생성
6. Git commit + logging

Preserve all workflow gates and checkpoints.

Special modes:
- --profile: 저장된 프로파일로 즉시 재생성 (Step 5로 직행)
- --list: 프로파일 목록 출력 후 종료
- --edit: 기존 프로파일 수정 모드
- --output: 레거시 호환 모드
</process>
