import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Root directory of the BrewMesh repository.
 */
export const ROOT_DIR = join(__dirname, '..');

/**
 * HTTP port on which the BrewMesh Express server listens.
 * Defaults to 8080 for Google Cloud Run compatibility.
 */
export const PORT = Number(process.env.PORT || 8080);

/**
 * PostgreSQL connection URI for Cloud SQL.
 * When empty, BrewMesh falls back automatically to embedded PGlite.
 */
export const DB_URI = process.env.DATABASE_URL || process.env.DB_URI || '';

/**
 * Optional filesystem directory to persist embedded PGlite storage.
 * When empty, PGlite runs in-memory.
 */
export const PGLITE_DIR = process.env.PGLITE_DIR || '';

/**
 * Google Gemini API key used by the @google/genai SDK.
 */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

/**
 * Gemini model identifier for conversational and analytics inference.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Consumer group identifier for PGMB subscriptions.
 */
export const PGMB_GROUP_ID = process.env.PGMB_GROUP_ID || 'brewmesh-server';

/**
 * Runtime environment mode, for example 'development' or 'production'.
 */
export const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Absolute path to the OpenAPI 3.0 specification file.
 */
export const OPENAPI_PATH = join(ROOT_DIR, 'openapi.yaml');

/**
 * Absolute path to the public assets directory.
 */
export const PUBLIC_DIR = join(ROOT_DIR, 'public');

/**
 * Absolute path to the BrewMesh agent skill markdown file.
 */
export const SKILL_PATH = join(ROOT_DIR, 'skill', 'SKILL.md');

/**
 * Absolute path to the PostgreSQL DDL script.
 */
export const DDL_PATH = join(ROOT_DIR, 'sql', 'ddl.sql');
