---
model: claude-haiku-4-5-20251001
---
# /sowhat:map — 논증 흐름 시각화

논증의 흐름을 **Mermaid 다이어그램**으로 시각화한다. `$ARGUMENTS`

파일 구조가 아닌 **명제와 논리 관계**를 보여주는 것이 목적이다:
- 어떤 질문에서 출발했는가
- 어떤 주장이 나왔는가
- 어떤 근거로 뒷받침했는가
- 어떤 반박이 있었고 어떻게 극복했는가
- 지금 현재 상태가 어떤 맥락에서 도출되었는가

---

## 인자 파싱

```
/sowhat:map [section] [--snapshot] [--local | --global]
```

| 인자 | 의미 |
|------|------|
| 인자 없음 또는 `--global` | 전체 논증 흐름 맵 |
| `{section}` (번호 또는 이름) | 해당 섹션 상세 맵 |
| `--snapshot` | 현재 상태를 타임스탬프 파일로도 저장 |

모드 결정: `--global` > `{section}` 존재 > global

---

## 사전 준비

1. `planning/config.json` 로드
2. `00-thesis.md` 로드
3. 디렉터리 생성:
   ```bash
   mkdir -p maps/snapshots maps/local maps/debate
   ```

---

## 노드 설계

각 노드는 **파일명이 아닌 실제 명제 문장**을 담는다.

### 노드 타입

| 타입 | 아이콘 | 내용 |
|------|--------|------|
| Thesis | 💡 | Answer 전체 문장 |
| Key Argument | 🧩 | Key Argument 한 줄 |
| Claim | 📌 | 실제 주장 문장 |
| Grounds | 🔍 | 근거/자료 핵심 문장 |
| Warrant | 🔗 | 추론 연결 문장 |
| Rebuttal | ⚡ | 반박 문장 |
| Response | ↩ | 재반론 문장 |

### 노드 스타일 (Mermaid classDef)

```
classDef thesis fill:#91caff,stroke:#4096ff,color:#000
classDef keyarg fill:#d3adf7,stroke:#9254de,color:#000
classDef settled fill:#b7eb8f,stroke:#52c41a,color:#000
classDef discussing fill:#ffe58f,stroke:#faad14,color:#000
classDef draft fill:#f0f0f0,stroke:#bfbfbf,color:#000
classDef revision fill:#ffccc7,stroke:#ff4d4f,color:#000
classDef grounds fill:#e6f4ff,stroke:#91caff,color:#000
classDef rebuttal fill:#fff1f0,stroke:#ffa39e,color:#000
```

### 텍스트 처리

- 노드 내 텍스트는 **30자 이내**로 잘라 `...` 추가 (가독성)
- 실제 전체 내용은 섹션 파일에서 확인 가능
- 빈 필드는 노드 생성 안 함 (생략)

---

## Global 모드

### 1. 데이터 수집

`00-thesis.md` 에서:
- Answer (Thesis 문장)
- Key Arguments 목록

각 섹션 파일에서:
- `status`
- Claim 핵심 문장
- Grounds 핵심 문장 (있으면)
- Warrant 핵심 문장 (있으면)
- Rebuttal 문장 (있으면)
- `thesis_argument` (어느 Key Arg에 속하는지)

### 2. Mermaid 생성 규칙

`flowchart TD` 사용 (위→아래).

```
flowchart TD
  T["💡 {Answer 30자...}"]:::thesis

  T --> KA1["🧩 {Key Arg 1}"]:::keyarg
  T --> KA2["🧩 {Key Arg 2}"]:::keyarg

  KA1 --> S1["📌 {Claim 30자...}"]:::settled
  S1 --> G1["🔍 {Grounds 30자...}"]:::grounds
  S1 --> R1["⚡ {Rebuttal 30자...}"]:::rebuttal
  R1 --> RE1["↩ {Response 30자...}"]:::settled

  KA2 --> S2["📌 {Claim 30자...}"]:::discussing

  classDef thesis fill:#91caff,stroke:#4096ff,color:#000
  classDef keyarg fill:#d3adf7,stroke:#9254de,color:#000
  classDef settled fill:#b7eb8f,stroke:#52c41a,color:#000
  classDef discussing fill:#ffe58f,stroke:#faad14,color:#000
  classDef grounds fill:#e6f4ff,stroke:#91caff,color:#000
  classDef rebuttal fill:#fff1f0,stroke:#ffa39e,color:#000
```

**연결 원칙:**
- Thesis → 각 Key Argument
- Key Argument → 해당 섹션의 Claim
- Claim → Grounds (있으면, 점선 `-.->`)
- Claim → Warrant (있으면, 점선 `-.->`)
- Claim → Rebuttal (있으면, 실선 `-->`)
- Rebuttal → Response (있으면, 실선 `-->`)

