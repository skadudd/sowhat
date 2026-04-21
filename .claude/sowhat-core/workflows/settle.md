# /sowhat:settle — 완료 선언

<!--
@metadata
checkpoints:
  - type: verify-argument
    when: "자동 검증 후 settle 승인"
config_reads: [layer, sections]
config_writes: [sections]
continuation:
  primary: "/sowhat:expand {next}"
  alternatives: ["/sowhat:challenge", "/sowhat:debate {section}"]
status_transitions: ["discussing → settled"]
-->

이 커맨드는 섹션의 status를 settled로 전환한다. `$ARGUMENTS`에 섹션 이름, 번호, 또는 `thesis`가 전달된다.

## 대상 파일 결정

- `$ARGUMENTS`가 `thesis` 또는 `00` → `00-thesis.md`
- `$ARGUMENTS`가 숫자 → `{N}-*.md`
- `$ARGUMENTS`가 이름 → `*-{name}.md`
- 빈 값이면 → `❌ 섹션을 지정하세요. 예: /sowhat:settle thesis, /sowhat:settle 01`

## 사전 검증

1. `planning/config.json` 로드
2. 대상 섹션 파일 로드
3. 현재 status 확인:
   - 이미 `settled` → `❌ 이미 settled 상태입니다.`
   - `invalidated` → `❌ invalidated 상태입니다. 상위 논거가 먼저 revision되어야 합니다.`
   - `draft` → `❌ draft 상태입니다. /sowhat:expand로 먼저 전개하세요.`

## 자동 검증 (thesis의 경우)

`00-thesis.md`를 settle하는 경우:

1. **Situation** 존재 여부 — 비어있으면 거부
2. **Complication** 존재 여부 — 비어있으면 거부
3. **Question** 존재 여부 — 비어있으면 거부
4. **Answer (So What?)** 존재 여부 — 비어있으면 거부
5. **Answer 명확성** — 한 문장인가? 모호하지 않은가?
6. **Key Arguments** 존재 여부 — 최소 1개 논거가 있어야 함
7. **Open Questions** — 미해결 항목이 있으면 거부

## 자동 검증 (기획/명세 섹션의 경우)

다음 항목을 순서대로 확인한다:

1. **thesis_argument 필드** — 존재하는가?
2. **Claim ↔ thesis Answer 정합성** — Claim이 thesis Answer를 지지하는가?
3. **Grounds 존재 여부** — 최소 1개의 근거가 있어야 함
4. **Warrant 존재 및 품질** — Warrant가 존재하는가? `"Implicit"` 또는 비어있으면 **경고** (거부는 아니지만 표시)
5. **Qualifier 설정 여부** — 비어있으면 거부
6. **Rebuttal 처리 여부** — 반론이 addressed되었거나 Open Question으로 명시되어 있는가?
7. **Open Questions** — 미해결 항목이 있으면 거부
8. **scheme 필드** — 설정되어 있어야 함
9. **Stub detection** — Toulmin 필드가 형식만 채워져 있고 실질 내용이 없는 "논증 stub"을 탐지. 거부
10. **Cross-section regression** — 이 섹션을 settle함으로써 기존 settled 섹션과의 논증 일관성이 깨지는지 검증. 충돌 시 경고

### Stub Detection (논증 빈 껍데기 탐지)

Toulmin 필드가 형식만 갖추고 실질 내용이 없는 "stub"을 탐지한다. AI 자동 전개(autonomous)에서 특히 빈번.

Stub 탐지는 두 방향의 결함을 함께 본다:
- **Filler stub** (너무 비어있음): 구체 식별자 없이 일반론만 서술 → **settle 거부** (기존 유지)
- **Fabrication 의심** (구체적인데 출처 표기 없음): 기관명·수치·연도가 있지만 출처 표기(URL/파일/finding ID/DOI)가 형식상 없거나 참조 실존 확인 실패 → **`unverified: true` 플래그 부착, settle 허용** (cycle 4 재구성: reject → warning)

