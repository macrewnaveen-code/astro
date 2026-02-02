# Astro SSG + ISR-like Setup on Scaleway

## Client Need
- **Static Site Generation (SSG):** Fast, SEO-friendly, CDN-served static pages.
- **Auto-update on CMS change (ISR-like):** When content is updated in Payload CMS, the frontend should update automatically (no manual build/upload).
- **No Vercel lock-in:** Use Scaleway for both static hosting and backend (Payload CMS).

---

## Architecture Overview

1. **Astro SSG**
   - Astro generates static HTML at build time (`npm run build`).
   - Output: `/dist` folder.
2. **Payload CMS**
   - Node.js app, hosted on Scaleway Compute/Serverless.
   - Publicly accessible API for content and webhooks.
3. **Scaleway Object Storage**
   - Hosts the static `/dist` output for global CDN delivery.
4. **Webhook + Build Trigger**
   - Payload CMS sends a webhook to a build trigger endpoint when content changes.
   - The build trigger (Node.js service, CI/CD pipeline, or Scaleway Function) runs `npm run build` and uploads `/dist` to Scaleway Object Storage.

---

## Step-by-Step Setup

### 1. Host Payload CMS on Scaleway
- Deploy your Payload CMS (Node.js) to Scaleway Compute Instance, Container, or Serverless Functions.
- Ensure it is publicly accessible (for API and webhook).
- Set up MongoDB (Scaleway DBaaS or managed MongoDB).

### 2. Astro SSG Project
- Keep `output: 'static'` in `astro.config.mjs`.
- Use `getStaticPaths()` to fetch all slugs from Payload CMS API at build time.

### 3. Scaleway Object Storage
- Create a bucket for static site hosting.
- Enable static website hosting in Scaleway console.
- Note the bucket endpoint URL (for your domain).

### 4. Build Trigger Service (for ISR-like updates)
**Option A: Node.js Webhook Listener**
- Deploy a small Node.js/Express app (on Scaleway Compute/Serverless) with an endpoint (e.g., `/rebuild`).
- When Payload CMS sends a webhook, this service:
  1. Pulls latest code/content (if needed)
  2. Runs `npm run build`
  3. Uploads `/dist` to Scaleway Object Storage (use AWS S3 SDK or Scaleway CLI)

**Option B: CI/CD Pipeline (Recommended)**
- Use GitHub Actions, GitLab CI, or Scaleway Pipelines.
- Configure a webhook in Payload CMS to trigger the pipeline (via repository dispatch or custom endpoint).
- Pipeline steps:
  1. Checkout code
  2. Install dependencies
  3. Run `npm run build`
  4. Upload `/dist` to Scaleway Object Storage

### 5. Payload CMS Webhook Setup
- In Payload CMS admin, add a webhook:
  - On: create, update, delete
  - URL: your build trigger endpoint (Node.js service or CI/CD trigger URL)

### 6. Domain & DNS
- Point your custom domain to the Scaleway Object Storage bucket endpoint.
- Configure HTTPS (via Scaleway or your DNS provider).

---

## Example: Node.js Build Trigger (Webhook Listener)
```js
const express = require('express');
const { exec } = require('child_process');
const AWS = require('aws-sdk'); // or use Scaleway SDK
const app = express();

app.post('/rebuild', (req, res) => {
  exec('npm run build', (err) => {
    if (err) return res.status(500).send('Build failed');
    // Upload /dist to Scaleway Object Storage here
    res.send('Build and deploy started');
  });
});

app.listen(3000);
```

---

## Example: GitHub Actions Workflow
```yaml
name: Astro SSG Build & Deploy
on:
  repository_dispatch:
    types: [payload-cms-update]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install deps
        run: npm ci
      - name: Build Astro
        run: npm run build
      - name: Upload to Scaleway
        run: |
          # Use AWS CLI or Scaleway CLI to sync /dist to bucket
          aws s3 sync ./dist s3://your-bucket-name --endpoint-url https://s3.fr-par.scw.cloud
```

---

## Notes & Best Practices
- **SSG is always used:** All pages are static, fast, and SEO-friendly.
- **ISR-like updates:** Site auto-updates after CMS changes, but not per-page on-demand (full rebuild each time).
- **No Vercel lock-in:** All infra is on Scaleway.
- **Scaleway Functions/Serverless:** Can be used for the build trigger if you want everything on Scaleway.
- **Security:** Protect your build trigger endpoint (secret token, IP allowlist, etc.).

---

## What You Need From Client
- Git repo access (Astro project)
- Scaleway Object Storage credentials
- Scaleway Compute/Serverless access (for Payload CMS and/or build trigger)
- Payload CMS admin access (for webhook setup)
- (Optional) CI/CD platform access (GitHub Actions, etc.)
- Domain/DNS access (if using a custom domain)

---

## References
- [Astro Static Deployment](https://docs.astro.build/en/guides/deploy/static/)
- [Scaleway Object Storage Static Hosting](https://www.scaleway.com/en/docs/storage/object/quickstart/static-website/)
- [Payload CMS Webhooks](https://payloadcms.com/docs/webhooks/overview)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Scaleway Serverless Functions](https://www.scaleway.com/en/serverless/functions/)

---

**This file is your go-to guide for SSG + ISR-like auto-updating Astro sites on Scaleway!**
