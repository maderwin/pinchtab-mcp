# Task Completion Checklist — pinchtab-mcp

After completing any coding task, always run:

```bash
npm run check
```

This runs in sequence:
1. `tsc --noEmit` — TypeScript type checking
2. `npm run lint` — oxlint (263 rules)
3. `npm run fmt:check` — oxfmt format check
4. `npm test` — vitest unit tests

If `npm run check` passes, the task is complete and safe to commit.

## Individual commands for faster iteration:
```bash
npm run lint         # Check lint only
npm run fmt          # Auto-fix formatting
npm test             # Run unit tests only
```

## E2E tests (only when browser automation changes are made):
```bash
npm run test:e2e     # Requires PinchTab running on localhost:9867
```

## Before merging/publishing:
```bash
npm run prepublishOnly  # check + build
```
