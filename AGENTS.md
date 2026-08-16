<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository & Deployment Guardrails
- NEVER push to remote repository on the `master` branch. Always request explicit confirmation before any remote push.
- All new features and bug fixes must be developed on dedicated branches (`feature/*`, `fix/*`).
- PDF generation must always maintain full text copy-paste fidelity in perfect DOM reading order, with clickable vector hyperlinks (`<a>` tags) for contact and project URLs without breaking visual layout.
- Ambiguity & Requirement Clarification Guardrail: If any user instruction is vague, underspecified, or open to multiple conflicting implementation approaches, DO NOT assume or rush to code. Always ask clarifying questions using `ask_question` to align on the exact goal, visual layout, and interaction flow before executing modifications.

