# Project Index: pinchtab-mcp

Generated: 2026-03-04

## Overview

MCP (Model Context Protocol) server for [PinchTab](https://pinchtab.com) — controls Chrome/Chromium browsers via accessibility tree snapshots. Exposes 15 browser-automation tools to AI agents (Claude, Cursor, VS Code, etc.) through the MCP standard.

PinchTab binary is bundled as an npm dependency and launched automatically by the server on first use.

---

## Project Structure

```
pinchtab-mcp/
├── src/
│   ├── index.ts               # Entry point: McpServer setup, signal handlers, main()
│   ├── config.ts              # Env vars: PINCHTAB_URL, PINCHTAB_TOKEN, PINCHTAB_BIN
│   ├── utils.ts               # toJson() helper
│   ├── pinchtab/
│   │   ├── process.ts         # Binary lifecycle: find, start, stop
│   │   └── client.ts          # HTTP client: pinch(method, path, body?)
│   ├── tools/
│   │   ├── index.ts           # registerAllTools(server) — barrel
│   │   ├── instances.ts       # pinchtab_list_instances (GET /tabs)
│   │   ├── navigation.ts      # pinchtab_navigate, pinchtab_snapshot, pinchtab_scroll, pinchtab_wait
│   │   ├── interaction.ts     # pinchtab_click, pinchtab_type, pinchtab_press, pinchtab_hover, pinchtab_focus, pinchtab_select
│   │   └── content.ts         # pinchtab_get_text, pinchtab_screenshot, pinchtab_eval, pinchtab_pdf
│   └── __tests__/
│       ├── config.test.ts
│       ├── client.test.ts
│       ├── content.test.ts
│       ├── instances.test.ts
│       ├── interaction.test.ts
│       ├── navigation.test.ts
│       ├── process.test.ts
│       ├── registration.test.ts
│       └── e2e/
│           └── browser.test.ts
├── dist/                      # Compiled output (Rolldown → single index.js)
├── docs/
├── package.json
├── tsconfig.json
├── rolldown.config.ts
├── vitest.config.ts
├── vitest.e2e.config.ts
├── oxlintrc.json
└── lefthook.yml
```

---

## Entry Points

| Type | Path | Description |
|------|------|-------------|
| CLI binary | `dist/index.js` | Compiled MCP server (`npx pinchtab-mcp`) |
| Dev entry | `src/index.ts` | Source entry for `npm run dev` (tsx) |
| Tool barrel | `src/tools/index.ts` | `registerAllTools(server)` — delegates to 4 tool modules |

---

## Core Modules

### `src/index.ts`
- Creates `McpServer` instance with name/version/instructions
- Calls `registerAllTools(server)`
- Connects via `StdioServerTransport`
- Handles `SIGINT`/`SIGTERM` → calls `cleanup()`
- Calls `ensurePinchtabRunning()` before connecting

### `src/config.ts`
| Export | Default | Description |
|--------|---------|-------------|
| `PINCHTAB_URL` | `http://127.0.0.1:9867` | PinchTab API base URL |
| `PINCHTAB_TOKEN` | `""` | Auth token (Bearer) |
| `PINCHTAB_BIN` | auto | Explicit binary path |

Binary lookup order: `PINCHTAB_BIN` env → `node_modules/.bin/pinchtab` → system PATH.

### `src/pinchtab/client.ts`
| Export | Signature | Description |
|--------|-----------|-------------|
| `pinch` | `(method, path, body?) → Promise<unknown>` | HTTP client; auto-starts PinchTab if not running; supports JSON + text responses; adds Bearer auth if token set |

### `src/pinchtab/process.ts`
| Export | Description |
|--------|-------------|
| `findPinchtabBin()` | Resolves binary path (env → node_modules → PATH) |
| `isPinchtabRunning()` | Health-checks `GET /instances` on configured URL |
| `ensurePinchtabRunning()` | Starts binary if not running, waits for readiness |
| `cleanup()` | Kills spawned process on exit |

### `src/utils.ts`
| Export | Description |
|--------|-------------|
| `toJson(value)` | `JSON.stringify(value, undefined, 2)` — uses `undefined` not `null` |

### `src/tools/index.ts`
| Export | Description |
|--------|-------------|
| `registerAllTools(server)` | Registers all 4 tool groups on the McpServer |

---

## PinchTab API (v0.7.x — Flat Standalone Mode)

In standalone mode (when PinchTab runs as a single process), all routes are **flat** — no instance or tab ID prefix needed. The active tab is implicit.

### Navigation & Page State
| Method | Route | Request Body | Response |
|--------|-------|-------------|----------|
| POST | `/navigate` | `{url}` | `{title, url}` |
| GET | `/text` | — | `{text, title, url}` |
| GET | `/snapshot` | query: `?interactive`, `?format=compact`, `?diff=true` | `{count, nodes: [{ref, role, name, depth, ...}], title, url}` |
| GET | `/screenshot` | — | `{base64: "..."}` (JPEG) |
| GET | `/pdf` | — | Binary PDF |

### Actions
| Method | Route | Request Body | Response |
|--------|-------|-------------|----------|
| POST | `/action` | `{kind: "click"/"humanClick", ref}` | `{ok}` |
| POST | `/action` | `{kind: "humanType"/"fill", ref, text}` | `{ok}` |
| POST | `/action` | `{kind: "press", key}` | `{ok}` |
| POST | `/action` | `{kind: "hover", ref}` | `{ok}` |
| POST | `/action` | `{kind: "focus", ref}` | `{ok}` |
| POST | `/action` | `{kind: "select", ref, value}` | `{ok}` |
| POST | `/action` | `{kind: "scroll", direction, amount}` | `{ok}` |

### JavaScript Evaluation
| Method | Route | Request Body | Response |
|--------|-------|-------------|----------|
| POST | `/evaluate` | `{expression}` | `{result}` |

### Tab Management
| Method | Route | Response |
|--------|-------|----------|
| GET | `/tabs` | `{tabs: [{id, title, type, url}]}` |
| GET | `/health` | `{status: "ok", tabs: N}` |

### Important API Notes
- **No `POST /instances`** — PinchTab starts with an initial tab automatically
- **Navigation is NOT an action** — use `POST /navigate`, not `/action` with `kind: "nav"`
- **Eval is NOT an action** — use `POST /evaluate` with `{expression}`, not `/action` with `kind: "eval"`
- **Snapshot returns `nodes`** (not `refs`) — array of `{ref, role, name, depth, ...}`
- **Screenshot returns `{base64: "..."}`** — JSON with base64 field, not raw binary
- **All routes are flat** — no `/instances/{id}/` or `/tabs/{id}/` prefix in standalone mode

---

## PinchTab Configuration (Environment Variables)

| Variable | Default | Description |
|---|---|---|
| `CHROME_BINARY` | Auto-detect | Path to Chrome/Chromium binary (Yandex, Brave, Edge, etc.) |
| `CDP_URL` | *(none)* | Connect to an existing browser via WebSocket DevTools URL |
| `BRIDGE_PORT` | `9867` | HTTP server port |
| `BRIDGE_BIND` | `127.0.0.1` | Bind address |
| `BRIDGE_HEADLESS` | `true` | Run browser headless (`false` to see window) |
| `BRIDGE_PROFILE` | `~/.pinchtab/chrome-profile` | Browser profile directory |
| `BRIDGE_TOKEN` | *(none)* | API authentication token |
| `BRIDGE_STEALTH` | `light` | Bot detection bypass level |
| `BRIDGE_BLOCK_ADS` | `false` | Block ad domains |
| `BRIDGE_BLOCK_IMAGES` | `false` | Block image loading |
| `BRIDGE_BLOCK_MEDIA` | `false` | Block video/audio |
| `BRIDGE_DEBUG` | `false` | Enable debug logging |
| `BRIDGE_LOG_LEVEL` | `info` | Logging verbosity |
| `BRIDGE_NO_RESTORE` | `false` | Skip tab restoration |

---

## MCP Tools (15 total)

### Tab Management (`src/tools/instances.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_list_instances` | `GET /tabs` | List all open browser tabs |

### Navigation (`src/tools/navigation.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_navigate` | `POST /navigate` | Navigate to a URL |
| `pinchtab_snapshot` | `GET /snapshot` | Get accessibility tree (element refs for interaction) |
| `pinchtab_scroll` | `POST /action` | Scroll page up/down |
| `pinchtab_wait` | *(local timer)* | Wait N seconds (useful after navigation) |

### Interaction (`src/tools/interaction.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_click` | `POST /action` | Click element by ref (humanClick=true by default) |
| `pinchtab_type` | `POST /action` | Type text into input (humanType=true by default) |
| `pinchtab_press` | `POST /action` | Press keyboard key (Enter, Tab, Escape, etc.) |
| `pinchtab_hover` | `POST /action` | Hover over element (reveal tooltips, dropdowns) |
| `pinchtab_focus` | `POST /action` | Focus element (trigger autocomplete, etc.) |
| `pinchtab_select` | `POST /action` | Select option in a dropdown |

### Content (`src/tools/content.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_get_text` | `GET /text` | Get readable page text (~800 tokens) |
| `pinchtab_screenshot` | `GET /screenshot` | Take a page screenshot |
| `pinchtab_eval` | `POST /evaluate` | Execute JavaScript in page context |
| `pinchtab_pdf` | `GET /pdf` | Export page as PDF |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript: `strict`, `ES2022`, `Node16` module resolution |
| `rolldown.config.ts` | Build: bundles `src/index.ts` → `dist/index.js` |
| `vitest.config.ts` | Unit test config |
| `vitest.e2e.config.ts` | E2E test config (env `PINCHTAB_E2E=1` required) |
| `oxlintrc.json` | Lint rules: 7 plugins, sorted keys, no null, ESM, etc. |
| `lefthook.yml` | Git hooks: pre-commit (lint+fmt), pre-push (tsc+test) |
| `.node-version` | Node.js version pin |

---

## Tests

| File | Type | What it tests |
|------|------|---------------|
| `src/__tests__/config.test.ts` | Unit | Env var parsing and defaults |
| `src/__tests__/client.test.ts` | Unit | HTTP client (JSON/text responses, error handling, auto-start) |
| `src/__tests__/content.test.ts` | Unit | Content tools (text, screenshot, eval, PDF) |
| `src/__tests__/instances.test.ts` | Unit | Tab listing tool |
| `src/__tests__/interaction.test.ts` | Unit | Interaction tools (click, type, press, hover, focus, select) |
| `src/__tests__/navigation.test.ts` | Unit | Navigation tools (navigate, snapshot, scroll, wait) |
| `src/__tests__/process.test.ts` | Unit | PinchTab process lifecycle |
| `src/__tests__/registration.test.ts` | Unit | Tool registration verification |
| `src/__tests__/e2e/browser.test.ts` | E2E | Full browser automation (requires live PinchTab) |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.12.0 | MCP server, tool registration, stdio transport |
| `pinchtab` | `*` | Browser automation binary (bundled) |
| `typescript` | ^5.7.0 | Language |
| `vitest` | ^3.0.0 | Test runner |
| `oxlint` | ^0.16.0 | Linter (263 rules, 7 plugins) |
| `oxfmt` | ^0.36.0 | Formatter |
| `rolldown` | ^1.0.0-rc.6 | Bundler |
| `tsx` | ^4.19.0 | Dev runner (hot-reload) |
| `lefthook` | ^1.10.0 | Git hooks manager |

---

## Quick Start

```bash
# Install
npm install

# Development (hot-reload)
npm run dev

# Full quality check (tsc + lint + fmt + test)
npm run check

# Build for production
npm run build

# Run compiled server
npm start

# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires PinchTab on localhost:9867)
npm run test:e2e

# E2E with Yandex Browser
CHROME_BINARY="/Applications/Yandex.app/Contents/MacOS/Yandex" BRIDGE_HEADLESS=false npx pinchtab &
PINCHTAB_E2E=1 npx vitest run -c vitest.e2e.config.ts
```

---

## Agent Workflow (Standard Loop)

```
1. pinchtab_navigate          → go to URL
2. pinchtab_wait              → wait 3s for load
3. pinchtab_screenshot        → verify page (first visit)
4. pinchtab_snapshot          → get element refs (filter=interactive)
5. pinchtab_click / type      → interact with refs
6. pinchtab_snapshot / screenshot → verify result
```

Element refs (`e0`, `e1`, `e5`, …) are stable between snapshot and actions. Re-snapshot after navigation or major DOM changes.

---

## Code Style Rules (Key)

- ESM only — `.js` extensions in imports
- No `null` — use `undefined`
- Object keys sorted alphabetically (enforced by oxlint `sort-keys`)
- `interface` over `type` for object shapes
- `async/await` + `try/catch` — no `.then()/.catch()`
- `it()` in tests (not `test()`), lowercase titles
- Files: `kebab-case.ts`
- Tool names: `pinchtab_` prefix, `snake_case`

---

## Commit Convention

`feat:` | `fix:` | `refactor:` | `test:` | `docs:` | `chore:`
