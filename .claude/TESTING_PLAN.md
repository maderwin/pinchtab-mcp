# Dependency Automation Testing Plan

## Pre-commit Validation

### 1. Verify Workflow Syntax ✓
All workflow files created:
- ✅ `.github/workflows/ci.yml` (modified - added npm audit)
- ✅ `.github/workflows/check-pinchtab-daily.yml` (new)
- ✅ `.github/workflows/dependabot-automerge.yml` (new)

### 2. Local Validation Commands

```bash
# Check workflow syntax (if actionlint installed)
actionlint .github/workflows/*.yml

# Or validate YAML syntax
yamllint .github/workflows/*.yml

# Run full quality check
npm run check
```

---

## Post-commit Testing (GitHub Actions)

### Test 1: Manual Trigger - PinchTab Check (Immediate)

```bash
# After pushing, go to GitHub Actions UI:
# Actions → Check PinchTab Daily → Run workflow → Run workflow

# Expected behavior:
# - Workflow runs
# - Checks current vs latest pinchtab version
# - If same: "✅ PinchTab is up to date"
# - If different: Creates PR with label "pinchtab-update"
```

**Validation:**
- ✅ Workflow completes without errors
- ✅ If update available: PR created with correct title format
- ✅ PR has labels: "dependencies", "pinchtab-update"

---

### Test 2: Dependabot PR Auto-merge (Wait for Dependabot)

**Scenario A: Non-PinchTab dependency update**

1. Wait for Dependabot to create a PR (next Monday if weekly schedule)
2. Check that CI runs automatically
3. If CI passes → workflow should approve and merge automatically
4. If CI fails → PR stays open without auto-merge

**Expected timeline:** Within 20 minutes of CI completion

**Validation:**
- ✅ Auto-merge workflow triggers on PR creation
- ✅ Waits for CI to complete
- ✅ Approves PR when CI passes
- ✅ Merges PR automatically (squash commit)

---

**Scenario B: PinchTab patch/minor update**

1. Manually trigger "Check PinchTab Daily" workflow (if update available)
2. Verify PR is created with "pinchtab-update" label
3. CI runs automatically
4. If CI passes → auto-merge should happen
5. If CI fails → comment added with notification

**Validation:**
- ✅ PR created by daily workflow
- ✅ Auto-merge workflow recognizes "pinchtab-update" label
- ✅ Merges automatically if CI passes (patch/minor)
- ✅ Adds comment + labels if CI fails

---

**Scenario C: PinchTab major update (manual simulation)**

To test this, you'd need to wait for an actual major update, or simulate:

1. Manually create a branch with major version bump in package.json
2. Create PR with title: "chore(deps): bump pinchtab from 1.5.0 to 2.0.0"
3. Add label "pinchtab-update"
4. Observe workflow behavior

**Expected:**
- ✅ Workflow adds label "needs-manual-review"
- ✅ Workflow adds comment explaining major version requires review
- ✅ Auto-merge is SKIPPED

---

### Test 3: CI with Security Audit (Immediate)

```bash
# Create a test PR or push to main
git checkout -b test/ci-audit
# Make trivial change
echo "# test" >> README.md
git add README.md
git commit -m "test: verify CI with npm audit"
git push origin test/ci-audit

# Create PR via GitHub UI or gh CLI
gh pr create --title "test: CI with npm audit" --body "Testing new CI workflow"
```

**Validation:**
- ✅ CI workflow includes "Security audit" step
- ✅ `npm audit --audit-level=moderate` runs
- ✅ CI passes (assuming no vulnerabilities)

---

## Integration Testing Checklist

After all workflows are pushed:

### Week 1 Monitoring

- [ ] **Day 1 (0:00 UTC):** Check if daily workflow runs automatically
- [ ] **Day 2:** Verify no duplicate PRs created
- [ ] **Day 7:** Check Dependabot weekly PRs behavior
- [ ] Monitor GitHub Actions usage (should stay within free tier limits)

### Success Criteria

- ✅ Daily workflow runs without errors (even if no update)
- ✅ At least one auto-merge completes successfully
- ✅ Security audit step appears in all CI runs
- ✅ No false positive auto-merges (major versions blocked)
- ✅ Failed CI properly handled (no auto-merge, notifications sent)

---

## Rollback Procedure

If issues occur:

```bash
# Disable auto-merge
git rm .github/workflows/dependabot-automerge.yml
git commit -m "chore: temporarily disable auto-merge"
git push

# Disable daily checks
git rm .github/workflows/check-pinchtab-daily.yml
git commit -m "chore: temporarily disable daily pinchtab checks"
git push

# Revert CI changes (if needed)
git revert <commit-hash>
git push
```

---

## Monitoring Commands

```bash
# View recent workflow runs
gh run list --workflow=check-pinchtab-daily.yml --limit 10

gh run list --workflow=dependabot-automerge.yml --limit 10

# View specific run details
gh run view <run-id>

# Watch workflow in real-time
gh run watch <run-id>
```

---

## Next Steps After Validation

Once all tests pass:

1. Update project memories with final validation results
2. Update README.md with automation documentation (optional)
3. Monitor for one week to ensure stability
4. Consider documenting lessons learned in spec
