# tfaction Workflow

## Overview

**tfaction** is a framework developed by [suzuki-shunsuke](https://github.com/suzuki-shunsuke/tfaction) for building advanced Terraform workflows with GitHub Actions.

### Key Features

- **Plan on PR, Apply on merge**: Executes `terraform plan` on Pull Requests and automatically runs `terraform apply` on merge
- **Monorepo support**: Dynamic build matrix that runs CI only for changed directories
- **Safe apply**: Plan-file-based apply to prevent unintended changes
- **PR comment notifications**: Automatic PR comments with plan results via tfcmt
- **Drift detection**: Periodic drift detection managed as GitHub Issues

```
┌─────────────────────────────────────────────────────────────────┐
│                    tfaction Workflow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Create PR │ →  │  Plan    │ →  │  Review  │ →  │  Merge   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                       │                               │          │
│                       ▼                               ▼          │
│               [Comment plan results       [Automatically run     │
│                on the PR]                  terraform apply]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Files

### tfaction.yaml (Root Configuration)

The tfaction configuration file placed at the project root.

```yaml
# infrastructure/terraform/tfaction.yaml
---
plan_workflow_name: Terraform Plan  # GitHub Actions workflow name (required)

# Update callers when local modules are updated
update_local_path_module_caller:
  enabled: true

# Security scanning
trivy:
  enabled: true

# Linting
tflint:
  enabled: true
  fix: true  # Auto-fix

# Target group definitions
target_groups:
  - working_directory: terraform/env/dev/
    target: my-app/dev/
```

### Key Configuration Items

| Item | Description | Default |
|-----|------|-----------|
| `plan_workflow_name` | Plan workflow file name (required) | - |
| `base_working_directory` | Base path for working directories | `""` |
| `working_directory_file` | Per-target configuration file name | `tfaction.yaml` |
| `terraform_command` | Terraform command (OpenTofu compatible) | `terraform` |
| `draft_pr` | Create PRs as draft | `false` |

### target_groups Configuration

```yaml
target_groups:
  - working_directory: terraform/env/dev/
    target: project-name/dev/

    # GCP authentication settings
    gcp_service_account: sa@project.iam.gserviceaccount.com
    gcp_workload_identity_provider: projects/123/locations/global/...

    # Environment variables
    env:
      TF_VAR_environment: dev

    # For AWS
    # aws_region: ap-northeast-1
    # terraform_plan_config:
    #   aws_assume_role_arn: arn:aws:iam::123:role/terraform-plan
```

### tfaction.yaml (Working Directory)

Placed in each environment's directory to override root configuration.

```yaml
# infrastructure/terraform/env/dev/backend/tfaction.yaml
---
# Per-target settings (optional)
# terraform_command: tofu  # When using OpenTofu
# env:
#   TF_VAR_custom: value
```

---

## Target and Working Directory

### Concepts

- **Target**: Unique identifier for a working directory. Used in PR labels and comments
- **Working Directory**: The actual directory path where Terraform is executed

```yaml
target_groups:
  - target: my-app/dev/        # Target (identifier)
    working_directory: terraform/env/dev/   # Working Directory (path)
```

### Matching Rules

tfaction determines the target group by the `working_directory` prefix.

```yaml
# Example: when terraform/env/dev/backend/ is changed
target_groups:
  - working_directory: terraform/env/dev/    # Matches
    target: project/dev/
  - working_directory: terraform/env/prod/   # Does not match
    target: project/prod/
```

---

## GitHub Actions Workflows

### Terraform Plan Workflow

```yaml
# .github/workflows/terraform-plan-dev.yml
name: Terraform Plan Dev

on:
  pull_request:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
      - .github/workflows/terraform-plan-dev.yml

concurrency:
  group: my-app
  cancel-in-progress: false

permissions:
  id-token: write      # Required for OIDC authentication
  contents: write      # Required for pushing code changes
  pull-requests: write # Required for PR comments

env:
  AQUA_CONFIG: "${{ github.workspace }}/aqua.yaml"
  TFACTION_CONFIG: "${{ github.workspace }}/infrastructure/terraform/tfaction.yaml"

jobs:
  setup:
    name: Set up
    runs-on: ubuntu-latest
    outputs:
      targets: ${{ steps.list-targets.outputs.targets }}
    steps:
      - uses: actions/checkout@v4
      - uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.55.0
      - uses: suzuki-shunsuke/tfaction/list-targets@v1
        id: list-targets

  plan:
    name: Plan (${{ matrix.target.target }})
    needs: setup
    if: join(fromJSON(needs.setup.outputs.targets), '') != ''
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        target: ${{ fromJSON(needs.setup.outputs.targets) }}
    env:
      TFACTION_TARGET: ${{ matrix.target.target }}
      TFACTION_WORKING_DIR: ${{ matrix.target.working_directory }}
      TFACTION_JOB_TYPE: ${{ matrix.target.job_type }}
    steps:
      - uses: actions/checkout@v4

      # Get GitHub App token
      - uses: actions/create-github-app-token@v2
        id: app-token
        with:
          app-id: ${{ secrets.MY_APP_GITHUB_APP_ID }}
          private-key: ${{ secrets.MY_APP_GITHUB_APP_PRIVATE_KEY }}

      # Install tools
      - uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.55.0

      # GCP authentication
      - uses: google-github-actions/auth@v2
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      # tfaction setup
      - uses: suzuki-shunsuke/tfaction/setup@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Test (tflint, trivy, etc.)
      - uses: suzuki-shunsuke/tfaction/test@v1
        continue-on-error: true
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Execute Plan
      - uses: suzuki-shunsuke/tfaction/plan@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}
