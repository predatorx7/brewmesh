import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import Boom from '@hapi/boom';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { middleware as openApiMiddleware } from 'express-openapi-validator';
import { OPENAPI_PATH, PUBLIC_DIR } from './consts.ts';
import { getDatabaseClient } from './db.ts';
import { LOGGER } from './logger.ts';
import { handleMcpHttpRequest } from './mcp/server.ts';
import CafeEventsSse from './routes/CafeEventsSse.ts';
import type { IPgClientLike } from './types/index.ts';

/**
 * Create and configure the BrewMesh Express application.
 * Mounts static assets, the `/api/events` PGMB SSE stream, the `/mcp` Remote MCP Server,
 * and the `express-openapi-validator` operation resolver backed by `openapi.yaml`.
 */
export async function createApp(pgClient?: IPgClientLike): Promise<Express> {
	const app = express();
	const db = pgClient ?? getDatabaseClient();

	// 1. CORS headers so Browser WebMCP, MCP Inspector, and external agents can connect
	app.use((req: Request, res: Response, next: NextFunction) => {
		const requestedHeaders = req.header('Access-Control-Request-Headers');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
		res.setHeader(
			'Access-Control-Allow-Headers',
			requestedHeaders ?? 'Accept, Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID, X-Viewer-Id',
		);
		res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
		if (req.method === 'OPTIONS') {
			res.status(204).end();
			return;
		}
		next();
	});

	// 2. JSON body parser & database context injection
	app.use(express.json({ limit: '1mb' }));
	app.use((req: Request, _res: Response, next: NextFunction) => {
		req.pg = db;
		req.viewerId = (req.header('x-viewer-id') || (req.query.userId as string) || 'syed').trim();
		next();
	});

	// 3. Health check and OpenAPI specification endpoint
	app.get('/healthz', (_req: Request, res: Response) => {
		res.json({ status: 'ok', service: 'brewmesh', region: 'asia-south1' });
	});

	app.get('/openapi.yaml', (_req: Request, res: Response) => {
		res.type('text/yaml').send(readFileSync(OPENAPI_PATH, 'utf8'));
	});

	// 4. Real-time Server-Sent Events stream (/api/events)
	app.get('/api/events', (req: Request, res: Response) => {
		CafeEventsSse(req, res);
	});

	// 5. Remote Model Context Protocol (MCP) Server endpoint (/mcp)
	app.all('/mcp', async (req: Request, res: Response, next: NextFunction) => {
		try {
			await handleMcpHttpRequest(req, res);
		} catch (error) {
			next(error);
		}
	});

	// 6. Serve static frontend assets (Google Search + gemini.google.com UI + WebMCP tools)
	app.use(express.static(PUBLIC_DIR));

	// 7. OpenAPI request validation and automatic operationId route resolution
	const handlerCache = new Map<string, (req: Request, res: Response, next: NextFunction) => unknown>();

	app.use(
		openApiMiddleware({
			apiSpec: OPENAPI_PATH,
			validateApiSpec: true,
			validateRequests: {
				coerceTypes: true,
				removeAdditional: true,
			},
			validateResponses: false,
			ignoreUndocumented: true,
			operationHandlers: {
				basePath: join(import.meta.dirname, 'routes'),
				resolver: (_basePath: string, route: any, apiDoc: any) => {
					const pathKey = route.openApiRoute.substring(route.basePath.length);
					const methodKey = route.method.toLowerCase();
					const operationObj = apiDoc.paths?.[pathKey]?.[methodKey];
					const operationId: string | undefined = operationObj?.operationId;
					assert(operationId, Boom.notImplemented(`Missing operationId for ${route.method} ${pathKey}`));

					if (operationId === 'GetEvents') {
						return (req: Request, res: Response) => CafeEventsSse(req, res);
					}

					return async (req: Request, res: Response, next: NextFunction) => {
						try {
							let fn = handlerCache.get(operationId);
							if (!fn) {
								const moduleUrl = pathToFileURL(join(import.meta.dirname, 'routes', `${operationId}.ts`)).href;
								const mod = await import(moduleUrl);
								fn = mod.default;
								assert(typeof fn === 'function', Boom.notImplemented(`Route handler ${operationId} is not a function`));
								handlerCache.set(operationId, fn);
							}
							await fn(req, res, next);
						} catch (error) {
							next(error);
						}
					};
				},
			},
		}),
	);

	// 8. SPA fallback for root navigation
	app.get('/', (_req: Request, res: Response) => {
		res.sendFile(join(PUBLIC_DIR, 'index.html'));
	});

	// 9. RFC 9457 Problem Details error handler
	app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
		if (res.headersSent) {
			return;
		}

		const status =
			typeof err?.status === 'number'
				? err.status
				: Boom.isBoom(err)
					? err.output.statusCode
					: 500;

		const title = Boom.isBoom(err)
			? err.output.payload.error
			: err?.name || 'Request Error';

		const detail = Boom.isBoom(err)
			? err.message
			: err?.message || 'An unexpected error occurred while processing your request.';

		if (status >= 500) {
			LOGGER.error({ err, path: req.path, method: req.method }, 'Unhandled server error');
		}

		res.status(status).type('application/problem+json').json({
			type: `https://httpstatuses.com/${status}`,
			title,
			status,
			detail,
			message: detail,
			...(Array.isArray(err?.errors) ? { errors: err.errors } : {}),
		});
	});

	return app;
}
