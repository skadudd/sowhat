---
status: settled
stasis: 정의(+가치)
scheme: consequence
qualifier: in most cases
grounds_structure: linked
version: 1
section: 3
title: mart
---

# 03-mart — 통합 데이터 마트 (4-tuple + VARIANT)

## Claim
4-tuple grain이 cross-content 분석의 N-way join을 제거하고, VARIANT가 DDL 변경 없이 콘텐츠 확장을 흡수한다.

## Grounds

- G1: 27개 이종 콘텐츠를 `(USER_SEQ, EVENT_DT, CONTENT_NAME, EVENT_TYPE)` 단일 grain으로 통합 완료.
- G2: 콘텐츠별 특수 필드를 `EVENT_ARRAY` VARIANT(JSON 배열)로 저장 → schema-on-read.
- G3: cross-content 분석이 단일 테이블에서 수행 가능 → N-way join 불필요.

## Warrant
grain이 표준화되면 분석 복잡도가 올라가도 집계 기준이 흔들리지 않는다.

## Rebuttal
4-tuple grain은 빠른 집계를 위한 최상위 차원이며, 세부 차원이 필요한 분석은 EVENT_ARRAY VARIANT를 flatten하여 수행 가능하다. 단, flatten은 VARIANT 풀스캔에 의존하므로 쿼리 성능 비용이 발생한다.
