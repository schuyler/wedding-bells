# Cloudflare Worker Deployment Guide

This document outlines how to deploy and configure the Cloudflare Worker for the Marc With A Sea application.

## Overview

The application uses a Cloudflare Worker to handle audio file uploads. The worker:

1. Receives audio recordings from the frontend
2. Validates the upload token for security
3. Stores the recording in an R2 bucket
4. Returns success response with file metadata

## Environment Setup

### Prerequisites

- Cloudflare account with Workers and R2 enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Login to Cloudflare via Wrangler (`wrangler login`)

### R2 Bucket Setup

1. Create a private R2 bucket named `marc-with-a-sea` in your Cloudflare account:

```bash
wrangler r2 bucket create marc-with-a-sea --no-public-access
```

2. For development, create a private preview bucket:

```bash
wrangler r2 bucket create marc-with-a-sea-dev --no-public-access
```

### R2 Bucket Permissions

1. The buckets are automatically private (not publicly accessible)
   - Only the worker can access the bucket
   - No public read access is configured

2. Worker access to the bucket:
   - The worker automatically gets permissions through the R2 binding in wrangler.jsonc
   - No additional permission configuration is needed for the worker to write to the bucket
   - The bucket binding provides the minimum required permissions (write access)

## Deployment Configuration

### Environment Variables

The Worker uses the following environment variables:

- `ALLOWED_ORIGIN`: The origin allowed to make requests to the worker (CORS)
- `UPLOAD_TOKEN`: Secret token for authenticating upload requests
- `PUBLIC_URL`: Base URL for accessing uploaded files (if public access is enabled)

### Production Deployment

To deploy to production:

1. Set up your production secrets:

```bash
wrangler secret put UPLOAD_TOKEN
```

2. Update environment variables in `wrangler.toml` with production values:

```toml
[vars]
ALLOWED_ORIGIN = "https://marc-with-a-sea.pages.dev"
PUBLIC_URL = "https://marc-with-a-sea.pages.dev"
```

3. Deploy the worker:

```bash
cd worker
npm run deploy
```

### Development Environment

For local development:

1. Start the worker locally:

```bash
cd worker
npm run dev
```

2. The worker will use the development configuration from wrangler.jsonc

## Frontend Configuration

The React application needs to be configured to communicate with the worker. The environment variables must be set in your Cloudflare Pages project settings.

### Setting Environment Variables in Cloudflare Pages

1. Go to the Cloudflare Pages dashboard
2. Select your project (wedding-bells.pages.dev)
3. Go to Settings > Environment variables
4. Add the following environment variables:

#### Production Environment Variables

- `VITE_API_URL`: The URL of your deployed worker (e.g., `https://marc-with-a-sea-worker.example.workers.dev/upload`)
- `VITE_UPLOAD_TOKEN`: The same token used in the worker for authentication
  - Must match the `UPLOAD_TOKEN` secret set in your worker
  - Generate a secure random token (e.g., using `openssl rand -hex 32`)
  - Do not commit this token to the repository
- `VITE_SIMULATE_UPLOAD`: Set to "false" for production

#### Development Environment Variables

- `VITE_API_URL`: Local worker URL (e.g., `http://127.0.0.1:8787/upload`) or deployed dev worker
- `VITE_UPLOAD_TOKEN`: Development token (should match what's in the worker)
- `VITE_SIMULATE_UPLOAD`: Set to "true" to bypass actual API calls during development

### Environment Branch Settings

Since wedding-bells.pages.dev tracks the main branch:
1. Set production variables for the "Production" environment
2. Set development variables for the "Preview" environment (used for branches other than main)
3. Each environment can have different values for VITE_UPLOAD_TOKEN

Note: After changing environment variables, you'll need to trigger a new deployment for the changes to take effect.

## Security Considerations

- Keep the `UPLOAD_TOKEN` secret and use a strong, unique value
- Configure proper CORS settings to only allow requests from your application domain (handled in worker code via getCorsHeaders)
- R2 Bucket Security:
  - Buckets are private by default - only the worker can access them
  - Worker has write-only access through R2 binding
  - Files are not publicly accessible
  - Only authenticated requests via `UPLOAD_TOKEN` can trigger writes
- Use environment-specific tokens for development vs. production

## Security Flow

1. Frontend -> Worker:
   - Frontend includes `UPLOAD_TOKEN` in X-Upload-Token header
   - Request must come from allowed origin (CORS)
   - Uses HTTPS for secure transmission

2. Worker -> R2 Bucket:
   - Worker authenticates request using `UPLOAD_TOKEN`
   - Worker uses R2 binding for secure bucket access
   - Write-only access prevents unauthorized file access

## Troubleshooting

- Check worker logs in Cloudflare dashboard for errors
- Verify CORS settings if the frontend cannot connect
- Confirm environment variables are set correctly
- Review network requests in browser developer tools for error responses
