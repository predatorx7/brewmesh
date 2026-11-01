# BrewMesh: The AI-powered connected cafe companion

BrewMesh is a next-generation connected cafe companion built for the **Google Cloud | Builder Pop-Up | H2S ("The Café Companion")** hackathon. It combines artisanal Mumbai cafe culture with Google Gemini 2.5 Flash intelligence, real-time PostgreSQL event streaming, and a unified interface for humans and AI agents.

The project runs natively on **Google Cloud Run** and **Cloud SQL** in Mumbai (`asia-south1`), with zero-config local fallback to embedded PGlite.

---

## Overview

Visiting a cafe is an inherently social, culinary, and sensory experience. Yet traditional ordering software treats guests like transactional tickets. BrewMesh reimagines this relationship by turning the cafe into an intelligent, ambient mesh that connects guests, baristas, and the space itself.

Whether you order a Monsooned Malabar pour-over through a Google Search-inspired web interface, have Chrome's on-device Gemini agent place your customized brioche burger via **Browser WebMCP**, or connect an external Claude agent through the **Remote MCP Server**, BrewMesh serves all three surfaces from a single, verifiable source of truth.

---

## Five pillars of the cafe companion

BrewMesh implements all five challenge pillars with dedicated backend workflows, database invariants, and conversational skills.

### 1. Smarter ordering
- **Deep culinary customization:** Customize every dimension of your order, including milk alternatives (oat, almond, soy, whole), spice levels (mild, medium, fiery), artisan breads (sourdough, brioche, whole wheat), cheeses (cheddar, pepper jack, vegan), seasonings (peri-peri, sea salt), and house-made dips (truffle mayo, mint chutney, garlic aioli).
- **Mood and condition reasoning:** Powered by Gemini 2.5 Flash, the companion translates human context into culinary recommendations. For example, if you say *"I have a scratchy throat and need a warm pick-me-up"*, BrewMesh highlights freshly crushed ginger masala chai or honey-steamed oat lattes.
- **Transparent wallet management:** Manage your balance in Indian Rupees (INR) with integrated safety checks. The companion verifies your wallet before placing an order and suggests a top-up only when required.

### 2. Better waits
- **Dynamic wait-time intelligence:** Preparation times are calculated dynamically inside PostgreSQL functions based on live kitchen queue depth and specific item preparation complexities (`queueSummary.estimatedWaitMins`).
- **Real-time kitchen streaming:** Powered by `@haathie/pgmb`, kitchen mutations stream directly to patrons over Server-Sent Events (`/api/events`). Your status updates from `placed` to `preparing`, `ready`, and `completed` without page refreshes.

### 3. Discovery
- **Mumbai specialty focus:** Explore regional roasts and dishes, including Monsooned Malabar, Chikmagalur Arabica, Coorg Robusta, Bun Maska, Vada Pav Brioche, and Peri-Peri Fries.
- **Familiar search interface:** The UI adapts the iconic Google Search Home Page into a docking Search Results Omni-Bar with Gemini AI Overview summaries and structured Knowledge Panels.

### 4. Connect people (Table Connect)
- **Shared curiosity over identical drinks:** BrewMesh rejects superficial matching algorithms that compare people by identical coffee orders. Instead, it celebrates flavor curiosity across different drinks (for example, introducing a cold brew lover to an artisanal tea enthusiast) and connects tables through what people are currently reading, building, or pondering.
- **Privacy-first discovery:** Participation is strictly opt-in. When you tell the companion what you are working on (for example *"I'm working on a material science paper and happy to chat"*), it activates Table Connect with your custom blurb.
- **Companion nudges and digital waves:** When you order while undiscoverable, the system provides a gentle companion nudge inviting you to share your topic. Guests can send digital waves (`send_table_wave`) with friendly icebreaker greetings.

### 5. Understand the room (Room Vibe)
- **Crowd-sourced ambient telemetry:** Patrons and staff contribute live observations about energy level (focused, chill, buzzing, lively), noise level, music volume, and table availability.
- **Real-time cafe atmosphere:** Arriving guests immediately know whether the cafe is quiet for a client call or buzzing for creative collaboration.

