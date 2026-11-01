# BrewMesh: AI cafe companion for Mumbai specialty coffee

BrewMesh is an AI cafe companion for a busy Mumbai specialty coffee house. It connects guests, baristas, and the cafe space in one shared system.

The application runs on **Google Cloud Run** and **Cloud SQL** in Mumbai (`asia-south1`), with an embedded PGlite fallback for zero-config local development. It pairs Google Gemini 2.5 Flash intelligence with real-time PostgreSQL event streaming over Server-Sent Events (`@haathie/pgmb`).

---

## Overview

BrewMesh solves seven everyday cafe problems through a sunlit specialty coffee house design. It replaces dark-mode and sparkle AI tropes with warm paper tones, custom cafe illustrations, zero technical jargon, and a 400ms skeleton shimmer transition for smooth visual feedback.

Whether you order through the browser, delegate an order to an in-page browser AI agent, or connect an external coding assistant, BrewMesh serves every interaction from a single PostgreSQL source of truth.

---

## Everyday cafe problems solved

### 1. Smarter ordering
- **Plain-English requests:** Order what you feel like in everyday conversational language. Gemini 2.5 Flash interprets mood, dietary needs, and flavor notes into exact menu items.
- **Deep culinary customization:** Customize milk (oat, almond, soy, whole), sweetness levels, brew temperatures, artisan breads (sourdough, brioche), spice levels, and house-made dips.
- **In-app wallet:** Pay directly from your Indian Rupee (INR) cafe balance. BrewMesh validates funds before submitting orders and offers a top-up if your balance is low.

### 2. Transparent waits
- **Dynamic wait-time calculation:** PostgreSQL functions compute wait estimates based on live kitchen queue depth and specific preparation times (`queueSummary.estimatedWaitMins`).
- **Real-time kitchen updates:** Kitchen status updates (`Queued` -> `Preparing` -> `Ready` -> `Completed`) stream straight from PostgreSQL to every active screen using `@haathie/pgmb` Server-Sent Events (`/api/events`).

### 3. Menu discovery
- **Regional Mumbai focus:** Discover single-origin roasts and local dishes, including Monsooned Malabar, Chikmagalur Arabica, Coorg Robusta, Bun Maska, Vada Pav Brioche, and Peri-Peri Fries.
- **Taste and schedule matching:** Receive personalized recommendations based on your flavor preferences, caffeine tolerance, and how much time you have before your next meeting.

### 4. Table Connect
- **Curiosity-driven connections:** BrewMesh avoids shallow algorithms that group people by identical coffee choices. Different drink preferences spark better conversations and let patrons introduce each other to new flavors.
- **Opt-in privacy:** You decide when to become discoverable. Share a short note about what you are reading, designing, or thinking about.
- **Digital waves:** Send a friendly wave (`👋`) with an icebreaker message to a neighboring table over real-time Server-Sent Events.

### 5. Room awareness
- **Live atmosphere status:** Check whether the cafe is quiet with plenty of seats or buzzing with conversation before you walk in.
- **Atmosphere categories:** View the current room mood (`Deep Work`, `Social Buzz`, `Cozy Rain`, or `Rush Hour`) and share feedback with the barista team if the air conditioning feels too chilly or the music is just right.

### 6. Board games and table games pairing
- **Cafe shelf collection:** Browse board games kept on the cafe's library shelf, such as Catan, Codenames, Chess, Carrom, and Azul.
- **Guest-hosted games:** View games brought by guests at tables right now, or list your own game to invite others to join your table.

### 7. Nearby cafes finder
- **Multi-criteria discovery:** Find nearby specialty coffee spots filtered by the games on their shelves, specific food or drink items, or how many people are open to play or chat right now.
- **Commute clarity:** View exact distances with walking and driving estimates from your current location.

---

## Three synchronized interfaces

BrewMesh serves three interfaces from one unified Express application:

1. **Human Web UI:** A responsive interface with a Google Search-inspired omni-bar that docks smoothly into a live cafe dashboard. The design uses warm specialty cafe colors, custom icons, and responsive 400ms shimmer states.
2. **Browser WebMCP (`navigator.modelContext`):** Registers tool declarations directly into the browser tab, enabling in-page AI models (such as Chrome with Gemini Nano) to inspect menus, place orders, and send waves.
3. **Remote and local MCP server (`/mcp` and `stdio`):** A standard Model Context Protocol server using `@modelcontextprotocol/sdk` supporting both Streamable HTTP and stdio transports for Claude Desktop, Cursor, and Gemini CLI.

---

## Live production endpoints

Every service runs in production in Google Cloud's Mumbai region (`asia-south1`) with a global CDN frontend on Firebase Hosting:

| Surface or resource | Live endpoint URL | Description |
| :--- | :--- | :--- |
| **Live Web App & Browser WebMCP UI** | `https://brewmesh.web.app`<br/>(also `https://brewmesh.firebaseapp.com`) | Firebase Hosting global edge serving the sunlit customer UI and registering in-browser WebMCP tools. |
| **Cloud Run Backend API** | `https://brewmesh-969535036828.asia-south1.run.app` | Production Node.js engine running in Google Cloud Mumbai (`asia-south1`). |
| **Remote MCP Server (Streamable HTTP)** | `https://brewmesh-969535036828.asia-south1.run.app/mcp`<br/>(and `https://brewmesh.web.app/mcp`) | Model Context Protocol endpoint for Claude Desktop, Cursor, and Gemini CLI. |
| **Browser WebMCP Tool Manifest** | `https://brewmesh.web.app/webmcp-tools.gen.js` | Generated WebMCP declarations for in-page browser agents. |
| **Real-Time Event Stream** | `https://brewmesh-969535036828.asia-south1.run.app/api/events` | `@haathie/pgmb` Server-Sent Events (SSE) broadcasting live order status and Table Connect waves. |
| **OpenAPI 3.0.3 Contract** | `https://brewmesh-969535036828.asia-south1.run.app/openapi.yaml` | Machine-readable contract defining all HTTP routes and schemas. |
| **GitHub Repository** | `https://github.com/predatorx7/brewmesh` | Complete open source repository with schema, type generators, and tests. |

### Quick verification commands

Verify each live production component directly from your terminal:

```bash
# 1. Fetch live cafe menu items
curl -s "https://brewmesh-969535036828.asia-south1.run.app/api/menu" | head -c 200

# 2. Query available tools from the remote Streamable HTTP MCP server
curl -s -X POST "https://brewmesh-969535036828.asia-south1.run.app/mcp" \
	-H "Content-Type: application/json" \
	-H "Accept: application/json, text/event-stream" \
	-d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | head -c 250

# 3. Read the OpenAPI 3.0.3 schema specification
curl -s "https://brewmesh-969535036828.asia-south1.run.app/openapi.yaml" | head -n 20

# 4. Inspect the generated in-browser WebMCP tool manifest
curl -s "https://brewmesh.web.app/webmcp-tools.gen.js" | head -n 25

# 5. Connect to the live Server-Sent Events stream
curl -N "https://brewmesh-969535036828.asia-south1.run.app/api/events"
```

---

## Google and Google Cloud products used

BrewMesh is built and deployed on the Google Cloud and Chrome AI ecosystem:

| Google product | How BrewMesh uses it |
| :--- | :--- |
| **Google Cloud Run (`asia-south1` Mumbai)** | Hosts the containerized Node.js 22 and TypeScript backend, serving the REST API, OpenAPI validator, `/mcp` Streamable HTTP Model Context Protocol server, and `/api/events` Server-Sent Events stream with auto-scaling in Mumbai. |
| **Google Cloud SQL for PostgreSQL** | Production relational database engine backing the `cafe` schema, PL/pgSQL domain functions, transactional INR wallet ledger, and `@haathie/pgmb` table mutation triggers (`push_table_mutations`), paired with an automatic in-process PGlite fallback for local development. |
| **Google Gemini API (`@google/genai` & `gemini-2.5-flash`)** | Powers three live intelligence workflows: (1) **Omni-Search Cafe Companion** (`runOmniSearch`) that translates natural-language cravings, budgets, and moods into customized menu pairings and detects when a guest wants to become discoverable on Table Connect; (2) **Table Connect Icebreakers** (`enrichTableConnectPeople`) that generate friendly conversation starters based on what people are working on; and (3) **Owner & Barista Analytics** (`runOwnerAnalytics`) that summarizes order velocity, agent-vs-human order splits, and room comfort feedback. |
| **Firebase Hosting (`brewmesh.web.app`)** | Serves the sunlit cafe web application, illustrations, and generated WebMCP manifest over Google's global CDN, and proxies `/api/**` and `/mcp` traffic directly to the Mumbai Cloud Run service. |
| **Chrome WebMCP (`navigator.modelContext` & `document.modelContext`)** | Registers all 17 cafe operations via Chrome's imperative WebMCP API (`registerTool`) and declarative HTML `<form toolname="...">` attributes so Chrome DevTools (`Application -> WebMCP`) and in-browser AI agents can discover and invoke tools directly inside the tab. |
| **Google Cloud Build & Artifact Registry** | Builds the multi-stage production Docker image from source and stores versioned container images in `asia-south1` for Cloud Run deployments. |

---

## System architecture

The following diagram illustrates data flow across contracts, backend services, databases, and client surfaces:

```mermaid
flowchart TB
	subgraph Truth["Sources of Truth"]
		OpenAPI["openapi.yaml (HTTP Contract & MCP Tools)"]
		DDL["sql/ddl.sql (PostgreSQL Schema & Invariants)"]
		Queries["sql/queries.sql (Named SQL Queries)"]
	end

	subgraph Codegen["Code Generation Pipeline"]
		Gen["npm run gen"]
		OpenAPI --> Gen
		DDL --> Gen
		Queries --> Gen
	end

	subgraph Backend["Unified Engine (Google Cloud Run Mumbai)"]
		Router["Express 5 Router & OpenAPI Validator"]
		Gemini["Gemini 2.5 Flash Reasoning Engine"]
		MCPServer["MCP Server (/mcp Streamable HTTP & stdio)"]
		SSE["@haathie/pgmb SSE Stream (/api/events)"]
	end

	subgraph Data["Database Layer"]
		CloudSQL["PostgreSQL (Cloud SQL asia-south1 or PGlite)"]
		Schema["cafe Schema (Orders, Tables, Games, Vibes, Wallet)"]
	end

	subgraph Clients["Three Synchronized Interfaces"]
		WebUI["Human Web UI (Sunlit Theme & Omni-Bar)"]
		WebMCP["Browser WebMCP (navigator.modelContext)"]
		RemoteMCP["Remote MCP Client (Claude Desktop / Cursor / CLI)"]
	end

	Gen --> Router
	Gen --> MCPServer

	WebUI --> Router
	WebMCP --> Router
	RemoteMCP --> MCPServer
	MCPServer --> Router

	Router --> Gemini
	Router --> CloudSQL
	CloudSQL --> Schema
	Schema --> SSE
	SSE --> WebUI
	SSE --> WebMCP
```

---

## Code generation pipeline

BrewMesh generates all types, query executors, and tool manifests from three declarative files:

```mermaid
flowchart LR
	subgraph Inputs["Source Files"]
		DDL["sql/ddl.sql"]
		SQL["sql/queries.sql"]
		OAS["openapi.yaml"]
	end

	subgraph Generators["Generators (npm run gen)"]
		PGTypegen["pgtyped (queries:typegen)"]
		OASTypegen["openapi-typescript"]
		MCPGen["scripts/mcp-tools-gen.ts"]
		WebMCPGen["scripts/webmcp-tools-gen.ts"]
	end

	subgraph Outputs["Generated Code & Artifacts"]
		QueryTypes["src/queries.ts"]
		APITypes["src/types/openapi.gen.ts"]
		MCPOps["src/mcp/operations.gen.ts"]
		WebMCPTools["public/webmcp-tools.gen.js"]
	end

	DDL --> PGTypegen
	SQL --> PGTypegen
	PGTypegen --> QueryTypes

	OAS --> OASTypegen
	OASTypegen --> APITypes

	OAS --> MCPGen
	MCPGen --> MCPOps

	OAS --> WebMCPGen
	WebMCPGen --> WebMCPTools
```

