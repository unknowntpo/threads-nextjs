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