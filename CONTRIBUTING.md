# Contributing to pinchtab-mcp

For project structure, tools reference, and code style rules see [PROJECT_INDEX.md](PROJECT_INDEX.md).

## Setup

```bash
git clone https://github.com/maderwin/pinchtab-mcp.git
cd pinchtab-mcp
npm install
```

Lefthook installs automatically via `prepare` — pre-commit runs lint + format on staged `.ts` files, pre-push runs typecheck + tests.

## Development

```bash
npm run dev          # Start server with tsx (auto-reload)
npm run check        # Full: tsc + oxlint + oxfmt --check + vitest
npm run build        # Rolldown → dist/index.js
```

Individual commands:

```bash
npm run lint         # oxlint with oxlintrc.json
npm run fmt          # oxfmt --write
npm run fmt:check    # oxfmt --check (no writes)
npm test             # vitest run (unit only)
npm run test:watch   # vitest watch mode
npm run test:e2e     # E2E tests (requires running PinchTab instance)
```

## Testing

Unit tests use vitest with `vi.mock` / `vi.doMock` for module-level mocks (HTTP client, config, process management). E2E tests require a running PinchTab instance and a real browser:

```bash
npm test             # Unit tests (always safe to run)
npm run test:e2e     # E2E (needs PinchTab on localhost:9867)
```

## Releasing

1. Update version in `package.json`.
2. Create a GitHub Release with the version tag (e.g. `v1.1.0`).
3. CI publishes to npm automatically.