> **cycle 4 Layer 책임 재정의** (`references/fabrication-prevention.md` §"Layer 책임 분리" 참조):
> - Settle은 이제 **L2 형식 경고 + L2a 참조 실존 확인** 레이어다
> - **L2 warning**: 정규식 매칭 + Exception 미발동 → `unverified` 플래그 (reject 아님)
> - **L2a cross-reference**: `#NNN`/`file:`/`§N` 실존 확인 — 미실존 시 `unverified` 플래그
> - URL 실존·값 정확성·사람명·보고서명 fabrication은 **L3 책임**
> - 최종 차단은 **L4 게이트** (finalize-planning / finalize / draft)가 `unverified` 플래그 집계로 수행
> - 이로써 AI 할루시네이션 원천 차단 (L0 AI-엄격) + 사용자 작성 편의성 (L0 사용자-중간) + 최종 유출 방지 (L4) 3중 방어

**탐지 패턴 — Filler (비어있음):**

| 필드 | Stub 판정 기준 | 예시 |
|------|---------------|------|
| Grounds | 구체적 출처/수치/사례 없이 일반론만 서술 | "다양한 연구에서 확인됨", "여러 전문가가 동의" |
| Warrant | Claim을 단순 반복하거나 동어반복 | Claim="시장이 크다" + Warrant="시장이 크기 때문에" |
| Backing | 구체적 출처/근거 없이 권위 호소만 | "업계 전문가 의견", "일반적으로 알려진 사실" |
| Rebuttal | 구체적 반론 미제시 + 대응 없음 | "반론이 있을 수 있으나 극복 가능", "큰 문제 없음" |
| Qualifier | 근거 강도와 무관한 최고 수준 설정 | Grounds 1건 + definitely |

**탐지 패턴 — Fabrication (Scope IN만):**

| 조건 | Stub 판정 기준 | 예시 |
|------|---------------|------|
| 영문 기관명 직접 등장 (en_direct) | 화이트리스트 영문 기관명(McKinsey/IDC/Gartner 등) + 연도 + 수치, 출처 표기 없음 | `"McKinsey 2024: 이탈률 34%"` |
| 영문 기관 접미어 (en_suffix) | 영문 기관 접미어(Research/Institute/Consulting 등) 조합 + 연도 + 수치, 출처 표기 없음 | `"Global Strategy Consulting 2024: 34%"` — 가상 기관명도 포착 |
| 한글 기관명 직접 등장 (ko_direct) | 화이트리스트 한글 기관명(통계청/한국은행/소프트웨어산업협회 등)이 Grounds/Backing에 있으나 출처 표기 없음 | `"통계청 KOSIS 2024: 28%"` |
| 한글 기관 접미어 (ko_suffix) | 한글 기관 접미어(협회/연구원/연구소 등) + 연도 + 수치, 출처 표기 없음 | `"한국컨설팅연구원 2024: 27%"` |

> **Scope OUT** (L2 탐지하지 않음 — L3에서 처리):
> - 사람 이름 (`Smith et al.`, `김현철 교수`)
> - 보고서·논문·책·기사명
> - 제품·법안·사건 고유명
> - URL 유효성 (실존·내용 대조)
> - 값 정확성 (원문 대조)

**Fabrication 검증 예외 (false positive 방지) — 복합 조건**:

다음 조건 중 하나라도 해당되면 Fabrication 판정을 **하지 않는다**. 키워드만으로 통과시키지 않고 **구조적 뒷받침**을 요구하여 bypass를 차단한다.

- **자체 데이터 맥락 표기 (복합)**: 키워드 하나만으론 부족. 아래 구조 중 하나 필수:
  - 키워드(`자체 조사|자체 데이터|내부 조사|인하우스|internal survey|internal data|in-house study|in-house research`) + `(n=\d+)` 표본 크기
  - 키워드 + `표본 \d+명` 한글 표현
  - 키워드 + `file:` / `dir:` 경로 동반
