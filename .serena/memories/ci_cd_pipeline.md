# CI/CD Pipeline — pinchtab-mcp

## Workflows (.github/workflows/)

### ci.yml — Continuous Integration
- Trigger: push/PR to main
- Matrix: Node 22 + 24
- Steps: tsc, lint, test
- Coverage: uploaded to Codecov (Node 22 only) via codecov-action@v5

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
