# Project Index: pinchtab-mcp

Generated: 2026-03-06 (updated)

## Overview

MCP (Model Context Protocol) server for [PinchTab](https://pinchtab.com) — controls Chrome/Chromium browsers via accessibility tree snapshots. Exposes 19 browser-automation tools to AI agents (Claude, Cursor, VS Code, etc.) through the MCP standard.

PinchTab binary is bundled as an npm dependency and launched automatically by the server on first use.

---

## Project Structure

```
pinchtab-mcp/
├── src/
│   ├── index.ts               # Entry point: McpServer setup, signal handlers, main()
│   ├── instructions.ts        # MCP agent instructions (operating modes, workflow, tips)
│   ├── config.ts              # Env vars: PINCHTAB_URL, PINCHTAB_TOKEN, PINCHTAB_BIN
│   ├── utils.ts               # isRecord(), toJson(), toolResult(), toolError()
│   ├── pinchtab/
│   │   ├── process.ts         # Binary lifecycle: find, start, stop
│   │   └── client.ts          # HTTP client: pinch(method, path, body?)
│   ├── tools/
│   │   ├── index.ts           # registerAllTools(server) — barrel
│   │   ├── shared.ts          # waitAndSnapshot() — shared by navigation + interaction
│   │   ├── instances.ts       # pinchtab_list_instances, pinchtab_close_tab, pinchtab_health, pinchtab_cookies
│   │   ├── navigation.ts      # pinchtab_navigate, pinchtab_snapshot, pinchtab_scroll, pinchtab_wait, pinchtab_wait_for_selector
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
│   └── index.html             # GitHub Pages landing page
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             # CI: tsc, lint, test, coverage → Codecov
│   │   ├── release.yml        # semantic-release → GitHub Release → npm publish (OIDC)
│   │   └── pages.yml          # Deploy docs/ to GitHub Pages
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── pull_request_template.md
│   └── dependabot.yml
├── package.json
├── tsconfig.json
├── rolldown.config.ts
├── vitest.config.ts
├── vitest.e2e.config.ts
├── oxlintrc.json
├── lefthook.yml
├── .releaserc.json
├── commitlint.config.ts
└── cspell.json
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
- Creates `McpServer` instance with name/version (read from package.json)/instructions
- Calls `registerAllTools(server)`
- Connects via `StdioServerTransport`
- Handles `SIGINT`/`SIGTERM` → calls `cleanup()`
- Calls `ensurePinchtabRunning()` before connecting

### `src/instructions.ts`
| Export | Description |
|--------|-------------|
| `instructions` | MCP agent instructions string: operating modes, workflow, highlighting, interaction tips, common patterns |

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
| `isRecord(value)` | Type guard: checks `typeof === "object" && !== null` |
| `toJson(value)` | `JSON.stringify(value, undefined, 2)` — uses `undefined` not `null` |
| `toolResult(data)` | Returns MCP tool success response |
| `toolError(error)` | Returns MCP tool error response |

### `src/tools/index.ts`
| Export | Description |
|--------|-------------|
| `registerAllTools(server)` | Registers all 4 tool groups on the McpServer |

### `src/tools/shared.ts`
| Export | Description |
|--------|-------------|
| `waitAndSnapshot(ms)` | Wait `ms` (max 10s), then return compact snapshot. Used by navigate(waitMs) and click(waitMs) |

---

## MCP Tools (19 total)

### Tab Management (`src/tools/instances.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_list_instances` | `GET /tabs` | List all open browser tabs |
| `pinchtab_close_tab` | `POST /tab` | Close current or specific tab by ID |
| `pinchtab_health` | `GET /health` | Check if PinchTab server is running |
| `pinchtab_cookies` | `GET /cookies` | Get all cookies for the current page |

### Navigation (`src/tools/navigation.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_navigate` | `POST /navigate` | Navigate to URL; `newTab` opens in new tab; `waitMs` returns auto-snapshot |
| `pinchtab_snapshot` | `GET /snapshot` | Get accessibility tree (element refs); supports filter, compact, diff |
| `pinchtab_scroll` | `POST /action` | Scroll page or element in any direction (up/down/left/right) |
| `pinchtab_wait` | *(local timer)* | Wait N seconds (1-30, default 3) |
| `pinchtab_wait_for_selector` | `POST /evaluate` | Poll CSS selector until it appears (500ms interval, max 15s) |

### Interaction (`src/tools/interaction.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_click` | `POST /action` | Click element by ref (humanClick default); `waitMs` for auto-snapshot |
| `pinchtab_type` | `POST /action` | Type text (humanType default); `clearFirst` for React/Vue/Angular |
| `pinchtab_press` | `POST /action` | Press keyboard key; optionally target a specific element |
| `pinchtab_hover` | `POST /action` | Hover over element (reveal tooltips, dropdowns) |
| `pinchtab_focus` | `POST /action` | Focus element (trigger autocomplete, etc.) |
| `pinchtab_select` | `POST /action` | Select option in a dropdown |

### Content (`src/tools/content.ts`)
| Tool | PinchTab Route | Description |
|------|---------------|-------------|
| `pinchtab_get_text` | `GET /text` | Get readable page text (~800 tokens) |
| `pinchtab_screenshot` | `GET /screenshot` | Take a page screenshot (base64 JPEG) |
| `pinchtab_eval` | `POST /evaluate` | Execute JavaScript in page context |
| `pinchtab_pdf` | `GET /pdf` | Export page as PDF |

---

## CI/CD Pipeline

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci.yml` | push/PR to main | tsc, lint, test; coverage upload to Codecov (Node 22) |
| `release.yml` | push to main, workflow_dispatch | semantic-release → GitHub Release → npm publish (OIDC Trusted Publishing) |
| `pages.yml` | push to main (docs/) | Deploy docs/ to GitHub Pages |

### Release Flow
1. Push to `main` with `feat:` or `fix:` commit
2. `semantic-release` analyzes commits, bumps version, creates GitHub Release
3. `npm publish --provenance --access public` via OIDC Trusted Publishing (no token needed)

---

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript: `strict`, `ES2022`, `Node16` module resolution |
| `rolldown.config.ts` | Build: bundles `src/index.ts` → `dist/index.js` |
| `vitest.config.ts` | Unit test config with coverage thresholds (90%+ branches/lines/statements) |
| `vitest.e2e.config.ts` | E2E test config (env `PINCHTAB_E2E=1` required) |
| `oxlintrc.json` | Lint rules: 7 plugins, sorted keys, no null, ESM, etc. |
| `lefthook.yml` | Git hooks: pre-commit (lint+fmt+spell), pre-push (tsc+test), commit-msg (commitlint) |
| `.releaserc.json` | semantic-release: commit-analyzer, release-notes, npm (no publish), github |
| `commitlint.config.ts` | Enforce conventional commits |
| `cspell.json` | Spell checking for TS and MD files |
| `.node-version` | Node.js version pin |

---

## Tests (111 total)

| File | Count | What it tests |
|------|-------|---------------|
| `config.test.ts` | 2 | Env var parsing and defaults |
| `utils.test.ts` | 12 | isRecord, toJson, toolResult, toolError |
| `client.test.ts` | 10 | HTTP client (JSON/text responses, error handling, auto-start) |
| `content.test.ts` | 16 | Content tools (text, screenshot, eval, PDF) |
| `instances.test.ts` | 11 | Tab listing, close tab, health check, cookies |
| `interaction.test.ts` | 20 | Click (+ waitMs), type (+ clearFirst), press, hover, focus, select |
| `navigation.test.ts` | 25 | Navigate (+ waitMs), snapshot, scroll, wait, wait_for_selector |
| `process.test.ts` | 13 | PinchTab process lifecycle |
| `registration.test.ts` | 2 | Tool registration verification |
| `e2e/browser.test.ts` | 12 | Full browser automation (requires live PinchTab) |

Coverage: ~98% statements, ~96% branches, 100% functions.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.12.0 | MCP server, tool registration, stdio transport |
| `pinchtab` | `*` | Browser automation binary (bundled) |
| `typescript` | ^5.7.0 | Language |
| `vitest` | ^3.0.0 | Test runner |
| `oxlint` | ^0.16.0 | Linter (262 rules, 7 plugins) |
| `oxfmt` | ^0.36.0 | Formatter |
| `rolldown` | ^1.0.0-rc.6 | Bundler |
| `tsx` | ^4.19.0 | Dev runner (hot-reload) |
| `lefthook` | ^1.10.0 | Git hooks manager |
| `semantic-release` | ^25.0.3 | Automated releases |

---

## Quick Start

```bash
# Install
npm install

# Development (hot-reload)
npm run dev

# Full quality check (tsc + lint + fmt + spell + test)
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
```

---

## Agent Workflow (Recommended)

```
1. pinchtab_navigate(url, waitMs: 3000)  → go to URL + get snapshot in one call
2. pinchtab_snapshot(filter: 'interactive') → get only buttons/links/inputs (fewer tokens)
3. pinchtab_click(ref, waitMs: 1000)     → interact + get post-click state
4. pinchtab_wait_for_selector(selector)  → wait for dynamic content (not fixed delays)
5. pinchtab_snapshot                     → verify result
```

- Prefer snapshot over screenshot (~3K vs 10-50K+ tokens)
- Use `clearFirst: true` in `pinchtab_type` for React/Vue/Angular forms
- Re-snapshot after navigation or major DOM changes (refs go stale)

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

Enforced by commitlint + lefthook commit-msg hook.
