# Draft — Framework 템플릿

단일 콘텐츠 생성 시 선택된 framework(Pyramid/Narrative/Problem-Solution/Comparative/PREP/Academic)의 구조 생성 지침. `workflows/draft.md` Step 5에서 결정된 framework의 해당 섹션을 읽고 그대로 렌더한다.

---

#### Pyramid (피라미드형)

```markdown
# {제목}

{SCQA 변형에 따른 도입부}

## {KA1 — grouping 순서에 따라 가장 먼저}

{evidence_depth에 맞춰 Grounds 렌더링}
{scheme 논리 연결을 자연스러운 연결 문장으로}

## {KA2}

{동일 깊이로 렌더링}

## {KAN}

{동일 깊이로 렌더링}

## 반론과 대응

{각 섹션 CQ 커버리지 + 미충족 CQ 대응 — evidence_depth 3 이상이면 개별 대응, 이하면 통합}

## 결론

{Answer 재강조 + 목표에 맞는 CTA}
```

#### Narrative (서사형)

```markdown
# {Hook — 독자 관심 포착}

{Situation → 독자가 공감할 배경}

{Complication → 긴장/갈등}

## {KA1을 스토리 비트로}

{Grounds를 사례/일화 중심으로 서술}

## {KA2를 스토리 비트로}

{전환점으로서의 반론 → 대응}

## {결말 — Answer + CTA}
```

#### Problem-Solution (문제-해결형)

```markdown
# {제목}

## 문제

{Complication 중심 — 얼마나 심각한가}

## 문제의 영향

{Grounds 중 정량적 데이터}

## 원인 분석

{scheme 논리 연결 — 왜 이 문제가 발생하는가}

## 해결책

{Answer — 구체적 솔루션}

## 효과 증명

{CQ 보조 인용 + 사례 Grounds}

## 다음 단계

{CTA}
```

#### Comparative (비교형)

```markdown
# {제목}: 의사결정 분석

## 배경

{SCQA}

## 비교 대상

{KA별로 옵션으로 재구성}

## 평가 기준

{scheme 논리에서 추출한 판단 기준}

## 분석

{Grounds를 기준별로 매핑}

## 권고

{Answer}

## 근거

{CQ 응답 근거}
```

#### PREP (Point-Reason-Example-Point)

```markdown
# {Point — Answer 한 문장}

{Reason — scheme CQ 논리 기반}

{Example — 가장 강한 Ground}

{Point 재강조 — CTA}
```

#### Academic (학술형)

```markdown
# {제목}

## Abstract

{Answer + 주요 발견 요약 — 200-300 words}

## 1. 서론

{SCQA + 연구 질문}

## 2. 선행 연구

{CQ 보조 근거 + Research findings — 출처 정식 인용}

## 3. 방법론

{research/ 디렉터리의 접근 방식 기술}

## 4. 주요 발견

{각 KA = 하위 섹션, 전체 Walton 구조 기술}

### 4.1 {KA1}
{Claim + Grounds + scheme/CQ 응답 + Confidence 명시}

### 4.2 {KA2}
{동일}

## 5. 논의

{미충족 CQ + 한계점 분석}

## 6. 결론

{Answer + 시사점 + 후속 연구 제안}

## 참고문헌

{research/ findings에서 APA 형식으로}
```
