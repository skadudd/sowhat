# Sowhat Skill Quality Audit — 2026-03-24

## Summary
- **Total skills**: 15
- **Critical issues**: 7
- **Warnings**: 12
- **Passed**: 4 (spec, settle, map, progress)

---

## Per-Skill Results

### init — FAIL
**Triggering**: description 필드 없음 — 트리거 불가
**Logic issues**: "Is Answer clear?" 탈출 경로 없음; GitHub auth 실패 처리 없음
**Recommendation**: description 추가; Step 2에 "Is Issue vague?" 게이트 추가; Step 10 에러 처리

---

### expand — WARN
**Triggering**: description 필드 없음
**Logic issues**: 핑퐁에서 유저가 답 안 해도 진행 가능; Warrant 검증 선택적; Step 5 "sufficient" 기준 없음
**Recommendation**: description 추가; 유저 답변 최소 길이 체크포인트; 충분성 기준 명시화

---

### spec — PASS
**Triggering**: 양호
**Logic issues**: 없음
**Recommendation**: description 보강 (trigger 문구 추가)

---

### debate — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- Qualifier 단계 미정량화 ("2단계 하락"의 기준이 모호)
- Steelman: "Rebuttal 보지 말라"이지만 구조 파악은 필요 → 순서 모순
- `--until-stable` + 동일 공격 반복 시 deadlock 가능
**Recommendation**:
- Qualifier 정량화: definitely=0, usually=1, in most cases=2, presumably=3, possibly=4
- Steelman 순서 명확화: "독립 생성 후 Rebuttal과 대조"
- 사이클 감지: N라운드와 N-2라운드 결과 동일 시 인간 결정 요구

---

### challenge — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- scheme 없는 섹션: "공격 취약" 표시만 하고 실패 처리 안 함 (settle gate와 불일치)
- Steelman이 현 Rebuttal을 먼저 안 읽는다고 하지만 구조는 알아야 함
- Implicit Warrant → 경고만, 게이트 통과 가능
**Recommendation**:
- scheme null → 자동 invalidated (or 강제 선택)
- Warrant Implicit: grounds가 명백한 경우만 허용, 기준 명시
- MECE 체크리스트: Key Argument별로 최소 1개 섹션이 직접 지지하는지 확인

---

### settle — PASS
**Triggering**: 양호
**Logic issues**: Warrant Implicit → ⚠️ 경고만 (실용적 균형)
**Recommendation**: 없음

---

### revise — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- 오염 감지: 텍스트 언급만 탐색, Rebuttal 암묵적 의존 미탐지
- 오염 섹션 자동 invalidated (너무 가혹; needs-revision이 적절)
- 섹션 debate로 강화된 컨텍스트 손실 가능
**Recommendation**:
- downgrade: settled → needs-revision (invalidated는 인간 결정)
- 오염 탐지: Grounds/Warrant/Rebuttal 전체 파싱
- 오염 ranking: direct > indirect > rebuttal-only

---

### research — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- 자율 리서치 모드: 일괄 승인 후 전체 자동 실행 (per-search 승인 없음)
- accept → reject 전환 시 Open Questions 잔존
- 소스 간 충돌 감지 없음
**Recommendation**:
- per-search 승인 인터랙션 추가
- reject 시 Open Questions 체크박스 자동 해제
- 충돌 파인딩 🔴 플래그

---

### draft — WARN
**Triggering**: 양호하나 구체적 trigger 문구 없음
**Logic issues**:
- planning 레이어에서 PRD 생성 강제 비활성화 (과도한 제한)
- custom format [6] 가이드라인 없음
- export/ 충돌 시 backup 방식이 git과 충돌
**Recommendation**:
- planning → PRD "preliminary" 생성 허용 (경고 포함)
- custom format 템플릿 제공
- backup 대신 `git stash` 사용

---

### map — PASS
**Triggering**: 양호
**Logic issues**: 없음
**Recommendation**: `--summary` 모드 추가 (thesis only 1-page 시각화)

---

### progress — PASS
**Triggering**: 양호
**Logic issues**: 없음
**Recommendation**: `--compact` 모드 추가 (action 추천 생략)

---

### resume — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- session.md 신선도 검증 없음 (비정상 종료 시 stale)
- quick-resume 전 외부 변경 감지 없음
**Recommendation**:
- session.md 저장 시점이 1시간 이상 경과 시 경고
- resume 전 현재 섹션 상태 vs session 컨텍스트 diff