---

## The "Surprise Us" innovation: Unified triple interface

BrewMesh introduces a **Triple Unified Surface Architecture**. A single Express application simultaneously powers:

1. **Human Web UI:** A responsive interface inspired by Google Search and styled with the `gemini.google.com` dark aesthetic (`#131314`, `#1E1F20`, and Gemini gradients).
2. **Browser WebMCP (`window.navigator.modelContext`):** Automatically registers client-side WebMCP tools into supported browsers (for example Chrome with experimental Gemini Nano integration) directly from `openapi.yaml`.
3. **Remote MCP Server (`/mcp`):** A standard Model Context Protocol server using `@modelcontextprotocol/sdk` supporting both Streamable HTTP and SSE transports for developer environments such as Claude Desktop, Cursor, or Gemini CLI.

```
                  +----------------------------------------------+
                  |               Customer or Agent              |
                  +----------------------------------------------+
                         /               |               \
                        /                |                \
       Human Browser Interaction  Browser WebMCP Agent  Remote MCP Client
       (Search UI + AI Overview)  (navigator.modelContext) (Claude / Cursor)
                       \                 |                /
                        \                |               /
                  +----------------------------------------------+
                  |      Unified BrewMesh Service (Node 24)       |
                  |  - Express 5 + express-openapi-validator     |
                  |  - Gemini 2.5 Flash Reasoning Engine         |
                  |  - @modelcontextprotocol/sdk (/mcp)          |
                  +----------------------------------------------+
                                         |
                                         | Push mutations
                                         v
                  +----------------------------------------------+
                  |         @haathie/pgmb Real-Time Broker        |
                  |       (Server-Sent Events at /api/events)    |
                  +----------------------------------------------+
                                         |
                                         | Query & PL/pgSQL
                                         v
                  +----------------------------------------------+
                  |              PostgreSQL Database             |
                  |   Google Cloud SQL (Mumbai asia-south1)     |
                  |       or embedded @electric-sql/pglite       |
                  +----------------------------------------------+
```

---

## System architecture

The following Mermaid diagram illustrates the data flow across services, protocols, and data layers:

```mermaid
flowchart TD
	subgraph Clients["Clients and Agent Surfaces"]
		UI["Human Web UI (Google Dark Theme)"]
		WebMCP["Browser WebMCP (window.navigator.modelContext)"]
		RemoteMCP["Remote MCP Client (Claude / Cursor / CLI)"]
	end

	subgraph Gateway["BrewMesh Unified Engine (Node 24)"]
		Router["Express 5 Router & OpenAPI Validator"]
		Gemini["Google Gemini 2.5 Flash Engine"]
		MCPServer["MCP Streamable HTTP & SSE Server (/mcp)"]
		SSEHandler["PGMB SSE Event Handler (/api/events)"]
	end

	subgraph DataLayer["Storage and Messaging"]
		PGMB["@haathie/pgmb Real-Time Event Broker"]
		PG["PostgreSQL (Cloud SQL asia-south1 or PGlite)"]
		Schema["Schema 'cafe' (Orders, Tables, Vibes, Wallet)"]
	end

	UI --> Router
	WebMCP --> Router
	RemoteMCP --> MCPServer
	MCPServer --> Router

	Router --> Gemini
	Router --> PG
	PG --> Schema
	Schema --> PGMB
	PGMB --> SSEHandler
	SSEHandler --> UI
```

---

## Single source-of-truth contract pipeline

BrewMesh enforces strict architectural discipline. All code, database tables, and API endpoints originate from three source-of-truth definitions:

1. **`sql/ddl.sql`:** Single source of truth for PostgreSQL schema `cafe`, value domains, enums, mutation triggers, PL/pgSQL calculations, and Mumbai cafe seed data. Business invariants (such as queue wait time estimates) reside in SQL functions.
2. **`sql/queries.sql`:** Single source of truth for database operations. Running `npm run queries:typegen` outputs type-safe query executors in `src/queries.ts`. Handlers never use inline SQL strings.
3. **`openapi.yaml`:** Single source of truth for HTTP operations, request/response schemas, TypeScript API types, and MCP tool declarations. Running `npm run gen` regenerates:
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
Edit `.env` and set your `GEMINI_API_KEY`. You can leave `DATABASE_URL` empty to use the zero-config embedded PGlite engine.

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