- **파일 경로 출처**: `file:{path}` 또는 `dir:{path}` 참조 (단독으로도 유효)
- **Research finding ID**: `#\d{3}` (3자리 ID) 또는 `\[리서치 #\d{3}\]`
- **URL**: `http://` 또는 `https://` 링크 (실존 확인은 L3)
- **DOI**: `doi:`, `DOI:`, `10\.\d{4,}/` 패턴
- **섹션 내부 교차참조 (식별자 요구)**:
  - `§\d+` — `§` 뒤 **숫자 필수**. 단독 `§`는 예외 미발동
  - `Appendix [A-Z\d]+` — `Appendix` 뒤 **식별자 필수** (예: `Appendix A`, `Appendix 1`). 단독 `Appendix`는 예외 미발동
  - `{NN}-[a-z]+` — 섹션 번호 형식 (예: `02-solution`)

> **왜 복합 조건인가**: 이전 구현은 `자체 조사`, `§`, `Appendix` 키워드만 존재하면 통과시켜 AI가 prefix/suffix만 붙여 bypass했다. 구조적 뒷받침을 요구하면 정당한 사용은 통과시키면서 단순 우회는 차단된다.

**탐지 방법:**
1. **처리 단위**: 각 Toulmin 필드를 **불릿(`-` 또는 `*`으로 시작하는 라인) 단위로 분리**하여 개별 검사. 한 불릿 안에 여러 문장이 있으면 해당 불릿 하나를 범위로 본다. 여러 불릿에 걸친 cross-match는 발생하지 않는다.
2. Filler 체크:
   - Grounds에 T1/T2 출처명, 수치, 연도, 사례명 등 구체적 식별자가 하나도 없으면 stub 의심
   - Warrant가 Claim의 키워드를 80% 이상 반복하면 동어반복 stub
   - Rebuttal에 구체적 반론 명제가 없으면 stub (대응만 있고 반론 자체가 generic)
3. Fabrication 체크 (정규식 — Scope IN만, **화이트리스트 + 접미어 2단 방식, 한·영 대칭**):

   각 정규식의 `.*?` 부분은 **문장 경계(`.`, `!`, `?`, 줄바꿈)를 넘지 않는다**. 즉 `[^.!?\n]*?` 로 제한하여 한 문장 안에서만 매칭.

   - **en_direct**: 영문 기관명 화이트리스트 + 연도 + 수치 (같은 문장 안)
     ```
     \b(McKinsey|IDC|Gartner|HubSpot|Forrester|Deloitte|Statista|CB Insights|PwC|Bain|BCG|KPMG|EY|Accenture|Nielsen|Ipsos|Pew|Harvard|MIT|Stanford|Oxford|Cambridge|OECD|IMF|WHO|UN)\b[^.!?\n]*?20\d{2}[^.!?\n]*?(\d+\.?\d*%|\$\d+(?:\.\d+)?[BMK]?|\d+\.?\d*배)
     ```
   - **ko_direct** (C1 해소 + cycle 5 KM 확장): 한글 기관명 화이트리스트 + 연도 + 수치 (같은 문장 안). 한글 복합 단위(`조원|억원|백만원|천만원|만원`) 포함.
     ```
     (통계청|KOSIS|한국은행|소프트웨어산업협회|한국개발연구원|한국인터넷진흥원|삼성경제연구소|LG경제연구원|현대경제연구원|금융감독원|DART|KDI|KISA|SERI)[^.!?\n]*?20\d{2}[^.!?\n]*?(\d+\.?\d*\s*(?:조|억|백만|천만|만)?원|\d+\.?\d*%|\$\d+|\d+\.?\d*배|\d+\s*명)
     ```
   - **en_suffix**: 영문 기관 접미어 패턴 + 연도 + 수치 (같은 문장 안)
     ```
     \b[A-Z][a-zA-Z]+\s+(Research|Institute|Consulting|Group|Insights|Labs|Partners|Associates)\b[^.!?\n]*?20\d{2}[^.!?\n]*?(\d+\.?\d*%|\$\d+(?:\.\d+)?[BMK]?|\d+\.?\d*배)
     ```
   - **ko_suffix** (cycle 5 KM 확장): 한글 기관 접미어 패턴 + 연도 + (수치 권장)
     ```
     [가-힣]{2,}(협회|연구원|연구소|공사|청|원|부|위원회|재단|진흥원|개발원)\s*20\d{2}
     ```
   - **ko_vague** (cycle 5 신설 — AU6 해소): 모호한 귀속 표현 + 수치 (두 문장 걸친 bypass 방지)
     ```
     (산업 표준|업계 평균|업계 기준|일반적으로|통상|보통|기준으로|20\d{2}년?\s*기준)[^.!?\n]*?(\d+\.?\d*\s*(?:조|억|백만|천만|만)?원|\d+\.?\d*%|\$\d+|\d+\.?\d*배)
     ```
   - **en_vague** (cycle 5 신설 — AU6 해소): 영문 vague attribution
     ```
     (industry average|industry standard|benchmark|reported|according to|studies show)[^.!?\n]*?(\d+\.?\d*%|\$\d+(?:\.\d+)?[BMK]?|\d+\.?\d*배)
     ```
   - 매칭된 각 건에 대해 위 "Fabrication 검증 예외" 조건을 먼저 확인 — 해당되면 통과
   - 예외에 해당하지 않으면 같은 불릿 안에 URL / `file:`/`dir:` / `#\d{3}` / DOI 중 하나가 **형식상 존재하는지** 요구 (존재 여부만 검증, 유효성은 L3 책임)
   - 출처 표기 미존재 시 fabrication stub 의심

