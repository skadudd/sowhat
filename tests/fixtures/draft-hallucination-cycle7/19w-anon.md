# ContentServiceX 데이터분석 프레임워크 설계 (익명화 버전)

> 이 문서는 회귀 테스트 fixture용으로 익명화된 버전입니다. 회사명·서비스명·개인정보는 제거됐습니다.

## 배경
콘텐츠 서비스에서 SSOT 부재로 분석 생산성 문제가 발생했다.

## 근거 수치
- DAU 코호트 mix 5버킷 false alarm 시스템적 제거
- 5개 기능 팀 KPI 셀프서비스 전환
- 월간→주간 보고 (4배)
- DA 3명 채용공고 회수
- 27개 콘텐츠 4-tuple grain 통합

## 설계
4-tuple grain으로 N-way join을 제거하고, VARIANT로 schema-on-read를 구현했다.
flatten이 필요한 분석은 UDF를 통합 마트 위에 적용하는 방식으로 흡수됐다.
외부 변동 메커니즘은 별도 추적하지 않았다.
