import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { findNearbyCafes } from '../queries.ts';

/**
 * Find nearby specialty cafes filtered by available board games, food/drink cravings, or people open to chat.
 */
export default async function FindNearbyCafes(req: Request, res: Response): Promise<void> {
	const search = (req.query.search as string) || null;
	const game = (req.query.game as string) || null;
	const craving = (req.query.craving as string) || null;
	const minChatPartners = req.query.minChatPartners ? Number(req.query.minChatPartners) : null;
	const client = req.pg ?? getDatabaseClient();

	const rows = await findNearbyCafes.run(
		{
			search,
			game,
			craving,
			minChatPartners,
		},
		client,
	);

	const payload = rows[0]?.result ?? { cafes: [], summary: 'No matching cafes found nearby.' };
	res.json(payload);
}
