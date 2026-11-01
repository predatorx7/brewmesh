import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { emitCafeEvent } from '../pgmb.ts';
import { placeOrder } from '../queries.ts';
import type { OrderReceipt } from '../types/index.ts';

/**
 * Format database order placement record to match OpenAPI OrderReceipt schema.
 */
export function formatOrderReceipt(rawResult: any): OrderReceipt {
	const order = rawResult.order ?? rawResult;
	return {
		orderId: order.id ?? order.orderId,
		userId: order.userId,
		status: order.status,
		totalAmount: order.totalAmount,
		walletBalanceRemaining: rawResult.walletBalance ?? null,
		orderedVia: (order.orderedVia as any) || 'web_ui',
		notes: order.notes ?? null,
		estimatedPrepMinutes: order.estimatedWaitMins ?? order.estimatedPrepMinutes ?? 5,
		companionNudge: rawResult.companionNudge ?? null,
		items: (order.items || []).map((it: any) => ({
			menuItemId: it.menuItemId,
			name: it.name,
			quantity: it.quantity,
			unitPrice: it.unitPrice ?? it.basePrice ?? 0,
			lineTotal: it.lineTotal ?? (it.unitPrice * it.quantity),
			customizations: it.customizations ?? {},
		})),
		createdAt: order.createdAt,
	};
}

/**
 * Place a customized food and drink order and pay automatically from INR wallet.
 */
export default async function PlaceOrder(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const items = body.items;
	assert(Array.isArray(items) && items.length > 0, Boom.badRequest('Order items must be a non-empty array'));

	const userId = (body.userId as string) || req.viewerId || 'syed';
	const orderedVia = (body.orderedVia as string) || 'web_ui';
	const notes = (body.notes as string) || null;
	const client = req.pg ?? getDatabaseClient();

	try {
		const rows = await placeOrder.run(
			{
				userId,
				items: typeof items === 'string' ? items : JSON.stringify(items),
				orderedVia,
				notes,
			},
			client,
		);

		assert(rows.length > 0 && rows[0]?.result, Boom.internal('Failed to place order'));

		const placementResult = rows[0].result;
		const receipt = formatOrderReceipt(placementResult);

		// Broadcast order insertion event across real-time SSE stream
		emitCafeEvent('cafe.orders.insert', receipt);

		res.status(201).json(receipt);
	} catch (error: any) {
		if (error?.code === 'P0003') {
			throw Boom.paymentRequired(error.message || 'Insufficient wallet balance to complete order');
		}
		if (error?.code === 'P0002') {
			throw Boom.conflict(error.message || 'One or more items in your order are out of stock');
		}
		throw error;
	}
}
