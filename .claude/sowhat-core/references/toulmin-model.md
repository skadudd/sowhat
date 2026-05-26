# Toulmin Model — DEPRECATED (sowhat v3.0.0)

> **⚠️ 이 파일은 sowhat v3.0.0에서 폐기되었습니다.**
>
> **대체**: `@.claude/sowhat-core/references/walton-schemes.md` (Walton Argumentation Schemes)
>
> **보존 원본**: `@.claude/sowhat-core/references/archive/toulmin-model.md`

---

## Breaking Changes 요약

| v2.x | v3.0.0 | 참조 |
|---|---|---|
| `warrant` | 삭제 (scheme 선택으로 흡수) | `walton-schemes.md` |
| `backing` | CQ 응답으로 흡수 | `walton-schemes.md` |
| `qualifier` (definitely/usually/...) | `confidence` (Tetlock band) | `calibration-guide.md` |
| `rebuttal` | 미충족 CQ로 흡수 | `walton-schemes.md` |
| `claim_tier: A/B` | `confidence ≥60%` / `<60%` | `calibration-guide.md` |
| 8 Toulmin schemes | 10 Walton schemes | `walton-schemes.md` |

## Migration

```bash
node scripts/migrate-toulmin-to-walton.js --section planning/sections/XX-*.md
```

상세 변환 규칙 → `scripts/migrate-toulmin-to-walton.js` 헤더 주석 참조.
