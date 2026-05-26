---
status: settled
stasis: 사실
scheme: cause-effect
qualifier: in most cases
grounds_structure: mixed
version: 2
section: 4
title: ops-loop
---

# 04-ops-loop — 운영 closed loop

## Claim
JIRA attribution + 의사결정 트리(L1) + ad-hoc escalation(L3)의 분리 설계가 거시 자동화와 미시 격리를 동시에 가능하게 한다.

## Grounds

**G1 — JIRA Attribution**
조직의 모든 의도적 개입을 JIRA 티켓으로 기록 → 변동 시점 후보군을 자동으로 좁힘.

**G4 — 운영 변화 정량 4건**
- DA 3명 채용공고 회수
- 5개 기능 팀 KPI 추출 셀프서비스 전환
- 주간 회의 보고서 backup 자동 생성
- 월간 → 주간 대표 보고 (빈도 4배 증가)

## Rebuttal

### R2 — 외부 변동 Confounding 차단
G4 4건은 동시 발생한 외부 변동이 아니라 분리 설계 메커니즘에 직접 추적 가능하다. DA 채용 회수의 근거는 셀프서비스 흡수로 인한 ad-hoc 분석 요청 감소다. 보고 빈도 가속의 근거는 보고서 backup 데이터 자동 생성이다. 두 변화 모두 분리 설계의 메커니즘에 직접 연결된다.
