# Loan Consulting CRM — Pilot v1

This is a working local pilot of the CRM we designed together. It has two parts
that both need to run at the same time:

- **backend** — stores your data (a single file called `local.db`, created
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

## What changed in this update

- **Duplicate prevention, fixed and applied everywhere.** The earlier version
  only blocked duplicates on the "+New" create forms. It's now enforced on the
  server itself (the actual source of truth) for every create AND edit path:
  New Contact, New Lead, editing a Lead's Details/Qualification from its
  expanded card or its detail page, editing a Contact's card, and the
  behind-the-scenes Connector auto-created when typing a new Referral name.
  A duplicate = same role + same name + an overlapping Mobile or Mobile 2 — a
  Lead and a Banker can still share a name/mobile without conflict; only two
  records of the *same* type colliding is blocked. Editing a record's own
  unchanged data no longer falsely flags itself.
- **Priority is now visible**, not just stored. Leads with High or Medium
  priority show a small colored label on their collapsed card (Low is left
  unflagged, mirroring how a Task's priority tag only shows up when notably
  set) — a judgment call, easy to change if you'd rather see all three levels.
- **Compact single-row action buttons** — New Contact and New Lead now show
  Cancel / Save & Create / Save on one line, matching the rest of the app's
  button sizing instead of a separate full-width button underneath.
- **"+ New" buttons removed** from the Leads, Loan Files, and Contacts tabs in
  Master Database — the Speed Dial (+) is now the only entry point for all
  three, consistently.
- **Contacts tab restructured**: now shows Connectors and Bankers together by
  default in one merged list, with a dropdown (styled like the app's existing
  filter dropdowns) to narrow it down to just one type.
- **Reference field made fully consistent everywhere.** Previously, editing an
  existing Lead's expanded card or detail page either hid the Reference field
  entirely for Referral leads, or showed a plain disabled placeholder. It now
  matches the New Lead form exactly: full connector search-and-select, with
  the existing referred connector's name looked up and shown automatically.
- **Qualification is now its own tab** (Details → Qualification → Follow-ups),
  consistently, in both the in-place expanded Lead card and the standalone
  Lead Detail page — previously it only appeared on one of the two.
- New database columns: `contacts.mobile_2`, `contacts.email`,
  `contacts.bank_name`, `contacts.property_usage` — all added automatically
  on next server start, no manual database work needed.

## Deploying (GitHub + Render + Turso)

1. On GitHub, delete the current `backend` and `frontend` folders in your repo.
2. Drag-and-drop the `backend` and `frontend` folders from this zip back in,
   using GitHub's web upload interface (no command line needed).
3. Render auto-redeploys both services a few moments after the push.
4. The free-tier backend service sleeps after ~15 minutes idle; the first
   request after that takes 30–60 seconds to wake up — this is expected.

## Your data

Everything you enter lives in Turso (production) or `backend/local.db`
(local testing only). To back up production data, use the Reporting page's
CSV export for Loan Files — note this does not cover Leads, Contacts,
Queries, or Communication Log data (no full-database export exists yet).
