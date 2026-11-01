# Working in BrewMesh

Follow the Google Developer Documentation Style Guide (`https://developers.google.com/style`), Anthropic Agent & Tool Best Practices (`https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`), and the architectural discipline from `reclaimprotocol/builder`.

## Sources of truth

1. `sql/ddl.sql` — Single source of truth for the PostgreSQL schema (`cafe`), value-type domains, enums, PL/pgSQL functions, `@haathie/pgmb` table mutation triggers, and initial Mumbai cafe seed data. Keep invariants and calculations inside SQL functions, not scattered across TypeScript.
2. `sql/queries.sql` — Single source of truth for all database queries (`/* @name ... */`). Run `npm run queries:typegen` to regenerate `src/queries.ts`. Never write inline SQL in route handlers.
3. `openapi.yaml` — Single source of truth for every HTTP operation, request/response validation (`express-openapi-validator`), TypeScript API types (`src/types/openapi.gen.ts`), Server MCP tools (`src/mcp/operations.gen.ts`), and Browser WebMCP tools (`public/webmcp-tools.gen.js`). Run `npm run gen` after modifying `openapi.yaml` or `sql/queries.sql`.

## Code style

- Use tabs (`\t`) for indentation, not spaces.
- Include the `.ts` extension on all relative TypeScript imports.
- Prefix private class fields and methods with `#`.
- Use `assert(condition, boomError)` from `node:assert` and `@hapi/boom` instead of `if (!condition) throw`.
- Use `||=` and `??=` for optional default assignment.
- Log through `src/logger.ts` (`pino`), never `console.log` in application runtime code.
- Write comments and documentation in active voice, present tense, second person ("you"), and sentence case. Use "for example" instead of "e.g." or "i.e.".

## UI & Markup conventions

- Keep the DOM hierarchy flat and use semantic elements (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<dialog>`, `<button>`).
- Prefer `padding` and flex/grid `gap` over `margin`.
- Set hover and state transitions to `0.1s` (and smooth docking transitions for the Google Search Home -> Search Results Omni-Bar).
- Dialogs must have a close button in the top-right header, put primary actions in the footer, and never stack a dialog on top of another dialog.
