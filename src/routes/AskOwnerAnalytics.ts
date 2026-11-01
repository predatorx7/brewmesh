import assert from 'node:assert';
import Boom from '@hapi/boom';
import type { Request, Response } from 'express';
import { getDatabaseClient } from '../db.ts';
import { runOwnerAnalyticsAi } from '../gemini.ts';
import { getOwnerDashboard } from '../queries.ts';
import { formatOwnerDashboard } from './GetOwnerDashboard.ts';

/**
 * Answer operational and business questions for the cafe owner using live metrics and Gemini.
 */
export default async function AskOwnerAnalytics(req: Request, res: Response): Promise<void> {
	const body = req.body || {};
	const question = (body.question as string)?.trim();
	assert(question && question.length > 0, Boom.badRequest('Question string is required'));

	const client = req.pg ?? getDatabaseClient();
	const rows = await getOwnerDashboard.run({}, client);
	assert(rows.length > 0 && rows[0]?.result, Boom.internal('Failed to retrieve owner dashboard'));

	const dashboard = formatOwnerDashboard(rows[0].result);
	const response = await runOwnerAnalyticsAi({
		question,
		dashboard,
	});

	res.json(response);
}
