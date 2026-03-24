# Checkpoints — sowhat 인간-루프 판단 지점

논증 워크플로우에서 Claude가 자동으로 진행하지 않고 인간의 판단을 요청해야 하는 지점을 정의한다.

---

## Checkpoint 유형

### 1. `verify-argument` (80% — 가장 빈번)

**논증 품질을 자동 검증한 후 인간이 최종 확인한다.**

Claude가 먼저 자동 검증을 수행하고, 결과를 인간에게 보여준 뒤 승인/수정을 받는다.
인간이 단순히 "확인"만 하면 되는 상황.

**사용 시점:**
- settle 직전: Toulmin 6필드 완성도 + scheme CQ 자동 점검 → 인간 확인
- challenge 후: 공격 결과 요약 → 인간이 반박/수용 결정
- debate round 판정 후: 오케스트레이터 판정 → 인간 확인

**형식:**
```
┌─── verify-argument ───────────────────────────┐
│ 자동 검증 결과:                                │
│   ✅ Claim-Grounds 연결: 통과                  │
│   ⚠️ Qualifier: 근거 대비 과도 (major)         │
│   ✅ Warrant: 논리적 연결 확인                  │
│                                                │
│ [A] 승인 — settle 진행                         │
│ [M] 수정 필요 — 어떤 부분?                     │
│ [S] 건너뛰기 — 나중에 다시                     │
└────────────────────────────────────────────────┘
```

**인간 응답 처리:**
- `[A]` → 다음 단계 진행
- `[M]` → 인간의 수정 지시를 받아 반영 후 재검증
- `[S]` → session.md에 상태 저장, 종료

---

### 2. `decision` (15% — 논증 방향 결정)

**인간만 내릴 수 있는 판단. Claude가 선택지를 구성하고, 인간이 결정한다.**

논증의 방향, 가치 판단, 전략적 선택 등 자동화 불가능한 결정.

**사용 시점:**
- thesis Answer 확정: 여러 후보 중 인간이 선택
- debate 에스컬레이션: Claim broken → 수정/폐기/유지 결정
- 역전파 범위: 영향받는 섹션 중 어디까지 invalidate할지
- scheme 선택: 섹션에 적합한 argument scheme 결정
- qualifier 최종 결정: 자동 추정 vs 인간 판단이 다를 때

**형식:**
```
┌─── decision ──────────────────────────────────┐
│ 결정 필요: {무엇에 대한 결정인지}              │
│                                                │
│ 배경:                                          │
│   {결정에 필요한 컨텍스트 2-3줄}               │
│                                                │
│ 선택지:                                        │
│   [1] {옵션} — {장단점 한 줄}                  │
│   [2] {옵션} — {장단점 한 줄}                  │
│   [3] {옵션} — {장단점 한 줄}                  │
│                                                │
│ Claude 추천: [{N}] — {이유 한 줄}              │
└────────────────────────────────────────────────┘
```

**인간 응답 처리:**
- 번호 선택 → 해당 옵션 실행
- 자유 입력 → 새로운 옵션으로 처리
- 미응답/보류 → session.md에 pending decision 저장

---

### 3. `human-input` (5% — 외부 정보 필요)

**인간만 제공할 수 있는 정보가 필요하다.**

Claude가 접근할 수 없는 내부 데이터, 전문 지식, 경험적 판단이 필요한 상황.

**사용 시점:**
- expand 중 Grounds 작성: 인간만 아는 내부 데이터/경험
- research 결과 해석: 도메인 전문 지식 필요
- rebuttal 작성: 실제 반론 경험이 있는 인간의 입력

**형식:**
```
┌─── human-input ───────────────────────────────┐
│ 필요 정보: {무엇이 필요한지}                   │
│                                                │
│ 이유:                                          │
│   {왜 Claude가 이 정보를 생성할 수 없는지}     │
│                                                │
│ 형식 힌트:                                     │
│   {기대하는 입력의 예시/형식}                   │
│                                                │
│ [P] 나중에 제공 (Open Question으로 기록)       │
└────────────────────────────────────────────────┘
```

**인간 응답 처리:**
- 정보 제공 → 즉시 반영, 워크플로우 계속
- `[P]` → Open Questions에 추가, 다음 단계로 진행

---

## 워크플로우별 Checkpoint 삽입 지점

### expand

| 스텝 | Checkpoint | 유형 |
|------|-----------|------|
| Step 1.5 (Stasis) | stasis 유형 선택 | decision |
| Step 2 (Scheme) | scheme 선택 | decision |
| Step 3 (Claim) | claim 후보 중 선택 | decision |
| Step 4 (Grounds) | 내부 데이터 요청 가능 | human-input |
| Step 6 (Qualifier) | 자동 추정과 다르면 | decision |
| Step 8 (Rebuttal) | rebuttal 후보 중 선택 | decision |

### debate

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| 각 라운드 판정 후 | 판정 결과 확인 | verify-argument |
| thesis-threatened | 에스컬레이션 결정 | decision |
| Post-debate | merge/cherry-pick/보류/삭제 | decision |

### challenge

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| 공격 리포트 출력 후 | 각 공격에 대한 반박/수용 | decision |
| 역전파 실행 전 | 역전파 범위 | decision |

### settle

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| 자동 검증 후 | 검증 결과 확인 + settle 승인 | verify-argument |

### finalize-planning / finalize

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| challenge 통과 후 | 진행 승인 | verify-argument |
| force export 선택 시 | 알려진 문제 인지하고 진행 | decision |

### inject

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| 필드 매핑 선택 | Grounds/Backing/Rebuttal/Warrant 중 선택 | decision |
| settled 섹션 강등 확인 | 주입 시 needs-revision 전환 | decision |

### autonomous

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| Thesis 방향 변경 필요 | Stage 1 실패 시 | decision |
| Critical issue 발견 | challenge에서 critical 발견 | decision |
| Claim 뒤집힘 | debate에서 broken 판정 | decision |
| 3회 연속 settle 실패 | 사용자 개입 필요 | decision |

### steelman

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| Counter-narrative 결과 확인 | 생성 후 취약점 리포트 검토 | verify-argument |

### branch

| 시점 | Checkpoint | 유형 |
|------|-----------|------|
| 분기 이름 설정 | 원본/대안 이름 지정 | decision |
| 분기 채택 결정 | merge 시 어느 분기 선택 | decision |

---

## Checkpoint와 Session의 관계

Checkpoint에서 인간 응답을 기다리는 동안:

1. **session.md 저장** — checkpoint 직전 상태를 기록
   ```yaml
   ---
   command: {command}
   section: {section}
   step: {step}
   status: awaiting_checkpoint
   checkpoint_type: {verify-argument|decision|human-input}
   saved: {datetime}
   ---
   ```

2. **context reset 시 복구** — resume가 `awaiting_checkpoint` 상태를 감지하면 checkpoint를 다시 제시

3. **타임아웃 없음** — 인간 응답은 무한 대기. 자동 진행하지 않는다.

---

## 핵심 원칙

- **Claude는 자동화하고, 인간은 판단한다** — 검증은 자동, 결정은 인간
- **선택지를 구성하는 것이 Claude의 역할** — "어떻게 하시겠습니까?"가 아니라 "[1] [2] [3] 중 선택"
- **추천을 항상 제시** — decision에는 Claude의 추천과 이유를 함께 표시
- **보류 옵션 항상 포함** — 인간이 지금 결정하지 않아도 되는 경로
- **checkpoint 없이 파괴적 행동 금지** — 역전파, status 변경, thesis 수정은 반드시 checkpoint 후
