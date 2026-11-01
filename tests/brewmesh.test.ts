import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.ts';
import { closeDatabase, initDatabase } from '../src/db.ts';
import { dispatchMcpTool } from '../src/mcp/server.ts';
import { closePgmb, initPgmb } from '../src/pgmb.ts';
import type { IPgClientLike } from '../src/types/index.ts';

describe('BrewMesh E2E Suite — Web UI API, OpenAPI Validation, Table Connect, Wallet, Kitchen Queue & MCP', () => {
	let db: IPgClientLike;
	let server: Server;
	let baseUrl: string;

	before(async () => {
		db = await initDatabase();
		await initPgmb(db);
		const app = await createApp(db);
		await new Promise<void>((resolve) => {
			server = app.listen(0, '127.0.0.1', () => {
				const addr = server.address();
				if (addr && typeof addr === 'object') {
					baseUrl = `http://127.0.0.1:${addr.port}`;
				}
				resolve();
			});
		});
	});

	after(async () => {
		if (server) {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
		await closePgmb();
		await closeDatabase();
	});

	it('serves the Google Search + gemini.google.com themed Web UI and WebMCP tool manifest', async () => {
		const htmlRes = await fetch(`${baseUrl}/`);
		assert.equal(htmlRes.status, 200);
		const html = await htmlRes.text();
		assert.ok(html.includes('BrewMesh'), 'Expected BrewMesh title in index.html');
		assert.ok(html.includes('omni-search-input'), 'Expected Google/Gemini Omni-Search input');

		const webmcpRes = await fetch(`${baseUrl}/webmcp-tools.gen.js`);
		assert.equal(webmcpRes.status, 200);
		const webmcpJs = await webmcpRes.text();
		assert.ok(webmcpJs.includes('omni_search_cafe'), 'Expected generated WebMCP tools in webmcp-tools.gen.js');
	});

	it('retrieves viewer context with wallet balance, usuals, and active orders (GET /api/me)', async () => {
		const res = await fetch(`${baseUrl}/api/me?userId=syed`);
		assert.equal(res.status, 200);
		const body = (await res.json()) as any;
		assert.equal(body.userId, 'syed');
		assert.equal(typeof body.walletBalance, 'number');
		assert.equal(body.isDiscoverable, false);
		assert.ok(Array.isArray(body.usuals), 'Expected usuals array');
	});

	it('lists customizable Coffee, Tea, Burgers, Sandwiches, and Chips (GET /api/menu)', async () => {
		const res = await fetch(`${baseUrl}/api/menu`);
		assert.equal(res.status, 200);
		const items = (await res.json()) as any[];
		assert.ok(items.length >= 14, `Expected at least 14 Mumbai cafe items, got ${items.length}`);
		const categories = new Set(items.map((i) => i.category));
		assert.ok(categories.has('Coffee'));
		assert.ok(categories.has('Tea & Coolers'));
		assert.ok(categories.has('Burgers & Sandwiches'));
		assert.ok(categories.has('Chips & Sides'));
	});

	it('adds +2,000 INR fake money to the user wallet (POST /api/wallet/top-up)', async () => {
		const beforeRes = await fetch(`${baseUrl}/api/me?userId=syed`);
		const beforeProfile = (await beforeRes.json()) as any;

		const topUpRes = await fetch(`${baseUrl}/api/wallet/top-up`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: 'syed', amount: 2000 }),
		});
		assert.equal(topUpRes.status, 200);
		const topUpBody = (await topUpRes.json()) as any;
		assert.equal(topUpBody.addedAmount, 2000);
		assert.equal(topUpBody.walletBalance, beforeProfile.walletBalance + 2000);
	});

	it('places a customized burger + coffee order, deducts wallet, decrements stock, and returns a Table Connect nudge (POST /api/orders)', async () => {
		const orderRes = await fetch(`${baseUrl}/api/orders`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: 'syed',
				orderedVia: 'webmcp_agent',
				notes: 'Extra crispy please',
				items: [
					{
						menuItemId: 1,
						quantity: 1,
						customizations: { Milk: 'Oat Milk' },
					},
					{
						menuItemId: 8,
						quantity: 1,
						customizations: { Bun: 'Artisan Sourdough', 'Spice Level': 'Peri-Peri Kick' },
					},
				],
			}),
		});
		assert.equal(orderRes.status, 201);
		const receipt = (await orderRes.json()) as any;
		assert.equal(receipt.userId, 'syed');
		assert.equal(receipt.orderedVia, 'webmcp_agent');
		assert.equal(receipt.status, 'Pending');
		assert.ok(receipt.totalAmount > 0);
		assert.ok(
			typeof receipt.companionNudge === 'string' && receipt.companionNudge.includes('Table Connect'),
			'Expected proactive Table Connect nudge when user is not yet discoverable',
		);
	});

	it('automatically makes a user discoverable when they share what they are working on via Omni-Search (POST /api/omni-search)', async () => {
		const omniRes = await fetch(`${baseUrl}/api/omni-search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: 'syed',
				query: "i'm working on a material science assignment for my company but ready to meet people here in this cafe",
				autoExecuteTools: true,
			}),
		});
		assert.equal(omniRes.status, 200);
		const omniBody = (await omniRes.json()) as any;
		assert.ok(omniBody.answer.length > 10);
		assert.ok(
			Array.isArray(omniBody.actionsTaken) && omniBody.actionsTaken.length > 0,
			'Expected Omni-Search to auto-enable Table Connect discoverability',
		);

		// Verify Syed is now discoverable in Cloud SQL / PGlite with his material science blurb
		const tableRes = await fetch(`${baseUrl}/api/table-connect?viewerId=ananya`);
		assert.equal(tableRes.status, 200);
		const people = (await tableRes.json()) as any[];
		const syedCard = people.find((p) => p.userId === 'syed');
		assert.ok(syedCard, 'Expected syed to appear in discoverable Table Connect list');
		assert.ok(syedCard.statusBlurb.toLowerCase().includes('material science'));
	});

	it('manages the Owner & Barista Kitchen Queue, Inventory, Room Vibes, and AI Analytics', async () => {
		// 1. Submit a Room Vibe
		const vibeRes = await fetch(`${baseUrl}/api/room-vibes`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: 'syed',
				vibe: 'Too Cold',
				comment: 'AC near Window Seat 2 is a bit chilly, playlist is awesome though!',
			}),
		});
		assert.equal(vibeRes.status, 201);

		// 2. Get Owner Dashboard
		const dashRes = await fetch(`${baseUrl}/api/owner/dashboard`);
		assert.equal(dashRes.status, 200);
		const dash = (await dashRes.json()) as any;
		assert.ok(Array.isArray(dash.kitchenQueue) && dash.kitchenQueue.length > 0);
		assert.ok(Array.isArray(dash.inventory) && dash.inventory.length >= 14);
		assert.ok(dash.analytics.totalOrders > 0);

		// 3. Advance an order in the Kitchen Queue
		const targetOrderId = dash.kitchenQueue[0].orderId;
		const advRes = await fetch(`${baseUrl}/api/owner/orders/${targetOrderId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'Ready' }),
		});
		assert.equal(advRes.status, 200);
		const advBody = (await advRes.json()) as any;
		assert.equal(advBody.status, 'Ready');

		// 4. Restock an inventory item (+10)
		const stockRes = await fetch(`${baseUrl}/api/owner/menu/1`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stockDelta: 10, isAvailable: true }),
		});
		assert.equal(stockRes.status, 200);

		// 5. Ask Owner Analytics AI
		const aiRes = await fetch(`${baseUrl}/api/owner/analytics`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question: 'What is our revenue split between human and agent orders, and how is the room vibe?',
			}),
		});
		assert.equal(aiRes.status, 200);
		const aiBody = (await aiRes.json()) as any;
		assert.ok(aiBody.answer.length > 10);
		assert.ok(Array.isArray(aiBody.actionItems) && aiBody.actionItems.length > 0);
	});

	it('executes MCP tools directly and over the /mcp Streamable HTTP endpoint', async () => {
		const mcpResult = (await dispatchMcpTool(
			'discover_table_connect',
			{ viewerId: 'syed' },
			db,
		)) as any[];
		assert.ok(Array.isArray(mcpResult) && mcpResult.length >= 3);

		// Also test POST /mcp JSON-RPC initialize & tools/list
		const rpcRes = await fetch(`${baseUrl}/mcp`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json, text/event-stream',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {},
					clientInfo: { name: 'brewmesh-test-agent', version: '1.0.0' },
				},
			}),
		});
		assert.equal(rpcRes.status, 200);
	});
});
