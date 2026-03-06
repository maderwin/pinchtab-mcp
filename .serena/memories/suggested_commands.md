# Suggested Commands — pinchtab-mcp

## Development
```bash
npm run dev          # Start server with tsx (hot reload via tsx watch)
npm run build        # Rolldown → dist/index.js
npm start            # Run compiled dist/index.js
```

## Quality Checks
```bash
npm run check        # Full: tsc --noEmit + oxlint + oxfmt --check + cspell + vitest
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

## GitHub Actions Workflows ⭐ NEW

### Manual Workflow Triggers
```bash
# Trigger daily PinchTab check manually
gh workflow run check-pinchtab-daily.yml

# View workflow status
gh workflow view check-pinchtab-daily.yml
gh workflow view dependabot-automerge.yml
```

### Monitor Workflow Runs
```bash
# List recent runs
gh run list --workflow=check-pinchtab-daily.yml --limit 10
gh run list --workflow=dependabot-automerge.yml --limit 10
gh run list --workflow=ci.yml --limit 10

# View specific run details
gh run view <run-id>

# Watch workflow in real-time
gh run watch <run-id>

# View workflow logs
gh run view <run-id> --log
```

### Dependency Management
```bash
# Check for outdated dependencies
npm outdated

# Check for security vulnerabilities
npm audit
npm audit --audit-level=moderate  # Same as CI

# Update specific dependency
npm update <package-name>

# Check current pinchtab version
npm list pinchtab
```

### PR Management
```bash
# List open PRs
gh pr list

# View Dependabot/auto-update PRs
gh pr list --label dependencies
gh pr list --label pinchtab-update

# View PR details
gh pr view <pr-number>

# Manually approve PR (if needed)
gh pr review <pr-number> --approve

# Manually merge PR
gh pr merge <pr-number> --squash
```

## Task Completion Checklist
Run before committing:
```bash
npm run check
```
