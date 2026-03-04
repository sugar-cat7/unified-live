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

provider "google" {
  project               = var.project_id
  region                = "asia-northeast1"
  user_project_override = true
}

