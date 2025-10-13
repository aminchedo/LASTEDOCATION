# ✅ GitHub Actions Setup Checklist

## 🎯 Initial Setup

### 1. Enable GitHub Actions
- [ ] Go to **Settings → Actions → General**
- [ ] Select "Allow all actions and reusable workflows"
- [ ] Enable "Read and write permissions"
- [ ] Enable "Allow GitHub Actions to create and approve pull requests"

### 2. Configure Secrets
- [ ] Go to **Settings → Secrets and variables → Actions**
- [ ] Add secret: `HF_TOKEN` (HuggingFace API token)
  ```bash
  gh secret set HF_TOKEN --body "hf_your_token_here"
  ```

### 3. Verify Workflows
- [ ] All 5 workflow files exist in `.github/workflows/`
- [ ] YAML syntax is valid for all workflows
- [ ] Workflows appear in Actions tab

### 4. Enable Branch Protection (Optional but Recommended)
- [ ] Go to **Settings → Branches**
- [ ] Add rule for `main` branch
- [ ] Require status checks before merging
- [ ] Select required checks:
  - ✅ CI Success
  - ✅ Backend Build
  - ✅ Frontend Build
  - ✅ Security Scan

## 🧪 Testing Workflows

### Test CI Pipeline
```bash
# Create empty commit to trigger CI
git commit --allow-empty -m "Test: Trigger CI workflow"
git push origin main
```

### Test Docker Build
```bash
# Trigger Docker build workflow
gh workflow run docker-build.yml
```

### Test ML Pipeline
```bash
# Trigger ML pipeline
gh workflow run ml-pipeline-ci.yml
```

### Test Voice E2E
```bash
# Trigger voice tests
gh workflow run voice-e2e-tests.yml
```

## 📊 Verify Success

### Check Workflow Status
```bash
# List recent runs
gh run list --limit 5

# Watch current run
gh run watch
```

### Verify in GitHub UI
- [ ] Go to **Actions** tab
- [ ] All workflows visible
- [ ] Green checkmarks ✅ on successful runs
- [ ] Build artifacts uploaded
- [ ] Security scans completed

## 🔧 Troubleshooting

### Workflows Not Appearing
1. Check file location: `.github/workflows/*.yml`
2. Verify YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('FILE.yml'))"`
3. Ensure GitHub Actions is enabled

### Permission Errors
1. Settings → Actions → General
2. Enable "Read and write permissions"
3. Save changes

### Docker Build Failures
1. Verify Dockerfile exists in `BACKEND/` and `client/`
2. Check Docker build context paths
3. Ensure `GITHUB_TOKEN` has package write access

## ✅ Completion Checklist

- [ ] All 5 workflows created
- [ ] Secrets configured
- [ ] Branch protection enabled
- [ ] Initial workflow run successful
- [ ] Docker images pushed to GHCR
- [ ] Security scans passing
- [ ] Team notified of CI/CD setup

## 🎉 Next Steps

1. Add status badges to README.md
2. Configure Dependabot for automated updates
3. Set up deployment environments (staging, production)
4. Configure notification webhooks (Slack, Discord)
5. Review and customize workflow schedules

---

**Setup Date**: 2025-10-13  
**Documentation**: See `docs/github-actions-workflows.md`
