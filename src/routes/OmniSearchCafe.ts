import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { runOmniSearchCompanion } from '../gemini.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { discoverTableConnect, getViewerContext, listMenuItems, setTableConnect } from '../queries.ts';
import type { OmniSearchResponse, TableConnectPerson } from '../types/index.ts';
import { formatMenuItem } from './ListMenuItems.ts';

/**
 * Format raw database user record into a TableConnectPerson compliant with OpenAPI schema.
 */
export function formatTableConnectPerson(p: any): TableConnectPerson {
	return {
		userId: p.id ?? p.userId,
		name: p.name,
		tableLabel: p.tableLabel || 'Open Seating',
		statusBlurb: p.statusBlurb ?? null,
		currentOrder: p.currentOrder ?? p.currentItemSummary ?? null,
		conversationStarters: p.conversationStarters || [
			`Ask what they think of their ${p.currentItemSummary ?? p.currentOrder ?? 'brew'}!`,
			`"Saw your note about '${p.statusBlurb || 'creative projects'}'—how is it going?"`,
		],
	};
}

/**
 * Run Gemini-powered Omni-Search and Cafe Companion.
 * Analyzes natural-language queries, condition descriptions, budget constraints,
 * and automatic Table Connect opt-ins.
 */
export default async function OmniSearchCafe(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const query = (body.query as string)?.trim();
	assert(query && query.length > 0, Boom.badRequest('Search query is required'));

	const userId = (body.userId as string) || req.viewerId || 'syed';
	const autoExecuteTools = body.autoExecuteTools !== false;
	const client = req.pg ?? getDatabaseClient();

	// 1. Fetch current viewer context
	const viewerRows = await getViewerContext.run({ userId }, client);
	assert(viewerRows.length > 0 && viewerRows[0]?.result?.user, Boom.notFound(`User '${userId}' not found`));
	const rawViewer = viewerRows[0].result;
	const viewerContext = {
		userId: rawViewer.user.id,
		name: rawViewer.user.name,
		role: rawViewer.user.role,
		walletBalance: rawViewer.user.walletBalance,
		tableLabel: rawViewer.user.tableLabel,
		isDiscoverable: rawViewer.user.isDiscoverable,
		statusBlurb: rawViewer.user.statusBlurb,
		usuals: [],
		activeOrders: [],
		incomingWaves: [],
	};

	// 2. Fetch full cafe menu
	const menuRows = await listMenuItems.run({}, client);
	const menuItems = (menuRows[0]?.result || []).map(formatMenuItem);

	// 3. Fetch currently discoverable people in the cafe
	const peopleRows = await discoverTableConnect.run({ viewerId: userId, query }, client);
	const rawPeople = peopleRows[0]?.result?.people || [];
	const discoverablePeople: TableConnectPerson[] = rawPeople.map(formatTableConnectPerson);

	// 4. Run Gemini companion inference
	const companionResult = await runOmniSearchCompanion({
		query,
		viewerContext,
		menuItems,
		discoverablePeople,
	});

	// 5. Automatically execute Table Connect opt-in if detected
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

	const response: OmniSearchResponse = {
		answer: companionResult.answer,
		menuRecommendations: companionResult.menuRecommendations,
		tableMatches: companionResult.tableMatches,
		actionsTaken: companionResult.actionsTaken,
		suggestedQueries: companionResult.suggestedQueries,
	};

	res.json(response);
}
