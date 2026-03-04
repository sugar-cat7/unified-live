# Service account required for running Terraform via GitHub Actions
resource "google_service_account" "my_app_gha_terraform_sa" {
  account_id   = "my-app-gha-tf-sa"
  display_name = "my-app-gha-terraform-sa"
  description  = "GitHub Actions Service Account for My App Terraform"
}

resource "google_service_account_iam_member" "my_app_gha_terraform_sa_member" {
  service_account_id = google_service_account.my_app_gha_terraform_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.my_app_gha_pool.name}/*"
}

resource "google_project_iam_member" "my_app_gha_terraform_sa_project_member_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.my_app_gha_terraform_sa.email}"
}

resource "google_project_iam_member" "my_app_gha_terraform_sa_project_member_project_iam_admin" {
  project = var.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = "serviceAccount:${google_service_account.my_app_gha_terraform_sa.email}"
}

resource "google_project_iam_member" "my_app_gha_terraform_sa_project_member_service_account_admin" {
  project = var.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.my_app_gha_terraform_sa.email}"
}

resource "google_project_iam_member" "my_app_gha_terraform_sa_project_member_artifactregistry_admin" {
  project = var.project_id
  role    = "roles/artifactregistry.admin"
  member  = "serviceAccount:${google_service_account.my_app_gha_terraform_sa.email}"
}
