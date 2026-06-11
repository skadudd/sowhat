# UX — 미리보기 게이트 (Preview Gate)

draft·finalize·finalize-planning 전용 미리보기 게이트 포맷·분기 규칙. 해당 command가 `@`-import한다. (ux-standards.md 코어에서 분리.)

---

## 10. 미리보기 게이트 (Preview Gate)

**적용 범위**: `draft`, `finalize`, `finalize-planning` — 다파일 생성 또는 외부 git commit이 발생하는 커맨드.
**적용 제외**: `expand`, `settle`, `revise` — 이미 인터랙티브 핑퐁 구조이므로 추가 게이트는 마찰.
**스킵 조건**: `--force` 또는 `--no-preview` 플래그 전달 시 게이트를 건너뛰고 즉시 실행.

### 미리보기 출력 포맷

```
> [draft > 미리보기 게이트]

📋 생성될 파일:
  export/linkedin-series/01-problem.md       (신규)
  export/linkedin-series/02-solution.md      (신규)
  export/linkedin-series/index.md            (신규)

📊 영향:
  settled 섹션 3개 → 산출물 3개
  status 전이 없음

[1] 이대로 만들기
[2] 취소
[3] 수정 요청 (자유 입력)
```

### 분기 처리

- `[1]` → 즉시 실행
- `[2]` → 종료
- `[3]` → 사용자 수정 요청 자유 입력 → 미리보기 재생성 → 반복 (최대 3회)
- 그 외 텍스트 입력 → `[3]`과 동일 처리

### 요약 규칙

| 항목 | 규칙 |
|------|------|
| 파일 목록 | 생성/수정/삭제 파일 전체. 경로는 상대경로 |
| 상태 전이 | 영향받는 섹션 + 변경 후 상태 표시 |
| 수정 루프 | 최대 3회. 초과 시 취소로 처리 |
| `--no-preview` | 미리보기 전혀 없이 즉시 실행 |
