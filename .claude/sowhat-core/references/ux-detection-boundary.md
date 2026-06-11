# UX — Detection-Only Scope Boundary

감지 전용 커맨드(progress/map/resume/sync)의 read-only 경계 규칙. 해당 command가 `@`-import한다. (ux-standards.md 코어에서 분리 — 비-detection command 로드 경감.)

---

## 9. Detection-Only Scope Boundary (CRITICAL)

**감지 전용 command는 파일 쓰기·git commit·Edit/Write/Bash(파일 생성) 도구 호출 금지.** 리포트 텍스트 출력만 허용한다.

### 감지 전용 command 목록

| Command | 허용 | 금지 |
|---|---|---|
| `/sowhat:progress` | Read, Glob, Grep | Write, Edit, Bash |
| `/sowhat:map` | Read, Glob, Grep | Write, Edit, Bash |
| `/sowhat:resume` | Read, Glob, Grep | Write, Edit, Bash |
| `/sowhat:sync` 감지 단계 | Read, Glob, Grep | Write, Edit, Bash — 반영 단계에만 허용 (명시적 확인 게이트 후) |

> `/sowhat:note`는 노트 저장이 주요 기능이므로 감지 전용이 아니다.

### 경계 게이트 규칙

감지 전용 command 실행 중 파일 쓰기가 필요한 상황이 발생하면:
1. **즉시 멈춘다** — 쓰기 없이 리포트만 출력한다
2. **경고 표시**: `⚠️ 이 command는 감지 전용입니다. 파일 변경은 허용되지 않습니다.`
3. 필요 시 변경을 수행할 수 있는 command를 안내한다

```
# 올바른 패턴 — progress는 읽기만
> /sowhat:progress 실행
→ 상태 표시 후 종료 (파일 변경 없음)

# 금지 패턴
> /sowhat:progress 실행
→ logs/session.md 업데이트  ← VIOLATION
```

### sync 감지/반영 분리

`/sowhat:sync`는 두 단계로 명확히 분리한다:
- **감지 단계**: 로컬 vs GitHub 상태 비교, diff 리포트 출력
- **반영 단계**: 사용자 명시적 확인([1]/[2]) 후에만 파일 쓰기·git 작업 허용

