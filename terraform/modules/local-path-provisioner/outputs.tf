output "storage_class_name" {
  description = "Name of the local-path storage class"
  value       = kubernetes_storage_class.local_path.metadata[0].name
}
