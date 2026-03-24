# Config Schema — planning/config.json

sowhat 프로젝트의 상태를 추적하는 단일 설정 파일. 모든 워크플로우가 이 파일을 읽고 업데이트한다.

---

## 전체 구조

```json
{
  "project": "string",
  "github": { ... },
  "layer": "string",
  "sections": { ... },
  "last_sync": "ISO8601",
  "research": { ... },
  "features": { ... }
}
```

---

## 필드 상세

### `project` (필수)
- **타입**: string
- **설명**: 프로젝트 이름 (kebab-case)
- **설정 시점**: init
- **예시**: `"my-saas-product"`

### `github` (필수)
- **타입**: object
- **설명**: GitHub 연동 정보

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `repo` | string | — | `{owner}/{repo}` 형식 |
| `token_env` | string | `"GITHUB_TOKEN"` | 토큰 환경변수 이름 |

### `layer` (필수)
- **타입**: string
- **유효값**: `"planning"` | `"spec"` | `"finalized"`
- **설명**: 현재 작업 레이어
- **전이 규칙**:
  - `"planning"` → `"spec"` (finalize-planning 실행 시)
  - `"spec"` → `"finalized"` (finalize 실행 시)
  - 역전이 없음

### `sections` (필수)
- **타입**: object (key = section id)
- **설명**: 모든 섹션의 상태 추적

각 섹션 값:
| 필드 | 타입 | 설명 |
|------|------|------|
| `issue` | number | GitHub Issue 번호 |
| `status` | string | `draft` \| `discussing` \| `settled` \| `needs-revision` \| `invalidated` |
| `file` | string | (미사용 — 예약됨) 현재 어떤 워크플로우도 이 필드를 쓰지 않음 |

**예시**:
```json
"sections": {
  "00-thesis": { "issue": 1, "status": "settled" },
  "01-problem": { "issue": 2, "status": "discussing" },
  "02-solution": { "issue": 3, "status": "draft" }
}
```

**규칙**:
- section id는 `{NN}-{name}` 형식 (00=thesis, 01~03=기획, 04~09=명세)
- status는 `references/status-transitions.md`의 전이 규칙을 따름
- 섹션 파일의 frontmatter status와 항상 동기화되어야 함 (불일치 시 resume가 감지)

### `last_sync` (필수)
- **타입**: ISO8601 datetime string
- **설명**: 마지막 GitHub 동기화 시각
- **업데이트 시점**: init, sync

### `research` (선택)
- **타입**: object
- **설명**: 리서치 상태 추적
- **생성 시점**: 첫 research 실행 시

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `count` | number | `0` | 총 파인딩 파일 수 |
| `unreviewed` | number | `0` | 미검토 파인딩 수 |
| `last_research` | string \| null | `null` | 마지막 리서치 시각 (ISO8601) |

### `features` (선택)
- **타입**: object
- **설명**: 기능 토글
- **생성 시점**: init

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `sub_research` | string | `"enabled"` | `"enabled"` \| `"disabled"` — expand 중 Sub-Research 사용 여부 |
| `sub_research_engine` | string | `"agent-browser"` | Sub-Research 엔진 |
| `sub_research_fallback` | string | `"websearch"` | 엔진 실패 시 폴백 |

---

## 워크플로우별 사용 패턴

| 워크플로우 | 읽기 | 쓰기 |
|-----------|------|------|
| init | — | 전체 생성 |
| expand | layer, sections | sections (status 업데이트) |
| settle | layer, sections | sections (status → settled) |
| challenge | layer, sections | sections (status → needs-revision) |
| debate | layer, sections | — (debate 브랜치에서 작업) |
| revise | layer, sections | sections (status 업데이트) |
| sync | 전체 | sections, last_sync |
| research | research, features | research |
| finalize-planning | layer, sections | layer → spec, sections 추가 |
| finalize | layer, sections | layer → finalized |
| progress | 전체 | — |
| resume | 전체 | — |
| map | sections | — |
| draft | layer, sections | — |

---

## 검증 규칙

1. **layer 유효성**: `"planning"` | `"spec"` | `"finalized"` 중 하나
2. **sections 동기화**: 모든 section id에 대응하는 파일이 `planning/` 디렉터리에 존재해야 함
3. **status 유효성**: `references/status-transitions.md`의 유효값만 허용
4. **issue 유효성**: 양의 정수
5. **datetime 형식**: ISO8601 (YYYY-MM-DDTHH:MM:SSZ)

---

## 마이그레이션

config.json에 새 필드를 추가할 때:
- 기본값이 있는 선택 필드로 추가 (기존 프로젝트 호환)
- 워크플로우에서 필드 없을 시 기본값 사용
- 필수 필드 추가 시 마이그레이션 스크립트 필요 (현재 해당 없음)
