import type { components, paths } from './openapi.gen.ts';

export type { components, paths };

export type ViewerContext = components['schemas']['ViewerContext'];
export type ViewerUsualItem = components['schemas']['ViewerUsualItem'];
export type MenuItem = components['schemas']['MenuItem'];
export type CustomizationGroup = components['schemas']['CustomizationGroup'];
export type CustomizationOption = components['schemas']['CustomizationOption'];
export type OmniSearchResponse = components['schemas']['OmniSearchResponse'];
export type OmniMenuRecommendation = components['schemas']['OmniMenuRecommendation'];
export type OrderReceipt = components['schemas']['OrderReceipt'];
export type OrderItemReceipt = components['schemas']['OrderItemReceipt'];
export type WalletTopUpResponse = components['schemas']['WalletTopUpResponse'];
export type TableConnectProfile = components['schemas']['TableConnectProfile'];
export type TableConnectPerson = components['schemas']['TableConnectPerson'];
export type TableWaveReceipt = components['schemas']['TableWaveReceipt'];
export type RoomVibeRecord = components['schemas']['RoomVibeRecord'];
export type OwnerDashboard = components['schemas']['OwnerDashboard'];
export type OwnerAnalyticsSummary = components['schemas']['OwnerAnalyticsSummary'];
export type OrderStatusUpdate = components['schemas']['OrderStatusUpdate'];
export type OwnerAnalyticsResponse = components['schemas']['OwnerAnalyticsResponse'];
export type OwnerAnalyticsKeyMetrics = components['schemas']['OwnerAnalyticsKeyMetrics'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

/**
 * Universal database client interface compatible with both node-postgres Pool
 * and @electric-sql/pglite.
 */
export interface IPgClientLike {
	query(
		sqlOrConfig: string | { text: string; values?: unknown[] },
		values?: unknown[],
	): Promise<{ rows: any[]; rowCount: number }>;
	exec?(sql: string): Promise<unknown>;
	end?(): Promise<void>;
}

/**
 * Parameters for the Gemini-powered Omni-Search Cafe Companion.
 */
export interface OmniSearchCompanionParams {
	query: string;
	viewerContext: ViewerContext;
	menuItems: MenuItem[];
	discoverablePeople: TableConnectPerson[];
}

/**
 * Intent-extracted Table Connect actions detected from user natural-language queries.
 */
export interface TableConnectAction {
	shouldEnableDiscoverable: boolean;
	extractedBlurb?: string;
	extractedTable?: string;
}

/**
 * Enriched result from the Omni-Search Cafe Companion inference.
 */
export interface OmniSearchCompanionResult {
	answer: string;
	menuRecommendations: OmniMenuRecommendation[];
	tableMatches: TableConnectPerson[];
	actionsTaken: string[];
	suggestedQueries: string[];
	tableConnectAction?: TableConnectAction;
	companionNudge?: string;
	webmcpToolCalls?: Array<{
		tool: string;
		args: Record<string, unknown>;
		status: 'completed' | 'failed';
	}>;
}

/**
 * Parameters for enriching Table Connect people with conversational icebreakers.
 */
export interface EnrichTableConnectParams {
	viewer: ViewerContext;
	people: TableConnectPerson[];
	query?: string;
}

/**
 * Parameters for answering natural-language business and operational questions for the cafe owner.
 */
export interface OwnerAnalyticsAiParams {
	question: string;
	dashboard: OwnerDashboard;
}

/**
 * Augmented Express Request providing access to the database client and viewer context.
 */
declare global {
	namespace Express {
		interface Request {
			pg: IPgClientLike;
			viewerId?: string;
		}
	}
}
