output "workload_identity_pool_name" {
  value       = module.terraform_backend.workload_identity_pool_name
  description = "Full resource name of the GitHub Actions Workload Identity Pool."
}

