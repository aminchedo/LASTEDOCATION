# GitHub Secrets Configuration

## Required Secrets

### Deployment
- `DEPLOY_SSH_KEY`: SSH private key for deployment server
- `SERVER_HOST`: Deployment server hostname/IP
- `SERVER_USER`: SSH user for deployment

### Database
- `DB_PASSWORD`: PostgreSQL password
- `JWT_SECRET`: JWT signing secret (generate with `openssl rand -hex 32`)
- `SESSION_SECRET`: Session secret (generate with `openssl rand -hex 32`)

### Services
- `HF_TOKEN`: HuggingFace API token
- `SENTRY_DSN`: Sentry error tracking DSN (optional)

### Notifications
- `SLACK_WEBHOOK`: Slack webhook URL for notifications (optional)

## How to Set Secrets

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the corresponding value

## Environment-Specific Secrets

For staging/production environments:
1. Go to Settings → Environments
2. Create environment (staging/production)
3. Add environment-specific secrets

## Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate session secret
openssl rand -hex 32

# Generate SSH key for deployment
ssh-keygen -t ed25519 -C "deployment@persian-tts" -f ~/.ssh/persian-tts-deploy
```

## Security Best Practices

1. Never commit secrets to version control
2. Rotate secrets regularly (every 90 days)
3. Use different secrets for different environments
4. Limit secret access to necessary workflows only
5. Use GitHub environment protection rules for production
