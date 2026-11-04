# RunLens — Test Run Reliability Dashboard

**RunLens** is a lightweight, portfolio-grade test analytics application for software engineers and QA teams. It parses JUnit XML test reports, tracks test outcomes across multiple CI/CD test runs, and provides empirical heuristic indicators to spot tests that may be flaky.

---

## Visual Preview & Architecture Overview

```
+--------------------------------------------------------------------------------------------------+
|  RunLens v1.0   Test Run Reliability Dashboard                    [API: Online]  [GitHub Repo]   |
+--------------------------------------------------------------------------------------------------+
|  [ ShieldCheck ] Privacy Notice: In-memory XML parsing. Runs persist solely in localStorage.      |
+--------------------------------------------------------------------------------------------------+
|  [ Recorded Runs: 6 ]  [ Tracked Tests: 6 ]  [ Passed: 4 ]  [ Failed: 1 ]  [ Possible Flaky: 1 ] |
+--------------------------------------------------------------------------------------------------+
|  UPLOAD REPORT                                              [ Load 6 Demo Runs ]                 |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |
|  |  (^) Drop a JUnit XML report here (.xml / .junit, max 2 MB)                                 | |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |
+--------------------------------------------------------------------------------------------------+
|  TEST CASE EXPLORER                     | SAVED RUN HISTORY (6 runs)                             |
|  [Search tests...] [Suite v] [Status v] | - RunLens-Build-106 (4 tests, 2.80s) [5P] [Inspect]    |
|  +------------------------------------+ | - RunLens-Build-105 (6 tests, 4.20s) [5P 1F] [Inspect] |
|  | Test Name            | Rate | Signal| | - RunLens-Build-104 (6 tests, 4.60s) [4P 2F] [Inspect] |
|  | test_charge_idempot..| 40%  | FLAKY | | - RunLens-Build-103 (6 tests, 4.05s) [4P 1F] [Inspect] |
|  | test_session_expiry  | 60%  | FAIL  | | - RunLens-Build-102 (6 tests, 4.35s) [5P 1F] [Inspect] |
|  | test_stripe_webhook  | 17%  | CONSI | | - RunLens-Build-101 (6 tests, 4.15s) [5P 1S] [Inspect] |
|  +------------------------------------+ | [ Clear All History ]                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Features

- **Stateless & In-Memory XML Processing**: The backend parses JUnit XML reports on the fly using `defusedxml` and returns normalized test summaries. Uploaded XML reports are never saved to disk or persistent storage.
- **Client-Side History & Privacy**: Test run history stays strictly inside your browser's `localStorage`. No analytics trackers, external cookies, or account sign-ups.
- **Transparent Flakiness Heuristic**: Highlights tests that oscillate between passing and failing states across recorded runs with clear mathematical criteria.
- **Offline & Standalone Demo Mode**: Explore pre-loaded multi-run datasets demonstrating flaky test identification without requiring an active backend connection.
- **Universal JUnit XML Compatibility**: Works seamlessly with test outputs from Pytest, JUnit 4/5, Surefire, Jest, Playwright, Go test, and PHPUnit.

---

## Flakiness Heuristic & Limitations

### The Rule
RunLens evaluates test stability using a transparent empirical rule:

1. Aggregate all outcomes for each unique test case across recorded runs saved in the browser.
2. Filter for non-skipped outcomes (i.e. `passed`, `failed`, or `errored`).
3. Mark a test as **Possible flaky** only when:
   - It has **at least 5 recorded non-skipped outcomes**, **AND**
   - It has **at least 1 passed outcome**, **AND**
   - It has **at least 1 failed or errored outcome**.

The UI displays the exact pass/failure count and failure percentage (e.g., `Possible Flaky (3P / 2F)` with `40% failure rate`).

### Important Limitations
> **Disclaimer:** RunLens does not claim to definitively prove non-deterministic behavior.

Differing test outcomes across runs may be caused by:
- Changes in application source code between commits.
- Altered seed data, network delays, or database state differences.
- Concurrency race conditions or environmental jitter.
- Test execution order dependencies.

The heuristic serves as an investigative signal to prompt code or fixture reviews, not a root-cause diagnosis.

---

## Stable Test Identification Rules

Test cases are uniquely identified using a stable composite key:

$$\text{Test ID} = \texttt{<classname>\#<name>}$$

- **Missing Class Name**: If a `<testcase>` omits the `classname` attribute, RunLens falls back to the enclosing `<testsuite>` name, or `default_class` if no suite name is available (`default_class#test_name`).
- **Duplicate Test Cases Within a Single Run**: When parameterized tests or retries share identical class names and test names within the same report, RunLens appends an occurrence suffix (`#dup2`, `#dup3`, etc.). This preserves distinct outcome records and prevents collisions while maintaining deterministic keys across runs.

---

## Monorepo Architecture

