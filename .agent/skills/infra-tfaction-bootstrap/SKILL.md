---
name: Infrastructure Setup (tfaction-based)
description: Skill for driving Terraform design and implementation with tfaction at the center. Standardizes state splitting, module design, and GitHub Actions integration.
---

# Trigger Conditions

- When performing new builds or configuration changes under `infrastructure/terraform/`
- When adding or updating `.github/workflows/terraform-*.yml`
- When deciding the splitting strategy for environments (dev/stg/prod) or state units
- When documenting Terraform operational rules in docs

# Procedure

1. First, refer to `docs/infra/terraform-tfaction-guidelines.md` to decide state splitting and module boundaries
2. Create `env/<environment>/<state-unit>/` and place the root module
3. Create reusable modules in `modules/` with explicit `type` / `description` / validation
4. Update `target_groups` in `infrastructure/terraform/tfaction.yaml`
5. Update `paths` and tfaction action calls in the plan/apply workflow
6. Ensure `terraform fmt` / `validate` / `tflint` / `trivy` pass in CI

# Implementation Rules

- Manual `terraform apply` to `prod` is prohibited (CI/CD + approval flow is required)
- `terraform_remote_state` should not be used in principle
- `--target` apply is prohibited in `prod`
- Use OIDC for authentication instead of fixed secrets

# Reference Documents

- `docs/infra/terraform-tfaction-guidelines.md` - Terraform design standards based on tfaction
- `docs/infra/tfaction.md` - tfaction configuration and workflows
- `docs/infra/ci-cd.md` - CI/CD and authentication design
- `docs/infra/terraform.md` - Terraform basic conventions
