# sowhat — workflow harness 소스 리포

이 리포는 sowhat을 *만드는* 곳이다 (사용처 아님).
sowhat = Claude Code runtime 위의 **workflow harness** (slash command 27개 + subagent 6개 + reference 라이브러리).

---

## 절대 규칙 — 편집 위치

**모든 코드 변경은 `.claude/` 하위에만.**
루트 `commands/`, `sowhat-core/`, `agents/`는 빌드 산출물 — 직접 편집 금지.
(근거: `scripts/build.js`가 `.claude/`에서 덮어씀, `.gitignore` 등록됨)

예시: 새 command 추가 → `.claude/commands/sowhat/new-cmd.md` 생성
반례: 루트 `commands/sowhat/new-cmd.md` 직접 생성 → 다음 빌드에서 소실

---

## 도구 사용 우선순위

프로젝트 수준 태스크·노트는 **sowhat 자체 기능**을 사용. `TaskCreate`/`TaskList` 금지.
(근거: TaskCreate는 세션 메모리 — sowhat 파일 시스템과 미연동, 세션 종료 시 소실)

- 태스크·메모 기록 → `/sowhat:note`
- 진행 상황 확인 → `/sowhat:progress`
- `TaskCreate` 허용 범위: Claude 자신의 세션 작업 단계 추적에만

모호한 요청이 오면 Claude Code 내부 도구보다 **sowhat 스킬을 먼저 고려**한다.

---

## 컴포넌트 추가 규칙

| 추가 대상 | 위치 | 필수 조건 |
|---|---|---|
| Slash command | `.claude/commands/sowhat/*.md` | frontmatter 4필드: `name`, `description`, `argument-hint`, `allowed-tools` |
| Workflow 본문 | `.claude/sowhat-core/workflows/*.md` | command에서 `@import`로 참조 |
| 공통 참조 | `.claude/sowhat-core/references/*.md` | UX·프로토콜·도메인 규칙 정의 |
| Subagent | `.claude/agents/sowhat-*.md` | `sowhat-` prefix 필수 (빌드 필터 기준) |

`description` 필드 누락 금지 — 트리거 불가.
(근거: 과거 audit에서 9개 command 누락 발견 → 현재 27개 전부 보유로 해소됨. 이력: `logs/skill-quality-audit.md`. 규칙은 신규 command에 계속 적용.)

Command = 요약·진입점 / Workflow = 실행 본문으로 분리 유지 (Two-tier standards).
Multi-step command는 반드시 `logs/session.md` 저장 포함.
(근거: 세션 재개 신뢰도. `.claude/sowhat-core/references/session-protocol.md` 참조)

---

## 변경 전 필독

- `@.claude/sowhat-core/references/ux-standards.md` — 모든 command UX 규칙 (`[1]/[2]/[3]` 선택지, AskUserQuestion 금지 등)
- `@.claude/sowhat-core/references/session-protocol.md` — session.md/handoff.json 저장 규칙
- `@.claude/sowhat-core/references/status-transitions.md` — 상태 전이 게이트
- `@.claude/sowhat-core/references/command-flow.md` — command 간 의존성

**cross-platform**: Parser·로그 호출 시 `tee` 대신 `> file && cat file` 패턴 사용 (PowerShell에서 `tee` silent fail 가능).

---

## 빌드·배포

```bash
node scripts/build.js   # .claude/ → 루트 복사 (npm publish 전에만 실행)
npm publish             # 패키지명: sowhat-cc
```

진입점: `bin/install.js` (`npx sowhat-cc --global` / `--local`)

---

## 회귀 보호 범위

sowhat의 회귀 보호는 **결정론적 컴포넌트**에 한정한다:

- `source-tag-parser.js` — 파서 동작 검증
- `pre-tool-security.js`, `post-tool-validate.js` — hook 동작 검증
- `scripts/test-*.js`로 실행 (`npm test`)

LLM 워크플로우 행동(예: debate sycophancy 여부, settle 판정 일관성)은 본질적으로 LLM-judge-LLM 문제로 단위 테스트 불가. 별도 인프라(LLM 호출 자동화 + 비용 관리)가 마련되기 전까지 eval YAML 형식의 회귀 보호는 도입하지 않는다.

(근거: v2.3.0이 9-gate harness 가이드를 따라 도입한 `.claude/tests/eval/*.yaml`은 코드 수정 skill 전제의 가이드를 문서·논증 워크플로우인 sowhat에 카테고리 오적용한 것으로 판명. v2.3.1에서 회수.)

---

## 금지 목록

- 루트 `commands/`, `sowhat-core/`, `agents/` 직접 편집
- `description` 필드 없는 command 생성
- session.md 저장 없는 multi-step command 작성
- 감지·수정 혼합 command (감지 전용 command는 파일 쓰기 금지, 리포트만 출력)
- `TaskCreate`로 프로젝트 수준 태스크 생성
- sowhat을 "skill"로 지칭 — 정확한 용어: **workflow harness**

---

## 아키텍처 한 줄 요약

> Claude Code(runtime harness) 위에서 동작하는 domain-specific workflow harness.
> JVM:Spring = Claude Code CLI:sowhat.
