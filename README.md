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

- **New Contact**: added Mobile 2, Email, and Location fields (all with
  match-autofill), and a Bank/NBFC field that appears only when Contact Type
  is Banker, with autosuggest against previously-entered bank names. A new
  "Save & Create Lead/Task" button saves the contact and immediately continues
  into the next form in the chain — Lead Entry (pre-filled) for a Lead, or a
  new Task for a Connector/Banker.
- **New Lead**: rebuilt as a single-open accordion with 3 sections — Name &
  Contact (now includes Mobile 2/Email, with full-record autofill when
  selecting an existing Lead match), Loan Interest (Category → Sub-Category →
  Amount — deliberately lightweight; the previous Sub-Type and BT/Topup split
  now live only at the Loan File stage), and Reference (unchanged). A new
  "Save & Create Loan Files" button saves the lead and continues straight into
  New Loan File, pre-selected.
- **Master Database → Leads & Contacts tabs**: cards now expand in place
  (no more navigating to a separate page) with a strict single-open behavior —
  opening one card closes any other card already open in that same list.
  Leads' expanded view has a Details/Follow-ups tab toggle.
- **Lead Detail page** (still reachable via deep links from tasks and search):
  restructured to match the new field set, with the same Details/Follow-ups
  tab toggle, so it's not a second, drifting version of the same page.
- Every accordion and expand-panel in the app (New Lead's 3 sections, Leads/
  Contacts cards) now follows one consistent rule: exactly one section/card
  open at a time.
- ₹ prefix + Indian comma-grouped formatting (e.g. ₹ 15,00,000) applies to
  every editable amount field app-wide.
- Clicking outside any open form or overlay panel closes it, app-wide.
- New database columns: `contacts.mobile_2`, `contacts.email`,
  `contacts.bank_name`, `contacts.property_usage` — all added automatically
  on next server start, no manual database work needed.
- Label-only rename: "Others" now displays as "Other Loan" everywhere it
  appears (Lead/Loan File forms, Reporting filters, Checklist Rules) — the
  underlying stored value is unchanged, so no existing data is affected.

## A known, temporary gap worth knowing about

CIBIL Score, Monthly Income, and Profile Type/Detail have been removed from
the Lead entry and edit forms, per the decision to make Lead capture
"lightweight" and move detailed applicant financial data to the Loan File
stage (Applicants section) instead. **That Loan File Applicant section has
not been built yet** — it's the next planned piece of work. Until it ships,
there is nowhere in the app to enter CIBIL/Income for a new Lead, which means
the existing Banker Discussion Summary's automatic eligibility flags (CIBIL
threshold, loan-to-income ratio) will show no data to flag for any Lead
created after this update. This is expected and temporary, not a bug — it
resolves once the Loan File Applicant pass ships.

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
