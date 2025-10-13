# Docker Build Fix Summary

## Issue
The Docker buildx command was failing with the following error:
```
ERROR: failed to build: invalid tag "ghcr.io/aminchedo/lastedocation/client:-c11836f": invalid reference format
```

## Root Cause
The tag generation was creating a tag with a leading hyphen (`-c11836f`), which is invalid for Docker tags. Docker tags cannot start with a hyphen or period.

The problematic tag format was:
```
ghcr.io/aminchedo/lastedocation/client:-c11836f
```

## Solution
Created a new GitHub Actions workflow file (`.github/workflows/docker-build.yaml`) with proper tag formatting using the `docker/metadata-action@v5`.

### Key Fix
Instead of generating tags that might have a leading hyphen, the workflow now uses:

```yaml
tags: |
  type=ref,event=pr,prefix=pr-
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=semver,pattern={{major}}.{{minor}}
  # Use 'sha-' prefix to avoid leading hyphen
  type=sha,prefix=sha-,format=short
  type=raw,value=latest,enable={{is_default_branch}}
```

This ensures the SHA-based tag will be formatted as:
```
ghcr.io/aminchedo/lastedocation/client:sha-c11836f  ✅ Valid
```

Instead of:
```
ghcr.io/aminchedo/lastedocation/client:-c11836f  ❌ Invalid
```

## Features Implemented

### 1. Client Image Build
- **Context**: `./client`
- **Dockerfile**: `./client/Dockerfile`
- **Multi-platform**: `linux/amd64`, `linux/arm64`
- **Caching**: GitHub Actions cache with `mode=max`
- **Provenance**: Build attestation for supply chain security

### 2. Backend Image Build
- **Context**: `./BACKEND`
- **Dockerfile**: `./BACKEND/Dockerfile`
- **Multi-platform**: `linux/amd64`, `linux/arm64`
- **Caching**: GitHub Actions cache with `mode=max`
- **Provenance**: Build attestation for supply chain security

### 3. Tag Strategy
For Pull Requests (e.g., PR #35):
- `pr-35`
- `sha-c11836f`

For branches:
- Branch name (e.g., `main`, `develop`)
- `sha-<commit>`

For main branch:
- `latest`
- `sha-<commit>`

For tagged releases:
- `v1.2.3`
- `v1.2`
- `sha-<commit>`

### 4. Security Features
- **SLSA Provenance**: Automated build attestation
- **Supply Chain Security**: Verifiable build process
- **Multi-platform Support**: Better compatibility
- **Layer Caching**: Faster builds

## Usage

### Automatic Builds
The workflow runs automatically on:
- Pushes to `main`, `develop`, or `cursor/**` branches
- Pull requests to `main` or `develop`

### Manual Build (Local Testing)
```bash
# Build client image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/aminchedo/lastedocation/client:local \
  --file ./client/Dockerfile \
  ./client

# Build backend image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/aminchedo/lastedocation/backend:local \
  --file ./BACKEND/Dockerfile \
  ./BACKEND
```

### Pull Images
```bash
# Pull client image (from PR #35)
docker pull ghcr.io/aminchedo/lastedocation/client:pr-35

# Pull latest client image
docker pull ghcr.io/aminchedo/lastedocation/client:latest
```

## Workflow File Location
`.github/workflows/docker-build.yaml`

## Required Permissions
The workflow needs the following permissions (already configured):
- `contents: read` - Read repository contents
- `packages: write` - Push to GitHub Container Registry
- `id-token: write` - Generate attestations
- `attestations: write` - Write build provenance

## Next Steps
1. Push this branch to trigger the workflow
2. Verify the build succeeds in GitHub Actions
3. Check the generated images in GitHub Container Registry
4. Merge to main when tests pass

## Related Files
- `.github/workflows/docker-build.yaml` - New workflow file
- `client/Dockerfile` - Client image definition
- `BACKEND/Dockerfile` - Backend image definition
- `docker-compose.yml` - Local development setup

## References
- [Docker Metadata Action](https://github.com/docker/metadata-action)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Attestations](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds)
