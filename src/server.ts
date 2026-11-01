import { createApp } from './app.ts';
import { PORT } from './consts.ts';
import { closeDatabase, initDatabase } from './db.ts';
import { LOGGER } from './logger.ts';
import { closePgmb, initPgmb } from './pgmb.ts';

/**
 * Bootstraps the BrewMesh database, PGMB real-time broker, Express HTTP server,
 * and Remote MCP endpoint.
 */
async function main(): Promise<void> {
	const db = await initDatabase();
	await initPgmb(db);

	const app = await createApp(db);

	const server = app.listen(PORT, '0.0.0.0', () => {
		LOGGER.info(
			{
				port: PORT,
				webUi: `http://localhost:${PORT}`,
				mcpEndpoint: `http://localhost:${PORT}/mcp`,
				sseEvents: `http://localhost:${PORT}/api/events`,
			},
			'BrewMesh server listening and ready for Humans, WebMCP, and MCP Agents',
		);
	});

	const shutdown = async (signal: string) => {
		LOGGER.info({ signal }, 'Shutting down BrewMesh server gracefully');
		server.close();
		await closePgmb();
		await closeDatabase();
		process.exit(0);
	};

	process.on('SIGINT', () => void shutdown('SIGINT'));
	process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

await main();
