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

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) with semantic-release for automated versioning.

**For production code changes (triggers npm release):**
- `feat:` — new tool or feature → minor release (1.4.0 → 1.5.0)
- `fix:` — bug fix → patch release (1.4.0 → 1.4.1)

**For everything else (no release):**
- `chore(ci):` — CI configuration changes
- `chore(deps):` — dependency updates
- `docs:` — documentation changes
- `test:` — adding or fixing tests
- `refactor:` — code restructuring without behavior changes

**Important:** Use `feat:` and `fix:` ONLY for production code that needs to be published immediately (changes in `src/` that affect end users). For CI/docs/tooling/tests, use other types.

Examples:
```bash
# ✅ Triggers release
git commit -m "feat: add new screenshot compression tool"
git commit -m "fix: correct timeout handling in wait_for_selector"

# ❌ No release (use chore/docs instead)
git commit -m "chore(ci): add spell check to CI workflow"
git commit -m "docs: update README badges"
git commit -m "test: add unit tests for config parser"
```

## Releasing

Releases are fully automated via semantic-release:

1. Push commits to `main` (or merge PR)
2. CI runs semantic-release to analyze commits
3. If `feat:` or `fix:` found → creates GitHub Release + publishes to npm
4. Otherwise → no release triggered
