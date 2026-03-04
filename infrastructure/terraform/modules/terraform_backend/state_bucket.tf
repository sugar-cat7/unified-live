# Cloud Storage for Remote State
resource "google_storage_bucket" "state" {
  name          = "my-app-tfstate"
  force_destroy = false
  location      = "asia-northeast1"
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }
  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }
}
