# Draft — Channel 특수 포맷

채널별 출력 포맷(Instagram 캐러셀 / Twitter 스레드 / Slide deck+Script / Video·Podcast 스크립트). draft.md Step 5에서 선택된 채널 포맷을 읽고 렌더한다.

---

### 채널별 특수 형식

#### 인스타그램 캐러셀 (`instagram-carousel`)

```markdown
<!-- Slide 1: Cover -->
# {Hook 제목}
{서브타이틀 — Answer 압축}

<!-- Slide 2: Problem -->
{Complication — 공감 유발 1문장}

<!-- Slide 3~N-1: Key Points -->
💡 {KA Claim}
📊 {가장 강한 Ground 1개}

<!-- Slide N: CTA -->
{Answer 재강조}
{CTA: 저장/공유/댓글}
```

#### 트위터/X 스레드 (`twitter-thread`)

```markdown
🧵 1/{N}
{Hook — Answer를 흥미롭게 재구성, 280자 이내}

2/{N}
배경: {Situation + Complication 압축}

3/{N} ~ {N-2}/{N}
💡 {KA Claim}
📊 {가장 강한 Ground}

{N-1}/{N}
⚠️ "하지만 {반론}?"
→ {대응}

{N}/{N}
결론: {Answer}
{해시태그 3-5개}
```

#### 슬라이드 덱 (`slide-deck`, `pitch-deck`)

슬라이드 산출물은 **2개 파일**로 분리 생성한다:

**파일 1: `SLIDES.md`** — 슬라이드 내용 (발표자가 아닌 청중이 보는 화면)

```markdown
<!-- Slide 1: Title -->
# {제목}
{Situation 한 줄}

<!-- Slide 2: Problem/Opportunity -->
## {Complication}
- {bullet 1}
- {bullet 2}
- {bullet 3}

<!-- Slide 3~N: Arguments -->
## {KA Claim}
- {핵심 Ground 1}
- {핵심 Ground 2}
[시각자료 제안: {차트/그래프/다이어그램 유형}]

<!-- Slide N+1: Counter -->
## "하지만..." → "그럼에도"
{반론 요약 → 대응}

<!-- Slide N+2: Conclusion -->
## {Answer}
{CTA — 구체적 다음 단계}
```

**파일 2: `SCRIPT.md`** — 발표자 스크립트 (슬라이드별 대사 + 타이밍)

```markdown
## 발표 스크립트: {제목}
예상 시간: {N}분

### Slide 1 — Title (0:00-0:30)
"{Situation 기반 오프닝 멘트. 청중의 관심을 잡는 질문이나 통계로 시작.}"

### Slide 2 — Problem (0:30-{M}:00)
"{Complication을 청중이 공감할 수 있게 풀어서 설명. 왜 이것이 문제인지 맥락 제공.}"

### Slide 3~N — Arguments ({M}:00-{M+K}:00)
"{KA Claim을 자연스러운 말투로. Grounds 데이터를 언급하며 시각자료를 가리킴.}"
[전환] "{다음 슬라이드로 넘기는 브릿지 문장}"

### Slide N+1 — Counter
"물론 이런 우려도 있습니다. {반론}. 하지만 {대응}."

### Slide N+2 — Conclusion
"{Answer 재강조}. {CTA — 구체적 요청}."
[마무리] "감사합니다. 질문 받겠습니다."
```

**Git 커밋 시 2파일 함께:**
```bash
git add export/generated/{profile-id}/SLIDES.md export/generated/{profile-id}/SCRIPT.md
git commit -m "draft({profile-id}): generate slide deck + speaker script"
```

#### 영상/팟캐스트 스크립트 (`youtube-script`, `podcast-script`)

```markdown
## 스크립트: {제목}
예상 길이: {분}분

### 도입 (0:00-0:30)
[화면/BGM] {시각자료 설명}
[내레이션] "{Hook — Situation 기반 오프닝}"

### 본론 1: {KA1} (0:30-{M}:00)
[화면] {데이터 시각화 / B-roll}
[내레이션] "{Claim}. {Grounds 기반 설명}."
[자막] {핵심 수치}

### 반론 대응 ({M}:00-{M+1}:00)
[내레이션] "물론 {반론}이라는 의견도 있습니다. 하지만..."

### 마무리
[내레이션] "{Answer}. {CTA}."
[화면] {구독/좋아요/다음 영상 예고}
```
