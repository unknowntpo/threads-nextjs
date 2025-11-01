/**
 * Local Path Provisioner Module
 *
 * Installs Rancher's local-path-provisioner for dynamic local storage provisioning.
 * Required for PersistentVolumeClaims in single-node k8s clusters.
 */

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

# Deploy local-path-provisioner using kubernetes provider
resource "kubernetes_manifest" "local_path_provisioner_namespace" {
  manifest = {
    apiVersion = "v1"
    kind       = "Namespace"
    metadata = {
      name = "local-path-storage"
    }
  }
}

resource "kubernetes_manifest" "local_path_provisioner_sa" {
  manifest = {
    apiVersion = "v1"
    kind       = "ServiceAccount"
    metadata = {
      name      = "local-path-provisioner-service-account"
      namespace = "local-path-storage"
    }
  }

  depends_on = [kubernetes_manifest.local_path_provisioner_namespace]
}

resource "kubernetes_manifest" "local_path_provisioner_clusterrole" {
  manifest = {
    apiVersion = "rbac.authorization.k8s.io/v1"
    kind       = "ClusterRole"
    metadata = {
      name = "local-path-provisioner-role"
    }
    rules = [
      {
        apiGroups = [""]
        resources = ["nodes", "persistentvolumeclaims", "configmaps"]
        verbs     = ["get", "list", "watch"]
      },
      {
        apiGroups = [""]
        resources = ["endpoints", "persistentvolumes", "pods"]
        verbs     = ["*"]
      },
      {
        apiGroups = [""]
        resources = ["events"]
        verbs     = ["create", "patch"]
      },
      {
        apiGroups = ["storage.k8s.io"]
        resources = ["storageclasses"]
        verbs     = ["get", "list", "watch"]
      }
    ]
  }
}

resource "kubernetes_manifest" "local_path_provisioner_clusterrolebinding" {
  manifest = {
    apiVersion = "rbac.authorization.k8s.io/v1"
    kind       = "ClusterRoleBinding"
    metadata = {
      name = "local-path-provisioner-bind"
    }
    roleRef = {
      apiGroup = "rbac.authorization.k8s.io"
      kind     = "ClusterRole"
      name     = "local-path-provisioner-role"
    }
    subjects = [
      {
        kind      = "ServiceAccount"
        name      = "local-path-provisioner-service-account"
        namespace = "local-path-storage"
      }
    ]
  }

  depends_on = [
    kubernetes_manifest.local_path_provisioner_clusterrole,
    kubernetes_manifest.local_path_provisioner_sa
  ]
}

resource "kubernetes_manifest" "local_path_provisioner_deployment" {
  manifest = {
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = "local-path-provisioner"
      namespace = "local-path-storage"
    }
    spec = {
      replicas = 1
      selector = {
        matchLabels = {
          app = "local-path-provisioner"
        }
      }
      template = {
        metadata = {
          labels = {
            app = "local-path-provisioner"
          }
        }
        spec = {
          serviceAccountName = "local-path-provisioner-service-account"
          containers = [
            {
              name  = "local-path-provisioner"
              image = "rancher/local-path-provisioner:v0.0.28"
              imagePullPolicy = "IfNotPresent"
              command = [
                "local-path-provisioner",
                "--debug",
                "start",
                "--config",
                "/etc/config/config.json"
              ]
              volumeMounts = [
                {
                  name      = "config-volume"
                  mountPath = "/etc/config/"
                }
              ]
              env = [
                {
                  name = "POD_NAMESPACE"
                  valueFrom = {
                    fieldRef = {
                      fieldPath = "metadata.namespace"
                    }
                  }
                }
              ]
            }
          ]
          volumes = [
            {
              name = "config-volume"
              configMap = {
                name = "local-path-config"
              }
            }
          ]
        }
      }
    }
  }

  depends_on = [
    kubernetes_manifest.local_path_provisioner_sa,
    kubernetes_config_map.local_path_config
  ]
}

resource "kubernetes_config_map" "local_path_config" {
  metadata {
    name      = "local-path-config"
    namespace = "local-path-storage"
  }

  data = {
    "config.json" = jsonencode({
      nodePathMap = [
        {
          node  = "DEFAULT_PATH_FOR_NON_LISTED_NODES"
          paths = ["/opt/local-path-provisioner"]
        }
      ]
    })
    "setup" = <<-EOT
      #!/bin/sh
      set -eu
      mkdir -m 0777 -p "$VOL_DIR"
    EOT
    "teardown" = <<-EOT
      #!/bin/sh
      set -eu
      rm -rf "$VOL_DIR"
    EOT
    "helperPod.yaml" = <<-EOT
      apiVersion: v1
      kind: Pod
      metadata:
        name: helper-pod
      spec:
        containers:
        - name: helper-pod
          image: busybox:latest
          imagePullPolicy: IfNotPresent
    EOT
  }

  depends_on = [kubernetes_manifest.local_path_provisioner_namespace]
}

resource "kubernetes_storage_class" "local_path" {
  metadata {
    name = "local-path"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "true"
    }
  }

  storage_provisioner = "rancher.io/local-path"
  reclaim_policy      = "Delete"
  volume_binding_mode = "WaitForFirstConsumer"
}
