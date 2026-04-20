# Fabrication Prevention — AI 생성 콘텐츠의 허구 인용 차단

sowhat의 모든 워크플로우가 참조하는 단일 규칙. AI가 사용자에게 제시하는 **선택지·제안·예시·placeholder·힌트**에 fabrication 가능한 고유값을 포함하지 않는다.

## 왜 이 규칙이 필요한가

expand 같은 핑퐁 워크플로우에서 AI는 선택지를 구체적으로 생성하도록 지시받는다. 예: `[1] McKinsey 2024 리포트: 이탈률 34%`. 이 값은 retrieval 없이 LLM이 생성한 것이며, 존재하지 않을 수 있다. 사용자가 그 선택지를 수락하면 **그럴듯하지만 실재하지 않는 인용**이 Backing으로 저장된다.

Stub Detection은 `"전문가 의견"` 같은 모호한 filler는 잡지만, `"McKinsey 2024: 34%"` 같은 specific-looking fabrication은 놓친다. Challenge Stage 0가 사후에 잡지만, 그 전에 섹션이 settle될 수 있다. 따라서 **생성 자체를 차단**하는 것이 근본 해결이다.

## 대상 워크플로우

- `expand`의 Claim/Warrant/Backing/Rebuttal 제안 선택지
- `autonomous`의 Toulmin 필드 자동 생성
- `debate`의 Con/Pro 제안 (인용 포함 시)
- `branch`·`steelman`·`critic`의 대안 제안 (인용 포함 시)
- `revise`의 수정 제안
- 모든 워크플로우 문서 안의 `예)` `예:` `예시:` 문구
- 사용자에게 출력되는 모든 placeholder·힌트

## 금지되는 고유값

AI가 retrieval 없이 생성하면 안 되는 것:

- **수치**: 구체 %, 배수, 금액, 건수, 연율 (예: `34%`, `CAGR 27.8%`, `$12.3B`, `3.2조원`, `3.5배`)
- **기관명**: 실재하는 조직·기업·학술지·매체 이름 (예: `McKinsey`, `IDC`, `Gartner`, `HubSpot`, `KOSIS`)
- **사람 이름**: 실재하거나 실재할 법한 인물 (특정 교수·CEO·저자·전문가)
- **보고서·논문·책·기사명**: 구체 출판물
- **연도 + 출처 조합**: `McKinsey 2024`, `IDC 2023` 등 검증 불가한 조합
- **제품·법안·사건 고유명**: 실재로 오인될 수 있는 명칭
- **URL**: 실제로 존재하는지 확인되지 않은 주소

## 허용되는 표현

구조와 유형은 제시하되, 검증 가능한 고유값은 비운다:

- **플레이스홀더**: `{기관} {연도}: {수치} {단위}`
- **유형 설명**: `"업계 벤치마크 이탈률 수치"`, `"전환 비용에 대한 기관 연구"`
- **구조적 예시**: `"A is like B in respect C, therefore D"` (논리 구조만)
- **추상적 예시**: `"시장 성장률은 진입 타이밍의 적절성을 증명한다"` (수치 없이 논리만)
- **카테고리 힌트**: `"공개 리서치 리포트 (업계 조사기관 등)"` (type 지시, specific name 아님)

## 구체 내용이 들어올 수 있는 3가지 경로

아래 3가지만 허용된다. 이외 경로로 AI가 고유값을 생성하면 **fabrication**이다:

1. **사용자 직접 입력** (`[N] 직접 작성` 선택 시)
2. **Sub-Research 결과** (실제 WebSearch/WebFetch/Perplexity/Gemini 호출 후 반환된 데이터, 영수증 검증 통과)
3. **research/ 파인딩 매핑** (이미 검증된 finding의 인용)

## 워크플로우별 적용

### expand (선택지 생성)

Step 3(Claim)·Step 5(Warrant)·Step 7(Backing)·Step 8(Rebuttal 대응) 제안 선택지 생성 시:

**나쁨:**
```
[1] McKinsey 2024 리포트: 성장기 시장 진입자가 3배 높은 생존율
[2] IDC 2024: CAGR 27.8%, TAM $12.3B
```

**좋음:**
```
[1] 성장기 시장 진입자의 생존율 우위 (출처: Sub-Research 또는 직접 입력)
[2] 시장 CAGR과 TAM 수치 (출처: Sub-Research 또는 직접 입력)
```

또는:
```
[1] {기관} {연도}: {수치} {단위}
[2] 직접 작성
[3] 🔍 Sub-Research 실행
```

### autonomous (필드 자동 전개)

`workflows/autonomous.md` Step 1·3의 "수치·출처 할루시네이션 방지" 규칙이 이를 엄격하게 구현한다. Grounds/Backing에 수치가 필요한데 `research/` findings가 없으면:

1. Research-Agent를 스폰하여 외부 검색
2. 검색 결과에서 확인된 수치만 사용
3. 검색으로도 확인 불가 시: **수치 없이 정성 기술** + Qualifier를 `presumably` 이하

### settle (stub detection 보강)

specific-looking citation(기관명 + 숫자)에 검증 가능한 출처(URL, 파일 경로, research finding ID)가 없으면 의심 플래그.

### challenge Stage 0 (최종 방어선)

사후 사실 대조. 실패 시 🔴 critical.

## 워크플로우 문서 안의 예시 문구

워크플로우 문서(`workflows/*.md`, `references/*.md`)에 쓰인 `예)` `예:` `예시:` 문구도 이 규칙을 적용한다. 이유: 워크플로우가 실행될 때 이 문구가 그대로 사용자에게 출력되어 "제안"으로 오인될 수 있다.

**좋은 예시 문구:**
```
예) "국내 {산업} 시장은 연 {N}% 성장 중이다"
예) "{기관} {연도} 리포트, CAGR {N}%"
예) "{비율}%가 {요인}을 {결과} 이유로 언급"
```

**나쁜 예시 문구:**
```
예) "국내 SaaS 시장은 연 28% 성장 중이다"
예) "IDC 2024 리포트, CAGR 27.8%"
예) "78%가 통합 비용을 이탈 이유로 언급"
```

## 예외 (구체 값이 허용되는 경우)

- **규칙 설명의 negative example**: "이런 것은 금지"를 설명하기 위해 금지 예시를 인용하는 경우 (예: 이 문서의 "나쁜 예시" 블록)
- **실제 세션 로그**: `logs/` 디렉터리에 실제 핑퐁·검증 결과를 기록하는 경우 (사용자 입력 또는 retrieval 결과)
- **실재 검증된 인용**: 실제로 사용자가 입력했거나 retrieval로 확인된 인용을 섹션 파일에 저장하는 경우

## 검증 가능성

이 규칙의 준수 여부는 다음 명령으로 점검할 수 있다:

```bash
# 워크플로우 문서에서 구체 기관명·수치 스캔
rg "McKinsey|IDC |Gartner|CB Insights|KOSIS|HubSpot|CAGR|\d+\.\d+%|\$\d+\.\d+B|\d+\.\d+조" sowhat-core/workflows/ sowhat-core/references/
```

결과가 `fabrication-prevention.md` 본문(규칙 설명) 또는 `autonomous.md`의 금지 예시 나열 외에서 나오면 검토 대상이다.
