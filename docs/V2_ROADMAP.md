# JobFlow AI v2 — Roadmap (DRAFT, awaiting owner approval)

> Status: **DRAFT**. Nothing here will be built until it is approved.
> Edit freely: mark each item ✅ keep, ✏️ change (add a note), or ❌ drop, and answer the ❓ decisions.
> Evidence for each item is in `docs/QA_REPORT_2026-11-25.md`.

Workflow:
- Each phase is one branch off `develop/v2`, e.g. `fix/v2-security`.
- Each item in a phase gets its own commit.
- Merges into `develop/v2` happen only after your review.
- Nothing is pushed to GitHub without your OK.

---

## Phase 1 — Security & abuse (branch `fix/v2-security`) — ✅ APPROVED, BUILT, NOT YET MERGED
Decisions taken (owner approved all items):
- 1.1: gated to non-production rather than removed, so local dev and the extension keep working.
- 1.2: the server renderer is locked down rather than moving export client-side. Output was verified identical to v1.
- 1.4: Postgres table plus in-memory fallback, no new service. Migration `20261125_add_rate_limit_bucket` still needs to be applied.

| # | Item | Decision |
|---|---|---|
| 1.1 | Accept the dev-auth cookie/header (`x-dev-auth`, `jobmaster_dev_auth`) and `/api/auth/dev-login` only when `NODE_ENV !== 'production'` (or remove them entirely). | ❓ Gate it or remove it? Does the Chrome extension still need it? |
| 1.2 | Fix SSRF in PDF export: stop rendering arbitrary client HTML. Disable JS and block all network/file requests in the server Chrome, or move export fully client-side. | ❓ Which approach? |
| 1.3 | Fix SSRF in the URL scraper: allow http/https only, block private/loopback/link-local IPs, limit redirects. | |
| 1.4 | Rate-limit the AI and export routes per user. | ❓ Limits (e.g. 10 tailors/hour)? Is a Redis/Upstash store OK? |
| 1.5 | Upload size limits: PDFs ≤ 5 MB, photo/signature ≤ 1 MB, with a MIME check. | |
| 1.6 | Return generic error messages to the browser and keep details in server logs only. | |

## Phase 2 — Controlled gap bridging (branch `feature/v2-gap-bridging`) — ✏️ REDESIGNED per owner, decisions recorded, awaiting final OK
**Owner's concept:**
- The app first tries to match the job truthfully.
- Where the profile falls short, it **bridges the gap with related content**, which may be invented but must be adjacent (e.g. the job ad wants React and the user has Angular, both JS frameworks). This follows the chosen strategy (Tactical Pivot / Aggressive Bridging).
- If the gap is too big to bridge credibly, it **refuses to generate** instead of producing a weak or absurd CV.

### Proposed pipeline
1. **Requirement analysis (cheap AI call).** Extract the job's requirements and mark each as *must-have* or *nice-to-have*. Classify each against the profile:
   - **MATCH**: the profile has it. Use it as-is.
   - **ADJACENT**: the profile has a related skill in the same family (Angular → React, Flask → FastAPI, MySQL → PostgreSQL, Jest → Cypress, AWS ECS → Kubernetes basics). Each is recorded with the bridge source.
   - **GAP**: nothing related in the profile (e.g. Java/Spring for a pure JS dev, a medical licence, a PhD).
2. **Feasibility gate.** If the must-have coverage is too low (❓ threshold), stop:
   - No CV is generated, and the user is not charged or is refunded.
   - The user sees a "gap too big" report: which must-haves are missing, and what they could add to their profile or learn.
3. **Generation**, according to the strategy:
   - **Tactical Pivot.** CV claims stay factual. ADJACENT skills are framed as transferable ("component-based SPAs in Angular; transferable to React"). The cover letter explicitly addresses the gaps.
   - **Aggressive Bridging.** For ADJACENT items, the CV may present the target skill as experience. It is attached to the job where the related skill was actually used, phrased plausibly (e.g. "Built SPA dashboards in Angular and React"). GAP items are never bridged.
4. **Post-check (code, not AI).** Compare the output against the profile and the analysis from step 1.
   - Every claim not in the profile is tagged **AI-bridged**, with its source skill.
   - Anything that bridges a GAP item, or breaks a hard line (below), is removed.

### Owner decisions (2026-11-25)
- **Refusal threshold:** refuse when **under 50%** of must-have requirements are covered (MATCH + ADJACENT).
- **Refusal cost:** **full price (20 tokens)**. The user still receives the full gap analysis report.
- **Hard lines (never invented):** **employers, job titles, employment dates, degrees and institutions, certifications and licences.**
  - Numeric metrics and spoken languages *may* be bridged. They are tagged and highlighted like any other bridged claim.
