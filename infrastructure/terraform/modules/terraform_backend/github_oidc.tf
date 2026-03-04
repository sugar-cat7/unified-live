# Workload Identity Pool for service account impersonation
resource "google_iam_workload_identity_pool" "my_app_gha_pool" {
  # 6 ~ 30 characters
  workload_identity_pool_id = "my-app-gha-pool"
}

resource "google_iam_workload_identity_pool_provider" "my_app_gha_pool_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.my_app_gha_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = google_iam_workload_identity_pool.my_app_gha_pool.workload_identity_pool_id
  display_name                       = "GitHub Actions"
  description                        = "GitHub Actions Workload Identity Pool Provider"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
  attribute_condition = "assertion.repository == 'your-org/my-app'"
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
