import type { Request, Response } from 'express';
import { createCafeSseHandler } from '../pgmb.ts';

const sseHandler = createCafeSseHandler();

/**
 * Handle Server-Sent Events subscriptions at GET /api/events.
 * Streams real-time table mutations, order status updates, and social waves.
 */
export default function CafeEventsSse(req: Request, res: Response): void {
	sseHandler(req, res);
}