```
test-run-reliability-dashboard/
|-- backend/                       # Python FastAPI API service
|   |-- app/
|   |   |-- main.py                # FastAPI routes, CORS, request validation
|   |   |-- models.py              # Pydantic data schemas
|   |   |-- parser.py              # defusedxml JUnit XML parser
|   |-- tests/                     # Pytest suite (parser and API tests)
|   |-- requirements.txt           # Python dependencies
|-- frontend/                      # Next.js App Router static web application
|   |-- src/
|   |   |-- app/                   # Next.js App Router (layout, page, styles)
|   |   |-- components/            # UI components (Dashboard, Table, Modals)
|   |   |-- lib/                   # Heuristics, storage, API client, samples
|   |-- public/                    # Static assets
|   |-- next.config.mjs            # Static export ('export') configuration
|   |-- tailwind.config.ts         # Tailwind CSS styling configuration
|-- sample-reports/                # Labeled sample JUnit XML test reports
|   |-- run-1-build-101.xml        # Baseline run (all pass, 1 skip)
|   |-- run-2-build-102.xml        # Run with idempotency failure
|   |-- run-3-build-103.xml        # Run with session expiry failure
|   |-- run-4-build-104.xml        # Run with timeout error
|   |-- run-5-build-105.xml        # Run triggering 5-run flaky signal
|   |-- run-6-build-106.xml        # Follow-up run confirming resolution
|   |-- malformed-sample.xml       # Intentionally broken XML for error boundary test
|-- .github/workflows/
|   |-- deploy-pages.yml           # Automated GitHub Pages static build & deploy
|-- render.yaml                    # Render Web Service Blueprint (free tier)
|-- README.md                      # Documentation
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24) & npm
- Python 3.10+ (tested on Python 3.11 / 3.14)

### 1. Run the Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest -v

# Start development server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be accessible at:
- Health check: `http://localhost:8000/health`
- Swagger UI docs: `http://localhost:8000/docs`
- Analysis endpoint: `POST http://localhost:8000/api/v1/analyze`

### 2. Run the Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Run development server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Frontend (`frontend/.env.local` or CI Build)
| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8000` (local) or `https://test-run-reliability-dashboard.onrender.com` (prod) |
| `NEXT_PUBLIC_BASE_PATH` | Base subpath for GitHub Pages | `""` (local) or `/test-run-reliability-dashboard` (prod) |

### Backend (`backend/.env` or Render Service Settings)
| Variable | Description | Example / Default |
|---|---|---|
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000,https://mahfuzshanto.github.io` |
| `PORT` | Port bound by host / container | `8000` (local) or injected by Render (`$PORT`) |

*Note: No passwords, tokens, or external API secrets are required for running RunLens.*

---

## Sample Reports Walkthrough

To explore the dashboard:
1. Click **"Load 6 Demo Runs"** on the dashboard to populate history from pre-parsed builds, **OR**
2. Upload the sample XML reports in order from `sample-reports/`:
   - `run-1-build-101.xml` (baseline passes)
   - `run-2-build-102.xml` (`test_charge_idempotency` fails)
   - `run-3-build-103.xml` (`test_charge_idempotency` passes, `test_session_expiry` fails)
   - `run-4-build-104.xml` (`test_stripe_webhook` errors on socket timeout)
   - `run-5-build-105.xml` (`test_charge_idempotency` fails again; meets 5-run threshold with both passes and fails)
   - `run-6-build-106.xml` (`test_charge_idempotency` passes)
3. Notice that:
   - `com.runlens.Payments#test_charge_idempotency` is tagged with `Possible Flaky (4P / 2F)`.
   - `com.runlens.Auth#test_session_expiry` shows a persistent failure without the flaky label.
   - `com.runlens.Search#test_query_indexing` remains consistently green.
4. Upload `sample-reports/malformed-sample.xml` to observe graceful error reporting.

---

## Deployment Guide

### Frontend Deployment: GitHub Pages

1. In your GitHub repository, navigate to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push to `main` branch. The workflow in `.github/workflows/deploy-pages.yml` will automatically:
   - Set `NEXT_PUBLIC_BASE_PATH=/test-run-reliability-dashboard`.
   - Build the Next.js static export to `frontend/out`.
   - Deploy the site to `https://<USERNAME>.github.io/test-run-reliability-dashboard/`.

### Backend Deployment: Render (Free Web Service)

1. Sign in to your [Render dashboard](https://dashboard.render.com).
2. Click **New > Web Service** and connect your GitHub repository.
3. Configure the service using the free tier:
   - **Name:** `test-run-reliability-dashboard`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Free` (requires no credit card)
4. Add the environment variables:
   - `PYTHON_VERSION`: `3.11.9`
   - `CORS_ORIGINS`: `https://<USERNAME>.github.io,http://localhost:3000`
5. Alternatively, connect via **Blueprints** using the included `render.yaml`.

> **Free Tier Cold Starts:** Free Render web services spin down after 15 minutes of inactivity. When a request is made after an idle period, the service can take 20-40 seconds to wake up. RunLens detects this gracefully and provides retry actions, while keeping the demo explorer fully operational offline.

---

## Privacy & Security

- **Safe XML Parser**: Utilizes Python `defusedxml` to protect against XML entity expansion (Billion Laughs) and external DTD injection attacks.
- **Upload Limit**: 2 MB upload guard to prevent memory exhaustion.
- **Zero Server Persistence**: No database, no filesystem caching, and no report retention on the backend.
- **Local Storage Only**: Run data is saved solely in the client browser's `localStorage` and never transmitted to external analytics providers.
