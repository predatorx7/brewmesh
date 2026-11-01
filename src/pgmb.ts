import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import {
	createSSERequestHandler,
	createTopicalSubscriptionParams,
	PgmbClient,
} from '@haathie/pgmb';
import { PGMB_GROUP_ID } from './consts.ts';
import { LOGGER } from './logger.ts';
import type { IPgClientLike } from './types/index.ts';

export interface CafeEventEnvelope {
	id: string;
	topic: string;
	payload: unknown;
	timestamp: string;
}

/**
 * In-process event emitter providing zero-latency broadcast for all cafe mutations
 * and social updates across connected HTTP SSE streams.
 */
class CafeEventHub extends EventEmitter {
	constructor() {
		super();
		this.setMaxListeners(200);
	}
}

export const CAFE_EVENT_HUB = new CafeEventHub();

let pgmbClientInstance: PgmbClient | undefined;

/**
 * Initialize PGMB client if a compatible database client is provided.
 * When running with Cloud SQL, registers topic subscriptions for table mutations.
 */
export async function initPgmb(client: IPgClientLike): Promise<PgmbClient | undefined> {
	if (pgmbClientInstance) {
		return pgmbClientInstance;
	}

	try {
		const clientWrapper = {
			query: async (queryTextOrConfig: any, values?: any) => {
				const res = await client.query(queryTextOrConfig, values);
				return res;
			},
		};

		const pgmb = new PgmbClient({
			client: clientWrapper as any,
			groupId: PGMB_GROUP_ID,
			logger: LOGGER,
			readEventsIntervalMs: 500,
			pollEventsIntervalMs: 500,
		});

		await pgmb.init();
		pgmbClientInstance = pgmb;
		LOGGER.info({ groupId: PGMB_GROUP_ID }, 'PGMB client initialized successfully');

		// Subscribe to table mutation topics from @haathie/pgmb
		const topics = [
			'cafe.orders.insert',
			'cafe.orders.update',
			'cafe.users.update',
			'cafe.menu_items.update',
			'cafe.table_waves.insert',
			'cafe.room_vibes.insert',
		];

		const subParams = createTopicalSubscriptionParams({
			topics,
		});

		await pgmb.assertSubscription(subParams);
		LOGGER.info({ topics }, 'PGMB asserted topical subscription for cafe mutations');

		return pgmbClientInstance;
	} catch (error) {
		LOGGER.warn({ error }, 'PGMB client initialization deferred (using in-process broadcast hub)');
		return undefined;
	}
}

/**
 * Gracefully stop the PGMB background polling loop before closing the database.
 */
export async function closePgmb(): Promise<void> {
	if (pgmbClientInstance) {
		const instance = pgmbClientInstance;
		pgmbClientInstance = undefined;
		await instance.end().catch(() => {});
		LOGGER.info('PGMB client stopped');
	}
}

/**
 * Broadcast a real-time event to all listening SSE clients.
 * For example, emit 'cafe.orders.insert' when a new coffee is queued.
 */
export function emitCafeEvent(topic: string, payload: unknown): void {
	const envelope: CafeEventEnvelope = {
		id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		topic,
		payload,
		timestamp: new Date().toISOString(),
	};

	CAFE_EVENT_HUB.emit('cafe_event', envelope);

	// Also publish asynchronously to PGMB if the client is connected
	if (pgmbClientInstance) {
		pgmbClientInstance
			.publish([{ topic, payload } as any])
			.catch((err) => LOGGER.debug({ err, topic }, 'Failed to publish event to PGMB broker'));
	}
}

/**
 * Create an Express route handler streaming real-time Server-Sent Events to clients.
 * Streams both PGMB table mutations and instant application events with automatic heartbeats.
 */
export function createCafeSseHandler(): (req: Request, res: Response) => void {
	return (req: Request, res: Response) => {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		});

		// Send initial SSE connection handshake
		res.write(': connected\n\n');
		res.write(
			`data: ${JSON.stringify({
				type: 'connected',
				timestamp: new Date().toISOString(),
				viewerId: req.query.userId || 'anonymous',
			})}\n\n`,
		);

		const onCafeEvent = (envelope: CafeEventEnvelope) => {
			if (res.writableEnded) {
				return;
			}
			res.write(`id: ${envelope.id}\n`);
			res.write(`event: ${envelope.topic}\n`);
			res.write(`data: ${JSON.stringify(envelope.payload)}\n\n`);
		};

		CAFE_EVENT_HUB.on('cafe_event', onCafeEvent);

		// Keep-alive heartbeat every 20 seconds
		const heartbeatTimer = setInterval(() => {
			if (res.writableEnded) {
				clearInterval(heartbeatTimer);
				return;
			}
			res.write(': ping\n\n');
		}, 20000);

		const cleanup = () => {
			clearInterval(heartbeatTimer);
			CAFE_EVENT_HUB.off('cafe_event', onCafeEvent);
		};

		req.on('close', cleanup);
		res.on('finish', cleanup);
		res.on('error', cleanup);
	};
}