> **왜 화이트리스트 방식인가**: 단순 `[A-Z][a-zA-Z]+\s+20\d{2}` 패턴은 `"In 2024, market grew 34%"`, `"Oct 2024 report"`, `"Meeting Notes 2024 Q1: 34%"` 같은 **일반 영문 표현을 false positive**로 잡는다. 화이트리스트(en_direct) + 영문 기관 접미어(en_suffix)의 2단 구조로 한글 패턴과 대칭을 이루며 false positive를 제거한다.

> **왜 ko_direct에 연도·수치 조건을 추가했는가**: 이전 구현은 한글 기관명 단어만 있어도 매칭해 `"통계청 홈페이지를 참고하세요"` 같은 사실 언급까지 reject했다. 영문과 대칭으로 `기관명 + 연도 + 수치` 3요소를 모두 요구하여 사실 언급은 통과시키고 fabrication만 탐지한다.

> **왜 문장 경계를 두는가**: 이전 `.*?`는 greedy backtracking으로 무관한 두 문장을 cross-match했다. `[^.!?\n]*?`로 한 문장 안에서만 매칭하게 하여 `"Harvard는 좋은 대학이다. 2024년 34% 성장."` 같은 두 문장 과도 매칭을 막는다.

> **탐지 우선순위** (중복 플래그 방지, 한 번만 flag): (1) en_direct → (2) ko_direct → (3) en_suffix → (4) ko_suffix. 상위에서 플래그되면 하위는 건너뛴다. 본 문서와 `references/fabrication-prevention.md`는 동일한 우선순위를 사용한다.

**L2a 참조 실존 확인 (cycle 4 신설, cycle 5 독립 validator로 확장 — AU7 해소)**:

cycle 4까지 L2a는 "L2 Exception 발동 시만" 작동했다. cycle 5에서 **독립 validator로 확장** — L2 정규식 매칭 여부와 무관하게 모든 Toulmin 필드를 스캔하여 참조 패턴 실존 확인.

**독립 실행 절차**:

1. Toulmin 필드(Grounds/Backing/Warrant/Rebuttal) 전체에서 아래 패턴 **독립적으로** 탐색:
   - `#\d{3}` → `Glob("research/{NNN}-*.md")`
     - 파일 있음 → pass
     - 없음 → `unverified: true` 플래그 부착
   - `file:{path}` / `dir:{path}` → `Read` 시도로 실존 확인
     - 성공 → pass
     - 실패 → `unverified: true` 플래그
   - `§\d+` → 숫자가 프로젝트 섹션 번호 범위(00-thesis, 01-03 planning, 04-09 spec) 내인지 확인
     - 범위 내 → pass
     - 범위 밖 → `unverified: true` 플래그

