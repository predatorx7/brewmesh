import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { SKILL_PATH } from '../consts.ts';
import { getDatabaseClient } from '../db.ts';
import { enrichTableConnectPeople, runOmniSearchCompanion, runOwnerAnalyticsAi } from '../gemini.ts';
import { LOGGER } from '../logger.ts';
import { emitCafeEvent } from '../pgmb.ts';
import {
	advanceOrderStatus,
	createOrJoinGame,
	discoverTableConnect,
	findNearbyCafes,
	getOwnerDashboard,
	getViewerContext,
	listMenuItems,
	listTableGames,
	placeOrder,
	sendTableWave,
	setTableConnect,
	submitRoomVibe,
	topUpWallet,
	updateMenuStock,
} from '../queries.ts';
import { formatOwnerDashboard } from '../routes/GetOwnerDashboard.ts';
import { formatMenuItem } from '../routes/ListMenuItems.ts';
import { formatTableConnectPerson } from '../routes/OmniSearchCafe.ts';
import { formatOrderReceipt } from '../routes/PlaceOrder.ts';
import type { IPgClientLike, TableConnectPerson } from '../types/index.ts';
import { MCP_TOOLS } from './operations.gen.ts';

/**
 * Convert JSON schema property definition to corresponding Zod schema for MCP validation.
 */
function jsonPropertyToZod(schema: any, isRequired: boolean): z.ZodTypeAny {
	let zType: z.ZodTypeAny;

	if (schema.type === 'string') {
		if (Array.isArray(schema.enum) && schema.enum.length > 0) {
			zType = z.enum(schema.enum as [string, ...string[]]);
		} else {
			zType = z.string();
		}
	} else if (schema.type === 'integer' || schema.type === 'number') {
		zType = z.number();
	} else if (schema.type === 'boolean') {
		zType = z.boolean();
	} else if (schema.type === 'array') {
		zType = z.array(z.any());
	} else if (schema.type === 'object') {
		zType = z.record(z.any());
	} else {
		zType = z.any();
	}

	if (schema.description) {
		zType = zType.describe(schema.description);
	}

	return isRequired ? zType : zType.optional();
}

/**
 * Build a Zod raw shape map from an MCP tool JSON inputSchema.
 */
function buildZodInputShape(inputSchema: any): Record<string, z.ZodTypeAny> {
	const shape: Record<string, z.ZodTypeAny> = {};
	const reqSet = new Set(inputSchema?.required || []);

	for (const [key, prop] of Object.entries(inputSchema?.properties || {})) {
		shape[key] = jsonPropertyToZod(prop, reqSet.has(key));
	}

	return shape;
}

/**
 * Dispatch an MCP tool call directly to the internal database queries and AI companion logic.
 */
