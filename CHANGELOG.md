# Changelog

All notable changes to sowhat are documented here.

---

## [2.3.0] — 2026-05-26

### Breaking Changes

- **`/sowhat:finalize` no longer generates files.** It is now a pure state terminator (challenge → layer:finalized → git commit only). All output documents are now generated exclusively by `/sowhat:draft`. Existing workflows that relied on `finalize → export/PROJECT.md` will need to switch to `/sowhat:draft --deliverable prd`.
- **`debate` default stance changed from `persuade` to `critique`.** Using `--stance persuade` now shows an explicit warning. This prevents Research-Agent from automatically favoring user-supporting evidence.
- **`gsd-export` deliverable removed.** The `prd` deliverable remains (targeting Jira/Linear/PM tools generally).

### New Features

- **`/sowhat:self-critic`** — New command and agent for analyzing the user's own argument structure (5-dimension Toulmin critique). Distinct from `/sowhat:critic` which analyzes external content.
- **`critique-dimensions.md`** — Shared 5-dimension critique standard (Completeness, Validity, Evidence Quality, Qualifier Appropriateness, Rebuttal Coverage) used by both critic-agent and self-critic-agent.
- **Claim Tier A/B differentiation** — `claim_tier` field added to Toulmin model. Tier-A (core) requires T1/T2 sources; Tier-B (supporting) allows T3/T4 + qualifier weakening. Affects `settle` gating and `challenge` Stage 0 severity.
- **Preview gate** — `draft`, `finalize`, `finalize-planning` now show a file list + action preview before executing. `[1]` continue, `[2]` cancel, `[3]` revise. Skip with `--no-preview`.
- **Security hooks** — `.claude/hooks/pre-tool-security.js` (PreToolUse) blocks writes to build artifact directories and secret files. `.claude/hooks/post-tool-validate.js` (PostToolUse) runs source-tag-parser on changed `.md` files.
- **`settings.json`** — Team-shared permissions.deny (destructive commands blocked) + hook registration.
- **`anti-triggers.md`** — Shared anti-trigger pattern library for all 27 commands.
- **All 27 commands** — Added `license`, `compatibility`, `When to Apply`, `Anti-triggers`, `Methodology`, `Output Format` sections. Destructive commands (`revise`, `draft`, `finalize`, `finalize-planning`, `autonomous`) marked `disable-model-invocation: true`.
- **Eval infrastructure** — `.claude/tests/eval/*.yaml` regression suite: debate-sycophancy, preview-gate, tier-ab-backing, critic-vs-self-critic, challenge-stage0.
- **`eval-protocol.md`** — Formal eval spec (YAML format, check types, severity levels).
- **`skills/archive/`** — Retirement directory for deprecated commands.
- **`package.json`** — Added `os`, `peerDependencies`, `funding`, `scripts.audit:skills`, `scripts.lint`. Version bumped to 2.3.0.
- **README** — Added Security & Permissions, Hooks, Privacy & Data Flow, Contributing & Skill Audit, Troubleshooting sections.

### Improvements

- **`challenge.md`** — Pass menu now includes `[3] /sowhat:self-critic` for post-challenge structural diagnosis.
- **`source-credibility.md`** — Added Claim Tier × Source Tier compatibility matrix.
- **`session-protocol.md`** — Added `preview_event` field and preview gate event_types (preview_approved, preview_canceled, preview_revised).
- **`ux-standards.md`** — Added Section 8: Preview Gate pattern documentation.
- **`sowhat-critic-agent.md`** — 5-dimension definitions delegated to shared `critique-dimensions.md`.
- **`sowhat-research-agent.md`** — Added stance-gate: biased search only when `--stance persuade` is explicitly set.

### Security

- Removed plaintext `PERPLEXITY_API_KEY` from `.claude/settings.local.json`.
- Added `.env`, `.env.*`, `*.key`, `*.pem`, `*.p12` to `.gitignore`.
- **If you had API keys stored in settings.local.json before v2.3.0, rotate them** — the key was exposed in git history. Use `/sowhat:config` to re-set new keys.

### Migration from 2.2.x

```
# If you used: /sowhat:finalize (for export generation)
# Now use:     /sowhat:finalize → then /sowhat:draft

# If you used: /sowhat:debate --stance (default was persuade)
# Now:         default is critique; add --stance persuade to opt-in

# If you used: gsd-export deliverable
# Now use:     prd deliverable (/sowhat:draft --deliverable prd)
```