**엣지 레이블:**
- Claim → Grounds: `|근거|`
- Claim → Warrant: `|추론|`
- Claim → Rebuttal: `|반박|`
- Rebuttal → Response: `|재반론|`

### 3. 저장

```markdown
# 논증 흐름 맵
> {현재 datetime}

```mermaid
{생성된 다이어그램}
```

## 섹션 상태
| 섹션 | 상태 | 주장 요약 |
|------|------|-----------|
| {N}-{name} | {status} | {Claim 40자...} |
```

파일: `maps/overview.md` (항상 덮어쓰기)

`--snapshot` 플래그 있으면 `maps/snapshots/overview-{YYYYMMDD-HHMM}.md` 에도 저장.

### 4. 출력

```
✅ maps/overview.md ({settled}/{total} settled)
```

needs-revision 있으면:
```
⚠️  needs-revision: {섹션 번호 목록}
```

---

## Local 모드

특정 섹션의 Toulmin 구조 전체를 더 상세하게 보여준다.

### 1. 섹션 파일 확인

- 숫자 → `{N}-*.md` 패턴 검색
- 이름 → `*-{name}.md` 패턴 검색
- 없으면 → `❌ 섹션을 찾을 수 없습니다: {section}`

### 2. 데이터 수집

- `00-thesis.md`: Answer, 해당 섹션의 Key Argument
- 현재 섹션: Claim, Grounds, Warrant, Backing, Qualifier, Rebuttal, Open Questions 전체

### 3. Mermaid 생성 (섹션 상세)

```
flowchart TD
  T["💡 {Answer 40자}"]:::thesis
  KA["🧩 {Key Arg}"]:::keyarg
  C["📌 {Claim 문장}"]:::{status}
  G["🔍 {Grounds 핵심}"]:::grounds
  W["🔗 {Warrant 핵심}"]:::grounds
  B["📚 {Backing 핵심}"]:::grounds
  Q["🎯 {Qualifier}"]:::draft
  R["⚡ {Rebuttal 문장}"]:::rebuttal
  OQ["❓ {Open Questions}"]:::draft

  T --> KA --> C
  C -.->|근거| G
  C -.->|추론| W
  W -.->|뒷받침| B
  C -.->|한정| Q
  C -->|반박| R
  C -.->|미해결| OQ
```

**노드 텍스트 규칙:**
- `\n` 사용 금지 — Mermaid 노드는 단일행만 지원
- 타입 아이콘은 텍스트 앞에 prefix로만 표시 (예: `💡 답변 문장`)
- 긴 문장은 30자에서 잘라 `...` 추가
- local 모드는 40자까지 허용

### 4. 저장

`maps/local/{section-name}.md`

### 5. 출력

```
✅ maps/local/{section-name}.md
```

---

## Debate 맵 (자동 호출)

`/sowhat:debate` 라운드 완료 시 자동 호출.

이전 상태는 git에서 가져온다:
```bash
git show HEAD~1:{section-file}.md
```

이전 Claim/Warrant/Rebuttal(회색) vs 현재(파랑) 비교:

```
flowchart LR
  subgraph Before["라운드 {N-1}"]
    BC["📌 {이전 Claim}"]:::draft
    BR["⚡ {이전 Rebuttal}"]:::rebuttal
  end
  subgraph After["라운드 {N}"]
    AC["📌 {현재 Claim}"]:::settled
    AR["⚡ {현재 Rebuttal}"]:::rebuttal
  end
  BC -->|"debate"| AC
```

저장: `maps/debate/debate-{section}-r{N}.md`

---

## 파일 명명 규칙

| 종류 | 경로 |
|------|------|
| 전체 개요 | `maps/overview.md` |
| 전체 스냅샷 | `maps/snapshots/overview-{YYYYMMDD-HHMM}.md` |
| 로컬 뷰 | `maps/local/{section-name}.md` |
| Debate 뷰 | `maps/debate/debate-{section}-r{N}.md` |

---

## 핵심 원칙

- **명제 중심** — 노드 내용은 파일명이 아닌 실제 주장·근거·반박 문장
- **Mermaid** — Excalidraw JSON 대신 텍스트 기반 다이어그램, 생성 비용 최소화
- **논증 흐름** — 질문 → 주장 → 근거/반박 → 결론의 논리 맥락 전달
- **Global은 항상 덮어쓴다** — 최신 상태 유지
- **스냅샷은 누적** — 삭제하지 않는다
