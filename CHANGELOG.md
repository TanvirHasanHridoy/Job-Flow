# Changelog

All notable changes to JobFlow AI (Job Master) are documented here.
Versions follow [Semantic Versioning](https://semver.org/): MAJOR.MINOR.PATCH.

## Branching model

| Branch / tag | Purpose |
|---|---|
| `master` | Always equals the latest released version. |
| `vX.Y.Z` tags | Permanent snapshot of each release. |
| `release/v1` | Urgent fixes to v1 only (released as v1.0.1, v1.0.2, …). |
| `develop/v2` | Integration branch for v2. Each change starts in its own `fix/v2-*` or `feature/v2-*` branch and merges into `develop/v2`. |

When v2 is complete, `develop/v2` merges into `master` and is tagged `v2.0.0`.

## [2.0.0] — 2026-11-26

Major release based on the v1.0.0 QA report (`docs/QA_REPORT_2026-11-25.md`), built in 8 reviewed phases (PRs #14–#21).

### Security
- Dev login (`x-dev-auth` header / `jobmaster_dev_auth` cookie / `/api/auth/dev-login`) only works outside production; previously anyone could sign in as any user.
- PDF export renders untrusted HTML without JavaScript or network access (SSRF fix); the URL scraper blocks private and internal addresses.
- Per-user rate limits on AI and export routes; upload size and type limits.
- Error responses no longer reveal database hosts, AI provider responses or parser internals.

### AI tailoring (controlled gap bridging)
- Requirement analysis first (match / related / missing); refuses with a gap report when under 50% of must-haves are covered.
- Tactical Pivot stays factual; Aggressive Bridging may bridge related skills only. Employers, job titles, dates, degrees and certifications are never invented (enforced in code).
- Bridged claims are highlighted for review (keep / remove); export warns about unreviewed claims. Outreach and Interview Prep use only kept claims, with "Prepare to back these up" coaching.
- Free job-description check before charging; clearly labelled Profile fit and Keywords in CV scores.

### Product
- Every generation is saved as a draft; edits autosave; drafts list; untracked drafts deleted after 30 days.
- Job import from Greenhouse, Lever, Ashby, Personio, SmartRecruiters and sites with job data: free and instant; closed postings detected without charge.
- No placeholder photo or fake signature; English CVs hide the photo by default; enclosures default to the CV only; onboarding for new users.
- Master Vault: unsaved-changes warning; imports saved immediately with merge or replace.

### Business & privacy
- Free plan: 100 tokens per month (monthly refill); `npm run tokens:add` for admin grants.
- Only the displayed bullet style and letter length are generated; translation only for clearly German ads; DOCX export matches the preview.
- AI logs kept 30 days, without full prompts or profile copies; "Download my data" and "Delete my account".
- AI provider switch with automatic fallback: Gemini, DeepSeek, Groq, OpenRouter (`AI_PROVIDERS`, `*_API_KEY`).

### Upgrade notes
- Database: apply `20261125_add_rate_limit_bucket` and `20261126_token_monthly_refill` (both additive).
- Environment: `GEMINI_API_KEY` and/or `DEEPSEEK_API_KEY` (optional `AI_PROVIDERS`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`).
- Once deployed, AI logs older than 30 days are deleted.

## [1.0.1] — 2026-11-26

### Fixed
- Production build (`next build`) failed type checking: the dashboard and tailor page files exported helper functions/constants, which Next.js 16 does not allow in page modules. They are now module-private. No behaviour change.

## [1.0.0] — 2026-11-25

First tagged release. It is a snapshot of `master` as of PR #11.

### Features
- OAuth sign-in (Google, GitHub, LinkedIn) via Supabase.
- Master Professional Vault:
  - Multi-persona profiles.
  - Import from a PDF resume, GitHub or LinkedIn text.
  - Photo and signature upload.
  - DACH-specific fields.
- AI tailoring of CV and cover letter (Gemini, with DeepSeek fallback):
  - EN and DE output with DIN 5008-style letters.
  - Visual, Strict ATS and Bullet Matrix formats.
  - Tactical Pivot and Aggressive Bridging strategies.
  - Tone, length, bullet-style and skills-focus options.
- Job intake from pasted text, a job URL (scraper) or a job PDF.
- Match score and gap analysis (exact, adjacent and missing skills).
- Section regeneration and bullet polishing.
- Recruiter outreach (InMail, hiring-manager email, referral message) and interview prep.
- Live CV preview with templates, colour themes, spacing and layout controls.
- PDF (vector) and DOCX export, plus ATS plain-text copy.
- Kanban, spreadsheet and calendar application tracker with status history.
- Token-based usage control:
  - 200 starting tokens.
  - Refunds on failed AI jobs.
  - Response cache.
- Chrome extension (side panel) with LinkedIn, Indeed, StepStone, XING and universal job parsers.

### Known issues
Documented in `docs/QA_REPORT_2026-11-25.md`, to be addressed in v2. The main ones:
- **Security:**
  - The dev-auth header and cookie are accepted in production.
  - SSRF risk in PDF export and in the URL scraper.
  - No rate limiting.
- **AI output can include facts that are not in the user's profile**, such as invented metrics and changed job titles.
- No way to top up tokens.