- **Visibility:** **highlight plus accept/remove** for every bridged claim, as described below.

### Transparency to the user (✅ approved)
- Bridged claims are highlighted in the editor, with a "Bridged from: Angular" label.
- There is a summary such as "4 claims were bridged — review before sending".
- The user can accept or remove each one.
- Interview Prep adds a "**Prepare to back this up**" section for every bridged skill: what to learn and how to talk about it honestly.

### Items
| # | Item | Decision |
|---|---|---|
| 2.1 | Requirement analysis plus feasibility gate (steps 1–2), with a "gap too big" report. | ✅ <50% must-haves → refuse; full 20 tokens charged |
| 2.2 | Rewrite the generation prompts for both strategies around MATCH / ADJACENT / GAP. Remove the "München" example and the rule that forces a metric into every bullet. | |
| 2.3 | Post-check: tag bridged claims, remove GAP bridges and hard-line violations. | ✅ Hard lines: employers, titles, dates, degrees, certifications |
| 2.4 | UI: highlight bridged claims, accept/remove each, review summary before export. | ✅ |
| 2.5 | Outreach and Interview Prep use only claims the user accepted; Interview Prep adds "back this up" coaching. | |
| 2.6 | Cover letter: stop stating candidate preferences (part-time, remote) copied from the ad. Tactical Pivot must address the gaps. | |
| 2.7 | Import: don't invent skill levels; offer **merge** vs **replace** when importing into an existing profile. | |

## Phase 3 — Input & scoring (branch `fix/v2-input-scoring`)
| # | Item | Decision |
|---|---|---|
| 3.1 | Check that the input is a job description (minimum length plus a cheap check) **before** charging tokens. | |
| 3.2 | Fix the match score: an empty result can't be 100%; count only skills that are actually in the profile; merge duplicates. | |
| 3.3 | Show one score in the UI (merge the "Match %" and "ATS x/y"), and show nothing before any tailoring. | ❓ Which score should be kept as primary? |

## Phase 4 — Don't lose user work (branch `feature/v2-autosave`)
| # | Item | Decision |
|---|---|---|
| 4.1 | Auto-save each generation as a draft (status `DRAFT`) so leaving or refreshing the page never loses it. | |
| 4.2 | Auto-save the profile after an import, or warn before the user leaves with unsaved changes. | |

## Phase 5 — Job intake (branch `feature/v2-smart-intake`)
| # | Item | Decision |
|---|---|---|
| 5.1 | Read JSON-LD `JobPosting` data first (fixes Ashby and many others) and use the LLM only as a fallback, which is faster and cheaper. | |
| 5.2 | Detect 404s and closed or expired postings (e.g. Greenhouse `?error=true`) and show a clear message, with no charge. | |

## Phase 6 — Document polish (branch `fix/v2-document-polish`)
| # | Item | Decision |
|---|---|---|
| 6.1 | Hide the placeholder photo when there is no photo, or always on English CVs. | |
| 6.2 | Remove the hard-coded enclosures; generate them from what the user has, or let the user edit them. | |
| 6.3 | Render markdown in the recommendation panel. | |
| 6.4 | Onboarding: an empty dashboard and Tailor page should prompt the user to fill the vault first. | |

## Phase 7 — Business (branch `feature/v2-billing`) — needs your product decisions
| # | Item | Decision |
|---|---|---|
| 7.1 | A way to get more tokens. | ❓ Stripe payments, a monthly free reset, an admin top-up, or all of these? Price points? |
| 7.2 | Settle the free allowance (60 vs 200) and remove the mismatch. | ❓ What number? |
| 7.3 | Cut AI cost: generate only the selected bullet style and letter length, and skip the translation call unless the text is really German. | |
| 7.4 | Retention for `TailorDiagnosticLog` (e.g. 30 days) and stop storing the full prompt each time. A GDPR delete-my-data option. | ❓ How many days? |

## Phase 8 — Code health (branch `refactor/v2-*`) — ongoing
| # | Item | Decision |
|---|---|---|
| 8.1 | Split `tailor/page.tsx` (8.6k lines) into components and hooks. | |
| 8.2 | Shared `callAI()` helper for retry, refund and errors (currently duplicated in 7 routes); remove the commented-out DeepSeek code. | |
| 8.3 | Fix the lint errors (362) and add tests for the scoring, tokens and auth helpers. | |
| 8.4 | Repo cleanup: `diff.txt`, `prisma/dev.db`, package name `temp-app`; make `next.config.ts` work in worktrees. | |

---

**Suggested order:** 1 → 2 → 3 → 4, then 5 / 6 / 7 / 8 in whatever order you prefer.
