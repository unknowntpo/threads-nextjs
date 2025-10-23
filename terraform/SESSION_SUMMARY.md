---

## ⚠️ Issue Encountered: Cloud Run GHCR Limitation

**Error:** Cloud Run v2 doesn't support GHCR (ghcr.io) images directly.
**Message:** "Expected an image path like [region.]gcr.io, [region-]docker.pkg.dev or docker.io"

**Options to Resolve:**

1. **Option A:** Set up Artifact Registry as remote repository proxy for GHCR (adds complexity)
2. **Option B:** Push images to GCR (gcr.io) - legacy, being deprecated
3. **Option C:** Push images to Artifact Registry (us-east1-docker.pkg.dev) - recommended
4. **Option D:** Push images to Docker Hub (docker.io) - public registry

**Recommended Solution:** Option C - Push to Artifact Registry

- Modern GCP-native solution
- $0.10/GB storage (minimal cost for our use)
- Better integration with Cloud Run
- Can automate in CI/CD

**Current Status:** 43/47 resources created

- ✅ VPC, firewall, NAT created
- ✅ VM created and running
- ✅ All secrets created
- ❌ Cloud Run services failed (image registry issue)

**Next Steps:** Configure Artifact Registry + rebuild images OR use Docker Hub as interim solution.
