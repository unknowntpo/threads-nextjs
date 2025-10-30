/**
 * kubectl-setup Module
 *
 * Automatically establishes IAP tunnel and configures kubectl access to k0s cluster.
 * Must run after VM is created and k0s startup script completes.
 */

# Automatically establish kubectl tunnel after VM is ready
# Runs scripts/kubectl-setup.sh to set up IAP tunnel and kubeconfig
resource "null_resource" "kubectl_setup" {
  provisioner "local-exec" {
    command = <<-EOT
      # Wait for VM to be fully ready (startup script completed)
      for i in {1..60}; do
        if gcloud compute ssh ${var.vm_name} \
          --zone=${var.zone} \
          --tunnel-through-iap \
          --command='test -f /var/log/startup-script.log && grep -q "setup complete" /var/log/startup-script.log' 2>/dev/null; then
          echo "VM startup script complete"
          break
        fi
        echo "Waiting for VM startup... attempt $i/60"
        sleep 5
      done

      # Run kubectl setup script from repo root
      cd "${path.root}/.."
      bash scripts/kubectl-setup.sh
    EOT

    environment = {
      ZONE = var.zone
    }
  }

  triggers = {
    vm_name = var.vm_name
    vm_id   = var.vm_id
  }
}
