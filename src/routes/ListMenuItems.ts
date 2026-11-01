import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { listMenuItems } from '../queries.ts';
import type { MenuItem } from '../types/index.ts';

/**
 * Format raw database menu item records to conform to the OpenAPI MenuItem schema.
 */
export function formatMenuItem(item: any): MenuItem {
	return {
		id: item.id,
		name: item.name,
		category: item.category,
		description: item.description,
		price: item.price ?? item.basePrice ?? 0,
		stock: item.stock ?? item.stockCount ?? 0,
		isAvailable: item.isAvailable ?? true,
		prepTimeMinutes: item.prepTimeMinutes ?? item.prepTimeMins ?? 5,
		sensoryTags: item.sensoryTags ?? item.tags ?? [],
		imageUrl: item.imageUrl || `/assets/menu/${item.slug || 'item'}.webp`,
		customizations: (item.customizations || item.customizationGroups || []).map((g: any) => ({
			name: g.name,
			required: Boolean(g.required),
			options: (g.options || []).map((opt: any) => ({
				name: opt.name ?? opt.label ?? '',
				extraPrice: opt.extraPrice ?? opt.priceDelta ?? 0,
			})),
		})),
	};
}

/**
 * List cafe menu items filtered by category, search query, or availability.
 */
export default async function ListMenuItems(req: Request, res: Response): Promise<void> {
	const category = (req.query.category as string) || null;
	const query = (req.query.query as string) || null;
	const rawOnly = req.query.onlyAvailable as unknown;
	const onlyAvailable =
		rawOnly === true || rawOnly === 'true'
			? true
			: rawOnly === false || rawOnly === 'false'
				? false
				: null;

	const client = req.pg ?? getDatabaseClient();
	const rows = await listMenuItems.run(
		{
			category,
			query,
			onlyAvailable,
		},
		client,
	);

	const rawItems = rows[0]?.result || [];
	const formattedItems = rawItems.map(formatMenuItem);

	res.json(formattedItems);
}