- `npm run gen`: Runs SQL query, OpenAPI TypeScript, and MCP tool generators in sequence.
- `npm run dev`: Starts the server with automatic environment variable loading.
- `npm run start`: Starts the production server using Node 24 native TypeScript execution.
- `npm run start:mcp`: Launches the MCP server in standard input/output (stdio) mode.
- `npm run check`: Runs TypeScript type checking without emitting files.

---

## Deploy to Google Cloud Run in Mumbai (asia-south1)

You can deploy BrewMesh to **Google Cloud Run** in Mumbai (`asia-south1`) for under $5.

### Cost breakdown under 5 dollars

1. **Google Cloud Run:** Includes 2 million free requests, 360,000 GB-seconds of memory, and 180,000 vCPU-seconds per month under the Google Cloud Free Tier. Configuring `--min-instances 0` ensures you pay $0 when idle.
2. **Database storage:**
   - **Option A (Zero cost):** Omit `DATABASE_URL`. BrewMesh runs embedded PGlite in memory with zero cloud database cost.
   - **Option B (Cloud SQL):** A `db-f1-micro` PostgreSQL instance in Mumbai costs approximately $0.01 per hour (under $5 for testing, development, and hackathon judging).
3. **Gemini 2.5 Flash:** Provides generous free quotas and cost-effective pricing through Google AI Studio.

### Deployment command

Authenticate with your Google Cloud account and deploy with a single command:

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

If you connect to a Google Cloud SQL instance, add the connection flag and database URL:

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

## WebMCP and Remote MCP tools reference

Every operation in `openapi.yaml` maps directly to both Browser WebMCP and Remote MCP tools:

| Tool name | Method and path | Purpose |
| :--- | :--- | :--- |
| `get_viewer_context` | `GET /api/viewer` | Inspect active patron details, table number, and INR balance. |
| `omni_search_cafe` | `POST /api/search` | Natural language mood, craving, and menu semantic search. |
| `list_menu_items` | `GET /api/menu` | Browse menu categorized by coffee, tea, food, or sides. |
| `place_order` | `POST /api/orders` | Place customized orders with wait-time calculation. |
| `top_up_wallet` | `POST /api/wallet/topup` | Credit customer wallet balance in Indian Rupees. |
| `update_table_connect` | `POST /api/connect/profile` | Update opt-in discovery status and work/thought blurb. |
| `discover_table_connect` | `GET /api/connect/discover` | Discover fellow patrons based on shared projects. |
| `send_table_wave` | `POST /api/connect/wave` | Send friendly icebreaker waves between tables. |
| `submit_room_vibe` | `POST /api/room/vibe` | Record ambient crowd telemetry and cafe energy levels. |
| `get_owner_dashboard` | `GET /api/owner/dashboard` | View kitchen queue, active tables, and stock alerts. |
| `advance_order_status` | `POST /api/owner/orders/advance` | Move orders from placed to preparing, ready, or completed. |
| `update_menu_stock` | `POST /api/owner/menu/stock` | Toggle stock availability and quantities. |
| `ask_owner_analytics` | `POST /api/owner/analytics` | Ask operational questions answered by Gemini 2.5 Flash. |

---

## Development conventions

- **Indentation:** Use tabs (`\t`) for all source files.
- **Imports:** Explicitly include `.ts` extensions on relative TypeScript imports.
- **Encapsulation:** Prefix private class properties and methods with `#`.
- **Validation:** Assert state using `assert(condition, boomError)` from `node:assert` and `@hapi/boom`.
- **Logging:** Direct all application logs through `pino` via `src/logger.ts`. Avoid `console.log`.
- **Documentation:** Use sentence case for headings, active voice, present tense, and second person. Never use Latin abbreviations like e-g or i-e; write "for example" or "that is".

---

## License

This project is licensed under the Apache License 2.0.
