# pinchtab-mcp — Project Overview

## Purpose
MCP (Model Context Protocol) server for PinchTab — controls Chrome/Chromium browsers via accessibility tree snapshots. Exposes browser automation as MCP tools to AI agents (Claude, Cursor, VS Code, etc.).

PinchTab binary is bundled as an npm dependency and launched automatically by the MCP server.

## Tech Stack
- **Language**: TypeScript (ESM, target ES2022, Node16 module resolution)
- **Runtime**: Node.js ≥18
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.12.0
- **Build**: Rolldown (`rolldown.config.ts`) → `dist/index.js`
- **Test runner**: Vitest ^3.0.0
- **Linter**: oxlint (263 rules, 7 plugins)
- **Formatter**: oxfmt
- **Git hooks**: Lefthook (pre-commit: lint+fmt on staged .ts; pre-push: typecheck+tests)

## Entry Points
- `src/index.ts` — McpServer setup, signal handlers, main()
- `dist/index.js` — compiled binary (via `bin.pinchtab-mcp` in package.json)

## Codebase Structure
```
src/
├── config.ts              # Env vars: PINCHTAB_URL, PINCHTAB_TOKEN, PINCHTAB_BIN
├── utils.ts               # Shared helpers (toJson, etc.)
├── index.ts               # Entrypoint: McpServer + instructions + signal handlers
├── pinchtab/
│   ├── process.ts         # PinchTab binary lifecycle (find, start, stop)
│   └── client.ts          # HTTP client for PinchTab API
├── tools/
│   ├── index.ts           # Barrel — registerAllTools(server)
│   ├── instances.ts       # pinchtab_list_instances (GET /tabs)
│   ├── navigation.ts      # pinchtab_navigate, pinchtab_snapshot, pinchtab_scroll, pinchtab_wait
│   ├── interaction.ts     # pinchtab_click, pinchtab_type, pinchtab_press, pinchtab_hover, pinchtab_focus, pinchtab_select
│   └── content.ts         # pinchtab_get_text, pinchtab_screenshot, pinchtab_eval, pinchtab_pdf
└── __tests__/
    ├── config.test.ts
    ├── client.test.ts
    ├── content.test.ts
    ├── instances.test.ts
    ├── interaction.test.ts
    ├── navigation.test.ts
    ├── process.test.ts
    ├── registration.test.ts
    └── e2e/
        └── browser.test.ts
```

## PinchTab API (v0.7.x — Flat Standalone Mode)
All routes are flat — no instance/tab ID prefix needed:
- `POST /navigate` — navigate to URL
- `GET /text` — page text
- `GET /snapshot` — accessibility tree (returns `nodes` array)
- `GET /screenshot` — screenshot (returns `{base64}`)
- `POST /evaluate` — execute JS (body: `{expression}`)
- `POST /action` — interactions (click, type, press, hover, focus, select, scroll)
- `GET /tabs` — list tabs
- `GET /pdf` — export PDF

**Key env var**: `CHROME_BINARY` (NOT `CHROME_BIN`) to specify custom browser path.

## Available MCP Tools (15 total)
pinchtab_list_instances, pinchtab_navigate, pinchtab_snapshot, pinchtab_click, pinchtab_type, pinchtab_press, pinchtab_hover, pinchtab_focus, pinchtab_select, pinchtab_get_text, pinchtab_screenshot, pinchtab_eval, pinchtab_pdf, pinchtab_scroll, pinchtab_wait

## Repository
https://github.com/maderwin/pinchtab-mcp.git
License: MIT
