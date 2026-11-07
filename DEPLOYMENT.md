# LeadPulse AI — Production Deployment Guide
**Architecture: Decoupled GitHub Pages Frontend + Secure Node.js Backend**

This guide provides end-to-end instructions for deploying the **LeadPulse AI** B2B lead intelligence application. The frontend runs as a client-side Single Page Application (SPA) on **GitHub Pages**, while all sensitive operations (Gemini 3.8 Flash, Google Places API New, website audits, contact verification, and export generation) run on a secure **Node.js/Express backend server**.

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     GitHub Pages (Frontend)     │
│   https://<username>.github.io  │
│  - React 19 + Tailwind CSS + D3 │
│  - Zero API keys or secrets     │
│  - Configurable VITE_API_BASE_URL│
└────────────────┬────────────────┘
                 │
                 │ Authenticated Requests & Bearer Tokens / CORS
                 ▼
┌─────────────────────────────────┐
│    Secure Backend Server (API)  │
│  - Express Router (/api/*)      │
│  - CORS origin whitelist        │
│  - GEMINI_API_KEY (Server-only) │
│  - GOOGLE_MAPS_API_KEY (Server) │
│  - Real website crawlers        │
│  - Multi-user authentication    │
└────────────────┬────────────────┘
                 │
                 │ Google Cloud / Firebase
                 ▼
┌────────────────────────────────────────────────────────┐
│  - Google Places API (New) (Business Discovery)        │
│  - Google Search Grounding (Live Web Verification)     │
│  - Gemini 3.8 Flash (AI Cold Outreach Generation)      │
│  - Firebase Firestore & Auth (Multi-tenant persistence)│
└────────────────────────────────────────────────────────┘
```

---

## 1. Build the Frontend

To build the client-side bundle locally or in CI:

```bash
# 1. Install dependencies
npm ci

# 2. Run typecheck & test suite to verify zero syntax errors
npm run typecheck
npm test

# 3. Build the production bundle
# If deploying to a GitHub Pages repository subfolder (e.g. /leadpulse/):
VITE_API_BASE_URL="https://your-backend-api.com" VITE_BASE_PATH="/leadpulse/" npm run build
```

The output will be placed in the `dist/` directory, complete with:
- `dist/index.html` (Entry point with relative script paths)
- `dist/404.html` (SPA fallback for GitHub Pages)
- `dist/.nojekyll` (Disables Jekyll parsing so all chunks load)
- `dist/assets/*.js` and `dist/assets/*.css` (Minified client bundles with zero secrets)

---

## 2. Deploy Frontend to GitHub Pages

### Option A: Automated GitHub Actions (Recommended)
This repository includes `.github/workflows/deploy.yml`.

1. Push your repository to GitHub.
2. In your GitHub repository:
   - Navigate to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Under **Settings** → **Secrets and variables** → **Actions** → **Variables** tab:
   - Click **New repository variable**.
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-backend-service.com` (Your deployed backend domain without trailing slash).
4. Go to the **Actions** tab and trigger the **Deploy Frontend to GitHub Pages** workflow, or push a commit to `main`.
5. Your frontend is live at `https://<username>.github.io/<repo-name>/`.

### Option B: Manual Deploy via gh-pages
```bash
npx gh-pages -d dist --dotfiles
```

---

## 3. Deploy Backend to a Server

The backend requires a Node.js 20+ runtime with persistent internet access for outbound HTTP crawling and Google APIs.

### Recommended Hosting Options
- **Google Cloud Run** (Fully managed container, automatic HTTPS, scale-to-zero)
- **Render.com / Railway / Fly.io** (Native Node.js web services)
- **AWS ECS / DigitalOcean App Platform / VPS**

### Starting the Backend in Production
```bash
# Production server start
export NODE_ENV=production
export PORT=3000
npm start
```
`npm start` invokes `tsx server.ts`, which starts Express with the `/api` router, CORS enforcement, and health monitoring.

---

## 4. Configure Environment Variables

Set these environment variables on your **Backend Server** (Cloud Run, Render, or `.env` file on your server):

| Variable Name | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for search grounding & cold outreach copy. |
| `GOOGLE_MAPS_API_KEY` | **Yes** | Google Cloud API key with *Places API (New)* enabled. |
| `ALLOWED_ORIGINS` | **Yes** | Comma-separated list of allowed frontend origins (e.g. `https://<username>.github.io`). |
| `NODE_ENV` | **Yes** | Set to `production`. |
| `PORT` | Optional | Port for the backend process (defaults to `3000`). |

> **CRITICAL SECURITY NOTE:**
> Never commit actual values for `GEMINI_API_KEY` or `GOOGLE_MAPS_API_KEY` to Git or place them in `VITE_*` frontend environment variables.

---

## 5. Configure Firebase (Authentication & Database)

LeadPulse AI uses client-side Firebase Auth and Firestore for multi-tenant persistence.

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** → **Sign-in method** → **Google** and **Email/Password**.
3. Enable **Cloud Firestore** in production mode.
4. Deploy the production security rules (`firestore.rules`) to guarantee strict user data isolation:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Ensure the Firebase Web configuration is set up in `src/lib/firebase.ts`.

---

## 6. Configure Google APIs (Places & Gemini)

1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Enable the following APIs in your project:
   - **Places API (New)**
   - **Gemini API** / Generative Language API
3. Under **APIs & Services** → **Credentials**:
   - Create an API key for Google Maps Platform.
   - Restrict the key's API scope to **Places API (New)**.
   - Set the key on your backend server as `GOOGLE_MAPS_API_KEY`.
4. In [Google AI Studio](https://aistudio.google.com/):
   - Generate an API key for Gemini.
   - Set the key on your backend server as `GEMINI_API_KEY`.

---

## 7. Configure CORS (Cross-Origin Resource Sharing)

Because the frontend is hosted on GitHub Pages (`https://<username>.github.io`) and the backend is hosted on a separate domain (e.g. `https://api.yourdomain.com`), the backend must explicitly permit your frontend origin.

On your backend hosting environment:
```bash
ALLOWED_ORIGINS="https://<username>.github.io,https://<username>.github.io/<repo-name>"
```
The backend `corsMiddleware` in `src/server/cors.ts`:
- Checks incoming `Origin` headers against `ALLOWED_ORIGINS`.
- Responds to `OPTIONS` preflight requests with `204 No Content`.
- Allows `Authorization`, `Content-Type`, and `X-Guest-Session` headers.
- Enables `credentials: true`.
- Rejects unauthorized cross-origin callers.

---

## 8. Configure Production Frontend API URL

When building the frontend for GitHub Pages:
Set the `VITE_API_BASE_URL` variable to your backend domain:

```bash
VITE_API_BASE_URL="https://your-backend-api.com"
```

In `src/lib/apiConfig.ts`, `getApiUrl()` dynamically prepends this base URL to all API calls:
- `/api/health` → `https://your-backend-api.com/api/health`
- `/api/research/plan` → `https://your-backend-api.com/api/research/plan`
- `/api/research/run` → `https://your-backend-api.com/api/research/run`
- `/api/research/status/:id` → `https://your-backend-api.com/api/research/status/:id`
- `/api/diagnostics` → `https://your-backend-api.com/api/diagnostics`
- `/api/outreach/generate` → `https://your-backend-api.com/api/outreach/generate`

If `VITE_API_BASE_URL` is omitted, it defaults to `""` (relative paths, suitable for single-host full-stack deployments).

---

## 9. Test Authentication

1. Open your deployed GitHub Pages URL.
2. Click **Sign in with Google** in the top navigation bar.
3. Verify that your user profile avatar, email, and name render properly.
4. Open browser DevTools Network tab:
   - Observe that outgoing requests to `/api/research/run` include:
     `Authorization: Bearer <Firebase_ID_Token>`
5. Verify guest mode works if not signed in (uses secure `X-Guest-Session` header).

---

## 10. Test Lead Generation

1. Go to the **Generate Leads** tab.
2. Select Country: `United Kingdom`, Niche: `Builders & Construction`, Count: `10`.
3. Click **Preview Search Strategy** → Verify the localized search plan is returned.
4. Click **Start Grounded Research Run**:
   - Verify Candidate Discovery phase (Google Places API / Search Grounding).
   - Verify Website Crawling & HTML Audit.
   - Verify Social Links (Facebook & Instagram) extraction.
   - Verify Public Contact extraction (Phone E.164, Email, Decision-Maker).
   - Verify A/B Grade assignment and D3 Quality Score calculation.
5. In **Database** tab, verify leads appear with dossiers, phone numbers, and website links.
6. In **Lead Detail Modal**, click **Generate Outreach** to verify the Gemini 3.8 Flash cold email generator.

---

## 11. Test Excel Export

1. In the **Database** tab, click **Export All (XLSX)** or select specific leads.
2. Open the downloaded `.xlsx` file in Microsoft Excel or Google Sheets.
3. Verify the 3 sheets:
   - **Qualified Leads**: 30 columns with formatted text phone numbers, escaped formulas (`'=`, `'+`, `'-`), and zero Google ratings/reviews.
   - **Research Run Summary**: Execution parameters, counts, and timing.
   - **Traceable Evidence Matrix**: Lead ID, claim, evidence URL, and date.
4. Verify **Export CSV** generates clean UTF-8 text without formula injection risks.

---

## Troubleshooting & Verification Checklist

| Check | Expected Result | Action if Failed |
|---|---|---|
| `GET /api/health` | `{"status":"healthy",...}` | Check backend server logs and port binding. |
| CORS Preflight | `204 No Content` with `Access-Control-Allow-Origin` | Add your GitHub Pages URL to `ALLOWED_ORIGINS`. |
| Assets 404 on GitHub Pages | All assets load from `./assets/...` | Check `base: './'` in `vite.config.ts`. |
| Refresh 404 on GitHub Pages | Redirects to root and loads requested tab | Verify `public/404.html` exists in `dist/`. |
| Gemini Quota (429) | System runs in Safe Mode with 0 fabricated leads | Verify billing tier or check API key quota. |
| Google Places Unavailable | Safe Mode reports provider status | Check `GOOGLE_MAPS_API_KEY` on backend server. |
