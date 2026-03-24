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
---
<objective>
settled 섹션들의 논증 구조를 종합하여, 바바라 민토의 피라미드 원칙에 기반한 구조 프레임워크를 제안하고, 구체적인 산출물(제안서/블로그/소셜미디어/슬라이드/논문/PRD 등)로 변환한다. 목적·목표·타겟 독자·증거 깊이·길이·시리즈 여부를 정의하는 프로파일을 생성·저장하여, 프로젝트 종료 후에도 다양한 형식으로 재산출할 수 있다.
</objective>

<execution_context>
@.claude/sowhat-core/workflows/draft.md
@.claude/sowhat-core/references/minto-pyramid.md
@.claude/sowhat-core/references/output-profiles.md
@.claude/sowhat-core/references/session-protocol.md
@.claude/sowhat-core/references/continuation-format.md
@.claude/sowhat-core/references/toulmin-model.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
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
