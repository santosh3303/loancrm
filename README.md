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

- New Contact form now has a Type dropdown (Lead / Connector / Banker) and its
  Name field autosuggests across all saved Leads, Connectors, and Bankers together.
- New Lead form was rebuilt: Name autosuggests against existing Leads (with the
  existing Mobile duplicate-check kept), a new Loan Category → Property Usage →
  Sub-type set of dependent dropdowns (only for Home Loan / Mortgage Loan), a
  ₹-formatted Amount field, and one dynamic field that relabels itself and
  changes behavior based on Source (Campaign Name for FB Ads, Reference Name for
  Referral, Source Details for Direct).
- ₹ prefix + Indian comma-grouped formatting (e.g. ₹ 15,00,000) now applies to
  every editable amount field in the app: New Lead's Amount, New Loan File's
  Amount, Lead Detail's Monthly Income and Loan Amount, and Loan File Detail's
  Commission Expected Amount.
- Clicking outside any open form or overlay panel now closes it, app-wide —
  previously this only worked for the header's Search panel.
- New database column: `contacts.property_usage` (Residential / Commercial),
  added automatically on next server start — no manual database work needed.

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
