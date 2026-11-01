import pino from 'pino';

/**
 * Global Pino logger configured for structured JSON output in Google Cloud Run.
 * Set LOG_LEVEL in your environment, for example 'debug' or 'warn'.
 */
export const LOGGER = pino({
	level: process.env.LOG_LEVEL || 'info',
	timestamp: pino.stdTimeFunctions.isoTime,
});

export default LOGGER;
