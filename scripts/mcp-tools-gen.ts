import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import {
	computeGenStamp,
	type GenStamp,
	renderStampHeader,
} from './gen-stamp.ts'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const SPEC_PATH = join(SCRIPT_DIR, '..', 'openapi.yaml')
const OUT_PATH = join(
	SCRIPT_DIR,
	'..',
	'src',
	'mcp',
	'operations.gen.ts',
)
const WEBMCP_OUT_PATH = join(
	SCRIPT_DIR,
	'..',
	'public',
	'webmcp-tools.gen.js',
)
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]

export type ParamInfo = {
	name: string
	in: string
	required?: boolean
	schema?: Record<string, unknown>
	description?: string
}

export type McpToolAnnotations = {
	readOnlyHint?: boolean
	destructiveHint?: boolean
	idempotentHint?: boolean
	openWorldHint?: boolean
}

export type ToolInfo = {
	operationId: string
	method: HttpMethod
	path: string
	summary: string
	description: string
	inputSchema: {
		type: 'object'
		properties: Record<string, unknown>
		required?: string[]
		additionalProperties: boolean
	}
	annotations: McpToolAnnotations
}

export type BuiltSpec = {
	tools: Record<string, ToolInfo>
	routes: Record<string, { method: string, path: string }>
}

const METHOD_ANNOTATIONS: Record<HttpMethod, McpToolAnnotations> = {
	get: { readOnlyHint: true, openWorldHint: false },
	delete: {
		destructiveHint: true,
		idempotentHint: true,
		openWorldHint: false,
	},
	put: { idempotentHint: true, openWorldHint: false },
	post: { openWorldHint: false },
	patch: { openWorldHint: false },
}

/**
 * Convert a PascalCase or camelCase operation identifier into a snake_case tool name.
 * For example, `GetViewerContext` becomes `get_viewer_context`.
 */
export function toSnakeCase(str: string): string {
	return str
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/([A-Z]+)([A-Z][a-z0-9])/g, '$1_$2')
		.toLowerCase()
}

/**
 * Resolve a JSON Schema reference path against the root OpenAPI specification object.
 */
function resolveRef(
	ref: string,
	root: Record<string, unknown>,
): Record<string, unknown> {
	const parts = ref.replace('#/', '').split('/')
	let node: unknown = root
	for(const part of parts) {
		node = (node as Record<string, unknown>)?.[part]
		if(!node) {
			return {}
		}
	}
	return node as Record<string, unknown>
}

/**
 * Recursively resolve `$ref` pointers in a schema definition.
 */
function resolveSchema(
	raw: Record<string, unknown>,
	root: Record<string, unknown>,
): Record<string, unknown> {
	let schema = raw.$ref ? resolveRef(raw.$ref as string, root) : raw
	while(schema.$ref) {
		schema = resolveRef(schema.$ref as string, root)
	}

	const cloned: Record<string, unknown> = { ...schema }

	if(cloned.properties) {
		cloned.properties = Object.fromEntries(
			Object.entries(
				cloned.properties as Record<string, Record<string, unknown>>,
			).map(([k, v]) => [k, resolveSchema(v, root)]),
		)
	}

	if(cloned.items) {
		cloned.items = resolveSchema(cloned.items as Record<string, unknown>, root)
	}

	for(const key of ['allOf', 'anyOf', 'oneOf'] as const) {
		if(Array.isArray(cloned[key])) {
			cloned[key] = (cloned[key] as Record<string, unknown>[]).map((s) =>
				resolveSchema(s, root),
			)
		}
	}

	return cloned
}

/**
 * Walk the OpenAPI specification and extract all operations tagged with `MCP`.
 * Flattens path parameters, query parameters, and JSON request body properties into a
 * single top-level `inputSchema` for seamless invocation by LLMs and agent runtimes.
 */
