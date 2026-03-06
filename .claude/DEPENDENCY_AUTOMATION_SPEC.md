# Dependency Update Automation — Implementation Specification

**Project:** pinchtab-mcp
**Goal:** Maximize automation for dependency updates with minimal manual intervention
**Status:** ✅ Feasible with standard GitHub Actions + Dependabot

---

## Requirements Summary

### Automated Dependency Update Strategy

| Dependency | Check Frequency | Auto-merge Conditions | Failed Checks Handling |
|------------|----------------|----------------------|------------------------|
| **pinchtab** | Daily (0:00 UTC) | CI pass + patch/minor only | Create PR + comment notification |
| **All others** | Weekly | CI pass + any version type | Create PR only |

### Required CI Checks for Auto-merge

1. ✅ **CI tests pass** — tsc, lint, fmt, spell, test, build (Node 20+22)
2. ✅ **Security audit** — `npm audit --audit-level=moderate`
3. ✅ **Version type check** — patch/minor auto-merge, major requires review for pinchtab
4. ✅ **Build verification** — `npm run build` success

---

## Technical Architecture

### Component Overview

```
.github/
├── dependabot.yml                      # Weekly checks for all deps
├── workflows/
│   ├── ci.yml                          # [MODIFY] Add npm audit step
│   ├── check-pinchtab-daily.yml        # [NEW] Daily pinchtab version check
│   └── dependabot-automerge.yml        # [NEW] Auto-merge logic for all PRs
```

### Workflow Details

#### 1. `.github/workflows/ci.yml` (Modify)

**Changes Required:**
- Add security audit step after test step

```yaml
- name: Security audit
  run: npm audit --audit-level=moderate
```

**Purpose:**
- Ensures all PRs (Dependabot and manual) pass security checks
- Blocks auto-merge if moderate/high/critical vulnerabilities found

---

#### 2. `.github/workflows/check-pinchtab-daily.yml` (New)

**Trigger:** Scheduled cron `0 0 * * *` (midnight UTC daily)

**Workflow Steps:**
1. Check npm registry for latest pinchtab version
2. Compare with current version in `package-lock.json`
3. If new version available:
   - Run `npm update pinchtab`
   - Create branch `dependabot/npm_and_yarn/pinchtab-{VERSION}`
   - Commit with message: `chore(deps): bump pinchtab from {OLD} to {NEW}`
   - Create PR with label `dependencies`, `pinchtab-update`
4. Auto-merge logic handled by `dependabot-automerge.yml`

**Key Features:**
- Uses GitHub App token for authentication (triggers CI workflows)
- Creates PRs in Dependabot-compatible format for unified handling
- Respects semver for version comparison

**Exit Scenarios:**
- No new version → skip PR creation
- PR already exists for version → skip duplicate
- CI fails → PR remains open with notification

---

#### 3. `.github/workflows/dependabot-automerge.yml` (New)

**Trigger:** `pull_request_target` events (opened, synchronize, reopened)
**Conditions:** Only runs for PRs from Dependabot or `check-pinchtab-daily.yml`

**Workflow Logic:**

```yaml
jobs:
  automerge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]' || contains(github.event.pull_request.labels.*.name, 'pinchtab-update')
    permissions:
      contents: write
      pull-requests: write

    steps:
      1. Extract dependency metadata (package name, old/new version)
      2. Calculate semver diff (patch/minor/major)
      3. Wait for CI checks to complete (timeout: 15 min)
      4. Evaluate auto-merge eligibility:

         IF package == "pinchtab":
           IF semver_diff == "major":
             → Add label "needs-manual-review"
             → Create comment: "⚠️ Major pinchtab update requires manual review"
             → SKIP auto-merge
           ELSE IF CI passed:
             → Approve PR
             → Enable auto-merge (squash)
           ELSE IF CI failed:
             → Create comment: "❌ PinchTab update failed CI checks. Manual review required."
             → Add label "ci-failed"
             → SKIP auto-merge

         ELSE (other dependencies):
           IF CI passed:
             → Approve PR
             → Enable auto-merge (squash)
           ELSE:
             → SKIP auto-merge (no notification)

      5. Auto-merge executes when all required checks pass
```

**Safety Mechanisms:**
- Runs on `pull_request_target` for secure token access
- Validates PR actor (Dependabot or workflow)
- Respects branch protection rules
- Never force-merges failed CI checks

---

#### 4. `.github/dependabot.yml` (Current Configuration)

**Keep as-is:**
- Weekly schedule for npm and github-actions ecosystems
- Grouped dev/production dependencies
- Conventional commit messages

**Note:** Dependabot handles weekly checks for ALL deps (including pinchtab). The daily workflow provides additional pinchtab monitoring.

---

## Security Considerations

### Auto-merge Safety

1. **Required Status Checks:**
   - CI workflow must pass (tsc, lint, fmt, spell, test, build)
   - Security audit must pass (no moderate+ vulnerabilities)
   - Both Node 20 and 22 matrix jobs must succeed

2. **Version Validation:**
   - Major pinchtab updates blocked from auto-merge
   - All other deps can auto-merge any version if CI passes

