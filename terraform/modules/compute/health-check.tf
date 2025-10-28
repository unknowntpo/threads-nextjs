# Health check for k0s API server
resource "google_compute_health_check" "k0s_api" {
  name                = "threads-${var.env}-k0s-health"
  check_interval_sec  = 60
  timeout_sec         = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3

  tcp_health_check {
    port = "6443" # k0s API server port
  }
}

# HTTP health check for general VM health
resource "google_compute_health_check" "vm_http" {
  name                = "threads-${var.env}-vm-http-health"
  check_interval_sec  = 30
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3

  http_health_check {
    port         = "3000" # NextJS port
    request_path = "/api/healthz"
  }
}