export function buildSpec(spec: Record<string, unknown>): BuiltSpec {
	const tools: Record<string, ToolInfo> = {}
	const routes: Record<string, { method: string, path: string }> = {}

	for(const [path, item] of Object.entries(spec.paths ?? {})) {
		for(const method of HTTP_METHODS) {
			const itemRec = item as Record<string, unknown> | undefined
			const op = itemRec?.[method] as Record<string, unknown> | undefined
			if(!op?.operationId) {
				continue
			}

			const operationId = op.operationId as string
			routes[operationId] = { method, path }

			const tags = (op.tags ?? []) as string[]
			if(!tags.includes('MCP')) {
				continue
			}

			const rawParams = (
				(op.parameters ?? []) as Array<Record<string, unknown>>
			).map((p) => (p.$ref ? resolveRef(p.$ref as string, spec) : p)) as ParamInfo[]

			const pathParams = rawParams.filter((p) => p.in === 'path')
			const queryParams = rawParams.filter((p) => p.in === 'query')

			const reqBody = op.requestBody as Record<string, unknown> | undefined
			const jsonBody = (
				reqBody?.content as Record<string, unknown> | undefined
			)?.['application/json'] as Record<string, unknown> | undefined

			const bodySchema = jsonBody?.schema
				? resolveSchema(jsonBody.schema as Record<string, unknown>, spec)
				: null

			const props: Record<string, unknown> = {}
			const requiredProps: string[] = []

			// 1. Flatten path parameters
			for(const p of pathParams) {
				const resolved = p.schema
					? resolveSchema(p.schema as Record<string, unknown>, spec)
					: {}
				props[p.name] = {
					...resolved,
					...(p.description ? { description: p.description } : {}),
				}
				if(p.required !== false) {
					requiredProps.push(p.name)
				}
			}

			// 2. Flatten query parameters
			for(const q of queryParams) {
				const resolved = q.schema
					? resolveSchema(q.schema as Record<string, unknown>, spec)
					: {}
				props[q.name] = {
					...resolved,
					...(q.description ? { description: q.description } : {}),
				}
				if(q.required) {
					requiredProps.push(q.name)
				}
			}

			// 3. Flatten JSON request body properties
			if(bodySchema?.properties) {
				const bodyProps = bodySchema.properties as Record<
					string,
					Record<string, unknown>
				>
				for(const [key, propVal] of Object.entries(bodyProps)) {
					props[key] = propVal
				}
				if(Array.isArray(bodySchema.required)) {
					for(const reqKey of bodySchema.required) {
						if(!requiredProps.includes(reqKey as string)) {
							requiredProps.push(reqKey as string)
						}
					}
				}
			}

			const toolName = toSnakeCase(operationId)
			const annotations: McpToolAnnotations = {
				...METHOD_ANNOTATIONS[method],
				...(op['x-mcp-annotations'] as McpToolAnnotations | undefined),
			}

			tools[toolName] = {
				operationId,
				method,
				path,
				summary: (op.summary as string) ?? '',
				description: (
					(op['x-mcp-description'] as string | undefined)
					?? (op.description as string | undefined)
					?? (op.summary as string | undefined)
					?? ''
				),
				inputSchema: {
					type: 'object',
					properties: props,
					...(requiredProps.length > 0 ? { required: requiredProps } : {}),
					additionalProperties: false,
				},
				annotations,
			}
		}
	}

	return { tools, routes }
}

/**
 * Format an arbitrary JavaScript object or value into tab-indented source text.
 */
function fmtObject(obj: unknown, depth: number): string {
	const pad = '\t'.repeat(depth)
	const inner = '\t'.repeat(depth + 1)
	if(obj === null) {
		return 'null'
	}
	if(obj === undefined) {
		return 'undefined'
	}
	if(Array.isArray(obj)) {
		if(obj.length === 0) {
			return '[]'
		}
		const items = obj.map((v) => inner + fmtObject(v, depth + 1)).join(',\n')
		return '[\n' + items + '\n' + pad + ']'
	}
	if(typeof obj !== 'object') {
		return JSON.stringify(obj)
	}
	const entries = Object.entries(obj as Record<string, unknown>)
	if(entries.length === 0) {
		return '{}'
	}
	const props = entries
		.map(([k, v]) => inner + JSON.stringify(k) + ': ' + fmtObject(v, depth + 1))
		.join(',\n')
	return '{\n' + props + '\n' + pad + '}'
}

/**
 * Render `src/mcp/operations.gen.ts` containing strongly typed definitions of all MCP tools.
 */
