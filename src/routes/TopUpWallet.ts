import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { topUpWallet } from '../queries.ts';
import type { WalletTopUpResponse } from '../types/index.ts';

/**
 * Add simulated INR funds (default 2000 INR) to a customer wallet.
 */
export default async function TopUpWallet(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const userId = (body.userId as string) || req.viewerId || 'syed';
	const amount = Number(body.amount ?? 2000);
	assert(amount > 0 && amount <= 10000, Boom.badRequest('Top-up amount must be between 100 and 10000 INR'));

	const client = req.pg ?? getDatabaseClient();
	const rows = await topUpWallet.run({ userId, amount }, client);
	assert(rows.length > 0 && rows[0]?.result?.user, Boom.notFound(`User '${userId}' not found`));

	const updatedUser = rows[0].result.user;
	const response: WalletTopUpResponse & { addedAmount: number; walletBalance: number } = {
		userId: updatedUser.id,
		creditedAmount: amount,
		newWalletBalance: updatedUser.walletBalance,
		addedAmount: amount,
		walletBalance: updatedUser.walletBalance,
	};

	// Broadcast user wallet mutation across real-time SSE stream
	emitCafeEvent('cafe.users.update', updatedUser);

	res.json(response);
}