```

### Terraform Apply Workflow

```yaml
# .github/workflows/terraform-apply-dev.yml
name: Terraform Apply Dev

on:
  push:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'

jobs:
  # ... setup job (same as plan)

  apply:
    name: Apply (${{ matrix.target.target }})
    needs: setup
    env:
      TFACTION_IS_APPLY: "true"  # Enable Apply mode
    steps:
      # ... checkout, auth steps

      - uses: suzuki-shunsuke/tfaction/apply@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Create follow-up PR on Apply failure
      - uses: suzuki-shunsuke/tfaction/create-follow-up-pr@v1
        if: failure()
        with:
          github_token: ${{ steps.app-token.outputs.token }}
```

---

## GCP Authentication Setup

### Workload Identity Federation

Authenticate from GitHub Actions to GCP without secrets.

```hcl
# Workload Identity Pool
resource "google_iam_workload_identity_pool" "gha_pool" {
  workload_identity_pool_id = "github-actions-pool"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "gha_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gha_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # Repository restriction (important)
  attribute_condition = "assertion.repository == 'owner/repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### GitHub Secrets Configuration

| Secret | Description |
|--------|------|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full path of the Workload Identity Provider |
| `GCP_SERVICE_ACCOUNT` | Service account email address |
| `MY_APP_GITHUB_APP_ID` | GitHub App ID |
| `MY_APP_GITHUB_APP_PRIVATE_KEY` | GitHub App private key |

---

## Drift Detection

### Configuration

```yaml
# tfaction.yaml
drift_detection:
  enabled: true
  issue_repo_owner: owner
  issue_repo_name: repo
  num_of_issues: 3              # Maximum concurrent Issues
  minimum_detection_interval: 1  # Minimum detection interval (days)
```

### Behavior

1. Periodically (Scheduled) runs `terraform plan`
2. Creates a GitHub Issue when drift is detected
3. The Issue includes drift details and remediation steps

---

## Module Management

### tfaction_module.yaml

Placed in module directories to register them with tfaction.

```yaml
# infrastructure/terraform/modules/terraform_backend/tfaction_module.yaml
---
# Can be empty. Placing it registers the directory as a module
```

### Version Management

Instead of local modules, tagged GitHub sources are recommended.

```hcl
# Local path (during development)
module "vpc" {
  source = "../../../modules/vpc"
}

# GitHub Source (recommended for production)
module "vpc" {
  source = "git::https://github.com/owner/repo.git//modules/vpc?ref=v1.0.0"
}
```

---

## Best Practices

### Authentication

| Recommendation | Reason |
|-----|------|
| Use GitHub App | Safer than PAT, fine-grained permission control |
| Workload Identity | No secrets required, automatic rotation |

### Tool Management

```yaml
# aqua.yaml
registries:
  - type: standard
    ref: v4.300.0

packages:
  - name: hashicorp/terraform@v1.14.2
  - name: terraform-linters/tflint@v0.54.0
  - name: aquasecurity/trivy@v0.67.2
```

### Security

1. **trivy**: Vulnerability scanning for infrastructure configurations
2. **tflint**: Terraform best practices checking
3. **attribute_condition**: Repository restriction via OIDC

### Operations

| Practice | Description |
|------------|------|
| Review Plan on PR | Review changes before Apply |
| Auto Apply on merge | Eliminate manual Apply |
| Follow-up PR | Automatic remediation PR on Apply failure |
| Drift Detection | Detect and fix manual changes |

---

## References

- [tfaction Official Documentation](https://suzuki-shunsuke.github.io/tfaction/docs/)
- [tfaction GitHub Repository](https://github.com/suzuki-shunsuke/tfaction)
- [tfaction Getting Started](https://github.com/suzuki-shunsuke/tfaction-getting-started)
