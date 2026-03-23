---
model: claude-opus-4-6
---
# /sowhat:challenge — 전체 트리 공격

이 커맨드는 전체 문서 트리를 7단계 논리 검증으로 공격한다. Toulmin Model, Walton Argument Schemes, Pragma-Dialectics를 모두 적용한다. 부분 공격은 없다 — 항상 전체를 대상으로 한다.

## 사전 준비 (1회만 실행 — 이후 재로드 금지)

**모든 섹션 파일을 한 번만 로드하고 7단계 전체에서 메모리 값을 재사용한다.**

1. `planning/config.json` 로드
2. `00-thesis.md` 로드 → `thesis_answer`, `key_arguments` 추출
3. 모든 섹션 파일을 **한 번에** 로드 (숫자 순서대로)
   - `settled` 또는 `discussing` 상태 섹션만 대상
   - `draft`, `invalidated` 섹션은 건너뜀
   - 각 섹션에서 추출: `status`, `thesis_argument`, `scheme`, `claim`, `grounds`, `warrant`, `qualifier`, `rebuttal`
4. 현재 layer가 `"spec"`이면 기획 + 명세 전체를 대상으로 함
5. 로그 디렉터리 확인:
   ```bash
   mkdir -p logs
   ```

> **로드 원칙**: 이후 [1단계]~[7단계] 검증은 모두 위에서 추출한 메모리 값을 참조한다. 섹션 파일 재로드 금지.

---

## 검증 순서 (고정 — 순서 변경 불가)

### [1단계] Thesis 정합성

각 섹션의 thesis_argument가 thesis의 Answer를 **실제로** 지지하는지 검증한다.

검증 항목:
- 이 섹션의 Claim이 제거되면 thesis Answer가 흔들리는가? (필요성)
- settled + discussing 섹션들이 합쳐졌을 때 Answer를 **완전히** 커버하는가? (충분성)
- IBIS 관점: 어떤 Issue에 대한 Position인지 명확한가?
- 빠진 Key Argument가 있지 않은가?

---

### [2단계] Argument Scheme 유효성 (NEW)

각 섹션의 `scheme` 필드를 확인하고 해당 scheme의 Critical Questions를 적용한다.

**scheme이 없는 섹션**: scheme 미설정 → `⚠️ scheme 미설정 (공격 취약)`으로 기록하고 계속.

**scheme별 Critical Questions:**

| Scheme | Critical Questions |
|--------|-------------------|
| authority | 이 권위자가 이 도메인의 진짜 전문가인가? 관련 분야에 전문가 합의가 있는가? 이해충돌은 없는가? |
| analogy | 두 케이스가 이 논증에서 중요한 측면에서 충분히 유사한가? 차이점이 논증에 결정적인가? |
| cause-effect | 인과 메커니즘이 타당한가? 역인과(reverse causation) 가능성은? Confounding variable은? |
| statistics | 표본이 대표성 있는가? 방법론이 건전한가? 데이터가 현재 시점에 유효한가? |
| example | 대표적인 사례인가? 체리피킹이 아닌가? 일반화가 가능한가? |
| sign | 이 신호가 신뢰할 수 있는 지표인가? 동일한 신호를 설명하는 다른 해석은 없는가? |
| principle | 이 원칙이 이 상황에 적용되는가? 관련 예외 조건은 없는가? |
| consequence | 결과가 현실적인가? 의도치 않은 부작용은? 적용 시간대는 맞는가? |

scheme 미설정이거나 scheme의 Critical Questions에 취약점이 발견되면 공격 리포트에 포함.

---

### [3단계] Warrant 유효성 (NEW)

각 섹션의 Warrant를 검증한다. **이 단계가 논증 구조의 핵심 검증이다.**

검증 항목:
1. **Warrant 명시성**: Warrant 필드가 비어있거나 "Implicit"이면 → 약점 플래그
2. **연결 타당성**: Warrant가 Grounds → Claim을 실제로 연결하는가?
   - Non-sequitur: Grounds가 Claim을 도출하지 않음
   - Missing link: A에서 C로 점프, B 설명 없음
   - Circular: Warrant가 Claim을 그대로 반복
3. **Backing 지지**: Warrant가 Backing으로 강화되어 있는가? (없으면 취약으로 기록, 필수 아님)

