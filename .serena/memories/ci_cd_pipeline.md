# CI/CD Pipeline — pinchtab-mcp

## Workflows (.github/workflows/)

### ci.yml — Continuous Integration
- Trigger: push/PR to main
- Matrix: Node 20 + 22
- Steps: tsc, lint, fmt:check, spell, test, **npm audit** (--audit-level=moderate), build
- Coverage: uploaded to Codecov (Node 22 only) via codecov-action@v5
- **Updated:** Added security audit step for dependency vulnerability checking

### release.yml — Release + Publish
- Trigger: push to main, workflow_dispatch
- Skip if commit message contains 'chore(release)'
- Steps:
  1. npm ci, tsc, lint, test, build
  2. Get pre-release version (from package.json)
  3. Run semantic-release (creates GitHub Release if feat/fix commit)
  4. Compare versions: if changed, npm publish --provenance --access public
- Permissions: contents:write, id-token:write, issues:write, pull-requests:write
- npm publish uses OIDC Trusted Publishing (no NPM_TOKEN needed)

### pages.yml — GitHub Pages
- Trigger: push to main (docs/ changes)
- Deploys docs/ directory

### check-pinchtab-daily.yml — Daily PinchTab Monitoring ⭐ NEW
- Trigger: scheduled cron `0 0 * * *` (midnight UTC daily), workflow_dispatch
- Steps:
  1. Get current pinchtab version from package-lock.json
  2. Get latest pinchtab version from npm registry
  3. Compare versions
  4. If update available → create PR with format: "chore(deps): bump pinchtab from X to Y"
  5. PR labels: "dependencies", "pinchtab-update"
- Permissions: contents:write, pull-requests:write
- Uses GitHub Actions bot for git operations
- Skips PR creation if branch already exists (no duplicates)

### dependabot-automerge.yml — Auto-merge for Dependency PRs ⭐ NEW
- Trigger: pull_request_target (opened, synchronize, reopened)
- Condition: Only runs for Dependabot PRs or PRs with "pinchtab-update" label
- Permissions: contents:write, pull-requests:write
- Logic flow:
  1. Extract dependency metadata (package name, old/new version) from PR title
  2. Calculate semver diff (major/minor/patch)
  3. Wait for CI checks to complete (max 15 min, 30s polling)
  4. **PinchTab major update:** Add label "needs-manual-review" + comment → SKIP auto-merge
  5. **PinchTab CI failed:** Add labels "ci-failed", "needs-manual-review" + notification comment → SKIP auto-merge
  6. **Other cases (CI passed, patch/minor):** Approve PR → Merge (squash)
- Safety: Uses pull_request_target for secure token access, respects branch protection

## Dependabot (.github/dependabot.yml)
- npm: weekly schedule, grouped dev/prod dependencies
- github-actions: weekly schedule
- Commit prefix: `chore(deps):` for npm, `ci(deps):` for actions

## Dependency Update Automation Strategy

### PinchTab Updates
- **Frequency:** Daily (0:00 UTC via check-pinchtab-daily.yml)
- **Auto-merge:** Patch/minor only (if CI passes)
- **Major versions:** Manual review required (label + comment notification)
- **Failed CI:** Manual review required (comment notification + labels)

### Other Dependencies
- **Frequency:** Weekly (Dependabot)
- **Auto-merge:** All versions (if CI passes)
- **Failed CI:** PR stays open, no notification

### Safety Checks for Auto-merge
1. CI must pass (tsc, lint, fmt, spell, test, security audit, build)
2. Security audit: `npm audit --audit-level=moderate` must pass
3. Build verification: `npm run build` must succeed
4. Version validation: Major pinchtab updates blocked

## semantic-release config (.releaserc.json)
- Plugins: commit-analyzer, release-notes-generator, npm (npmPublish: false), github
- Note: npmPublish:false because semantic-release doesn't support OIDC
- npm publish is handled by the manual step after semantic-release

## Key Gotchas
- npm OIDC Trusted Publishing requires npm >= 11.5.1 (workflow installs npm@latest)
- No registry-url in setup-node (creates .npmrc with empty token, blocks OIDC)
- GITHUB_TOKEN events don't trigger other workflows (that's why release+publish are in same workflow)
- Branch protection blocks @semantic-release/git from pushing to main (that's why we removed it)
- Trusted Publishing settings on npmjs.com must reference release.yml (not publish.yml)
- **Auto-merge uses pull_request_target** to access secrets securely (required for PR approval/merge)
- **Daily workflow timing:** 0:00 UTC to minimize CI congestion

## Monitoring & Maintenance
- Weekly review: Check merged PRs count, review any stuck "needs-manual-review" PRs
- Monthly audit: Review auto-merge accuracy, check GitHub Actions usage minutes
- Watch for: Multiple failed pinchtab updates (upstream breaking changes), security audit blocking PRs

## Testing Commands
```bash
# Manually trigger daily workflow
gh workflow run check-pinchtab-daily.yml

# View recent runs
gh run list --workflow=check-pinchtab-daily.yml --limit 10
gh run list --workflow=dependabot-automerge.yml --limit 10

# Watch workflow
gh run watch <run-id>
```
