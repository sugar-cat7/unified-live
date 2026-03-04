output "workload_identity_pool_name" {
  value       = google_iam_workload_identity_pool.my_app_gha_pool.name
  description = "Full resource name of the GitHub Actions Workload Identity Pool."
}

output "service_account_email" {
  value       = google_service_account.my_app_gha_terraform_sa.email
  description = "Email of the GitHub Actions Service Account."
}

