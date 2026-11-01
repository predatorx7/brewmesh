import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { submitRoomVibe } from '../queries.ts';
import type { RoomVibeRecord } from '../types/index.ts';

/**
 * Submit live customer feedback and atmospheric sentiment for Understand the Room.
 */
export default async function SubmitRoomVibe(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const vibe = body.vibe;
	const comment = (body.comment as string)?.trim();
	assert(vibe, Boom.badRequest('Vibe rating is required'));
	assert(comment && comment.length > 0, Boom.badRequest('Feedback comment is required'));

	const userId = (body.userId as string) || req.viewerId || 'syed';
	const client = req.pg ?? getDatabaseClient();

	const rows = await submitRoomVibe.run(
		{
			userId,
			vibe,
			comment,
		},
		client,
	);

	assert(rows.length > 0 && rows[0]?.result, Boom.badRequest('Failed to record room vibe'));

	const raw = rows[0].result;
	const record: RoomVibeRecord = {
		vibeId: raw.id ?? (raw as any).vibeId,
		userId: raw.userId,
		vibe: raw.vibe,
		comment: raw.comment,
		createdAt: raw.createdAt,
	};

	// Broadcast room vibe sentiment across real-time SSE stream
	emitCafeEvent('cafe.room_vibes.insert', record);

	res.status(201).json(record);
}