2. L2 정규식이 매칭 안 한 경우에도 참조 패턴만 있으면 L2a 발동. 예:
   - `"어떤 연구(#456)에 따르면 34%"` — 기관명·연도 매칭 없음 → L2 미매칭
     - L2a 독립 실행 → `#456` Glob → 미실존 → **unverified 플래그**

3. **research/ 디렉토리 없는 프로젝트 처리 (cycle 6 AU14 해소)**: 디렉토리 유무로 L2a를 비활성화하지 않는다. 참조별 독립 판정:
   - `#NNN` 참조 있음 + `research/` 디렉토리 없음 → `Glob` 결과 비어있음 → **unverified 플래그** (보수적 판정)
   - `file:{path}` 참조 있음 + 경로 미실존 → Read 실패 → **unverified 플래그**
   - 참조 패턴이 아예 없는 섹션 → L2a는 아무것도 하지 않음 (no-op)

> **cycle 4 → cycle 5 → cycle 6 변화**:
> - cycle 4: L2 Exception 조건부 검증 (한정적)
> - cycle 5: 독립 검증으로 확장했으나 "research/ 디렉토리 유무"로 일괄 비활성화 조건 남아있었음 (AU14)
> - cycle 6: 참조별 독립 판정 — 디렉토리 유무는 개별 `Glob` 결과에만 영향

**검증 결과 (cycle 4 재분류)**:

- **Filler stub 발견** → `❌ Stub 탐지 (filler): {필드} — {이유}` → **settle 거부** (기존 유지 — filler는 여전히 차단)
- **Fabrication 의심 (L2 warning)** 또는 **L2a 미실존** → `⚠️ Fabrication 의심: {필드} — "{구체 값}" 출처 미연결 또는 참조 미실존` → **`unverified: true` 플래그 부착, settle 허용**
  - 사용자에게 알림: "ℹ️ unverified 플래그 {N}건 부착. draft/finalize 전에 해소 필요:
    1. 해당 인용의 URL/파일 경로/DOI를 직접 명시 → `/sowhat:revise`
    2. `/sowhat:research` 또는 `/sowhat:inject`로 검증된 finding에 매핑 후 `#NNN` 삽입
    3. 자체 데이터인 경우 `자체 조사 (n=N)` + `file:` 경로 명시
    4. 구체 인용을 제거하고 정성 기술로 대체 + Qualifier 하향"
- **경계 사례** → `⚠️ Stub 의심: {필드} — {이유}` → 경고 (플래그 없음, 거부 아님)

### unverified 플래그 스키마 (cycle 4 신설, cycle 5 확장 — AU8 해소)

Toulmin 필드의 의심 불릿에 메타 부착. 두 가지 형식 지원:

**Frontmatter 방식** (권장 — 파싱 용이, cycle 5에서 `detected_by` 배열화):

```yaml
---
last_challenged_at: "2026-04-21T..."  # cycle 5 신설 — L4 게이트가 auto-invoke 판정에 사용
unverified_items:
  - field: "grounds"
    bullet_index: 2
    value: "McKinsey 2024: 34%"
    reason: "retrieval 없는 구체값"
    detected_by:                      # cycle 5: 배열화
      - "L0-user"                     # L0 사용자 경로 감지
      - "L2-en_direct"                # L2 warning (어느 정규식인지 명시)
    detected_at: "2026-04-21T..."
---
```

**detected_by 값**:
- `L0-ai`: L0 AI 경로에서 LLM이 규칙 어기고 제시 → 사용자 수락
- `L0-user`: L0 사용자 경로 — 미출처 직접 입력
- `L2-en_direct` / `L2-ko_direct` / `L2-en_suffix` / `L2-ko_suffix`: L2 정규식 매칭
- `L2-ko_vague` / `L2-en_vague`: vague attribution 매칭 (cycle 5 신규)
- `L2a-finding_miss`: research/#NNN 미실존
- `L2a-file_miss`: file:/dir: 경로 미실존
- `L2a-section_miss`: §N 범위 밖

