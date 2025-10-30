output "threads_namespace" {
  description = "Threads application namespace name"
  value       = kubernetes_namespace.threads.metadata[0].name
}
