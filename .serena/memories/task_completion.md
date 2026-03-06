# Task Completion Checklist — pinchtab-mcp

After completing any coding task, always run:

```bash
npm run check
```

This runs in sequence:
1. `tsc --noEmit` — TypeScript type checking
2. `npm run lint` — oxlint (262 rules)
3. `npm run fmt:check` — oxfmt format check
4. `npm run spell` — cspell on .ts and .md files
5. `npm test` — vitest unit tests (111 tests)

If `npm run check` passes, the task is complete and safe to commit.

## Individual commands for faster iteration:
```bash
npm run lint         # Check lint only
npm run fmt          # Auto-fix formatting
npm test             # Run unit tests only
npm run test:coverage # Tests with coverage report
```

## E2E tests (only when browser automation changes are made):
```bash
npm run test:e2e     # Requires PinchTab running on localhost:9867
```

## Commit convention:
Enforced by commitlint + lefthook commit-msg hook.
Use conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

## Release flow:
Push to main → semantic-release auto-creates GitHub Release → npm publish via OIDC.
- `feat:` → minor bump (1.x.0)
- `fix:` → patch bump (1.0.x)
- `chore:` / `docs:` → no release

## Coverage thresholds (vitest.config.ts):
- branches: 90%, functions: 95%, lines: 95%, statements: 95%