export async function dispatchMcpTool(
	toolName: string,
	args: Record<string, any>,
	client: IPgClientLike,
): Promise<unknown> {
	LOGGER.info({ toolName, args }, 'Executing MCP tool call');

	switch (toolName) {
		case 'get_viewer_context': {
			const userId = args.userId || 'syed';
			const rows = await getViewerContext.run({ userId }, client);
			return rows[0]?.result || null;
		}

		case 'list_menu_items': {
			const rows = await listMenuItems.run(
				{
					category: args.category || null,
					query: args.query || null,
					onlyAvailable: args.onlyAvailable ?? null,
				},
				client,
			);
			return (rows[0]?.result || []).map(formatMenuItem);
		}

		case 'omni_search_cafe': {
			const userId = args.userId || 'syed';
			const query = args.query || '';
			const autoExecuteTools = args.autoExecuteTools !== false;

			const viewerRows = await getViewerContext.run({ userId }, client);
			const rawViewer = viewerRows[0]?.result;
			const viewerContext = {
				userId: rawViewer?.user?.id || userId,
				name: rawViewer?.user?.name || userId,
				role: rawViewer?.user?.role || 'customer',
				walletBalance: rawViewer?.user?.walletBalance || 0,
				tableLabel: rawViewer?.user?.tableLabel,
				isDiscoverable: rawViewer?.user?.isDiscoverable ?? false,
				statusBlurb: rawViewer?.user?.statusBlurb,
				usuals: [],
				activeOrders: [],
				incomingWaves: [],
			};

			const menuRows = await listMenuItems.run({}, client);
			const menuItems = (menuRows[0]?.result || []).map(formatMenuItem);

			const peopleRows = await discoverTableConnect.run({ viewerId: userId, query }, client);
			const discoverablePeople: TableConnectPerson[] = (peopleRows[0]?.result?.people || []).map(
				formatTableConnectPerson,
			);

			const companionResult = await runOmniSearchCompanion({
				query,
				viewerContext,
				menuItems,
				discoverablePeople,
			});

			if (autoExecuteTools && companionResult.tableConnectAction?.shouldEnableDiscoverable) {
				const action = companionResult.tableConnectAction;
				const tableLabel = action.extractedTable || viewerContext.tableLabel || 'Table 4';
				const statusBlurb = action.extractedBlurb || query;

				const updateRows = await setTableConnect.run(
					{
						userId,
						isDiscoverable: true,
						tableLabel,
						statusBlurb,
					},
					client,
				);
				if (updateRows.length > 0) {
					emitCafeEvent('cafe.users.update', updateRows[0].result);
				}
			}

			return {
				answer: companionResult.answer,
				menuRecommendations: companionResult.menuRecommendations,
				tableMatches: companionResult.tableMatches,
				actionsTaken: companionResult.actionsTaken,
				suggestedQueries: companionResult.suggestedQueries,
			};
		}

		case 'place_order': {
			const userId = args.userId || 'syed';
			const orderedVia = args.orderedVia || 'mcp_server';
			const notes = args.notes || null;
			const items = args.items;

			const rows = await placeOrder.run(
				{
					userId,
					items: typeof items === 'string' ? items : JSON.stringify(items),
					orderedVia,
					notes,
				},
				client,
			);
			const receipt = formatOrderReceipt(rows[0]?.result);
			emitCafeEvent('cafe.orders.insert', receipt);
			return receipt;
		}

		case 'top_up_wallet': {
			const userId = args.userId || 'syed';
			const amount = Number(args.amount ?? 2000);
			const rows = await topUpWallet.run({ userId, amount }, client);
			const updatedUser = rows[0]?.result?.user;
			if (updatedUser) {
				emitCafeEvent('cafe.users.update', updatedUser);
			}
			return {
				userId: updatedUser?.id || userId,
				creditedAmount: amount,
				newWalletBalance: updatedUser?.walletBalance || 0,
			};
		}

		case 'discover_table_connect': {
			const viewerId = args.viewerId || 'syed';
			const query = args.query || null;

			const viewerRows = await getViewerContext.run({ userId: viewerId }, client);
			const rawViewer = viewerRows[0]?.result;
			const viewerContext = {
				userId: rawViewer?.user?.id || viewerId,
				name: rawViewer?.user?.name || viewerId,
				role: rawViewer?.user?.role || 'customer',
				walletBalance: rawViewer?.user?.walletBalance || 0,
				tableLabel: rawViewer?.user?.tableLabel,
				isDiscoverable: rawViewer?.user?.isDiscoverable ?? false,
				statusBlurb: rawViewer?.user?.statusBlurb,
				usuals: [],
				activeOrders: [],
				incomingWaves: [],
			};

			const rows = await discoverTableConnect.run({ viewerId, query }, client);
			const rawPeople = rows[0]?.result?.people || [];
			const people = rawPeople.map(formatTableConnectPerson);

			return enrichTableConnectPeople({
				viewer: viewerContext,
				people,
				query: query || undefined,
			});
		}

		case 'update_table_connect': {
			const userId = args.userId || 'syed';
			const isDiscoverable = Boolean(args.isDiscoverable);
			const tableLabel = args.tableLabel || null;
			const statusBlurb = args.statusBlurb || null;

			const rows = await setTableConnect.run(
				{
					userId,
					isDiscoverable,
					tableLabel,
					statusBlurb,
				},
				client,
			);
			const user = rows[0]?.result?.user;
			if (user) {
				emitCafeEvent('cafe.users.update', user);
			}
			return {
				userId: user?.id || userId,
				isDiscoverable: user?.isDiscoverable ?? isDiscoverable,
				tableLabel: user?.tableLabel,
				statusBlurb: user?.statusBlurb,
				updatedAt: user?.updatedAt || new Date().toISOString(),
			};
		}

		case 'send_table_wave': {
			const fromUserId = args.fromUserId || 'syed';
			const toUserId = args.toUserId;
			const message = args.message;

			const rows = await sendTableWave.run({ fromUserId, toUserId, message }, client);
			const raw = rows[0]?.result;
			const receipt = {
				waveId: raw?.id,
				fromUserId: raw?.fromUserId,
				toUserId: raw?.toUserId,
				message: raw?.message,
				status: 'delivered',
				createdAt: raw?.createdAt || new Date().toISOString(),
			};
			emitCafeEvent('cafe.table_waves.insert', receipt);
			return receipt;
		}

		case 'submit_room_vibe': {
			const userId = args.userId || 'syed';
			const vibe = args.vibe;
			const comment = args.comment;

			const rows = await submitRoomVibe.run({ userId, vibe, comment }, client);
			const raw = rows[0]?.result;
			const record = {
				vibeId: raw?.id,
				userId: raw?.userId,
				vibe: raw?.vibe,
				comment: raw?.comment,
				createdAt: raw?.createdAt || new Date().toISOString(),
			};
			emitCafeEvent('cafe.room_vibes.insert', record);
			return record;
		}

		case 'get_owner_dashboard': {
			const rows = await getOwnerDashboard.run({}, client);
			return formatOwnerDashboard(rows[0]?.result);
		}

		case 'advance_order_status': {
			const orderId = Number(args.orderId);
			const status = args.status;
			const rows = await advanceOrderStatus.run({ orderId, status }, client);
			const raw = rows[0]?.result;
			emitCafeEvent('cafe.orders.update', raw);
			return {
				orderId: raw?.id,
				status: raw?.status,
				updatedAt: raw?.updatedAt || new Date().toISOString(),
			};
		}

		case 'update_menu_stock': {
			const itemId = Number(args.itemId);
			const stockDelta = typeof args.stockDelta === 'number' ? args.stockDelta : null;
			const absoluteStock = typeof args.absoluteStock === 'number' ? args.absoluteStock : null;
			const isAvailable = typeof args.isAvailable === 'boolean' ? args.isAvailable : null;

			const rows = await updateMenuStock.run({ itemId, stockDelta, absoluteStock, isAvailable }, client);
			const formatted = formatMenuItem(rows[0]?.result);
			emitCafeEvent('cafe.menu_items.update', formatted);
			return formatted;
		}

		case 'ask_owner_analytics': {
			const question = args.question;
			const rows = await getOwnerDashboard.run({}, client);
			const dashboard = formatOwnerDashboard(rows[0]?.result);
			return runOwnerAnalyticsAi({ question, dashboard });
		}

		case 'list_games': {
			const source = args.source || null;
			const onlyLookingForPlayers = Boolean(args.onlyLookingForPlayers);
			const rows = await listTableGames.run({ source, onlyLookingForPlayers }, client);
			return rows[0]?.result ?? { games: [] };
		}

		case 'create_or_join_game': {
			const rows = await createOrJoinGame.run(
				{
					action: args.action || 'HOST',
					gameId: args.gameId || null,
					userId: args.userId || 'syed',
					title: args.title || null,
					category: args.category || 'Strategy',
					source: args.source || 'GUEST_BROUGHT',
					tableNumber: Number(args.tableNumber) || 4,
					maxPlayers: Number(args.maxPlayers) || 4,
					note: args.note || null,
				},
				client,
			);
			const res = rows[0]?.result;
			if (res?.game) {
				emitCafeEvent('cafe.table_games.update', res.game);
			}
			return res;
		}

		case 'find_nearby_cafes': {
			const rows = await findNearbyCafes.run(
				{
					search: args.search || null,
					game: args.game || null,
					craving: args.craving || null,
					minChatPartners: args.minChatPartners ? Number(args.minChatPartners) : null,
				},
				client,
			);
			return rows[0]?.result ?? { cafes: [], summary: 'No matching cafes found nearby.' };
		}

		default:
			throw new Error(`Unknown MCP tool '${toolName}'`);
	}
}

