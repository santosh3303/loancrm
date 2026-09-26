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

## What changed in this update (Pass 0 - duplicate-entry fixes)

Three real duplicate-creating paths were found and fixed, all confirmed with live
tests against the database (not just read from the code):

- **The New Contact -> New Lead chain no longer creates a second record.** Previously,
  tapping "Save & Create Lead" saved the person once, then opened New Lead pre-filled
  with the same details - and pressing "Save Lead" there tried to save them a SECOND
  time. If a mobile number was given, this got blocked outright (a dead end for you).
  If no mobile was given, it silently created a duplicate. New Lead now recognizes
  when it was opened this way and updates the same record instead of creating a new one.
- **Referral auto-created Connectors no longer pile up.** When typing a new person's
  name into a Lead's Reference field (without picking an existing match), the app
  creates a Connector behind the scenes. This never collects a mobile number, so the
  server's own duplicate check (which requires a matching mobile) couldn't catch a
  second save with the same typed name - every save created a new "Suresh Shah" and
  so on. This is now checked by exact name match first, so the same typed name always
  reuses the same Connector.
- **Old sample-data loader removed** (previous update) - replaced by the guarded
  Reset & Load Sample Data button, confirmed not to double data on repeat use.

**What was checked and found NOT to be a bug**: the core duplicate rule itself (same
role + same name + an overlapping mobile) is unchanged - that is still the documented
design, and two people who genuinely share a name with no mobile on file for either
are correctly not flagged, by design.

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