function renderOperationsModule(
	tools: Record<string, ToolInfo>,
	routes: Record<string, { method: string, path: string }>,
	stamp: GenStamp,
): string {
	const sortedTools = Object.fromEntries(
		Object.entries(tools).sort(([a], [b]) => a.localeCompare(b)),
	)
	const sortedRoutes = Object.fromEntries(
		Object.entries(routes).sort(([a], [b]) => a.localeCompare(b)),
	)

	const lines: string[] = renderStampHeader({
		generatorRelPath: 'scripts/mcp-tools-gen.ts',
		npmScript: 'npm run openapi:mcpgen',
		stamp,
	})

	lines.push('')
	lines.push('export type McpToolAnnotations = {')
	lines.push('\treadOnlyHint?: boolean')
	lines.push('\tdestructiveHint?: boolean')
	lines.push('\tidempotentHint?: boolean')
	lines.push('\topenWorldHint?: boolean')
	lines.push('}')
	lines.push('')
	lines.push('export type McpToolDefinition = {')
	lines.push('\toperationId: string')
	lines.push("\tmethod: 'get' | 'post' | 'put' | 'patch' | 'delete'")
	lines.push('\tpath: string')
	lines.push('\tsummary: string')
	lines.push('\tdescription: string')
	lines.push('\tinputSchema: {')
	lines.push("\t\ttype: 'object'")
	lines.push('\t\tproperties: Record<string, unknown>')
	lines.push('\t\trequired?: string[]')
	lines.push('\t\tadditionalProperties: boolean')
	lines.push('\t}')
	lines.push('\tannotations: McpToolAnnotations')
	lines.push('}')
	lines.push('')
	lines.push('export const MCP_TOOLS = {')

	for(const [toolName, info] of Object.entries(sortedTools)) {
		lines.push(`\t${JSON.stringify(toolName)}: {`)
		lines.push(`\t\toperationId: ${JSON.stringify(info.operationId)},`)
		lines.push(`\t\tmethod: ${JSON.stringify(info.method)},`)
		lines.push(`\t\tpath: ${JSON.stringify(info.path)},`)
		lines.push(`\t\tsummary: ${JSON.stringify(info.summary)},`)
		lines.push(`\t\tdescription: ${JSON.stringify(info.description)},`)
		lines.push(`\t\tinputSchema: ${fmtObject(info.inputSchema, 2)},`)
		lines.push(`\t\tannotations: ${fmtObject(info.annotations, 2)},`)
		lines.push('\t},')
	}

	lines.push('} as const satisfies Record<string, McpToolDefinition>')
	lines.push('')
	lines.push('export type McpToolName = keyof typeof MCP_TOOLS')
	lines.push('export type McpToolShape = (typeof MCP_TOOLS)[McpToolName]')
	lines.push('')
	lines.push('export const ROUTES = {')

	for(const [opId, routeInfo] of Object.entries(sortedRoutes)) {
		lines.push(`\t${JSON.stringify(opId)}: ${JSON.stringify(routeInfo)},`)
	}

	lines.push('} as const')
	lines.push('')
	lines.push('export type RouteId = keyof typeof ROUTES')
	lines.push('')

	return lines.join('\n')
}

/**
 * Render `public/webmcp-tools.gen.js` as an ES module and browser global for WebMCP.
 */
function renderWebMcpModule(
	tools: Record<string, ToolInfo>,
	stamp: GenStamp,
): string {
	const sortedTools = Object.fromEntries(
		Object.entries(tools).sort(([a], [b]) => a.localeCompare(b)),
	)

	const lines: string[] = renderStampHeader({
		generatorRelPath: 'scripts/mcp-tools-gen.ts',
		npmScript: 'npm run openapi:mcpgen',
		stamp,
	})

	lines.push('')
	lines.push('export const BREWMESH_WEBMCP_TOOLS = [')

	for(const [toolName, info] of Object.entries(sortedTools)) {
		lines.push('\t{')
		lines.push(`\t\tname: ${JSON.stringify(toolName)},`)
		lines.push(`\t\toperationId: ${JSON.stringify(info.operationId)},`)
		lines.push(`\t\tmethod: ${JSON.stringify(info.method)},`)
		lines.push(`\t\tpath: ${JSON.stringify(info.path)},`)
		lines.push(`\t\tsummary: ${JSON.stringify(info.summary)},`)
		lines.push(`\t\tdescription: ${JSON.stringify(info.description)},`)
		lines.push(`\t\tinputSchema: ${fmtObject(info.inputSchema, 2)},`)
		lines.push(`\t\tannotations: ${fmtObject(info.annotations, 2)},`)
		lines.push('\t},')
	}

	lines.push('];')
	lines.push('')
	lines.push('export const BREWMESH_WEBMCP_TOOLS_MAP = Object.fromEntries(')
	lines.push('\tBREWMESH_WEBMCP_TOOLS.map((tool) => [tool.name, tool]),')
	lines.push(');')
	lines.push('')
	lines.push("if (typeof window !== 'undefined') {")
	lines.push('\twindow.BREWMESH_WEBMCP_TOOLS = BREWMESH_WEBMCP_TOOLS;')
	lines.push('\twindow.BREWMESH_WEBMCP_TOOLS_MAP = BREWMESH_WEBMCP_TOOLS_MAP;')
	lines.push('}')
	lines.push('')

	return lines.join('\n')
}

async function main() {
	const yaml = await readFile(SPEC_PATH, 'utf8')
	const spec = parse(yaml) as Record<string, unknown>
	const { tools, routes } = buildSpec(spec)
	const stamp = await computeGenStamp(SPEC_PATH)

	await mkdir(dirname(OUT_PATH), { recursive: true })
	await writeFile(OUT_PATH, renderOperationsModule(tools, routes, stamp))
	console.log(`wrote ${Object.keys(tools).length} MCP tools → ${OUT_PATH}`)

	await mkdir(dirname(WEBMCP_OUT_PATH), { recursive: true })
	await writeFile(WEBMCP_OUT_PATH, renderWebMcpModule(tools, stamp))
	console.log(`wrote ${Object.keys(tools).length} WebMCP tools → ${WEBMCP_OUT_PATH}`)
}

if(
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	await main()
}
