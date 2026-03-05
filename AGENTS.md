# Agent Guidelines for pinchtab-mcp

For project structure, tools, configuration, and code style see [PROJECT_INDEX.md](PROJECT_INDEX.md).

## Key Decisions (Non-Obvious)

- **McpServer, not Server** — uses `registerTool()` + zod schemas from `@modelcontextprotocol/sdk/server/mcp.js`. The `Server` class is deprecated.
- **Auto-start** — PinchTab binary starts on first API call. Lookup order: `PINCHTAB_BIN` env → `node_modules/.bin/pinchtab` → system PATH.
- **Stdio transport** — MCP over stdin/stdout. All logging → stderr (`console.error`).
- **Element refs** — `e0`, `e1`, … are accessibility tree identifiers, not DOM selectors. They exist only in snapshot responses, not in the DOM. Stale after navigation or major DOM changes.
- **No null** — the codebase uses `undefined` everywhere (including `toJson()`: `JSON.stringify(value, undefined, 2)`).
- **Sorted keys** — all object literals have alphabetically sorted keys, including `z.object()` fields and MCP tool config objects.
- **Real interactions by default** — `humanClick` (real mouse events) and `humanType` (character-by-character) are defaults. Programmatic variants are opt-in fallbacks.

## When Modifying Tools

1. Correct file: `src/tools/{instances,navigation,interaction,content}.ts`.
2. Pattern: `server.registerTool(name, { description, inputSchema, title }, handler)` — keys sorted.
3. `inputSchema`: `z.object({...})` with fields sorted alphabetically.
4. Name prefix: `pinchtab_`.
5. Return format: `{ content: [{ text, type: "text" as const }] }` — keys sorted.
6. Use `toJson(result)` from `../utils.js` for pretty-printing, never `JSON.stringify(x, null, 2)` directly.
7. Use `pinch(method, path, body?)` from `../pinchtab/client.js` for all HTTP calls.