---

### finalize — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- challenge 자동 실행, skip 불가 (--force 옵션 없음)
- REQUIREMENTS.md Qualifier 언어 손실 (must/should 구분 없어짐)
- GitHub milestone close 실패 시 silent
**Recommendation**:
- `--force` 플래그로 challenge 스킵 허용
- FR에 Qualifier 보존: "must"(definitely) / "should"(usually) / "may"(possibly)
- GitHub 실패 시 경고 출력

---

### finalize-planning — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- 스펙 섹션 자동 생성 전 추출 내용 미리보기 없음
- 추출 실패 섹션에 Open Questions만 남기고 더 이상 안내 없음
- planning challenge ≠ spec-level gap 검증 (재실행 안내 없음)
**Recommendation**:
- 생성 전 "추출 내용 미리보기 → 확인 [Y/N]" 추가
- 추출 실패 시 "수동 정의 필요" 명시
- "spec 섹션 expand 후 challenge 재실행 권장" 경고 추가

---

### sync — WARN
**Triggering**: description 필드 없음
**Logic issues**:
- 로컬 ↔ GitHub 상태 충돌 시 무조건 GitHub 우선 (conflict 감지 없음)
- reverse-propagation 확인 없이 자동 실행 (파괴적)
- 부분 실패 시 상태 불일치 (롤백 없음)
**Recommendation**:
- 충돌 감지: [G]itHub / [L]ocal / [A]sk per section
- reverse-propagation: 영향 섹션 표시 후 확인 요청
- 부분 실패 시 "완료: N건, 실패: M건" 리포트

---

## Cross-Skill Issues

### 1. Description 필드 9개 누락 (CRITICAL)
**영향**: init, expand, debate, challenge, research, resume, finalize, finalize-planning, sync
이 9개 스킬은 skill-creator 기준상 트리거 불가 상태.

### 2. 파괴적 작업 확인 게이트 불일치 (HIGH)
**영향**: challenge, debate, revise, finalize
일부는 자동 invalidate, 일부는 확인 요청. 기준 없음.
**Fix**: "파괴적 작업(invalidate/downgrade/cascade) 전 항상 확인" 원칙 표준화

### 3. Implicit Warrant 정책 모호 (MEDIUM)
**영향**: settle, challenge, debate
경고만 하고 게이트 통과 허용 — 명시적 정책 없음.

### 4. session.md 저장 비일관성 (MEDIUM)
**영향**: expand, spec, debate, challenge(미저장), finalize(미저장)
일부만 session.md 저장. resume 신뢰도 저하.

### 5. Qualifier 수치화 미정의 (MEDIUM)
**영향**: debate, challenge
"2단계 하락" 기준이 스킬 내 정의 없음. 실행 시 해석 여지.
**Fix**: 모든 스킬에서 공유할 Qualifier ladder 정의 (definitely=0 ~ possibly=4)

---

## Top 5 Priority Fixes

| 순위 | 이슈 | 영향 | 난이도 |
|------|------|------|--------|
| 1 | **description 필드 9개 추가** | 스킬 트리거 전혀 안 됨 | 낮음 |
| 2 | **Qualifier 수치화** (debate/challenge 공유 기준) | 판정 모호성 제거 | 낮음 |
| 3 | **파괴적 작업 확인 게이트 표준화** | 데이터 손실 위험 | 중간 |
| 4 | **session.md 저장 표준화** | resume 신뢰도 | 중간 |
| 5 | **Steelman 순서 명확화** (debate/challenge) | 긍정 편향 방지 | 낮음 |

---

## Overall Assessment

| 차원 | 점수 | 비고 |
|------|------|------|
| 완전성 | 7/10 | 워크플로우 존재하나 session 관리 미완 |
| 명확성 | 6/10 | 논리 게이트는 명확, enforcement 약함 |
| **트리거링** | **2/10** | 9/15 스킬 description 없음 |
| 엣지 케이스 | 6/10 | 주요 케이스 처리되나 timeout/cycle 미처리 |
| UX 일관성 | 5/10 | 확인 게이트·session 저장 불일치 |
| 실행 가능성 | 7/10 | 절차 명확, git/frontmatter 처리 양호 |

---

*Audit: 2026-03-24 | Method: skill-creator criteria + cross-skill pattern analysis*
