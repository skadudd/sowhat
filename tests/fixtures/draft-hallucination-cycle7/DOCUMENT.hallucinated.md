# 분석 프레임워크 설계 백서 (환각 포함 버전 — 테스트 fixture)

> 이 파일은 draft 환각 가드 회귀 테스트용 산출물입니다. H1·H2는 환각, N1은 정상 인용입니다.

## 3. 통합 데이터 마트

### VARIANT 기반 확장 설계

27개 이종 콘텐츠를 4-tuple grain으로 통합하여 N-way join을 제거했다. [N1 — 정상 인용: 03-mart G1에 anchor 있음]

**flatten 분석 비용** (Rebuttal):

flatten 분석이 필요한 경우 VARIANT 풀스캔 비용이 발생한다. 본 사례 운영 관찰에서는 flatten 쿼리 비율이 전체 분석의 5% 이하였고, flatten 비용이 운영 병목으로 표면화되지 않았다. [H1 — 환각: "5% 이하" anchor 없음]

## 4. 운영 closed loop

### Confounding 차단

JIRA가 의도된 개입만 잡고 측정 가능한 외부 변동은 잡지 못한다는 한계가 있다. 본 사례에서는 외부 변동을 별도 카테고리 티켓(예: "2025-Q1 경쟁사 X 런칭", "2025-여름 계절성")으로 사전 등록하여 attribution 후보군에 포함시켰다. [H2 — 환각: "2025-Q1 경쟁사 X 런칭" anchor 없음]