3. **GitHub Permissions:**
   - Workflows use minimal required permissions
   - `pull_request_target` for safe secret access
   - Branch protection rules enforced

### Vulnerability Response

- `npm audit` fails CI → blocks auto-merge
- Dependabot security updates take priority (can trigger anytime)
- Manual review required if security issues detected

---

## Implementation Checklist

### Phase 1: Security Enhancement
- [ ] Add `npm audit` step to `.github/workflows/ci.yml`
- [ ] Test CI workflow with audit step
- [ ] Verify audit failures block PR merge

### Phase 2: Daily PinchTab Monitoring
- [ ] Create `.github/workflows/check-pinchtab-daily.yml`
- [ ] Configure GitHub App token (or PAT) for workflow
- [ ] Test manual workflow_dispatch trigger
- [ ] Verify PR creation on pinchtab update

### Phase 3: Auto-merge Logic
- [ ] Create `.github/workflows/dependabot-automerge.yml`
- [ ] Test with existing Dependabot PR (if available)
- [ ] Verify semver diff calculation
- [ ] Validate notification comments on failures
- [ ] Test auto-merge execution on CI pass

### Phase 4: Integration Testing
- [ ] Trigger manual pinchtab update (downgrade → upgrade)
- [ ] Verify daily workflow creates PR
- [ ] Verify auto-merge workflow approves + merges
- [ ] Test failure scenario (break tests, verify no merge)
- [ ] Test major version update (verify manual review required)

### Phase 5: Monitoring & Refinement
- [ ] Monitor first week of automated updates
- [ ] Review notification effectiveness
- [ ] Adjust timing if CI congestion occurs
- [ ] Update spec with lessons learned

---

## Expected Behavior Examples

### Scenario 1: Daily PinchTab Patch Update
1. **00:00 UTC:** Workflow checks npm registry
2. **00:01 UTC:** New patch version detected (1.2.3 → 1.2.4)
3. **00:02 UTC:** PR created with updated `package.json` + `package-lock.json`
4. **00:03 UTC:** CI workflow starts (triggered by PR)
5. **00:10 UTC:** CI passes, auto-merge workflow approves
6. **00:11 UTC:** PR auto-merges (squash commit)
7. **Result:** Fully automated, zero manual intervention ✅

### Scenario 2: PinchTab Major Update with Failing Tests
1. **00:00 UTC:** Workflow detects major version (1.5.0 → 2.0.0)
2. **00:02 UTC:** PR created with label `pinchtab-update`
3. **00:03 UTC:** CI starts
4. **00:10 UTC:** Tests fail due to breaking changes
5. **00:11 UTC:** Auto-merge workflow adds comment:
   ```
   ⚠️ Major pinchtab update (1.5.0 → 2.0.0) requires manual review.

   CI Status: ❌ Failed
   - Tests failed: 3 breaking changes detected
   - Review required before merge
   ```
6. **00:11 UTC:** Label `needs-manual-review` + `ci-failed` added
7. **Result:** Developer notified via GitHub, manual review required ⚠️

### Scenario 3: Weekly Dependabot Update (Other Deps)
1. **Monday 00:00 UTC:** Dependabot checks dependencies
2. **Monday 00:05 UTC:** Multiple PRs created (grouped dev deps)
3. **Monday 00:06 UTC:** CI workflows start for each PR
4. **Monday 00:15 UTC:** All CIs pass
5. **Monday 00:16 UTC:** Auto-merge approves all PRs
6. **Monday 00:20 UTC:** All PRs merged automatically
7. **Result:** Fully automated weekly maintenance ✅

---

## Maintenance & Monitoring

### Weekly Review (Optional)
- Check merged PRs count
- Review any PRs stuck in `needs-manual-review`
- Monitor CI execution times (adjust schedule if needed)

### Monthly Audit
- Review auto-merge accuracy (false positives/negatives)
- Check GitHub Actions usage minutes
- Update workflow versions (actions/checkout, etc.)

### Alerts to Watch For
- Multiple failed pinchtab updates in a row → upstream breaking changes
- Security audit blocking PRs → vulnerability in dependencies
- CI timeouts → need to optimize test suite

---

## Success Metrics

**Automation Goals:**
- ✅ 95%+ dependency updates require zero manual intervention
- ✅ PinchTab updates merged within 24 hours of release (if CI passes)
- ✅ Security vulnerabilities blocked automatically
- ✅ Major updates flagged for review before merge

**Developer Time Saved:**
- Before: ~30 min/week reviewing dependency PRs
- After: ~5 min/month reviewing flagged major updates
- **Savings:** ~90% reduction in manual dependency management

---

## Rollback Plan

If automation causes issues:

1. **Disable auto-merge:** Delete `.github/workflows/dependabot-automerge.yml`
2. **Disable daily checks:** Pause `.github/workflows/check-pinchtab-daily.yml`
3. **Revert to manual:** Keep Dependabot PRs, merge manually

All changes are non-destructive and reversible.

---

## References

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub Actions Auto-merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
- [Semantic Versioning](https://semver.org/)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)

---

**Specification Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Ready for implementation
