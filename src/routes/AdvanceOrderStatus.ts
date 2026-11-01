import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { advanceOrderStatus } from '../queries.ts';
import type { OrderStatusUpdate } from '../types/index.ts';

/**
 * Update the preparation status of an order in the barista kitchen queue.
 */
export default async function AdvanceOrderStatus(req: Request, res: Response): Promise<void> {
	const orderId = Number(req.params.orderId);
	assert(!Number.isNaN(orderId) && orderId > 0, Boom.badRequest('Valid numeric orderId path parameter is required'));

	const status = req.body?.status;
	assert(
		status && ['Pending', 'Preparing', 'Ready', 'Completed'].includes(status),
		Boom.badRequest("Status must be one of: 'Pending', 'Preparing', 'Ready', 'Completed'"),
	);

	const client = req.pg ?? getDatabaseClient();
	const rows = await advanceOrderStatus.run({ orderId, status }, client);
	assert(rows.length > 0 && rows[0]?.result, Boom.notFound(`Order ${orderId} not found`));

	const raw = rows[0].result;
	const response: OrderStatusUpdate = {
		orderId: raw.id ?? (raw as any).orderId,
		status: raw.status,
		updatedAt: raw.updatedAt,
	};

	// Broadcast live order status transition across real-time SSE stream
	emitCafeEvent('cafe.orders.update', raw);

	res.json(response);
}