---

## Real-time event flow

Every order update or Table Connect wave commits a PostgreSQL transaction and broadcasts mutations to every connected client:

```mermaid
sequenceDiagram
	autonumber
	actor Patron as Customer or Agent
	participant WebUI as Browser Tab (Web UI / WebMCP)
	participant Server as Cloud Run Express Server
	participant PG as PostgreSQL Database (Cloud SQL)
	participant PGMB as @haathie/pgmb Broker
	actor Barista as Barista / Neighbor Table

	Patron->>WebUI: Place customized order or send table wave
	WebUI->>Server: POST /api/orders or POST /api/table-connect/wave
	Server->>PG: Execute SQL transaction & commit mutation
	PG->>PGMB: Trigger pg_notify with row delta
	PGMB-->>WebUI: Push table mutation event over SSE (/api/events)
	PGMB-->>Barista: Push live update to kitchen queue or neighbor screen
	WebUI->>WebUI: Re-render UI with 400ms shimmer transition
```

---

## Single source-of-truth contract pipeline

BrewMesh prevents architectural drift through three source-of-truth files:

1. **`sql/ddl.sql`:** Single source of truth for the PostgreSQL schema `cafe`, value domains, enums, mutation triggers, PL/pgSQL calculations, and Mumbai cafe seed data. Business invariants (for example, queue wait estimates) reside inside SQL functions rather than application code.
2. **`sql/queries.sql`:** Single source of truth for database operations. Running `npm run queries:typegen` produces type-safe TypeScript query executors in `src/queries.ts`. Route handlers never construct inline SQL strings.
3. **`openapi.yaml`:** Single source of truth for HTTP endpoints, request/response validation schemas, TypeScript interfaces, and tool definitions. Running `npm run gen` produces:
   - TypeScript contract interfaces (`src/types/openapi.gen.ts`)
   - Remote MCP tool definitions (`src/mcp/operations.gen.ts`)
   - In-browser WebMCP tool definitions (`public/webmcp-tools.gen.js`)

---

## Getting started locally

### Prerequisites
- Node.js version 22.12.0 or version 24+
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation and setup

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/predatorx7/brewmesh.git
cd brewmesh
npm ci
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` and set your `GEMINI_API_KEY`. You can leave `DATABASE_URL` empty to run the embedded PGlite database engine with zero external dependencies.

3. Run the contract and type generators:
```bash
npm run gen
```

4. Start the development server:
```bash
npm run dev
```

Open your browser at `http://localhost:8080`.

### Available npm scripts

- `npm run gen`: Runs the SQL query typegen, OpenAPI TypeScript compiler, and MCP tool generators in sequence.
- `npm run dev`: Starts the development server with file watching and automatic environment variable loading.
- `npm run start`: Starts the production server using Node 24 native TypeScript execution.
- `npm run start:mcp`: Launches the MCP server in standard input/output (stdio) mode.
- `npm run check`: Executes TypeScript type checking without emitting files.

---

## Deploy to Google Cloud Run in Mumbai (asia-south1)

You can host BrewMesh on **Google Cloud Run** in Mumbai (`asia-south1`) for under $5 per month.

### Cost breakdown under 5 dollars

1. **Google Cloud Run:** Includes 2 million free requests, 360,000 GB-seconds of memory, and 180,000 vCPU-seconds per month under the Google Cloud Free Tier. Setting `--min-instances 0` scales the service to zero when idle, resulting in $0 compute costs during quiet periods.
2. **Database storage:**
   - **Option A (Zero cost):** Omit `DATABASE_URL`. BrewMesh runs embedded PGlite in memory with zero cloud database fees.
   - **Option B (Cloud SQL):** A `db-f1-micro` PostgreSQL instance in Mumbai costs approximately $0.01 per hour (under $5 for testing, development, and hackathon evaluation).
3. **Gemini 2.5 Flash:** Provides free tier usage and budget-friendly pricing via Google AI Studio.

### Deployment command

Authenticate with your Google Cloud account and deploy using the Cloud SDK:

