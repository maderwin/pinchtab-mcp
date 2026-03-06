# pinchtab-mcp — Project Overview

## Purpose
MCP (Model Context Protocol) server for PinchTab — controls Chrome/Chromium browsers via accessibility tree snapshots. Exposes browser automation as MCP tools to AI agents (Claude, Cursor, VS Code, etc.).

PinchTab binary is bundled as an npm dependency and launched automatically by the MCP server.

## Tech Stack
- **Language**: TypeScript (ESM, target ES2022, Node16 module resolution)
- **Runtime**: Node.js ≥20
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.12.0
- **Build**: Rolldown (`rolldown.config.ts`) → `dist/index.js`
- **Test runner**: Vitest ^3.0.0 (111 tests, ~98% coverage)
- **Linter**: oxlint (262 rules, 7 plugins)
- **Formatter**: oxfmt
- **Git hooks**: Lefthook (pre-commit: lint+fmt+spell; pre-push: tsc+test; commit-msg: commitlint)
- **Release**: semantic-release → GitHub Release → npm publish (OIDC Trusted Publishing)

## Entry Points
- `src/index.ts` — McpServer setup, signal handlers, main()
- `dist/index.js` — compiled binary (via `bin.pinchtab-mcp` in package.json)

## Codebase Structure
```
src/
├── config.ts              # Env vars: PINCHTAB_URL, PINCHTAB_TOKEN, PINCHTAB_BIN
├── utils.ts               # Pure utilities: isRecord, toJson, toolResult, toolError
├── instructions.ts        # MCP agent instructions (operating modes, workflow, tips)
├── index.ts               # Entrypoint: McpServer + signal handlers + main()
├── pinchtab/
│   ├── process.ts         # PinchTab binary lifecycle (find, start, stop)
│   └── client.ts          # HTTP client for PinchTab API
├── tools/
│   ├── index.ts           # Barrel — registerAllTools(server)
│   ├── shared.ts          # waitAndSnapshot() — shared by navigation + interaction
│   ├── instances.ts       # pinchtab_list_instances, pinchtab_close_tab, pinchtab_health, pinchtab_cookies
│   ├── navigation.ts      # pinchtab_navigate, pinchtab_snapshot, pinchtab_scroll, pinchtab_wait, pinchtab_wait_for_selector
│   ├── interaction.ts     # pinchtab_click, pinchtab_type, pinchtab_press, pinchtab_hover, pinchtab_focus, pinchtab_select
│   └── content.ts         # pinchtab_get_text, pinchtab_screenshot, pinchtab_eval, pinchtab_pdf
└── __tests__/             # 9 test files, 111 tests total
```

## Available MCP Tools (19 total)
pinchtab_list_instances, pinchtab_close_tab, pinchtab_health,
pinchtab_navigate (waitMs, newTab), pinchtab_snapshot, pinchtab_scroll, pinchtab_wait, pinchtab_wait_for_selector,
pinchtab_click (waitMs), pinchtab_type (clearFirst), pinchtab_press, pinchtab_hover, pinchtab_focus, pinchtab_select,
pinchtab_get_text, pinchtab_screenshot, pinchtab_eval, pinchtab_pdf, pinchtab_cookies

## CI/CD
- **ci.yml**: tsc + lint + test + coverage upload to Codecov (Node 22)
- **release.yml**: semantic-release → GitHub Release → npm publish (OIDC Trusted Publishing)
- **pages.yml**: Deploy docs/ to GitHub Pages

## Key Patterns
- `waitMs` param on navigate/click: auto-returns compact snapshot after delay (saves round-trips)
- `clearFirst` on type: click → Ctrl+A → type sequence for React/Vue/Angular
- `wait_for_selector`: polls CSS selector via /evaluate (500ms interval, max 15s)

## Repository
https://github.com/maderwin/pinchtab-mcp.git
npm: https://www.npmjs.com/package/pinchtab-mcp
License: MIT
