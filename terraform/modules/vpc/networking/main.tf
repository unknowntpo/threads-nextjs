/**
 * Networking Module
 *
 * Creates VPC, subnet, firewall rules, and Cloud NAT for the infrastructure.
 */

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "threads-${var.env}-vpc"
  auto_create_subnetworks = false
  description             = "VPC network for Threads Next.js application"
}

# Subnet in us-east1 (free tier eligible)
resource "google_compute_subnetwork" "subnet" {
  name          = "threads-${var.env}-subnet"
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.0.0/24"
  description   = "Subnet for VM and Cloud Run connectors"

  # Enable private Google access for Cloud APIs
  private_ip_google_access = true
}

# Firewall rule: Allow internal communication within VPC
resource "google_compute_firewall" "allow_internal" {
  name    = "threads-${var.env}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/24"]
  description   = "Allow all internal traffic within VPC"
}

# Firewall rule: Allow SSH and k8s API from IAP (Identity-Aware Proxy)
resource "google_compute_firewall" "allow_iap" {
  name    = "threads-${var.env}-allow-iap"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22", "6443"]  # SSH and k8s API
  }

  # IAP IP ranges for tunneling
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["ssh"]
  description   = "Allow SSH and k8s API access via Identity-Aware Proxy"
}

# Cloud Router for Cloud NAT
resource "google_compute_router" "router" {
  name    = "threads-${var.env}-router"
  region  = var.region
  network = google_compute_network.vpc.id

  description = "Router for Cloud NAT"
}

# Cloud NAT for VM egress (allows VM to pull Docker images, etc.)
resource "google_compute_router_nat" "nat" {
  name   = "threads-${var.env}-nat"
  router = google_compute_router.router.name
  region = var.region

  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
