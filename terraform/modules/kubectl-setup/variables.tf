variable "vm_name" {
  description = "Name of the VM instance running k0s"
  type        = string
}

variable "vm_id" {
  description = "ID of the VM instance (for triggering setup on VM changes)"
  type        = string
}

variable "zone" {
  description = "GCP zone where the VM is located"
  type        = string
}
