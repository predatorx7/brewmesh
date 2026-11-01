import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { listTableGames } from '../queries.ts';

/**
 * List board and card games available on the cafe shelf or brought by guests.
 */
export default async function ListGames(req: Request, res: Response): Promise<void> {
	const source = (req.query.source as string) || null;
	const onlyLookingForPlayers =
		req.query.onlyLookingForPlayers === 'true' || req.query.onlyLookingForPlayers === ('true' as unknown);
	const client = req.pg ?? getDatabaseClient();

	const rows = await listTableGames.run({ source, onlyLookingForPlayers }, client);
	const payload = rows[0]?.result ?? { games: [] };
	res.json(payload);
}
