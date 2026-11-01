import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { getOwnerDashboard } from '../queries.ts';
import type {
	OwnerAnalyticsSummary,
	OwnerDashboard,
	RoomVibeRecord,
} from '../types/index.ts';
import { formatMenuItem } from './ListMenuItems.ts';
import { formatOrderReceipt } from './PlaceOrder.ts';

/**
 * Format raw database owner dashboard records to match OpenAPI OwnerDashboard schema.
 */
export function formatOwnerDashboard(raw: any): OwnerDashboard {
	const analyticsRaw = raw.analytics || {};
	const totalOrders = analyticsRaw.totalOrders ?? 0;
	const agentOrders = analyticsRaw.agentOrders ?? 0;
	const humanOrders = analyticsRaw.humanOrders ?? 0;
	const revenueToday = analyticsRaw.totalRevenueInr ?? 0;
	const agentRevenueRatio = totalOrders > 0 ? Number((agentOrders / totalOrders).toFixed(2)) : 0;

	const analytics: OwnerAnalyticsSummary = {
		revenueToday,
		totalOrders,
		humanOrdersCount: humanOrders,
		agentOrdersCount: agentOrders,
		agentRevenueRatio,
	};

	const kitchenQueue = (raw.kitchenQueue || []).map(formatOrderReceipt);
	const inventory = (raw.inventory || []).map(formatMenuItem);
	const roomVibes: RoomVibeRecord[] = (raw.roomVibes || []).map((v: any) => ({
		vibeId: v.id ?? v.vibeId,
		userId: v.userId,
		vibe: v.vibe,
		comment: v.comment,
		createdAt: v.createdAt,
	}));

	return {
		kitchenQueue,
		inventory,
		analytics,
		roomVibes,
	};
}

/**
 * Retrieve the complete operational dashboard for the cafe owner and barista screen.
 */
export default async function GetOwnerDashboard(req: Request, res: Response): Promise<void> {
	const client = req.pg ?? getDatabaseClient();
	const rows = await getOwnerDashboard.run({}, client);
	assert(rows.length > 0 && rows[0]?.result, Boom.internal('Failed to retrieve owner dashboard'));

	const formatted = formatOwnerDashboard(rows[0].result);
	res.json(formatted);
}