```bash
gcloud run deploy brewmesh \
	--source . \
	--region asia-south1 \
	--allow-unauthenticated \
	--port 8080 \
	--set-env-vars GEMINI_MODEL=gemini-2.5-flash,PGMB_GROUP_ID=brewmesh-server \
	--set-env-vars GEMINI_API_KEY="your-gemini-api-key" \
	--min-instances 0 \
	--max-instances 2 \
	--memory 512Mi \
	--cpu 1
```

If you connect to a Google Cloud SQL instance, include the database connection flags:

```bash
gcloud run deploy brewmesh \
	--source . \
	--region asia-south1 \
	--allow-unauthenticated \
	--port 8080 \
	--add-cloudsql-instances "your-project:asia-south1:brewmesh-db" \
	--set-env-vars DATABASE_URL="postgresql://postgres:password@localhost/cafe?host=/cloudsql/your-project:asia-south1:brewmesh-db" \
	--set-env-vars GEMINI_MODEL=gemini-2.5-flash,PGMB_GROUP_ID=brewmesh-server \
	--set-env-vars GEMINI_API_KEY="your-gemini-api-key" \
	--min-instances 0 \
	--max-instances 2 \
	--memory 512Mi \
	--cpu 1
```

---

## API and MCP tools reference

The following 17 operations power the human interface, in-browser WebMCP agents, and remote MCP clients:

| Tool name | Method and path | Purpose |
| :--- | :--- | :--- |
| `get_viewer_context` | `GET /api/me` | Inspect active patron details, table number, and INR balance. |
| `omni_search_cafe` | `POST /api/omni-search` | Natural language mood, craving, and menu semantic search. |
| `list_menu_items` | `GET /api/menu` | Browse menu categorized by coffee, tea, food, or sides with live stock and customizations. |
| `place_order` | `POST /api/orders` | Place customized food and drink orders with automatic wait-time calculation. |
| `top_up_wallet` | `POST /api/wallet/top-up` | Credit customer wallet balance in Indian Rupees. |
| `update_table_connect` | `PUT /api/table-connect` | Update opt-in discovery status and work or thought blurb. |
| `discover_table_connect` | `GET /api/table-connect` | Discover fellow patrons based on shared projects without coffee taste filtering. |
| `send_table_wave` | `POST /api/table-connect/wave` | Send friendly icebreaker waves and notes between tables. |
| `submit_room_vibe` | `POST /api/room-vibes` | Record ambient crowd telemetry and cafe energy levels. |
| `get_owner_dashboard` | `GET /api/owner/dashboard` | View kitchen queue, active tables, stock alerts, and sentiment summaries. |
| `advance_order_status` | `PATCH /api/owner/orders/{orderId}` | Move orders from Pending to Preparing, Ready, or Completed. |
| `update_menu_stock` | `PATCH /api/owner/menu/{itemId}` | Toggle stock availability and quantities. |
| `ask_owner_analytics` | `POST /api/owner/analytics` | Ask operational and sentiment questions answered by Gemini 2.5 Flash. |
| `get_events` | `GET /api/events` | Stream real-time database mutations and waves via `@haathie/pgmb` Server-Sent Events. |
| `list_games` (`listGames`) | `GET /api/games` | Browse games available on the cafe shelf or brought by guests at tables. |
| `create_game_session` (`createGameSession`) | `POST /api/games` | List a game you brought or picked up from the shelf to invite players to your table. |
| `find_nearby_cafes` (`findNearbyCafes`) | `GET /api/cafes/nearby` | Locate nearby specialty cafes filtered by games offered, menu items, or people open to play. |

---

## Development conventions

- **Indentation:** Use tabs (`\t`) for all source files.
- **Imports:** Explicitly include `.ts` extensions on relative TypeScript imports.
- **Encapsulation:** Prefix private class properties and methods with `#`.
- **Validation:** Assert state using `assert(condition, boomError)` from `node:assert` and `@hapi/boom`.
- **Logging:** Direct all application logs through `pino` via `src/logger.ts`. Do not use `console.log`.
- **Documentation:** Use sentence case for headings, active voice, present tense, and second person. Write "for example" or "that is" rather than Latin abbreviations.

---

## License

This project is licensed under the Apache License 2.0.
