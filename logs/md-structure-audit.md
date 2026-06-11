# MD 지침·구조 Audit — 2026-06-11

대상: `.claude/` 하위 워크플로우 하네스 (slash command 27 + subagent 6 + reference 라이브러리) + 루트 거버넌스.
방법: Explore 에이전트 6종 병렬 감사 → load-bearing 주장 전부 파일 재검증 → 검증된 결함만 수정.

---

## 1. 검증 후 기각된 오탐 (수정하지 않음)

| 보고된 "문제" | 판정 | 근거 |
|---|---|---|
| orphaned references 10개 | **기각** | anti-triggers는 command 23개, continuation-format ~20개가 `@`-import. 실제 미연결은 series-data-model 1개뿐(아래 해소) |
| `status: complete` 미정의 상태 | **기각** | session.md 실행필드(session-protocol.md), 섹션 lifecycle와 별 네임스페이스 |
| path syntax 충돌(@ vs relative) | **기각** | command=`@`-import 지시자, workflow=산문 포인터 — 의도된 2메커니즘 |
| AI boundary 14곳 drift | **하향** | 한 줄 리마인더+포인터일 뿐, 장문 복붙 아님 |
| debate.md session 로깅 누락 | **부분 기각** | debate는 session-protocol import 중. 실제 누락은 steelman·character뿐(해소) |
| character-system 통째 아카이브 | **부분 기각** | `@`-import된 운영 본문(Phase 1-5 실행). 통째 이동 불가 |

---

## 2. 수정 완료

### Stage 0 — Codex 제거 → Claude Code 단일화
- 삭제: `AGENTS.md`(CLAUDE.md의 기계적 `.Codex/` 치환본 — `.Codex/` 디렉터리 부재 + build.js는 `.claude/`만 읽어 적극적 오류), `.codex/`(TOML 6 + hooks 2 + hooks.json, 하드코딩 절대경로), `.agents/`.
- 검증: `.claude`·README·SOWHAT-DESIGN·CHANGELOG·package.json·scripts 어디도 미참조 → 댕글링 0.

### Stage 1 — Reference DRY / 로직·정합성
- **challenge.md 스테이지 중복 제거**: L239-379 인라인 Stage 0-7 스펙(challenge-algorithm.md와 ~82% 중복)을 오케스트레이션 요약 표로 슬림화. 판정 로직은 challenge-algorithm.md 단일 소유. (−~120L, drift 제거)
- **draft-review-algorithm.md 생성**: draft.md의 dangling pointer 3건(L1356/1419/1541) 해소. `--review` 절차 전체를 reference로 추출.
- **Steelman 3중 의미 disambiguation**: debate 라운드 전술 / challenge Stage 7 / `/sowhat:steelman` 워크플로우를 구분하는 주석 추가(challenge.md, debate.md).
- **Confidence scale 정합**: expand.md 스텝 6에 calibration-guide·strength-scoring·challenge-algorithm §Stage 6 포인터 + "Tetlock band vs CQ confidence(0-4)" 네임스페이스 구분 명시.
- **grounds_structure 갭**: challenge-algorithm.md Stage 5 필요성 테스트가 linked/convergent/mixed에 따라 분기(linked 단일 약점 ground → critical)하도록 반영.

### Stage 2 — Context-rot 분리 (monolith → on-demand 포인터)
조건부 대형 분기를 `references/{cmd}-{topic}.md`로 추출, 본문엔 명령형 산문 포인터 잔치. 보편 규칙은 `@`-import 유지.

| 워크플로우 | before | after | 추출 → reference |
|---|---|---|---|
| draft.md | 1756 | 1410 | `--review` 모드 → draft-review-algorithm.md (351L) |
| init.md | 1129 | 659 | research 모드 → init-research-mode.md (349L), `--auto` → init-auto-pipeline.md (139L) |
| research.md | 964 | 313 | 5개 분석 모드 → research-modes.md (286L), `--deep` → research-deep-mode.md (326L) |
| expand.md | 1099 | 941 | Sub-Research Semi-Async → expand-sub-research.md (169L) |
| series.md | 1006 | 571 | `create`/`promote` → series-create.md (446L) |

순감: 워크플로우 본문 **−1,948L** (5개 최대 monolith가 매 호출 시 무조건 로드하던 분량). 해당 분기 진입 시에만 reference를 on-demand Read.

### Stage 3 — 구조 일관성
- steelman.md·character.md: session-protocol `@`-import 추가 → 25개 command 정합.
- research.md: 모드별 session.md 저장 5회(번호 중복 `6.`/`6.` 버그 포함) → 모드 매핑 표 기반 **1회 저장**으로 통합.
- series.md: series-data-model.md 포인터 연결(F-7 orphan 해소).
- config.md: `argument-hint: ""` → `"(인자 없음 — 대화형 메뉴)"`.

### Stage 4 — Stale 문서 + 검증
- README: "5개 에이전트" → 6 (self-critic 추가).
- walton-schemes.md: 부재 파일 `walton-schemes-full.md` 포인터 → 외부 문헌 인용으로 리워드.
- CLAUDE.md: description-규칙 근거를 "9개 누락 → 현재 27개 전부 해소"로 갱신(historical 표기).

---

## 3. 검증 결과
- `npm test` (parser·hook 결정론 회귀): **All tests passed**.
- Dangling reference 스캔(`references/*.md` 포인터 전수): **0건**.
- 신규 reference 7개 전부 실존, 각 워크플로우 dispatcher가 정확히 참조.
- Codex 잔재: **0건**.
- session-protocol command import: 25개.

---

## 4. 의도적 보류 (Phase 2 후보)
per-run 가치 대비 touch/risk가 큰 항목은 보류. 추후 별도 사이클에서 신중히 진행 권장:
- **ux-standards.md 분할**(§2.3 체크포인트·§9 detection-scope·§10 preview-gate를 선택 import로): 섹션당 25-41L로 ≥80L 임계 미만이나 ~20개 command multiplier. command별 import 재배선 필요 → breakage risk.
- **draft.md 프레임워크/채널 템플릿 분리**(framework ~187L, channel ~128L): 임계 초과·가치 있으나 Step 5 생성 로직 내부 중첩 → dispatch 경계 정밀 검증 필요.
- **debate.md 조건부 섹션**(stance 53L·global 17L·branch-lifecycle 46L): 각 블록 <80L 임계 미만 → 과편화 방지 위해 보류.
- **character-system.md 설계근거/운영 분리**: `@`-import된 운영 본문이라 신중한 rationale-only 분리 필요.
- **draft PRD/series-gen 템플릿 분리**, **series 잔여 서브커맨드**(digest/add/terms): 후속.

---

## 5. 설계 원칙 (이번 사이클 확립)
> `.claude/`가 단일 정본. context-rot 레버 = **보편 규칙은 `@`-import 유지, 조건부·중복·detail 대형 블록(≥~80L)만 reference로 빼서 산문 포인터로 on-demand 로드**. 과편화(필요 fragment 미독·coherence 손상) 방지를 위해 소형·happy-path 코어는 인라인 유지. 중복은 단일 소유(single source)로.