일반적인 Warrant 실패 패턴:
- "큰 시장 → 우리 성공" (논증 누락: 우리가 그 시장을 잡는다는 연결 없음)
- "고통이 크다 → 우리 솔루션이 필요하다" (경쟁사도 같은 고통을 해결할 수 있음)
- "데이터가 있다 → Claim이 맞다" (데이터 해석 논리 없음)

---

### [4단계] So What

각 Grounds가 해당 Claim을 지지하는지 검증한다. Warrant를 경유하여 확인.

검증 항목:
- 이 Grounds + Warrant → Claim의 흐름이 자연스러운가?
- "So What?"에 답할 수 있는가? (Grounds가 있으면 Claim이 따라오는가)
- Claim이 상위 Key Argument를 지지하는가? (thesis까지 연결선 확인)

---

### [5단계] Why So

각 Claim이 충분하고 필요한 근거를 가지는지 검증한다.

검증 항목:
- **충분성**: Grounds가 Claim을 지지하기에 충분한가? (근거가 너무 약하거나 적지 않은가)
- **필요성**: 각 Ground를 제거했을 때 Claim이 약해지는가? (불필요한 근거는 없는가)
- **중복성**: 여러 Grounds가 동일한 내용을 반복하지 않는가?
- **비약**: Grounds에서 Claim으로의 논리적 비약이 있는가?

---

### [6단계] Qualifier 보정 (NEW)

각 섹션의 Qualifier와 근거 강도의 균형을 검증한다.

검증 기준:

| 상황 | 판정 |
|------|------|
| `definitely` + 근거 약함 (인터뷰 1-3건, 사례 1-2개) | Overclaiming — qualifier 하향 권장 |
| `definitely` + 반론 없음 | Overclaiming — `usually` 또는 `in most cases` 권장 |
| `possibly` + 강한 데이터 (대규모 연구, 강한 인과) | Underclaiming — 약한 포지션 |
| `presumably` + Backing 없음 | qualifier 수준과 근거 불균형 |
| `in most cases` + Backing 있음 | 균형 — 통과 |

---

### [7단계] MECE + Steelman

**MECE 검증:**
- Key Arguments 간 중복이 있는가? (같은 논거를 두 섹션이 다루는가)
- 빠진 논거가 있는가? (thesis Answer 달성에 필요한데 어떤 섹션도 다루지 않는 것)
- 섹션 간 Scope 충돌이 있는가? (같은 영역을 두 섹션이 In으로 주장하는가)

**Steelman 검증 (NEW):**
각 섹션에 대해 가장 강한 반론을 독립적으로 생성하고, 섹션의 Rebuttal이 이를 대응하는지 확인:
1. Claude가 scheme의 Critical Questions를 기반으로 해당 섹션에 대한 최강 반론을 직접 생성
2. 섹션의 `## Rebuttal` 필드 확인
3. Rebuttal이 비어있거나 생성된 반론을 대응하지 못하면 → 플래그

---

### [참고] 리서치 교차검증

`research/` 내 `status: accepted` 파인딩이 있으면, 발견된 갭과 교차검증:
- 리서치 파인딩이 동일한 갭을 식별했으면 함께 보고: `리서치 #{NNN}에서도 이 갭을 확인함: {요약}`
- 관련 없으면 건너뜀

---

## 공격 리포트 출력

**상세 리포트는 파일로 저장하고, 응답에는 요약만 출력한다.**

### 1. 파일 저장

```bash
date -u +"%Y%m%d-%H%M"
```

전체 상세 리포트를 `logs/challenge-{YYYYMMDD-HHMM}.md`에 저장:

```markdown
# Challenge Report — {datetime}

## Scheme 문제
[1] cause-effect 논증 취약 (02-market)
  문제: ...
  Critical Question: ...
  영향: ...

## Warrant 문제
...

## Qualifier 문제
...

## Steelman 미대응
...

## 통과
...
```

### 2. 응답 출력 (요약만)

