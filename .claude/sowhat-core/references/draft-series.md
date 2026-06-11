# Draft — Series 생성 템플릿

시리즈 산출물의 파트별 템플릿(도입편/본편/결론편). draft.md Step 5에서 시리즈 모드일 때 각 part를 읽고 렌더한다.

---

### 시리즈 콘텐츠 생성

시리즈인 경우 파트별로 개별 파일 생성:

`export/generated/{profile-id}/part-{N}.md`

**Part 1 (도입편):**
```markdown
<!--
  시리즈: {series_title}
  파트: 1/{total_parts}
  프로파일: {profile-id}
-->

# {시리즈 제목}: {Part 1 부제}

{SCQA — 전체 시리즈의 맥락 설정}

## 이 시리즈에서 다룰 것

{KA별 1줄 예고 — 시리즈 로드맵}

## {Part 1 핵심 메시지 — Answer의 맛보기}

{evidence_depth에 맞춰 가장 강한 Ground 1개}

---
*다음 편: {Part 2 제목} — {Part 2 미니 Q}*
```

**Part 2~N-1 (본편):**
```markdown
<!--
  시리즈: {series_title}
  파트: {M}/{total_parts}
-->

# {시리즈 제목}: {Part M 부제}

> 지난 편 요약: {이전 파트 Answer 1문장}

{미니 SCQA — 이 파트만의 맥락}

## {이 파트의 KA Claim}

{evidence_depth에 맞춘 Grounds 렌더링}

## 그래서?

{이 KA가 전체 Answer에 기여하는 방식 — scheme 논리}

{미충족 CQ 대응 (있으면)}

---
*다음 편: {Part M+1 제목} — {예고}*
```

cliffhanger=false이면 "다음 편" 라인 생략.

**Part N (결론편):**
```markdown
<!--
  시리즈: {series_title}
  파트: {N}/{N}
-->

# {시리즈 제목}: {결론 부제}

## 지금까지의 여정

{각 파트 핵심 1문장씩 요약}

## 종합: {Answer}

{Answer 상세 서술 — 시리즈 전체의 논거 종합}

## "하지만..."

{통합 미충족 CQ 대응}

## 결론: {CTA}

{목표에 맞는 행동 촉구}
```
