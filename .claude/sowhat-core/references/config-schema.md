# Config Schema — planning/config.json

sowhat 프로젝트의 상태를 추적하는 단일 설정 파일. 모든 워크플로우가 이 파일을 읽고 업데이트한다.

---

## 전체 구조

```json
{
  "project": "string",
  "mode": "string",
  "source": { ... },
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

### `mode` (선택)
- **타입**: string
- **유효값**: `"idea"` | `"content-critique"` | `"research"`
- **기본값**: `"idea"` (필드 없으면 idea로 간주)
- **설명**: 프로젝트 초기화 모드
- **설정 시점**: init
- `"idea"`: 사용자의 아이디어에서 시작하는 기본 모드
- `"content-critique"`: 외부 콘텐츠를 분석 대상으로 삼아 사용자가 입장을 세우는 모드
- `"research"`: 자료를 먼저 수집·분석하여 근거 기반으로 thesis를 bottom-up 도출하는 모드

### `source` (선택 — content-critique 모드 전용)
- **타입**: object
- **설명**: 분석 대상 콘텐츠 정보. `mode === "content-critique"` 일 때만 존재
- **설정 시점**: init (`--from` 인자 사용 시)

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | `"url"` \| `"file"` — 소스 유형 |
| `url` | string (선택) | 소스 URL (type=url일 때) |
| `path` | string (선택) | 로컬 파일 경로 (type=file일 때) |
| `stance` | string | `"refute"` \| `"critique"` \| `"alternative"` \| `"partial"` — 사용자의 입장 |
| `fetched` | string | ISO8601 datetime — 콘텐츠 가져온 시각 |

**stance 설명**:
- `"refute"`: 반박 — 대상의 주장이 틀렸다
- `"critique"`: 비평 — 대상의 주장에 약점이 있다
- `"alternative"`: 대안 제시 — 더 나은 방법이 있다
- `"partial"`: 부분 동의 — 일부만 동의한다

**예시**:
```json
"mode": "content-critique",
"source": {
  "type": "url",
  "url": "https://example.com/article",
  "stance": "refute",
  "fetched": "2026-03-25T10:30:00Z"
}
```

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
| `stale_count` | number | `0` | 만료된(stale) 파인딩 수 |
| `last_staleness_check` | string \| null | `null` | 마지막 staleness 검사 시각 (ISO8601) |
| `tier_distribution` | object | `{}` | Tier별 파인딩 분포 `{ "T1": N, "T2": N, "T3": N, "T4": N }` |

### `credibility` (선택)
- **타입**: object
- **설명**: 출처 신뢰도 설정 (`references/source-credibility.md` 참조)
- **생성 시점**: init (기본값으로 생성)

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `custom_whitelist` | string[] | `[]` | T1/T2로 강제할 추가 도메인 |
| `custom_blacklist` | string[] | `[]` | T4로 강제할 추가 도메인 |
| `strict_mode` | boolean | `false` | `true`면 T3도 Grounds 단독 사용 불가 |

### `citations` (선택)
- **타입**: object
- **설명**: 인용 그래프 추적 (`references/citation-graph.md` 참조)
- **생성 시점**: 첫 inject 또는 research apply 시

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `total` | number | `0` | 전체 인용 수 |
| `orphaned` | number | `0` | 고아 인용 수 (파인딩 삭제됨) |
| `unlinked_grounds` | number | `0` | 출처 미명시 Grounds 수 |

### `snapshots` (선택)
- **타입**: object
- **설명**: 스냅샷 상태 추적
- **생성 시점**: 첫 snapshot 생성 시

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `latest` | string | null | 최신 스냅샷 버전 (예: "v3") |
| `count` | number | 0 | 총 스냅샷 수 |
| `auto_snapshot` | boolean | true | 자동 스냅샷 활성화 여부 |

### `features` (선택)
- **타입**: object
- **설명**: 기능 토글
- **생성 시점**: init

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `sub_research` | string | `"enabled"` | `"enabled"` \| `"disabled"` — expand 중 Sub-Research 사용 여부 |
| `sub_research_engine` | string | `"agent-browser"` | Sub-Research 엔진 |
| `sub_research_fallback` | string | `"websearch"` | 엔진 실패 시 폴백 |
| `deep_research` | string | `"auto"` | `"auto"` \| `"enabled"` \| `"disabled"` — Perplexity Deep Research 사용 여부. `"auto"`면 `PERPLEXITY_API_KEY` 환경변수 존재 시 활성화 |
| `deep_research_preset` | string | `"deep-research"` | Perplexity Agent API preset. `"fast-search"` \| `"pro-search"` \| `"deep-research"` \| `"advanced-deep-research"` |

---

## 워크플로우별 사용 패턴

| 워크플로우 | 읽기 | 쓰기 |
|-----------|------|------|
| init | — | 전체 생성 (content-critique 시 mode, source 포함) |
| expand | layer, sections | sections (status 업데이트) |
| settle | layer, sections | sections (status → settled) |
| challenge | layer, sections | sections (status → needs-revision) |
| critic | mode, source, layer, sections | — |
| debate | layer, sections, mode, source | — (debate 브랜치에서 작업) |
| revise | layer, sections | sections (status 업데이트) |
| sync | 전체 | sections, last_sync |
| research | research, features, credibility | research |
| finalize-planning | layer, sections | layer → spec, sections 추가 |
| finalize | layer, sections | layer → finalized |
| progress | 전체 | — |
| resume | 전체 | — |
| map | sections | — |
| draft | layer, sections, draft_profiles | draft_profiles |
| inject | layer, sections, research, credibility | sections, research |
| autonomous | 전체 | sections, research |
| steelman | layer, sections | — |
| branch | sections | — |
| character | — | — |
| note | project | — |
| snapshot | snapshots, sections, layer | snapshots |

### `draft_profiles` (선택)
- **타입**: object (key = profile id)
- **설명**: 저장된 산출물 프로파일 추적 (`references/output-profiles.md` 참조)
- **생성 시점**: 첫 draft 프로파일 생성 시
- **기본값**: `{}` (빈 객체)

각 프로파일 값:
| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | string | 프로파일 YAML 파일 경로 (`export/profiles/{id}.yml`) |
| `last_generated` | string \| null | 마지막 산출물 생성 시각 (ISO8601) |
| `generation_count` | number | 이 프로파일로 생성한 횟수 |

**예시**:
```json
"draft_profiles": {
  "linkedin-series": {
    "file": "export/profiles/linkedin-series.yml",
    "last_generated": "2024-01-15T14:30:45Z",
    "generation_count": 3
  },
  "investor-deck": {
    "file": "export/profiles/investor-deck.yml",
    "last_generated": null,
    "generation_count": 0
  }
}
```

**규칙**:
- profile id는 kebab-case
- 프로파일 파일이 삭제되면 이 항목도 정리해야 함 (resume가 감지)
- 프로젝트 finalized 후에도 프로파일 추가/재생성 가능

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
