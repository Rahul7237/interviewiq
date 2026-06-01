# Google Sheets Integration — Setup Guide

## Step 1 — Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Rename it to anything you like, e.g. `InterviewAI Records`

---

## Step 2 — Set your secret token in the script

1. Open `google-apps-script.js` from this project
2. Find this line near the top:
   ```js
   const SECRET_TOKEN = 'CHANGE_ME_TO_SOMETHING_RANDOM';
   ```
3. Replace `CHANGE_ME_TO_SOMETHING_RANDOM` with any random string you choose, e.g.:
   ```js
   const SECRET_TOKEN = 'ritik_interview_2024_xK9p';
   ```
   Keep this value — you'll need it in Step 5.

---

## Step 3 — Open the Script Editor

1. In your sheet, click **Extensions → Apps Script**
2. Delete any default code in the editor
3. Paste the entire contents of `google-apps-script.js` (with your token already set)
4. Click **Save** (💾 icon)

---

## Step 4 — Run `testSetup` once

1. In the toolbar, select function **`testSetup`** from the dropdown
2. Click **▶ Run**
3. Approve any permissions it asks for (it only needs access to the spreadsheet)
4. Check your sheet — an **"Interviews"** tab should appear with a styled header row

---

## Step 5 — Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear ⚙️ next to "Select type" → choose **Web app**
3. Fill in:
   - **Description**: `InterviewAI Webhook`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKf.../exec`)

> **Why "Anyone"?** The URL is kept private and protected by your secret token — any request without the correct token is silently rejected. Your Google Sheet itself remains private and only visible to your Google account.

---

## Step 6 — Add credentials to your project

Create or open `.env.local` in the project root and add **both** lines:

```
VITE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SHEETS_TOKEN=ritik_interview_2024_xK9p
```

- Replace the URL with the one copied in Step 5
- Replace the token with the exact same string you put in `SECRET_TOKEN` in Step 2

> ⚠️ Never commit `.env.local` to git. It's already in `.gitignore` by default in Vite projects.

---

## Step 7 — Restart the dev server

```bash
npm run dev
```

---

## What gets recorded

| Column | When filled |
|---|---|
| Session ID | On interview start |
| Name | On interview start |
| Topic / Category | On interview start |
| Question Type | On interview start |
| Experience (YOE) | On interview start |
| Questions count | On interview start |
| Start Time | On interview start |
| Score / Max / % | On interview completion |
| Grade | On interview completion (color-coded cell) |
| Verdict | On interview completion |
| Status | `In Progress` → `Completed` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Nothing appears in the sheet | Check that `VITE_SHEETS_URL` and `VITE_SHEETS_TOKEN` are set correctly in `.env.local` |
| Token mismatch | Make sure `SECRET_TOKEN` in the script exactly matches `VITE_SHEETS_TOKEN` in `.env.local` |
| "Interviews" tab missing | Run `testSetup` again from the Script Editor |
| Re-deploying after script changes | Use **Deploy → Manage deployments → Edit → New version** |
| CORS errors in browser console | Safe to ignore — `no-cors` mode is intentional; data still reaches the sheet |