**중복 감지 처리**: 같은 bullet이 여러 layer에서 플래그되면 `detected_by` 배열에 모두 추가, 별도 엔트리 생성 금지. L4 게이트는 `bullet_index` 기준 unique count.

**인라인 방식** (보조 — 시각 확인 용):

```markdown
## Grounds
- 구체적 근거 1
- "McKinsey 2024: 34%" ⚠️ unverified (L0-user, L2-en_direct)
- 구체적 근거 3
```

두 형식은 동기화 유지. L4 게이트는 frontmatter를 집계한다.

---

### Cross-Section Regression Gate

이 섹션을 settle함으로써 기존 settled 섹션과의 논증 일관성이 깨지는지 검증한다.

**검증 대상:**
1. **Claim 충돌**: 이 섹션의 Claim이 다른 settled 섹션의 Claim과 모순되지 않는가?
2. **Grounds 의존 깨짐**: 다른 settled 섹션의 Grounds가 이 섹션의 Claim을 전제로 하는 경우, 전제가 여전히 유효한가?
3. **thesis 정합성**: 이 섹션을 포함한 전체 settled 섹션의 Claim이 thesis Answer를 논리적으로 지지하는가?

**검증 방법:**
1. 모든 settled 섹션의 Claim + Grounds + Warrant를 로드
2. 이 섹션의 Claim과 각 settled 섹션의 Claim 간 논리적 모순/충돌 검사
3. 이 섹션을 인용하는 다른 섹션의 Grounds 텍스트에서 전제 유효성 확인
4. thesis Answer → Key Arguments → 각 섹션 Claim의 논리 체인 검증

**검증 결과:**
- 충돌 없음 → 조용히 통과 (표시 없음)
- 충돌 발견 → 경고 출력 (settle 거부는 아님, verify-argument checkpoint에서 인간이 판단):
  ```
  ⚠️ Cross-section regression 감지

  {N}-{section}의 Claim과 충돌:
    이 섹션: "{this claim}"
    {N}-{section}: "{other claim}"
    충돌: {충돌 설명}

  [영향받는 섹션]: {section list}
  ```

---

### Scheme별 추가 검증

- `statistics` scheme → 실제 수치/데이터가 Grounds에 있어야 함. 없으면 거부
- `authority` scheme → 출처/전문가가 Backing에 명시되어야 함. 없으면 거부
- `analogy` scheme → 비교 대상이 명시되어야 함. 없으면 거부
- `cause-effect` scheme → 인과 메커니즘이 Warrant에 설명되어야 함. 없으면 경고

검증 방법: 각 항목을 읽고 논리적 정합성을 판단한다.

## 검증 실패 시

```
❌ settle 거부: {섹션 이름}

이유:
- {구체적 이유 1}
- {구체적 이유 2}

해소 필요:
- {무엇을 해야 하는지}
```

settle을 거부하고 종료한다.

## 검증 통과 시

### 0. verify-argument Checkpoint

자동 검증 결과를 인간에게 제시하고 승인을 받는다 (`references/checkpoints.md` 참조):

```
**[verify-argument]** {섹션 이름}

> [settle {섹션 이름} > verify-argument]
> 자동 검증 결과:
> {각 검증 항목: ✅ 통과 / ⚠️ 경고 목록}

[1] 승인 — settle 진행
[2] 수정 필요 — 어떤 부분?
[3] 건너뛰기 — 나중에 다시
```

- `[1]` → 아래 Step 1~8 실행
- `[2]` → 인간의 수정 지시를 받아 반영 후 재검증
- `[3]` → session.md에 `status: awaiting_checkpoint` 저장, 종료

### 1. 파일 업데이트

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

- `status: settled`로 변경
- `updated: {current_datetime}`로 변경

### 2. Git commit (상태 변경)

