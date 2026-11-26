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

## [Unreleased] — v2 (in development on `develop/v2`)

The scope is pending owner approval. See `docs/QA_REPORT_2026-11-25.md` for the findings behind it.

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
