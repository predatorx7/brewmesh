import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript'
import { computeGenStamp, renderStampHeader } from './gen-stamp.ts'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const SPEC_PATH = join(SCRIPT_DIR, '..', 'openapi.yaml')
const OUT_PATH = join(
	SCRIPT_DIR,
	'..',
	'src',
	'types',
	'openapi.gen.ts',
)

/**
 * Generate TypeScript API definitions from `openapi.yaml`.
 *
 * Calls `openapiTS` programmatic API and prefixes the generated code
 * with the drift stamp containing the specification version and source hash.
 */
async function main() {
	const stamp = await computeGenStamp(SPEC_PATH)

	const ast = await openapiTS(pathToFileURL(SPEC_PATH))
	const header = renderStampHeader({
		generatorRelPath: 'scripts/openapi-typegen.ts',
		npmScript: 'npm run openapi:typegen',
		stamp,
	}).join('\n')

	const out = `${header}\n${COMMENT_HEADER}${astToString(ast)}`
	await mkdir(dirname(OUT_PATH), { recursive: true })
	await writeFile(OUT_PATH, out)
	console.log(
		`wrote openapi types (spec v${stamp.specVersion}, ` +
			`${stamp.sourceHash}) → ${OUT_PATH}`,
	)
}

await main()