문제가 있을 때:
```
🔴 Challenge — {N}건 발견 (상세: logs/challenge-{datetime}.md)

  [Scheme]    {N}건 — {섹션 목록 한 줄}
  [Warrant]   {N}건 — {섹션 목록 한 줄}
  [Qualifier] {N}건 — {섹션 목록 한 줄}
  [Steelman]  {N}건 — {섹션 목록 한 줄}
  [So What]   {N}건 — {섹션 목록 한 줄}
  [Why So]    {N}건 — {섹션 목록 한 줄}
  [MECE]      {N}건

가장 심각한 문제:
  [1] {유형} ({섹션}): {한 줄 설명}
  [2] {유형} ({섹션}): {한 줄 설명}
  [3] {유형} ({섹션}): {한 줄 설명}
```

문제가 없을 때:
```
✅ Challenge 통과 — 7단계 모두 통과
  논증 강도: [████████░░] {N}%
```

> **응답 원칙**: 섹션별 상세 내용은 로그 파일에만 저장한다. 응답에 각 공격의 전문을 출력하지 않는다.

---

## 인간 응답 처리

각 공격에 대해 인간이 응답한다.

### 반박하는 경우 (Pragma-Dialectics: defense move)

인간의 반박이 **논리적으로 타당한지** Claude가 재검증한다.

타당성 판정 기준:
- 반박이 문제가 된 논리적 약점을 직접 해소하는가?
- 새로운 Grounds 또는 Warrant를 제시하는가?
- 단순 재주장 (claim을 반복)이 아닌가?

판정 결과:
- **타당** → 해당 공격 **철회**, 리포트에서 제거
- **부분 타당** → 공격 약화, 남은 약점 재명시
- **타당하지 않음** → **재공격** (구체적 이유와 함께, 이전 공격보다 더 구체적으로)

**인간의 반박을 무조건 수용하지 않는다.** 품질이 최우선이다.

### 수용하는 경우 (Pragma-Dialectics: concession move)

역전파를 즉시 실행한다:

1. 해당 섹션 `status: needs-revision`
2. 하위 의존 섹션 (thesis_argument가 같은 섹션들 중 이 섹션에 의존하는 것) `status: invalidated`
3. GitHub Issue reopen + label 변경:
   ```bash
   gh issue reopen {issue_number}
   gh issue edit {issue_number} --add-label "needs-revision" --remove-label "settled"
   ```
4. `config.json` 업데이트
5. `00-thesis.md` Key Arguments 체크박스 해제 (해당되면)
6. Git commit:
   ```bash
   git add -A
   git commit -m "challenge: invalidate({sections}) - {이유 한 줄}"
   ```
7. `logs/argument-log.md` 업데이트:
   ```markdown
   ## [{datetime}] challenge
     Invalidated: {sections}
     Reason: {공격 유형 - 구체적 이유}
     Affected: {역전파된 섹션 목록}
   ```

---

## 완료 안내

모든 공격이 처리되면:

```
✅ Challenge 완료
  [Scheme]    {N}건 발견 / {M}건 철회 / {K}건 수용
  [Warrant]   {N}건 발견 / {M}건 철회 / {K}건 수용
  [Qualifier] {N}건 발견 / {M}건 철회 / {K}건 수용
  [Steelman]  {N}건 발견 / {M}건 철회 / {K}건 수용

  역전파: {영향받은 섹션 목록}

다음: /sowhat:expand {section}      → 역전파된 섹션 재전개
      /sowhat:debate {section}      → 자동 논증 강화
      /sowhat:finalize-planning     → 기획 완료 (모든 settled 필요)
```

---

## 핵심 원칙

- **섹션 파일 1회 로드** — 사전 준비에서 한 번만 로드, 7단계 내내 메모리 값 재사용
- **리포트는 파일에, 요약만 응답에** — 응답에 각 공격의 전문을 출력하지 않는다
- **항상 전체 트리 공격** — 부분 공격 없음
- **검증 순서 고정** — Thesis → Scheme → Warrant → So What → Why So → Qualifier → MECE+Steelman
- **인간의 반박을 무조건 수용하지 않는다** — 논리적 타당성 재검증
- **Warrant 공격 최우선** — Implicit Warrant는 모든 논증의 가장 큰 취약점
- **scheme 기반 공격** — 일반적 논리 오류보다 scheme 특정 취약점이 더 날카롭다
- **Steelman은 독립 생성** — 섹션의 Rebuttal을 먼저 보지 말고 반론 먼저 생성
- **품질 우선** — 타협하지 않는다
- **역전파는 즉시 실행** — 수용 시 하위 전체에 영향
