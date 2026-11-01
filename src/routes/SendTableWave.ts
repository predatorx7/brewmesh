import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { sendTableWave } from '../queries.ts';
import type { TableWaveReceipt } from '../types/index.ts';

/**
 * Send a live icebreaker wave and note to another discoverable patron in the cafe.
 */
export default async function SendTableWave(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const toUserId = (body.toUserId as string)?.trim();
	const message = (body.message as string)?.trim();
	assert(toUserId && toUserId.length > 0, Boom.badRequest('Recipient toUserId is required'));
	assert(message && message.length > 0, Boom.badRequest('Wave message is required'));

	const fromUserId = (body.fromUserId as string) || req.viewerId || 'syed';
	const client = req.pg ?? getDatabaseClient();

	const rows = await sendTableWave.run(
		{
			fromUserId,
			toUserId,
			message,
		},
		client,
	);

	assert(rows.length > 0 && rows[0]?.result, Boom.badRequest('Failed to deliver wave'));

	const raw = rows[0].result;
	const receipt: TableWaveReceipt = {
		waveId: raw.id ?? (raw as any).waveId,
		fromUserId: raw.fromUserId,
		toUserId: raw.toUserId,
		message: raw.message,
		status: 'delivered',
		createdAt: raw.createdAt,
	};

	// Broadcast table wave across real-time SSE stream
	emitCafeEvent('cafe.table_waves.insert', receipt);

	res.status(201).json(receipt);
}
