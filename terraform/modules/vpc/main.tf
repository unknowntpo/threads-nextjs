/**
 * VPC Module
 *
 * Manages VPC infrastructure: GCP APIs, networking, compute resources.
 */

# Enable required GCP APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "vpcaccess.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iamcredentials.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
  project            = var.project_id
}

# Networking module - VPC, subnets, firewall rules
module "networking" {
  source = "./networking"

  project_id = var.project_id
  region     = var.region
  env        = var.env

  depends_on = [google_project_service.required_apis]
}

# Compute module: k0s cluster on compute engine
module "compute" {
  source = "./compute"

  project_id = var.project_id
  region     = var.region
  zone       = var.zone
  env        = var.env

  network_name    = module.networking.network_name
  subnet_name     = module.networking.subnet_name

  snapshot_name        = var.snapshot_name
  use_latest_snapshot  = var.use_latest_snapshot

  depends_on = [module.networking]
}
