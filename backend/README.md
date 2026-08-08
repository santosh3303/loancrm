# Running the backend

1. Open a terminal in this `backend` folder.
2. Run: npm install   (first time only)
3. Run: npm start
4. It will print: "Loan CRM backend running on http://localhost:4000"
5. Leave this terminal window open while you use the app.

## About the database
This app now uses a small cloud database service (Turso) so your data is
never at risk of being wiped when the app restarts. When running locally,
it automatically falls back to a local test file (`local.db`) — only used
for your own testing, not your real data. Once deployed to Render with the
Turso connection details set, all real data goes to Turso and stays there
permanently.
