# Session Protocol

All sowhat commands that have multi-step workflows MUST save `logs/session.md` at start AND at completion.

## Start Save Pattern

Save at the beginning of each command (after initial validation, before first user-facing step):

```
---
command: {command-name}
section: {section-name or (auto)/(url)/(search)}
step: {current-step-name}
status: in_progress
saved: {current_datetime_ISO8601}
---

## 마지막 컨텍스트
{1-2 sentences describing current state and what was just decided}

## 재개 시 첫 질문
{exact question or action to resume from this point}
```

## Completion Save Pattern

Overwrite session.md when command finishes:

```
---
command: {command-name}
section: {section-name}
step: complete
status: complete
saved: {current_datetime_ISO8601}
---

## 마지막 컨텍스트
{command} 완료 — {1 sentence summary of what was achieved}

## 재개 시 첫 질문
{next suggested command}
```

## Optional Extension Fields

Workflows may add extra frontmatter fields beyond the base schema:

| Field | Used by | Meaning |
|-------|---------|---------|
| `sub_research_pending` | expand | `true` if Sub-Research agent was triggered and results are pending |
| `checkpoint_type` | settle, challenge | `verify-argument`, `decision`, or `human-input` when status is `awaiting_checkpoint` |

## Rules

- Always overwrite (not append) — session.md is a single-slot checkpoint
- `saved` field MUST use real system time: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- Update step field as workflow progresses through major stages
- Commands that are read-only (progress, map, resume) do NOT need session.md saves
- session.md is the primary input for `/sowhat:resume`
