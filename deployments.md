# Deploying BrewMesh to Google Cloud and Firebase

This guide walks you through deploying BrewMesh to **Google Cloud Run** (`asia-south1` Mumbai), **Google Cloud SQL for PostgreSQL**, and **Firebase Hosting**.

---

## Live production environment

| Component | Production value |
| :--- | :--- |
| **Google Cloud / Firebase Project ID** | `brewmesh` (Project Number: `969535036828`) |
| **Primary Region** | `asia-south1` (Mumbai, India) |
| **Firebase Hosting Web UI & WebMCP** | `https://brewmesh.web.app` (`https://brewmesh.firebaseapp.com`) |
| **Cloud Run Service URL** | `https://brewmesh-969535036828.asia-south1.run.app` |
| **Remote MCP Endpoint (Streamable HTTP)** | `https://brewmesh-969535036828.asia-south1.run.app/mcp` |
| **Real-Time SSE Event Stream** | `https://brewmesh-969535036828.asia-south1.run.app/api/events` |
| **OpenAPI 3.0.3 Contract** | `https://brewmesh-969535036828.asia-south1.run.app/openapi.yaml` |

---

## 1. Prerequisites

Before you deploy, install and authenticate the following command-line tools on your machine:

1. **Node.js 22+** and **npm 10+**
2. **Google Cloud CLI (`gcloud`):**
   ```bash
   gcloud auth login
   gcloud config set project brewmesh
   ```
3. **Firebase CLI (`firebase-tools`):**
   ```bash
   npx -y firebase-tools@latest login
   ```

---

## 2. Enable required Google Cloud APIs

Enable Cloud Run, Cloud SQL, Cloud Build, Artifact Registry, API Keys, and the Generative Language (Gemini) API on your Google Cloud project:

```bash
gcloud services enable \
	run.googleapis.com \
	sqladmin.googleapis.com \
	cloudbuild.googleapis.com \
	artifactregistry.googleapis.com \
	generativelanguage.googleapis.com \
	apikeys.googleapis.com \
	--project=brewmesh
```

---

## 3. Create or retrieve a Gemini API key

Create a dedicated Google Gemini API key restricted to the Generative Language API (`generativelanguage.googleapis.com`):

```bash
gcloud services api-keys create \
	--display-name="BrewMesh Gemini API Key" \
	--api-target=service=generativelanguage.googleapis.com \
	--project=brewmesh
```

Copy the `keyString` returned by the command and store it in your local `.env` file (which is gitignored):

```dotenv
PORT=8080
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PGMB_GROUP_ID=brewmesh-server
```

---

## 4. Database setup (Cloud SQL for PostgreSQL or PGlite fallback)

BrewMesh automatically initializes the `cafe` schema, PL/pgSQL functions, `@haathie/pgmb` mutation triggers, and Mumbai seed data from `sql/ddl.sql` on startup.

### Option A: Zero-config embedded PGlite (default)
If you omit `DATABASE_URL`, the Cloud Run container automatically runs an in-process PostgreSQL engine via `@electric-sql/pglite` with `@haathie/pgmb` triggers enabled.

> **Important:** When running with PGlite on Cloud Run, allocate at least **1 GiB of memory** (`--memory=1Gi`) so the WebAssembly PostgreSQL heap can initialize cleanly.

### Option B: Managed Google Cloud SQL for PostgreSQL (`asia-south1`)
To connect to a managed Cloud SQL for PostgreSQL instance in Mumbai:

1. Create a PostgreSQL 16 instance and database:
   ```bash
   gcloud sql instances create brewmesh-pg \
   	--database-version=POSTGRES_16 \
   	--tier=db-f1-micro \
   	--region=asia-south1 \
   	--project=brewmesh

   gcloud sql databases create brewmesh \
   	--instance=brewmesh-pg \
   	--project=brewmesh
   ```
2. Pass `--add-cloudsql-instances=brewmesh:asia-south1:brewmesh-pg` and `DATABASE_URL` when deploying to Cloud Run in Step 6.

---

## 5. Run code generation and pre-deploy checks

Whenever you modify `sql/ddl.sql`, `sql/queries.sql`, or `openapi.yaml`, regenerate the TypeScript query runners, OpenAPI types, MCP server tools, and browser WebMCP manifest, then run the test suite:

```bash
# 1. Regenerate src/queries.ts, src/types/openapi.gen.ts, src/mcp/operations.gen.ts, and public/webmcp-tools.gen.js
npm run gen

# 2. Verify TypeScript compilation (0 errors)
npm run check

# 3. Run the end-to-end test suite (HTTP routes, OpenAPI validation, Wallet, Table Connect, Games, Nearby Cafes, and MCP)
npm test
```

---

## 6. Deploy the backend and MCP server to Google Cloud Run

Deploy the containerized Express and Model Context Protocol server from source to Google Cloud Run in `asia-south1` (Mumbai):

```bash
gcloud run deploy brewmesh \
	--source . \
	--region=asia-south1 \
	--project=brewmesh \
	--allow-unauthenticated \
	--memory=1Gi \
	--cpu=1 \
	--set-env-vars="NODE_ENV=production,GEMINI_API_KEY=${GEMINI_API_KEY},GEMINI_MODEL=gemini-2.5-flash,PGMB_GROUP_ID=brewmesh-server" \
	--quiet
```

What this command does:
- Builds the multi-stage production container using `Dockerfile` via Google Cloud Build.
- Deploys a new revision of the `brewmesh` service in `asia-south1` with `1Gi` RAM and `1` vCPU.
- Exposes the REST API (`/api/**`), the Streamable HTTP MCP server (`/mcp`), the `@haathie/pgmb` SSE stream (`/api/events`), and the static web assets.

---

## 7. Deploy the frontend and proxy rules to Firebase Hosting

`firebase.json` serves the static frontend (`public/`) from Google's global CDN and rewrites `/api/**`, `/mcp`, and `/openapi.yaml` to the `brewmesh` Cloud Run service in `asia-south1`:

```bash
npx -y firebase-tools@latest deploy --only hosting --project brewmesh
```

---

## 8. Verify the live deployment

Run these commands to verify every production surface after deploying:

```bash
# 1. Check the live menu API
curl -s "https://brewmesh.web.app/api/menu" | head -c 250

# 2. Check the live board games pairing API (cafe shelf + guest-brought games)
curl -s "https://brewmesh.web.app/api/games" | head -c 250

# 3. Check the nearby cafes finder API filtered by board game
curl -s "https://brewmesh.web.app/api/cafes/nearby?game=Catan" | head -c 250

# 4. Verify the Remote MCP Server (Streamable HTTP JSON-RPC initialize)
curl -s -X POST "https://brewmesh-969535036828.asia-south1.run.app/mcp" \
	-H "Content-Type: application/json" \
	-H "Accept: application/json, text/event-stream" \
	-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"verify-cli","version":"1.0.0"}}}'

# 5. Verify the Browser WebMCP tool manifest
curl -I "https://brewmesh.web.app/webmcp-tools.gen.js"
```

### Inspecting WebMCP tools in Chrome DevTools
1. Open `https://brewmesh.web.app` in Google Chrome (with `#enable-webmcp-testing` enabled in `chrome://flags`).
2. Open **Chrome DevTools** (`F12` or `Cmd + Option + I`) and select **Application -> WebMCP**.
3. Hard-refresh the page (`Cmd + Shift + R` on macOS or `Ctrl + F5` on Windows/Linux) so DevTools captures both the **16 imperative tools** registered on `navigator.modelContext` / `document.modelContext` and the **declarative HTML `<form toolname="...">` tools**.
