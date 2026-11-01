import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { DB_URI, DDL_PATH, PGLITE_DIR, ROOT_DIR } from './consts.ts';
import { LOGGER } from './logger.ts';
import type { IPgClientLike } from './types/index.ts';

const { Pool } = pg;

/**
 * Adapter wrapping an embedded PGlite instance to conform to IPgClientLike.
 * Normalizes query invocation so queries expecting (text, values) or ({ text, values })
 * run seamlessly with @pgtyped/runtime.
 */
export class PGliteAdapter implements IPgClientLike {
	#db: PGlite;

	constructor(db: PGlite) {
		this.#db = db;
	}

	get raw(): PGlite {
		return this.#db;
	}

	async query(
		sqlOrConfig: string | { text: string; values?: unknown[] },
		values?: unknown[],
	): Promise<{ rows: any[]; rowCount: number }> {
		if (typeof sqlOrConfig === 'object' && sqlOrConfig !== null) {
			const res = await this.#db.query(
				sqlOrConfig.text,
				(sqlOrConfig.values ?? values) as unknown[] | undefined,
			);
			return { rows: res.rows, rowCount: res.rows.length };
		}
		const res = await this.#db.query(sqlOrConfig, values);
		return { rows: res.rows, rowCount: res.rows.length };
	}

	async exec(sql: string): Promise<unknown> {
		return this.#db.exec(sql);
	}

	async end(): Promise<void> {
		await this.#db.close();
	}
}

/**
 * Adapter wrapping a node-postgres Pool instance to conform to IPgClientLike.
 */
export class PgPoolAdapter implements IPgClientLike {
	#pool: pg.Pool;

	constructor(pool: pg.Pool) {
		this.#pool = pool;
	}

	get raw(): pg.Pool {
		return this.#pool;
	}

	async query(
		sqlOrConfig: string | { text: string; values?: unknown[] },
		values?: unknown[],
	): Promise<{ rows: any[]; rowCount: number }> {
		const res = await this.#pool.query(sqlOrConfig as any, values as any);
		return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
	}

	async exec(sql: string): Promise<unknown> {
		return this.#pool.query(sql);
	}

	async end(): Promise<void> {
		await this.#pool.end();
	}
}

let activeClient: IPgClientLike | undefined;

/**
 * Initialize the database connection and execute required schema migrations.
 * Uses Cloud SQL (pg.Pool) when DB_URI is set; falls back to embedded PGlite otherwise.
 */
export async function initDatabase(): Promise<IPgClientLike> {
	if (activeClient) {
		return activeClient;
	}

	let client: IPgClientLike;
	let isPGlite = false;

	if (DB_URI) {
		LOGGER.info({ uri: DB_URI.replace(/:[^:@]+@/, ':***@') }, 'Connecting to PostgreSQL / Cloud SQL pool');
		const pool = new Pool({
			connectionString: DB_URI,
			max: 20,
			idleTimeoutMillis: 30000,
		});
		client = new PgPoolAdapter(pool);
	} else {
		LOGGER.info({ dir: PGLITE_DIR || 'in-memory' }, 'Initializing embedded PGlite database fallback');
		const pglite = new PGlite(PGLITE_DIR || undefined);
		client = new PGliteAdapter(pglite);
		isPGlite = true;
	}

	// 1. Initialize PGMB schema if available
	const pgmbPath = join(ROOT_DIR, 'node_modules', '@haathie', 'pgmb', 'sql', 'pgmb.sql');
	if (existsSync(pgmbPath)) {
		try {
			let pgmbSql = readFileSync(pgmbPath, 'utf8');
			if (isPGlite) {
				// Strip btree_gin extension requirement for PGlite WASM compatibility
				pgmbSql = pgmbSql.replace('CREATE EXTENSION IF NOT EXISTS btree_gin;', '-- btree_gin skipped in pglite');
				pgmbSql = pgmbSql.replace(/CREATE INDEX "sub_gin" ON subscriptions[^;]+;/, 'CREATE INDEX "sub_gin" ON subscriptions(group_id);');
			}
			if (client.exec) {
				await client.exec(pgmbSql);
			} else {
				await client.query(pgmbSql);
			}
			LOGGER.info('PGMB message broker schema initialized successfully');
		} catch (error) {
			LOGGER.warn({ error }, 'PGMB schema initialization skipped or already present');
		}
	}

	// 2. Initialize BrewMesh DDL and seed data
	if (existsSync(DDL_PATH)) {
		try {
			const ddlSql = readFileSync(DDL_PATH, 'utf8');
			if (client.exec) {
				await client.exec(ddlSql);
			} else {
				await client.query(ddlSql);
			}
			LOGGER.info('BrewMesh cafe DDL and Mumbai seed data initialized successfully');
		} catch (error) {
			LOGGER.error({ error }, 'Failed to execute BrewMesh DDL script');
			throw error;
		}
	} else {
		LOGGER.warn({ path: DDL_PATH }, 'DDL script not found at expected path');
	}

	// 3. Set search path to ensure unqualified references resolve to the cafe schema
	await client.query('SET search_path TO cafe, public;');

	activeClient = client;
	return activeClient;
}

/**
 * Retrieve the active database client instance.
 * Call initDatabase() first during application startup.
 */
export function getDatabaseClient(): IPgClientLike {
	if (!activeClient) {
		throw new Error('Database client not initialized. Call initDatabase() before accessing the client.');
	}
	return activeClient;
}

/**
 * Close the active database connection pool or embedded database instance.
 */
export async function closeDatabase(): Promise<void> {
	if (activeClient?.end) {
		await activeClient.end();
		activeClient = undefined;
		LOGGER.info('Database client connection closed');
	}
}
