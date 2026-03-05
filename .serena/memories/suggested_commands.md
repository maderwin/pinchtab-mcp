# Suggested Commands — pinchtab-mcp

## Development
```bash
npm run dev          # Start server with tsx (hot reload via tsx watch)
npm run build        # Rolldown → dist/index.js
npm start            # Run compiled dist/index.js
```

## Quality Checks
```bash
npm run check        # Full: tsc --noEmit + oxlint + oxfmt --check + vitest
npm run lint         # oxlint -c oxlintrc.json --tsconfig tsconfig.json src/
npm run fmt          # oxfmt --write src/  (auto-format)
npm run fmt:check    # oxfmt --check src/  (no writes, CI-safe)
tsc --noEmit         # Type-check only
```

## Testing
```bash
npm test             # vitest run (unit tests only)
npm run test:watch   # vitest watch mode
npm run test:e2e     # E2E tests — requires PinchTab running on localhost:9867
                     # (set PINCHTAB_E2E=1 env var, uses vitest.e2e.config.ts)
```

## Pre-publish
```bash
npm run prepublishOnly   # Full check + build (runs automatically before npm publish)
```

## Git Hooks (Lefthook)
- **pre-commit**: lint + fmt on staged .ts files
- **pre-push**: tsc + tests
```bash
lefthook install     # Install hooks (auto-run via npm prepare)
```

## Task Completion Checklist
Run before committing:
```bash
npm run check
```
