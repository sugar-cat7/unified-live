# Infrastructure CI/CD

## Overview

This project uses GitHub Actions and tfaction to build an infrastructure CI/CD pipeline.
All infrastructure changes are reviewed through Pull Requests and automatically deployed upon merge.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Infrastructure CI/CD Pipeline                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Create PR │ →  │  CI (Plan)    │ →  │ Review   │ →  │ Merge        │  │
│  └──────────┘    └───────────────┘    └──────────┘    └──────────────┘  │
│                         │                                    │           │
│                         ▼                                    ▼           │
│              ┌─────────────────────┐              ┌─────────────────┐   │
│              │ - terraform plan    │              │ CD (Apply)      │   │
│              │ - tflint            │              │ - terraform     │   │
│              │ - trivy scan        │              │   apply         │   │
│              │ - PR comment        │              │ - follow-up PR  │   │
│              └─────────────────────┘              └─────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Configuration

### File List

| File | Trigger | Purpose |
|---------|---------|------|
| `terraform-plan-dev.yml` | PR to `develop` | Plan for dev environment |
| `terraform-apply-dev.yml` | Push to `develop` | Apply for dev environment |
| `terraform-plan-prod.yml` | PR to `main` | Plan for prod environment |
| `terraform-apply-prod.yml` | Push to `main` | Apply for prod environment |

### Trigger Conditions

```yaml
# Plan workflow
on:
  pull_request:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
      - .github/workflows/terraform-plan-dev.yml

# Apply workflow
on:
  push:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
```

---

## CI Workflow (Plan)

### Job Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    terraform-plan-dev.yml                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │   setup      │  Detect changed targets                   │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  plan (dev1) │  │  plan (dev2) │  │  plan (devN) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│   Parallel execution (Matrix Strategy)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Execution Steps

1. **Checkout**: Check out the repository
2. **Tool Install**: Install Terraform, TFLint, Trivy via aqua
3. **GCP Auth**: Authenticate with GCP using Workload Identity
4. **Setup**: Set up tfaction
5. **Test**: Run checks with TFLint and Trivy
6. **Plan**: Execute `terraform plan` and comment the results on the PR

### Required Permissions

```yaml
permissions:
  id-token: write      # OIDC authentication
  contents: write      # Auto-commit (format fixes, etc.)
  pull-requests: write # PR comments
```

### Concurrency Control

```yaml
concurrency:
  group: my-app
  cancel-in-progress: false  # Do not cancel in-progress jobs
```

---

## CD Workflow (Apply)

### Execution Steps

1. **Checkout**: Check out the repository
2. **Tool Install**: Install tools via aqua
3. **GCP Auth**: Authenticate with GCP using Workload Identity
4. **Setup**: Set up tfaction
5. **Apply**: Execute `terraform apply`
6. **Follow-up PR**: Automatically create a remediation PR on Apply failure

### Apply Flag

```yaml
env:
  TFACTION_IS_APPLY: "true"  # Enable Apply mode
```

### Automatic Recovery on Failure

```yaml
- name: Follow up PR
  uses: suzuki-shunsuke/tfaction/create-follow-up-pr@v1
  if: failure()
  with:
    github_token: ${{ steps.app-token.outputs.token }}
```

---

## Environment Isolation

### Branch Strategy

```
main (production)
  ↑
  └── PR (terraform-plan-prod → terraform-apply-prod)

develop (development)
  ↑
  └── PR (terraform-plan-dev → terraform-apply-dev)

feature/*
  └── Development branches
```

### Directory Structure

```
infrastructure/terraform/
├── env/
│   ├── dev/           # Development environment → develop branch
│   ├── staging/       # Staging → staging branch
│   └── prod/          # Production environment → main branch
└── modules/           # Shared modules (used across all environments)
```

### State Isolation

Each environment uses an independent GCS bucket prefix.

```hcl
# dev environment
backend "gcs" {
  bucket = "project-tfstate"
  prefix = "env/dev/terraform_backend"
}

# prod environment
backend "gcs" {
  bucket = "project-tfstate"
  prefix = "env/prod/terraform_backend"
}
```

---

## Security Scanning

### Trivy

Scans infrastructure configurations for vulnerabilities.

```yaml
env:
  TRIVY_SEVERITY: HIGH,CRITICAL
  TRIVY_SKIP_DIRS: ".terraform"
```

#### Detection Targets

- Vulnerabilities in Terraform configurations
- Cloud resource misconfigurations
- Secret exposure

### TFLint

Checks Terraform best practices.

```hcl
# .tflint.hcl
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "google" {
  enabled = true
  version = "0.30.0"
  source  = "github.com/terraform-linters/tflint-ruleset-google"
}

rule "terraform_naming_convention" {
  enabled = true
}
```

### gitleaks (Manual Scan)

Checks for secret leaks.

```bash
# Run locally
gitleaks detect --source . --verbose
```

---

## Tool Management

### aqua.yaml

All CI tools are managed with aqua, with pinned versions.

```yaml
# aqua.yaml
registries:
  - type: standard
    ref: v4.300.0

packages:
  - name: hashicorp/terraform@v1.14.2
  - name: terraform-linters/tflint@v0.54.0
  - name: aquasecurity/trivy@v0.67.2
  - name: terraform-docs/terraform-docs@v0.20.0
  - name: GoogleCloudPlatform/cloud-sdk@534.0.0
  - name: reviewdog/reviewdog@v0.20.3
```

### Version Updates

Managed via automatic updates with Renovate or Dependabot.

```json
// renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchManagers": ["terraform"],
      "groupName": "terraform"
    }
  ]
}
```

---

## Secrets Management

### Required GitHub Secrets

| Secret | Description | How to Configure |
|--------|------|---------|
| `GCP_PROJECT_ID` | GCP project ID | Settings > Secrets |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider path | Obtain from Terraform output |
| `GCP_SERVICE_ACCOUNT` | Service account | Obtain from Terraform output |
| `MY_APP_GITHUB_APP_ID` | GitHub App ID | Obtain from GitHub App settings |
| `MY_APP_GITHUB_APP_PRIVATE_KEY` | GitHub App private key | Obtain from GitHub App settings |

### Environment Configuration

```yaml
jobs:
  plan:
    environment: production  # Uses GitHub Environment
```

By using GitHub Environments:
- Apply deployment protection rules
- Manage environment-specific Secrets
- Add approval workflows

---

## Troubleshooting

### When Plan Fails

1. **Authentication error**: Verify that GCP Secrets are configured correctly
2. **Permission error**: Check the service account permissions
3. **State lock**: Verify that no other jobs are locking the State

### When Apply Fails

1. **Check Follow-up PR**: Review the automatically created PR
2. **Diff from Plan**: Verify that no other changes were merged after the plan
3. **Resource limits**: Check if quotas or limits have been reached

### When Drift Is Detected

1. **Check Issue**: Review drift details in the GitHub Issue
2. **Investigate cause**: Identify manual changes or console operations
3. **Create fix PR**: Fix the Terraform code and create a PR

---

## Summary

| Phase | Action | Tools |
|---------|----------|--------|
| CI (Plan) | Change detection → Lint → Scan → Plan | tfaction, tflint, trivy |
| Review | Review Plan results → Approve | GitHub PR |
| CD (Apply) | Apply → Follow-up PR | tfaction |
| Monitoring | Drift Detection | tfaction |
