import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { getViewerContext } from '../queries.ts';
import type { ViewerContext } from '../types/index.ts';

/**
 * Retrieve the active viewer profile, INR wallet balance, order history, and cafe context.
 */
export default async function GetViewerContext(req: Request, res: Response): Promise<void> {
	const userId = (req.query.userId as string) || req.viewerId || 'syed';
	const client = req.pg ?? getDatabaseClient();

	const rows = await getViewerContext.run({ userId }, client);
	assert(rows.length > 0 && rows[0]?.result?.user, Boom.notFound(`User profile for '${userId}' not found`));

	const raw = rows[0].result;
	const user = raw.user;

	const formatted: ViewerContext = {
		userId: user.id,
		name: user.name,
		role: user.role,
		walletBalance: user.walletBalance,
		tableLabel: user.tableLabel,
		isDiscoverable: user.isDiscoverable,
		statusBlurb: user.statusBlurb,
		usuals: (raw.usualItems || []).map((item) => ({
			menuItemId: item.id,
			name: item.name,
			count: 3,
			lastOrderedAt: new Date().toISOString(),
		})),
		activeOrders: (raw.activeOrders || []).map((order) => ({
			orderId: order.id,
			userId: order.userId,
			status: order.status,
			totalAmount: order.totalAmount,
			walletBalanceRemaining: user.walletBalance,
			orderedVia: (order.orderedVia as any) || 'web_ui',
			notes: order.notes,
			estimatedPrepMinutes: order.estimatedWaitMins || 5,
			companionNudge: raw.companionNudge,
			items: (order.items || []).map((it) => ({
				menuItemId: it.menuItemId,
				name: it.name,
				quantity: it.quantity,
				unitPrice: it.unitPrice,
				lineTotal: it.lineTotal,
				customizations: it.customizations,
			})),
			createdAt: order.createdAt,
		})),
		incomingWaves: (raw.incomingWaves || []).map((wave) => ({
			waveId: wave.id,
			fromUserId: wave.fromUserId,
			toUserId: wave.toUserId,
			message: wave.message,
			status: 'delivered',
			createdAt: wave.createdAt,
		})),
	};

	res.json(formatted);
}
