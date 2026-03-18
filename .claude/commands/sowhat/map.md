---
model: claude-haiku-4-5-20251001
---
# /sowhat:map — 논증 트리 시각화

이 커맨드는 논증 구조를 Excalidraw 다이어그램으로 시각화한다. `$ARGUMENTS`에 따라 전체 트리(global) 또는 특정 섹션의 로컬 뷰를 생성한다.

## 인자 파싱

```
/sowhat:map [section] [--field fieldname] [--snapshot] [--local | --global]
```

| 인자 | 의미 |
|------|------|
| 인자 없음 또는 `--global` | 전체 논증 트리 개요 |
| `{section}` (번호 또는 이름) | 해당 섹션 로컬 뷰 |
| `--field {fieldname}` | 특정 필드 강조 (local 모드 전용) |
| `--snapshot` | 현재 상태를 스냅샷으로도 저장 |

모드 결정 우선순위: `--global` > `{section}` 존재 > global

## 사전 준비 (모든 모드 공통)

1. `planning/config.json` 로드 → sowhat 프로젝트 확인
2. `00-thesis.md` 로드
3. `maps/` 디렉터리 구조 생성 (없으면):
   ```bash
   mkdir -p maps/snapshots maps/local maps/debate
   ```
4. 현재 datetime 확인:
   ```bash
   date -u +"%Y-%m-%dT%H:%M:%SZ"
   ```

---

## Global 모드

전체 논증 트리를 하나의 Excalidraw 다이어그램으로 생성한다.

### 1. 데이터 수집

모든 섹션 파일을 로드한다 (숫자 순서):
- 각 섹션에서 추출: `status`, `scheme`, `qualifier`, Claim 첫 문장, `thesis_argument` 필드
- `00-thesis.md`에서: Answer, Key Arguments 목록

### 2. 다이어그램 구조 설계

계층 구조:
```
[Thesis Answer]
    ├── [Key Argument 1]
    │     ├── [{N}-{section}] Claim 요약
    │     └── [{N}-{section}] Claim 요약
    └── [Key Argument 2]
          └── [{N}-{section}] Claim 요약
```

노드 색상 (status별):
- `settled`: `#6fbd6f` (초록)
- `discussing`: `#f5c518` (노랑)
- `draft`: `#cccccc` (회색)
- `needs-revision`: `#ff6b6b` (빨강)
- `invalidated`: `#888888` (어두운 회색)
- Thesis 노드: `#4a9eff` (파랑)
- Key Argument 노드: `#a78bfa` (보라)

각 섹션 노드에 표시:
- 섹션 번호와 이름 (예: `02-market`)
- scheme 라벨 (예: `[analogy]`)
- qualifier 라벨 (예: `[presumably]`)
- Claim 첫 40자 + `...`

### 3. Excalidraw 생성

`mcp__claude_ai_Excalidraw__create_view` 도구를 먼저 시도한다.

실패 시 `mcp__claude_ai_Excalidraw__export_to_excalidraw`로 폴백한다.

두 도구 모두 실패 시:
```
❌ Excalidraw 생성 실패
  Excalidraw MCP가 연결되어 있는지 확인하세요.
```

생성 경로: `maps/overview.excalidraw`

### 4. 스냅샷 처리

`--snapshot` 플래그가 있거나, 이전에 `/sowhat:settle`이 실행된 직후인 경우:
```bash
# 스냅샷 저장
# 경로: maps/snapshots/overview-{YYYYMMDD-HHMM}.excalidraw
```

`mcp__claude_ai_Excalidraw__save_checkpoint`로 스냅샷을 저장한다.

### 5. 출력

```
✅ 마인드맵 생성: maps/overview.excalidraw

섹션 현황:
  ✅ settled: {N}개 ({섹션 번호 목록})
  🟡 discussing: {N}개 ({섹션 번호 목록})
  ⬜ draft: {N}개 ({섹션 번호 목록})
  🔴 needs-revision: {N}개 ({섹션 번호 목록})
  ⬛ invalidated: {N}개 ({섹션 번호 목록})

다음: /sowhat:expand {draft 섹션} → 다음 섹션 전개
      /sowhat:challenge → 전체 트리 검증
```

스냅샷을 저장했으면:
```
  스냅샷 저장: maps/snapshots/overview-{YYYYMMDD-HHMM}.excalidraw
```

---

## Local 모드

특정 섹션의 논증 체인을 로컬 뷰로 시각화한다.

### 1. 섹션 파일 확인

- `$ARGUMENTS`가 숫자 → `{N}-*.md` 패턴 검색
- `$ARGUMENTS`가 이름 → `*-{name}.md` 패턴 검색
- 없으면 → `❌ 섹션을 찾을 수 없습니다: {section}`

