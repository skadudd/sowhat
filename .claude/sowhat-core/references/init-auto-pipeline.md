# Init — `--auto` 파이프라인 (research + auto 조합)

`/sowhat:init --research --auto`일 때의 전체 흐름. `workflows/init.md`가 `--auto` 분기에서 이 파일을 읽고 따른다.

---

## --auto 파이프라인 (research + auto 조합)

`/sowhat:init --research --auto`일 때의 전체 흐름.

**인간 개입 지점은 딱 두 곳**: (1) 최초 소스 수집, (2) critical checkpoint.

### 전체 흐름

```
[인간] 소스 수집 (R-1 대화형)
  ↓ "수집 완료"
[자동] R-2 분석 → R-3 종합 → R-4 thesis 자동 선택
  ↓
[자동] R-5 Key Args 매핑 → R-6 역 SCQ → R-7 파일 생성
  ↓
[자동] settle thesis (자동 승인)
  ↓
[자동] /sowhat:autonomous 실행
  │     (expand → mini-debate → settle → strength-check)
  │     ⚠️ critical checkpoint 시 일시정지 → 인간 개입 → 재개
  ↓
[자동] /sowhat:challenge 실행
  │     ⚠️ critical/major 이슈 발견 시 일시정지
  │     통과 시 계속
  ↓
[자동] /sowhat:draft 실행 (기본 프로파일)
  ↓
완료 리포트
```

### 소스 수집 (유일한 대화형 단계)

`--auto`여도 소스 수집(R-1)은 대화형으로 유지한다. 인간만 자료를 제공할 수 있다.

```
----------------------------------------
📚 Research + Auto 모드

  자료를 추가하세요. "수집 완료" 입력 시 자동 진행됩니다.
  (thesis 도출 → 전개 → 검증 → 산출물 생성까지 자동)

  [1] URL 입력
  [2] 파일 경로 (file:{path})
  [3] 폴더 경로 (dir:{path})
  [4] 토픽 검색
  [5] 수집 완료 → 자동 파이프라인 시작
----------------------------------------
```

[5] 이후 인간 입력 없이 전체 파이프라인 실행.

### autonomous 연결

init 완료 후 thesis를 자동 settle하고 autonomous를 실행한다:

```
settle thesis → autonomous 실행 시:
  - --skip-debate 없음 (mini-debate 포함)
  - --max-rounds 2 (기본값)
  - checkpoint 정책: autonomous 기존과 동일
    - thesis 방향 변경 → PAUSE
    - critical issue → PAUSE
    - claim broken → PAUSE
    - 3회 연속 settle 실패 → PAUSE
```

PAUSE 발동 시:
```
⚠️  AUTO PIPELINE 일시정지

  이유: {checkpoint 유형}
  현재 진행: {autonomous N/M 섹션}

  [1] 문제 해결 후 자동 재개
  [2] 수동 모드로 전환 (자동 파이프라인 종료)
  [3] 파이프라인 중단
```

[1] 선택 → 인간이 문제를 해결하면 나머지 파이프라인 자동 재개.
[2] 선택 → 이후 인간이 수동으로 expand/settle/challenge/draft 실행.

### challenge 연결

autonomous 완료 후 (Post-Autonomous challenge 포함) 추가 이슈가 없으면 draft로 진행.
이슈 있으면:

```
⚠️  Challenge에서 {N}건 발견

  [1] 자동 수정 후 재도전 (revise → re-challenge)
  [2] 수동 모드로 전환
  [3] 무시하고 draft 진행 (⚠️ 이슈 있는 상태로 산출물 생성)
```

[1] 선택 시: 각 이슈를 자동 revise → challenge 재실행 (최대 2회 반복).

### draft 연결

challenge 통과 후 draft를 자동 실행한다.

**기본 프로파일 적용:**
- 유형: 보고서 (report)
- 독자: 일반 (general)
- 길이: 중간 (medium)
- 시리즈: 단일 (single)

```
✅ Auto Pipeline 완료

  소스: {N}개 분석
  Thesis: "{thesis_answer}"
  섹션: {M}개 settled
  논증 강도: {score}/100
  산출물: drafts/{filename}

  총 소요: {시간}

  다음:
  [1] 산출물 확인 및 수정
  [2] 다른 프로파일로 재산출 (/sowhat:draft --profile)
  [3] 논증 강화 (/sowhat:debate)
```

### --auto + --profile 조합

draft 프로파일을 지정하고 싶으면:
```
/sowhat:init --research --auto --profile blog
/sowhat:init --research --auto --profile prd
/sowhat:init --research --auto --profile slide
```

`--profile` 없으면 기본값(report) 적용.