```bash
git add {section_file}
git commit -m "settle({section}): {claim 한 줄 요약}"
```

### 3. GitHub Issue 업데이트

```bash
gh issue close {issue_number}
gh issue edit {issue_number} --add-label "settled" --remove-label "draft,discussing,needs-revision"
```

### 4. config.json 업데이트

해당 섹션의 `status`를 `"settled"`로 변경한다.

### 5. 00-thesis.md 업데이트 (기획 섹션의 경우)

Key Arguments 체크박스를 체크한다:
- `- [ ] {논거} → {N}-{section}.md` → `- [x] {논거} → {N}-{section}.md`

### 6. logs/argument-log.md 추가

`logs/argument-log.md`에 append한다 (파일이 없으면 `# Argument Log` 헤더와 함께 생성):

```markdown
## [{current_datetime}] settle({section})
  Action: status → settled
  Before: {이전 status}
  After: settled
  Claim: {claim 한 줄 요약}
  Scheme: {scheme}
  Qualifier: {qualifier}
  Warrant: {명시됨 | Implicit}
```

### 7. Git commit (로그 업데이트)

```bash
git add logs/argument-log.md planning/config.json 00-thesis.md
git commit -m "wip(logs): settle log for {section}"
```

### 7.5. logs/session.md 업데이트

```markdown
---
command: settle
section: {N}-{section}
step: complete
status: complete
saved: {current_datetime}
---

## 마지막 컨텍스트
settle 완료 — {N}-{section} settled 전환. Claim: {claim 한 줄}

## 재개 시 첫 질문
/sowhat:expand {next} → 다음 섹션 전개
```

### 8. 완료 안내 + 논증 구조 요약 + 강도 점수

완료 메시지와 함께 논증 구조 및 강도 점수를 **인라인으로 즉시 출력**한다.
강도 점수는 `references/strength-scoring.md`의 알고리즘으로 계산한다.

```
----------------------------------------
✅ settled: {섹션 이름}
  Issue #{N} closed
----------------------------------------

📋 논증 구조 요약

  📌 Claim [{scheme} / {qualifier}]
    {Claim 전문}

  🔍 Grounds
    {Grounds 전문}

  🔗 Warrant
    {Warrant 전문 | ⚠️ Implicit — 명시화 권장}

  📚 Backing
    {Backing | 없음}

  ⚡ Rebuttal
    {Rebuttal | 없음}

📊 논증 강도: {section_score}/100 [{등급}]
  근거     [{evidence_bar}] {evidence_score}/35
  논리     [{logic_bar}]    {logic_score}/30
  방어     [{defense_bar}]  {defense_score}/20
  보정     [{calibration_bar}] {calibration_score}/15
  {60 미만이면: ⚠️ 논증 강도가 낮습니다. /sowhat:debate {section}으로 강화를 권장합니다.}

----------------------------------------
⚠️  컨텍스트 관리 권장
  세션이 길어졌을 수 있습니다.

  [1] /clear 후 재시작 (상태는 파일에 저장됨)
  [2] /compact (압축 요약)
  [3] 계속 진행
----------------------------------------

----------------------------------------
다음 액션:

[1] 다음 섹션 전개 (expand {next})
[2] 전체 트리 검증 (challenge) — 모든 섹션 settled 후
[3] 변증법 강화 (debate {section})
[4] 논증 수정 + 영향 점검 (revise {section})
----------------------------------------
```

## 핵심 원칙

- **완료는 인간이 선언한다** — Claude가 자동으로 settle하지 않는다
- **검증은 Claude가 한다** — 논리적 정합성 + Toulmin 구조 완결성을 확인한다
- **검증 실패 시 거부** — 무엇을 해소해야 하는지 명시한다
- **Warrant "Implicit"은 경고** — 거부까지는 아니지만 약한 논증임을 표시한다
- **Stub은 거부한다** — 형식만 채운 빈 껍데기 논증은 settle 불가
- **Regression은 경고한다** — 기존 settled 섹션과 충돌하면 인간이 판단