/**
 * Instantiate and configure the BrewMesh Model Context Protocol (MCP) server instance.
 * Automatically registers all 13 tools from operations.gen.ts and the brewmesh://skill resource.
 */
export function createBrewMeshMcpServer(): McpServer {
	const server = new McpServer(
		{
			name: 'brewmesh-mcp-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				resources: {},
				tools: {},
				logging: {},
			},
		},
	);

	// Register BrewMesh Skill resource
	server.resource('brewmesh-skill', 'brewmesh://skill', async (uri) => {
		let skillContent = '# BrewMesh Cafe Companion Skill\n\nOperational guidelines for AI agents.';
		if (existsSync(SKILL_PATH)) {
			try {
				skillContent = readFileSync(SKILL_PATH, 'utf8');
			} catch (err) {
				LOGGER.warn({ err }, 'Failed to read skill file for MCP resource');
			}
		}
		return {
			contents: [
				{
					uri: uri.href,
					mimeType: 'text/markdown',
					text: skillContent,
				},
			],
		};
	});

	// Register all operations from operations.gen.ts
	for (const [toolName, toolDef] of Object.entries(MCP_TOOLS)) {
		const inputShape = buildZodInputShape(toolDef.inputSchema);

		server.registerTool(
			toolName,
			{
				description: toolDef.description,
				inputSchema: inputShape,
				annotations: toolDef.annotations as any,
			},
			async (args: any) => {
				const client = getDatabaseClient();
				try {
					const result = await dispatchMcpTool(toolName, args || {}, client);
					return {
						content: [
							{
								type: 'text',
								text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
							},
						],
					};
				} catch (error: any) {
					LOGGER.error({ toolName, error }, 'Error executing tool in MCP server');
					return {
						isError: true,
						content: [
							{
								type: 'text',
								text: `Execution failed for ${toolName}: ${error.message || String(error)}`,
							},
						],
					};
				}
			},
		);
	}

	return server;
}

const activeMcpSessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>();

/**
 * Handle incoming Remote MCP HTTP requests over Express.
 * Mount at POST /mcp, GET /mcp, and DELETE /mcp.
 */
export async function handleMcpHttpRequest(req: Request, res: Response): Promise<void> {
	const sessionId = (req.headers['mcp-session-id'] as string) || undefined;

	if (req.method === 'POST') {
		const isInit = req.body?.method === 'initialize';

		if (isInit) {
			const server = createBrewMeshMcpServer();
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
			});

			await server.connect(transport);

			// Track session
			const id = transport.sessionId || randomUUID();
			activeMcpSessions.set(id, { server, transport });

			await transport.handleRequest(req, res, req.body);
			return;
		}

		if (sessionId && activeMcpSessions.has(sessionId)) {
			const session = activeMcpSessions.get(sessionId)!;
			await session.transport.handleRequest(req, res, req.body);
			return;
		}

		// Stateless fallback mode for single-request callers
		const server = createBrewMeshMcpServer();
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});
		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);
		res.on('close', () => {
			transport.close().catch(() => {});
			server.close().catch(() => {});
		});
		return;
	}

	if (req.method === 'GET') {
		if (sessionId && activeMcpSessions.has(sessionId)) {
			const session = activeMcpSessions.get(sessionId)!;
			await session.transport.handleRequest(req, res);
			return;
		}
		res.status(400).json({ error: 'Missing or expired mcp-session-id header for SSE stream' });
		return;
	}

	if (req.method === 'DELETE') {
		if (sessionId && activeMcpSessions.has(sessionId)) {
			const session = activeMcpSessions.get(sessionId)!;
			activeMcpSessions.delete(sessionId);
			await session.transport.handleRequest(req, res);
			await session.transport.close().catch(() => {});
			await session.server.close().catch(() => {});
			return;
		}
		res.status(404).json({ error: 'Session not found' });
		return;
	}

	res.status(405).json({ error: 'Method not allowed on /mcp' });
}