### 2. 필드 결정

`--field {fieldname}`이 지정된 경우 해당 필드를 사용한다.

지정되지 않은 경우, 다음 순서로 결정한다:
1. `logs/argument-log.md`의 마지막 항목에서 해당 섹션 관련 action 확인
2. 섹션 파일의 마지막 수정 섹션 헤더 추론
3. 기본값: `claim`

유효한 필드 이름: `claim`, `grounds`, `warrant`, `backing`, `qualifier`, `rebuttal`, `scope`, `open-questions`

잘못된 필드 이름이면:
```
❌ 알 수 없는 필드: {fieldname}
  유효한 필드: claim, grounds, warrant, backing, qualifier, rebuttal, scope, open-questions
```

### 3. 데이터 수집

- `00-thesis.md`에서: Answer, 해당 섹션이 속한 Key Argument
- 현재 섹션에서: 전체 Toulmin 구조, Argument Log, Open Questions
- 의존 섹션 확인: 다른 섹션의 `thesis_argument`가 이 섹션을 참조하는 경우

### 4. 다이어그램 구조 설계

```
[Thesis Answer]
      ↓
[Key Argument]
      ↓
[Section Claim]  ← 현재 섹션 (파랑 강조)
      ↓
[{현재 필드 강조}]  ← 포커스 필드 (파랑, 굵은 테두리)
      ↓
[의존 섹션들]  ← 이 섹션에 의존하는 섹션들 (있으면)
```

사이드 패널 (별도 영역):
```
[Open Questions]     [Debate History]
  - [ ] 질문 1         라운드 1: strengthened
  - [ ] 질문 2         라운드 2: modified
```

필드별 강조 색상:
- 포커스 필드 노드: `#4a9eff` (파랑), 테두리 굵게
- 관련 필드 (논리적 연결): `#a78bfa` (보라), 점선
- 나머지: 흰색 또는 연회색

### 5. Excalidraw 생성

저장 경로: `maps/local/{section-name}-{field}.excalidraw`
- 예: `maps/local/02-market-warrant.excalidraw`
- 예: `maps/local/02-market-rebuttal.excalidraw`

`mcp__claude_ai_Excalidraw__create_view` 먼저 시도, 실패 시 `mcp__claude_ai_Excalidraw__export_to_excalidraw` 사용.

### 6. 출력

```
✅ 로컬 뷰 생성: maps/local/{section-name}-{field}.excalidraw

섹션: {N}-{name} (status: {status})
포커스: {field}

논증 체인:
  Thesis → {Key Argument} → {Claim 요약}

의존 섹션: {있으면 목록, 없으면 "없음"}
Open Questions: {N}개 미해결

다음: /sowhat:expand {section} → 이 섹션 전개 계속
      /sowhat:debate {section} → 이 섹션 debate 시작
```

Argument Log에 항목이 있으면:
```
  Debate 이력: {N}라운드 ({최신 결과})
```

---

## Debate 맵 생성 (자동 호출)

`/sowhat:debate` 내부에서 라운드 완료 시 자동으로 호출될 수 있다.

인자: 섹션 이름 + 라운드 번호 (내부 인터페이스)

저장 경로: `maps/debate/debate-{section}-r{N}.excalidraw`

이 경우 이전 라운드 상태(회색)와 현재 라운드 상태(파랑)를 나란히 표시한다.

---

## settle 후 자동 스냅샷

`/sowhat:settle` 완료 직후 global 맵이 업데이트된 경우, `--snapshot` 없이도 자동으로 스냅샷을 저장한다.

이 동작은 settle 커맨드가 map을 호출할 때 `--snapshot` 플래그를 자동으로 추가하는 방식으로 구현된다.

---

## 파일 명명 규칙 요약

| 종류 | 경로 |
|------|------|
| 전체 개요 | `maps/overview.excalidraw` |
| 전체 스냅샷 | `maps/snapshots/overview-{YYYYMMDD-HHMM}.excalidraw` |
| 로컬 뷰 | `maps/local/{section-name}-{field}.excalidraw` |
| Debate 뷰 | `maps/debate/debate-{section}-r{N}.excalidraw` |

---

## 핵심 원칙

- **Global은 항상 덮어쓴다** — `maps/overview.excalidraw`는 최신 상태 유지
- **스냅샷은 누적된다** — 삭제하지 않는다
- **Local은 포커스 제공** — 핑퐁 중간에 호출해도 유효
- **Excalidraw 도구 폴백** — create_view 실패 시 export_to_excalidraw 시도
- **maps/ 디렉터리 자동 생성** — 없으면 만든다, 오류 없이
