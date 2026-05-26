# Eval Protocol — sowhat 회귀 검증

sowhat command의 동작을 회귀 보장하는 평가 프로토콜.
`tests/eval/*.yaml` 파일이 이 프로토콜에 따라 검증 시나리오를 정의한다.

---

## eval 파일 포맷 (YAML)

```yaml
name: "eval 이름"
description: "무엇을 검증하는가"
command: "/sowhat:command [args]"
fixtures:
  - path: "tests/fixtures/{file}"
    role: "input | reference | config"
checks:
  - type: "output_contains | output_not_contains | file_exists | file_not_exists | exit_code"
    value: "{기대값}"
    description: "검증 항목 설명"
severity: "blocking | warning"
```

---

## Check 유형

| type | 설명 | value |
|------|------|-------|
| `output_contains` | 출력 텍스트에 포함 여부 | 문자열 (정규식 가능) |
| `output_not_contains` | 출력 텍스트에 미포함 여부 | 문자열 |
| `file_exists` | 파일 생성 여부 | 파일 경로 패턴 |
| `file_not_exists` | 파일 미생성 여부 | 파일 경로 패턴 |
| `exit_code` | 프로세스 종료 코드 | 숫자 |
| `json_field` | JSON 파일 필드 값 | `{path}:{expected}` |

---

## Severity

- `blocking`: 실패 시 배포 불가. 핵심 동작 회귀.
- `warning`: 실패 시 경고. 부가 기능 저하.

---

## 실행 방법

```bash
# 단일 eval 실행
node scripts/eval-runner.js tests/eval/debate-sycophancy.yaml

# 전체 eval 실행
node scripts/eval-runner.js tests/eval/

# blocking만 실행 (CI용)
node scripts/eval-runner.js tests/eval/ --severity blocking
```

---

## Fixture 구조

```
tests/
  fixtures/
    thesis-sample.md          — 샘플 thesis (settled)
    section-01-sample.md      — 샘플 기획 섹션 (settled)
    section-02-sample.md
    config-planning.json      — planning layer config
    config-spec.json          — spec layer config
  eval/
    challenge-stage0.yaml
    debate-sycophancy.yaml
    critic-vs-self-critic.yaml
    preview-gate.yaml
    tier-ab-backing.yaml
```
