# /sowhat:finalize — 명세 레이어 검증·종결

<!--
@metadata
checkpoints:
  - type: verify-argument
    when: "challenge 통과 확인 후 진행 승인"
  - type: decision
    when: "force 시 알려진 문제 인지"
config_reads: [layer, sections]
config_writes: [layer]
continuation:
  primary: "/sowhat:draft (산출물 생성)"
  alternatives: ["/sowhat:draft --list", "/sowhat:map"]
status_transitions: ["layer: spec → finalized"]
-->

이 커맨드는 명세 레이어를 최종 검증하고 layer를 finalized로 종결한다. **파일을 생성하지 않는다.** 외부 공유용 산출물은 `/sowhat:draft`에서 생성한다.

## 사전 검증

1. `planning/config.json` 로드
2. `layer`가 `"spec"`인지 확인
   - `"planning"` → `❌ 아직 기획 레이어입니다. /sowhat:finalize-planning을 먼저 실행하세요.`
   - `"finalized"` → `❌ 이미 완료된 프로젝트입니다.`

3. 명세 레이어 전체 상태 확인 (04~09):
   - `settled`되지 않은 섹션 존재 → `❌ 실행 거부: {section}이 {status} 상태입니다.`
   - 어떤 섹션이 누락되어 있으면 → `⚠️ {section}이 존재하지 않습니다. /sowhat:spec {section}을 먼저 실행하세요.`

모든 명세 섹션(04~09)이 `settled`여야만 진행한다.

## Session 저장

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

`logs/session.md`를 저장한다:

```markdown
---
command: finalize
step: challenge
status: in_progress
saved: {current_datetime}
---

## 마지막 컨텍스트
finalize 시작 — challenge 자동 실행 중
```

## 미리보기 게이트 (Preview Gate)

`--force` 또는 `--no-preview` 플래그가 있으면 이 단계 건너뜀.

```
> [finalize > 미리보기 게이트]

📋 예상 작업:
  1. /sowhat:challenge 자동 실행 (전체 트리 검증)
  2. planning/config.json → layer: "finalized" 업데이트
  3. git commit: "finalize: complete spec layer"

📊 영향:
  settled 명세 섹션 {N}개 최종 확정
  status 전이: layer spec → finalized

[1] 계속 진행
[2] 취소
```

- `[1]` → Challenge 자동 실행 진행
- `[2]` → 종료

## Challenge 자동 실행

`$ARGUMENTS`에 `--force`가 있으면 challenge를 건너뛴다.

`--force` 없으면: `/sowhat:challenge`를 자동 실행한다 — **기획 + 명세 전체** 대상.

- 문제가 발견되면:
  ```
  🔴 Challenge에서 {N}건 발견 — 종결을 중단합니다.

  [1] 문제를 먼저 해결하고 재실행
  [2] --force로 강제 진행 (문제 있음을 인지한 상태로)
  ```
  인간의 선택을 기다린다.
- 문제가 없으면 → 다음 단계 진행

> **역할**: finalize 전 challenge Stage 0-7 최종 검증. Stage 0은 사용자 입력 citation의 실존·값 정확성 확인(`[source:user]`/`[source:#NNN]`/`[source:sub-research]`/`[source:file:*]`), Stage 1-7은 논리 검증. 상세: `references/ai-content-boundary.md`.
>
> **`--force` 주의**: `--force` 사용 시 challenge를 건너뛴다. 통과하지 못한 논리·사실 이슈가 최종 산출물에 남을 수 있다. 인지된 문제가 경미할 때만 사용.

## Argument Log 추가

`logs/argument-log.md`에 최종 요약을 append한다:

```markdown
## [{current_datetime}] finalize
  Action: layer → finalized
  Sections: {settled된 모든 섹션 목록}
```

## config.json 업데이트

```json
{
  "layer": "finalized"
}
```

## Git commit

```bash
git add -A
git commit -m "finalize: complete spec layer"
```

## GitHub

```bash
# Milestone close (있으면)
gh api repos/{owner}/{repo}/milestones/{milestone_number} -X PATCH -f state=closed 2>/dev/null || true
```

## logs/session.md 업데이트

```markdown
---
command: finalize
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
finalize 완료 — 명세 레이어 종결됨. layer: finalized.

## 재개 시 첫 질문
/sowhat:draft 로 원하는 형식의 산출물을 생성하세요.
```

## 완료 안내

```
✅ 명세 레이어 종결 완료

  논증이 확정되었습니다. 이제 원하는 형식으로 산출물을 만드세요.

----------------------------------------
다음 액션:

[1] 산출물 생성 (/sowhat:draft)
[2] 저장된 프로파일 목록 (/sowhat:draft --list)
[3] 논증 맵 보기 (/sowhat:map)
[4] 최종 검증 재실행 (/sowhat:challenge)
----------------------------------------
```

## 핵심 원칙

- **challenge 자동 실행은 생략 불가** (`--force` 명시 시만 예외)
- **finalize는 파일을 생성하지 않는다** — 상태 전이와 검증만 담당
- **모든 산출물 생성은 /sowhat:draft에 위임**
- **export는 기획+명세의 충실한 요약** — 새로운 내용을 추가하지 않는다
