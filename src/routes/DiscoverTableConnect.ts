import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { enrichTableConnectPeople } from '../gemini.ts';
import { discoverTableConnect, getViewerContext } from '../queries.ts';
import type { TableConnectPerson } from '../types/index.ts';
import { formatTableConnectPerson } from './OmniSearchCafe.ts';

/**
 * Discover other patrons opted into Table Connect in the cafe with conversational icebreakers.
 */
export default async function DiscoverTableConnect(req: Request, res: Response): Promise<void> {
	const viewerId = (req.query.viewerId as string) || req.viewerId || 'syed';
	const query = (req.query.query as string) || null;
	const client = req.pg ?? getDatabaseClient();

	const viewerRows = await getViewerContext.run({ userId: viewerId }, client);
	assert(viewerRows.length > 0 && viewerRows[0]?.result?.user, Boom.notFound(`Viewer '${viewerId}' not found`));

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

	const rows = await discoverTableConnect.run({ viewerId, query }, client);
	const rawPeople = rows[0]?.result?.people || [];
	const people: TableConnectPerson[] = rawPeople.map(formatTableConnectPerson);

	const enrichedPeople = await enrichTableConnectPeople({
		viewer: viewerContext,
		people,
		query: query || undefined,
	});

	res.json(enrichedPeople);
}
