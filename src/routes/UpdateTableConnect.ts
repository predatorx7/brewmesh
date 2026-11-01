import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { setTableConnect } from '../queries.ts';
import type { TableConnectProfile } from '../types/index.ts';

/**
 * Opt a customer in or out of Table Connect and save their status blurb and table location.
 */
export default async function UpdateTableConnect(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	assert(typeof body.isDiscoverable === 'boolean', Boom.badRequest('isDiscoverable boolean is required'));

	const userId = (body.userId as string) || req.viewerId || 'syed';
	const isDiscoverable = Boolean(body.isDiscoverable);
	const tableLabel = (body.tableLabel as string) || null;
	const statusBlurb = (body.statusBlurb as string) || null;

	const client = req.pg ?? getDatabaseClient();
	const rows = await setTableConnect.run(
		{
			userId,
			isDiscoverable,
			tableLabel,
			statusBlurb,
		},
		client,
	);

	assert(rows.length > 0 && rows[0]?.result?.user, Boom.notFound(`User '${userId}' not found`));

	const user = rows[0].result.user;
	const response: TableConnectProfile = {
		userId: user.id,
		isDiscoverable: user.isDiscoverable,
		tableLabel: user.tableLabel,
		statusBlurb: user.statusBlurb,
		updatedAt: user.updatedAt,
	};

	// Broadcast user profile update across real-time SSE stream
	emitCafeEvent('cafe.users.update', user);

	res.json(response);
}
