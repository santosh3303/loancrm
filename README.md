# Loan Consulting CRM — Pilot v1

This is a working local pilot of the CRM we designed together. It has two parts
that both need to run at the same time:

- **backend** — stores your data (a single file called `loan_crm.db`, created
  automatically the first time you start it — this file IS your entire database,
  back it up by simply copying it).
- **frontend** — the actual app you click around in, in your browser.

## First time setup

You'll need Node.js installed on your laptop (download from nodejs.org if you
don't have it — the "LTS" version).

1. Start the backend first — open `backend/README.md` and follow those 3 steps.
2. Then start the frontend — open `frontend/README.md` and follow those steps.
3. Open the link the frontend shows you (usually http://localhost:5173) in
   your browser (Chrome recommended).

Every time you want to use the app afterward, you repeat: start backend,
then start frontend, then open the browser link. Two terminal windows stay
open in the background while you work.

## What's included in this pilot

- Dashboard — pipeline counts, today's follow-ups, open queries
- Leads — entry form with live duplicate/match detection, list view
- Loan Files — full stage tracker (sales-side → bank-side, pivoting at File
  Login), applicants (Main/Co-Applicant/Guarantor) with document tiers,
  auto-generated Required Docs List (WhatsApp-shareable), Banker Discussion
  Summary (with rule-based flags), Follow-ups, Queries, Communication Log,
  Commission tracking
- Contacts — Connectors (with performance/conversion stats) and Bankers
- Reports — filter loan files by category/stage/source/bank/date, export to CSV
- One-click WhatsApp and Call buttons throughout

## What's NOT built yet (next phases, once you've tried this)

- Deployment to a hosted service (Render) — this pilot is local-only for now,
  as planned
- Fully drag-and-drop customizable dashboard — current one is fixed-layout
- PDF export for reports (CSV export is included)
- Editing document checklist rules from within the app itself (currently a
  starter "Generic" rule set is seeded in the database — bank-specific
  rules can be added, just not yet through a screen in the app)

## Your data

Everything you enter lives in `backend/loan_crm.db`. To back it up, just copy
that one file somewhere safe (e.g., a dated copy in a backup folder) — no
technical steps needed.
