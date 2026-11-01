import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { closeDatabase, initDatabase } from './db.ts';
import { LOGGER } from './logger.ts';
import { createBrewMeshMcpServer } from './mcp/server.ts';

/**
 * Entrypoint for running the BrewMesh Model Context Protocol (MCP) server over standard I/O.
 * Used by desktop and CLI agent clients (for example, Claude Desktop or Antigravity).
 */
async function main(): Promise<void> {
	LOGGER.info('Starting BrewMesh MCP stdio server...');

	// Initialize database storage
	await initDatabase();

	const server = createBrewMeshMcpServer();
	const transport = new StdioServerTransport();

	await server.connect(transport);
	LOGGER.info('BrewMesh MCP stdio server listening on stdin/stdout');

	const shutdown = async () => {
		LOGGER.info('Shutting down MCP stdio server...');
		await server.close().catch(() => {});
		await closeDatabase().catch(() => {});
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

main().catch((error) => {
	LOGGER.error({ error }, 'Fatal error starting BrewMesh MCP stdio server');
	process.exit(1);
});
