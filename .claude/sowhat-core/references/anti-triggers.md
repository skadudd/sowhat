# Anti-Triggers — 공통 비실행 조건 라이브러리

모든 sowhat command의 `## Anti-triggers` 섹션이 참조하는 공통 패턴.
Command별 고유 anti-trigger는 해당 command 파일에 직접 작성하고, 공통 패턴은 이 파일을 참조한다.

---

## 공통 Anti-trigger 패턴

### A. 단일 세션 제약

```
- 논증 없이 단발 메시지 ("이게 맞아?", "어떻게 생각해?")
- 대화 기록이 없는 상태에서 실행
- 현재 섹션이 없는 빈 프로젝트
```

### B. 작업 규모 제약

```
- 10줄 미만 초안 (확장이 아닌 기초 설계 단계)
- thesis가 없는 상태
- 논증 트리 없이 단독 실행
```

### C. 상태 불일치

```
- 대상 섹션이 invalidated 상태
- 상위 논거가 먼저 해결되어야 하는 상태
- planning-only 상태에서 spec/finalized 전용 커맨드 실행
```

### D. 중복 실행

```
- 이미 completed/finalized 상태인 프로젝트에서 re-init
- 이미 settled된 섹션에 expand 재시도 (challenge를 먼저)
- 동일 섹션에 대한 debate가 이미 진행 중일 때 중복 스폰
```

### E. Planning 단계 전용 제약

```
- spec/finalized 레이어에서 planning-only 커맨드 실행
- planning 레이어에서 spec 전용 커맨드 실행
```

---

## Command별 anti-trigger 매트릭스

| Command | 핵심 anti-trigger |
|---------|-----------------|
| `init` | 이미 config.json 존재 (덮어쓰기 의도가 아닌 한) |
| `expand` | settled 섹션에 재실행, thesis 없는 상태 |
| `settle` | draft/invalidated 상태의 섹션 |
| `challenge` | settled 섹션 0개, draft 상태만 존재 |
| `debate` | settled 섹션 0개, challenge 실행 전 |
| `finalize-planning` | unsettled 기획 섹션 존재, spec 레이어 이후 |
| `finalize` | 명세 섹션 (04~09) 미완성, planning 레이어 |
| `draft` | finalize-planning 미실행 (--force 제외) |
| `revise` | settled 상태 (challenge/debate로 먼저 재검토) |
| `research` | 논증 없이 단순 정보 검색 목적 (일반 웹 검색으로 대체) |
| `critic` | 외부 URL/내용 없이 실행, 사용자 자신의 논증 비평 (self-critic 사용) |
| `self-critic` | 외부 콘텐츠 비평 목적 (critic 사용), settled 섹션 없음 |
| `steelman` | 논증 완성 전 실행, challenge 결과 없이 실행 |
| `inject` | research finding 없이 실행 |
| `spec` | planning 레이어 미완성 |
| `map` | 섹션 1개도 없는 상태 |
| `progress` | — (언제든 실행 가능) |
| `resume` | — (언제든 실행 가능) |
| `note` | — (언제든 실행 가능) |
| `config` | — (언제든 실행 가능) |
| `snapshot` | 변경사항 없는 상태 (git clean) |
| `branch` | main에서 실행 (branch 전략 이해 필요) |
| `sync` | 빌드 시스템 없는 환경 |
| `character` | series 미설정 상태 |
| `series` | 단일 문서 프로젝트 |
| `autonomous` | 논증 트리 없는 초기 상태, 사용자 직접 참여 선호 시 |
| `add-argument` | settled 논증 트리에서 구조 변경 목적 (expand로 새 섹션 추가) |
