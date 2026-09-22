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

- **New: "Reset & Load Sample Data" button** (Settings → Testing Tools, at the
  bottom). It first shows a confirmation pop-up. If you confirm, it permanently
  deletes ALL Leads, Contacts (Connectors and Bankers), Loan Files, Applicants,
  Tasks, Queries, Communication Log and Change History, then loads a fresh set:
  6 leads, 2 connectors, 2 bankers, 4 loan files, 9 tasks, 3 queries and
  3 communication logs. **Checklist Rules and Eligibility Rules are kept**
  (they are settings, not records).
- Pressing it twice never doubles the data — every press starts from empty.
- The server refuses the reset unless the app's confirmation is sent, so a
  stray request can't wipe anything.
- Sample task and lead dates are now relative to today (e.g. "overdue 4 days"),
  so the Daily Operations groups always look realistic.
- **Removed:** the old "seed demo data" server route. It had no "already
  loaded" check, so running it twice doubled everything. The new reset replaces it.

**Known, disclosed limits of this update**
- The sample data still uses today's data structure. It will be updated to the
  new Loan File structure as each Loan File pass ships.
- The Testing Tools card is temporary and has no login protection (the app has
  none). Remove it once testing is finished.
- Nothing else in the app was changed in this update.

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
