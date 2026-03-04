# Terraform Best Practices

## Overview

This project uses **Terraform** to manage Google Cloud Platform (GCP) infrastructure.
With Infrastructure as Code (IaC), infrastructure changes are tracked in Git and safely deployed through the review process.

For details on tfaction-based operational standards and design decisions, see:

- `docs/infra/terraform-tfaction-guidelines.md`

## Directory Structure

```
infrastructure/terraform/
├── tfaction.yaml              # tfaction root configuration
├── .tflint.hcl                # TFLint configuration
├── env/                       # Environment-specific settings
│   ├── dev/                   # Development environment
│   │   └── backend/           # Terraform backend settings
│   │       ├── main.tf        # Module invocations
│   │       ├── provider.tf    # Provider settings
│   │       ├── variable.tf    # Variable definitions
│   │       ├── outputs.tf     # Output definitions
│   │       └── tfaction.yaml  # tfaction per-target settings
│   ├── staging/               # Staging environment
│   └── prod/                  # Production environment
└── modules/                   # Reusable modules
    └── terraform_backend/     # Terraform backend module
        ├── terraform.tf       # Service account settings
        ├── github_oidc.tf     # GitHub OIDC settings
        ├── state_bucket.tf    # State bucket settings
        ├── variable.tf        # Variable definitions
        ├── outputs.tf         # Output definitions
        └── tfaction_module.yaml
```

### Structural Principles

- **modules/**: Reusable infrastructure components
- **env/**: Root modules per environment (dev/staging/prod)
- Each environment has an independent State, with no cross-environment impact

---

## File Naming Conventions

### Standard File Structure

| File Name | Purpose |
|-----------|------|
| `main.tf` | Resource definitions, module invocations |
| `provider.tf` | Provider and backend settings |
| `variables.tf` | Variable declarations |
| `outputs.tf` | Output value definitions |
| `versions.tf` | Terraform/provider version constraints |

### Resource Naming

Use **underscore-separated** names for resources.

```hcl
# Good: underscore-separated
resource "google_storage_bucket" "terraform_state" {
  name = "my-project-tfstate"  # hyphens are OK in the name argument
}

resource "google_service_account" "github_actions_sa" {
  account_id = "gha-terraform-sa"
}

# Bad: hyphen-separated (resource names)
resource "google_storage_bucket" "terraform-state" {  # NG
  ...
}
```

### Keep Resource Names Concise

When the resource type already makes the intent clear, avoid including redundant information in the name.

```hcl
# Good: simple name
resource "google_storage_bucket" "state" { ... }

# Bad: redundant
resource "google_storage_bucket" "state_bucket" { ... }  # NG: "bucket" is redundant
```

---

## Module Design

### Module Structure

```
modules/
└── terraform_backend/
    ├── main.tf           # Main resources (or feature-specific files)
    ├── variables.tf      # Input variables
    ├── outputs.tf        # Output values
    └── README.md         # Module documentation (optional)
```

### Module Invocation

Use relative paths to call modules.

```hcl
# env/dev/backend/main.tf
module "terraform_backend" {
  source     = "../../../modules/terraform_backend"
  project_id = var.project_id
}
```

### Design Principles

1. **Single responsibility**: Each module focuses on one function
2. **Input variables**: Parameterize all configurable values
3. **Output values**: Export values that other modules or resources reference
4. **Pin versions**: Pin versions for external modules

```hcl
# For external modules
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"  # Pin version
  ...
}
```

---

## State Management

### Remote State Configuration

State is managed using GCS (Google Cloud Storage).

```hcl
# provider.tf
terraform {
  required_version = "1.14.2"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.13.0"
    }
  }

  backend "gcs" {
    bucket = "my-app-tfstate"
    prefix = "env/dev/terraform_backend"
  }
}
```

### State Bucket Configuration

```hcl
resource "google_storage_bucket" "state" {
  name          = "my-app-tfstate"
  force_destroy = false
  location      = "asia-northeast1"
  storage_class = "STANDARD"

  # Security settings
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # Versioning (protection against accidental deletion)
  versioning {
    enabled = true
  }

  # Lifecycle (auto-delete old versions)
  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }
}
```

### State Isolation Best Practices

| Rule | Reason |
|-------|------|
| Isolate State per environment | dev changes do not affect prod |
| Keep under 100 resources | Faster refresh, reduced blast radius |
| Group related resources | Split State at logical boundaries |

---

## Variables and Outputs

### Variable Definitions

```hcl
# variables.tf
variable "project_id" {
  type        = string
  description = "The GCP project ID"
}

variable "region" {
  type        = string
  description = "The GCP region for resources"
  default     = "asia-northeast1"
}

variable "disk_size_gb" {
  type        = number
  description = "Disk size in gigabytes"
  default     = 100
}

variable "enable_public_access" {
  type        = bool
  description = "Whether to enable public access"
  default     = false
}
```

### Variable Naming Conventions

| Pattern | Example | Description |
|---------|-----|------|
| Unit suffix | `disk_size_gb`, `timeout_seconds` | Make units explicit |
| Positive boolean | `enable_*`, `is_*`, `has_*` | Avoid double negatives |
| Description required | `description = "..."` | Add description to all variables |

### Output Definitions

```hcl
# outputs.tf
output "workload_identity_pool_name" {
  value       = google_iam_workload_identity_pool.gha_pool.name
  description = "Full resource name of the GitHub Actions Workload Identity Pool."
}

output "service_account_email" {
  value       = google_service_account.gha_terraform_sa.email
  description = "Email of the GitHub Actions Service Account."
}
```

---

## Security

### GitHub Actions OIDC Authentication

Workload Identity Federation enables secret-free authentication to GCP.

```hcl
# Workload Identity Pool
resource "google_iam_workload_identity_pool" "gha_pool" {
  workload_identity_pool_id = "github-actions-pool"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "gha_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gha_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"
  display_name                       = "GitHub Actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # Restrict to specific repository
  attribute_condition = "assertion.repository == 'owner/repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### Principle of Least Privilege

Grant only the minimum necessary permissions to service accounts.

```hcl
# Service account for GitHub Actions
resource "google_service_account" "gha_terraform_sa" {
  account_id   = "gha-terraform-sa"
  display_name = "GitHub Actions Terraform SA"
}

# Grant only required permissions
resource "google_project_iam_member" "terraform_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.gha_terraform_sa.email}"
}
```

### Data Protection

Set `prevent_destroy` on stateful resources.

```hcl
resource "google_sql_database_instance" "main" {
  name = "main-db"

  lifecycle {
    prevent_destroy = true  # Prevent accidental deletion
  }
}
```

---

## Linting & Validation

### TFLint Configuration

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

### How to Run

```bash
# TFLint
tflint --init
tflint

# Terraform Validate
terraform validate

# Trivy (security scan)
trivy config --severity HIGH,CRITICAL .
```

### Automated Checks in CI

The following are automatically executed in the tfaction workflow:

1. `terraform fmt` - Format check
2. `terraform validate` - Syntax check
3. `tflint` - Best practices check
4. `trivy` - Security scan

---

## Summary

| Category | Best Practice |
|---------|-------------------|
| Structure | Separate modules/ and env/ |
| Naming | Underscore-separated, concise names |
| State | Isolated per environment, under 100 resources |
| Variables | Description required, unit suffixes |
| Security | OIDC authentication, least privilege, prevent_destroy |
| Quality | Automated checks with TFLint + Trivy |
