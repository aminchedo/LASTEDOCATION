# 🚀 GitHub Actions Quick Reference

## 📊 Workflow Status

<!-- Replace YOUR_USERNAME and YOUR_REPO with actual values -->

[![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci-cd-pipeline.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci-cd-pipeline.yml)
[![Docker Build](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/docker-build.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/docker-build.yml)
[![ML Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ml-pipeline-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ml-pipeline-ci.yml)
[![Voice E2E](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/voice-e2e-tests.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/voice-e2e-tests.yml)

---

## ⚡ Quick Commands

### View Workflows
```bash
# List all workflows
gh workflow list

# View workflow runs
gh run list

# Watch latest run
gh run watch
```

### Trigger Workflows
```bash
# Main CI
gh workflow run ci.yml

# Full CI/CD to staging
gh workflow run ci-cd-pipeline.yml -f environment=staging

# Full CI/CD to production
gh workflow run ci-cd-pipeline.yml -f environment=production

# Docker builds
gh workflow run docker-build.yml

# ML Pipeline
gh workflow run ml-pipeline-ci.yml

# Voice E2E tests
gh workflow run voice-e2e-tests.yml
```

### View Logs
```bash
# View latest run
gh run view

# View specific run with logs
gh run view RUN_ID --log

# View failed jobs
gh run view --log-failed
```

---

## 🎯 Workflow Triggers

| Workflow | Auto Trigger | Manual | Scheduled |
|----------|--------------|--------|-----------|
| `ci.yml` | ✅ Push/PR to main/develop | ✅ | ❌ |
| `ci-cd-pipeline.yml` | ✅ Push to main, tags | ✅ | ❌ |
| `docker-build.yml` | ✅ Push/PR/tags | ❌ | ❌ |
| `ml-pipeline-ci.yml` | ✅ Changes to models/ | ✅ | ❌ |
| `voice-e2e-tests.yml` | ✅ Changes to TTS services | ✅ | ✅ Daily 2 AM |

---

## 🔐 Required Secrets

Configure in: **Settings → Secrets and variables → Actions**

```bash
# Add HuggingFace token
gh secret set HF_TOKEN --body "hf_your_token_here"

# List all secrets
gh secret list
```

---

## 🏗️ Workflow Jobs Overview

### CI Pipeline (`ci.yml`)
```
backend-lint ────────┐
backend-typecheck ───┤
frontend-lint ───────┼──► build-verification ──► security-scan ──► ci-success
frontend-typecheck ──┤
backend-tests ───────┤
frontend-tests ──────┘
```

### CI/CD Pipeline (`ci-cd-pipeline.yml`)
```
checklist-validation ──► comprehensive-tests ──┬──► deploy ──► post-deployment
                                               │
                                               ├──► performance-tests
                                               │
                                               └──► security-audit
```

### Docker Build (`docker-build.yml`)
```
build-backend ──┐
                ├──► scan-images ──► notify
build-frontend ─┘
```

### ML Pipeline (`ml-pipeline-ci.yml`)
```
validate-models ──────────┐
test-huggingface ─────────┤
test-model-performance ───┼──► ml-pipeline-success
validate-datasets ────────┤
check-compatibility ──────┘
```

### Voice E2E (`voice-e2e-tests.yml`)
```
setup-environment ──► test-tts-synthesis ──┐
                      test-persian-language ┼──► e2e-integration ──► voice-tests-success
                      test-model-inference ─┤
                      test-audio-quality ───┘
```

---

## 📦 Artifacts Generated

| Workflow | Artifact | Retention | Description |
|----------|----------|-----------|-------------|
| ci.yml | `backend-dist` | 7 days | Built backend code |
| ci.yml | `frontend-dist` | 7 days | Built frontend code |
| voice-e2e-tests.yml | `test-audio-samples` | 7 days | Persian audio test samples |
| ci-cd-pipeline.yml | Coverage reports | Until run deleted | Code coverage data |
| docker-build.yml | Docker images | Indefinite | GHCR container images |

---

## 🐛 Troubleshooting Checklist

### ❌ Workflow Failed

1. **Check workflow logs**
   ```bash
   gh run view --log-failed
   ```

2. **Common failures and fixes:**

   | Error | Solution |
   |-------|----------|
   | `npm ci` failed | Delete `node_modules`, verify `package-lock.json` |
   | `TypeScript errors` | Run `npm run build` locally first |
   | `Test failures` | Check service dependencies (PostgreSQL, Redis) |
   | `Docker build failed` | Verify Dockerfile syntax and context |
   | `Permission denied` | Enable "Read and write" in Actions settings |

3. **Re-run failed jobs**
   ```bash
   gh run rerun RUN_ID --failed
   ```

### 🔄 Re-run Workflows

```bash
# Re-run entire workflow
gh run rerun RUN_ID

# Re-run only failed jobs
gh run rerun RUN_ID --failed

# Re-run with debug logging
gh run rerun RUN_ID --debug
```

---

## 📈 Performance Tips

### Faster Builds
- ✅ Dependencies are cached automatically
- ✅ Docker layers are cached in GHCR
- ✅ Jobs run in parallel when possible

### Optimization Strategies
1. **Use build cache**: Already configured for npm and Docker
2. **Skip unnecessary jobs**: Use path filters in triggers
3. **Parallel execution**: Independent jobs run simultaneously
4. **Conditional steps**: Use `if:` to skip optional steps

---

## ✅ Pre-merge Checklist

Before merging PRs, ensure:

- [ ] CI Pipeline passes (green ✅)
- [ ] All linting checks pass
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass
- [ ] Security scan shows no critical issues
- [ ] Build artifacts are generated successfully

---

## 🔒 Security Best Practices

1. **Never commit secrets** to repository
2. **Use GitHub Secrets** for sensitive data
3. **Review Trivy scan results** before deployment
4. **Keep dependencies updated** (Dependabot enabled)
5. **Enable branch protection** rules on main
6. **Require status checks** before merging
7. **Review security alerts** in Security tab

---

## 📞 Support

For workflow issues:
1. Check workflow logs: `gh run view --log`
2. Review [full documentation](./github-actions-workflows.md)
3. Check [GitHub Actions status](https://www.githubstatus.com/)
4. Open issue with workflow run URL

---

## 🔄 Workflow Updates

To update workflows:

1. Edit files in `.github/workflows/`
2. Test changes on a branch
3. Verify YAML syntax:
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/FILE.yml'))"
   ```
4. Create PR and review changes
5. Merge after approval

---

## 📊 Monitoring

### Key Metrics to Track
- ⏱️ Workflow execution time
- 📊 Test pass rate
- 🔒 Security vulnerabilities found
- 🐳 Docker image sizes
- 📦 Build artifact sizes

### View Insights
```bash
# View workflow timing
gh run list --workflow=ci.yml --limit 10

# View all runs today
gh run list --created "$(date +%Y-%m-%d)"
```

---

**Last Updated**: 2025-10-13  
**Version**: 1.0.0
