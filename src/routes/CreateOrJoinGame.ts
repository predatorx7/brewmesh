import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { createOrJoinGame } from '../queries.ts';

/**
 * Host a new board game table session or join an existing game table looking for players.
 */
export default async function CreateOrJoinGame(req: Request, res: Response): Promise<void> {
	const {
		action = 'HOST',
		gameId = null,
		userId = 'syed',
		title = null,
		category = 'Strategy',
		source = 'GUEST_BROUGHT',
		tableNumber = 4,
		maxPlayers = 4,
		note = null,
	} = req.body ?? {};

	assert(userId, Boom.badRequest('Please provide a userId to host or join a game.'));
	if (String(action).toUpperCase() === 'JOIN') {
		assert(gameId, Boom.badRequest('Please select a gameId to join.'));
	}

	const client = req.pg ?? getDatabaseClient();
	const rows = await createOrJoinGame.run(
		{
			action,
			gameId,
			userId,
			title,
			category,
			source,
			tableNumber: Number(tableNumber) || 4,
			maxPlayers: Number(maxPlayers) || 4,
			note,
		},
		client,
	);

	const payload = rows[0]?.result;
	assert(payload?.game, Boom.badRequest('Could not create or join the selected game.'));
	res.status(String(action).toUpperCase() === 'JOIN' ? 200 : 201).json(payload);
}
