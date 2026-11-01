import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { updateMenuStock } from '../queries.ts';
import { formatMenuItem } from './ListMenuItems.ts';

/**
 * Update inventory stock levels or availability flags for a cafe menu item.
 */
export default async function UpdateMenuStock(req: Request, res: Response): Promise<void> {
	const itemId = Number(req.params.itemId);
	assert(!Number.isNaN(itemId) && itemId > 0, Boom.badRequest('Valid numeric itemId path parameter is required'));

	const body = req.body || {};
	const stockDelta = typeof body.stockDelta === 'number' ? body.stockDelta : null;
	const absoluteStock = typeof body.absoluteStock === 'number' ? body.absoluteStock : null;
	const isAvailable = typeof body.isAvailable === 'boolean' ? body.isAvailable : null;

	const client = req.pg ?? getDatabaseClient();
	const rows = await updateMenuStock.run(
		{
			itemId,
			stockDelta,
			absoluteStock,
			isAvailable,
		},
		client,
	);

	assert(rows.length > 0 && rows[0]?.result, Boom.notFound(`Menu item ${itemId} not found`));

	const formatted = formatMenuItem(rows[0].result);

	// Broadcast inventory stock mutation across real-time SSE stream
	emitCafeEvent('cafe.menu_items.update', formatted);

	res.json(formatted);
}
