# /sowhat:self-critic — 사용자 논증 5차원 자기 비평

<!--
@metadata
checkpoints:
  - type: decision
    when: "비평 결과 수용/무시"
config_reads: [layer, sections]
config_writes: []
continuation:
  primary: "/sowhat:revise {section} (약점 수정)"
  alternatives: ["/sowhat:expand {section}", "/sowhat:debate {section}"]
status_transitions: []
-->

이 커맨드는 사용자 자신의 논증 섹션을 외부 비평가의 시선으로 5차원 분석한다. challenge가 논리 공격인 것과 달리, self-critic은 구조적 약점 식별과 개선 방향 제시에 집중한다.

## 인자 파싱

```
/sowhat:self-critic [section] [--dimension {1|2|3|4|5|all}]
```

- `section`: 섹션 번호 또는 이름 (예: `02`, `market`, 생략 시 선택 메뉴)
- `--dimension N`: 특정 차원만 분석 (생략 시 전체 5차원)

## 사전 검증

1. `planning/config.json` 로드
2. 섹션이 지정되지 않으면:
   ```
   어떤 섹션을 비평할까요?

   [1] 전체 섹션 요약 비평
   {섹션별 번호 목록}
   ```
3. 지정된 섹션 파일 로드 — `draft`, `discussing`, `settled`, `needs-revision` 모두 가능. `invalidated`는 제외.
4. `00-thesis.md` 로드 (전체 맥락 파악용)

## Self-Critic Agent 스폰

```
Task(
  subagent_type: "sowhat-self-critic-agent",
  prompt: """
  <thesis>{thesis_answer} + {key_arguments}</thesis>
  <section>{섹션 Toulmin 전체 구조}</section>
  <section_name>{section_name}</section_name>
  <dimension>{dimension or "all"}</dimension>
  """
)
```

## 결과 표시

Agent 결과를 그대로 출력한다.

### 후속 액션 제시

```
----------------------------------------
이 섹션의 Self-Critic 분석이 완료되었습니다.

[1] 약점 수정 (/sowhat:revise {section})
[2] 근거 강화 (/sowhat:expand {section})
[3] debate로 심화 검증 (/sowhat:debate {section})
[4] 다른 섹션 비평
----------------------------------------
```

## 핵심 원칙

- **self-critic은 파일을 수정하지 않는다** — 분석 리포트만 출력
- **challenge와 역할 분리**: challenge는 논리 공격(Walton scheme 등), self-critic은 구조 진단
- **개선 방향은 구체적으로**: "/sowhat:revise로 Grounds에 T2 이상 출처 추가 권장" 수준까지
