# Research Finding Lifecycle

연구 파인딩 파일(`research/NNN-{slug}.md`)의 전체 생명주기를 정의한다.

---

## 상태 흐름

```mermaid
stateDiagram-v2
    [*] --> unreviewed: /sowhat:research 실행
    unreviewed --> accepted: /sowhat:research accept N
    unreviewed --> rejected: /sowhat:research reject N
    accepted --> applied: Grounds/Backing에 반영됨
    accepted --> stale: 6개월 경과 또는 소스 변경
    rejected --> [*]: 파일 보존 (기록용)
    stale --> accepted: /sowhat:research review → 재확인
    stale --> rejected: /sowhat:research reject N
    applied --> [*]: 논증에 통합 완료
```

## 상태 정의

| Status | 의미 | 파인딩 파일 frontmatter |
|--------|------|----------------------|
| `unreviewed` | 생성됨, 인간 미검토 | `status: unreviewed` |
| `accepted` | 인간이 유효하다고 판단 | `status: accepted` |
| `rejected` | 인간이 무관하거나 신뢰 불가로 판단 | `status: rejected` |
| `applied` | 해당 섹션의 Grounds/Backing에 반영 완료 | `status: applied` |
| `stale` | 시간 경과 또는 소스 변경으로 재검토 필요 | `status: stale` |

---

## 생성 (Creation)

### 트리거
- `/sowhat:research URL` — URL 분석
- `/sowhat:research {topic}` — 토픽 검색
- `/sowhat:research` (인자 없음) — 자율 리서치
- debate 중 Research-Agent 자동 트리거

### 파일 생성 규칙

```
research/{NNN}-{slug}.md

NNN: 3자리 순번 (001, 002, ...)
slug: 검색어/URL에서 추출한 kebab-case 식별자
```

### Frontmatter

```yaml
---
id: NNN
type: url | topic | auto | debate
source: "{URL 또는 검색어}"
created: "{ISO8601}"
relevant_sections: ["{section_id}", ...]
status: unreviewed
applied_to: null
stale_reason: null
---
```

---

## 리뷰 (Review)

### `/sowhat:research review`

미검토 파인딩 목록을 보여준다:

```
📋 미검토 파인딩: {N}건

  [001] {slug} — {source 한 줄} ({created} 생성)
        관련 섹션: {sections}
  [002] ...

  accept {N}: 수용 → 섹션에 반영 제안
  reject {N}: 기각 → 기록만 보존
  all: 전체 보기
```

---

## 수용 (Accept)

### `/sowhat:research accept N`

1. 파인딩 파일의 `status: accepted`로 변경
2. 관련 섹션의 Open Questions에 반영 제안 추가
3. config.json `research.unreviewed` 감소
4. argument-log.md에 기록

### 반영 (Application)

accepted 파인딩이 실제로 섹션에 반영되면:
- expand/revise 중 Grounds 또는 Backing에 데이터 추가
- 파인딩 파일의 `status: applied`, `applied_to: "{section_id}"`로 변경
- 원본 파인딩 파일은 보존 (출처 추적용)

---

## 기각 (Reject)

### `/sowhat:research reject N`

1. 파인딩 파일의 `status: rejected`로 변경
2. config.json `research.unreviewed` 감소
3. **파일 삭제하지 않음** — 왜 기각했는지 나중에 참조할 수 있도록

---

## 만료 (Staleness)

### 자동 만료 감지

`/sowhat:progress` 또는 `/sowhat:resume` 실행 시 accepted 파인딩의 신선도를 검사한다:

```
FOR EACH finding WITH status == "accepted":
  age = now - finding.created

  IF age > 180 days (6개월):
    finding.status = "stale"
    finding.stale_reason = "age"

  # URL 기반 파인딩: 소스 접근 가능성은 검사하지 않음 (비용 대비 효용 낮음)
```

### 만료 알림

```
⚠️  만료된 파인딩: {N}건

  [{id}] {slug} — 생성: {created} ({age}일 전)
    관련 섹션: {sections}
    만료 이유: {reason}

  [1] 재확인 → accept 유지
  [2] 기각 → reject로 변경
  [3] 무시 (다음에 다시 알림)
```

---

## 아카이브 (Archive)

### finalize 실행 시

`/sowhat:finalize` 완료 후:
- `applied` 상태 파인딩: `research/` 디렉터리에 보존 (export에 출처로 참조됨)
- `rejected` 상태 파인딩: 보존 (기록용)
- `unreviewed` / `stale` 상태 파인딩: 경고 출력

```
⚠️  미처리 파인딩 {N}건이 남아있습니다.
  이 파인딩들은 export에 포함되지 않습니다.
  /sowhat:research review 로 처리하세요.
```

---

## config.json 연동

```json
"research": {
  "count": 5,        // 전체 파인딩 수
  "unreviewed": 2,   // 미검토 수
  "last_research": "2024-01-15T14:30:45Z"
}
```

### 카운트 업데이트 시점

| 액션 | count | unreviewed |
|------|-------|-----------|
| 파인딩 생성 | +1 | +1 |
| accept | — | -1 |
| reject | — | -1 |
| stale (accepted → stale) | — | +1 (재검토 필요) |
