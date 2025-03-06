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

1. Create an R2 bucket named `marc-with-a-sea` in your Cloudflare account:

```bash
wrangler r2 bucket create marc-with-a-sea
```

2. For development, create a preview bucket:

```bash
wrangler r2 bucket create marc-with-a-sea-dev
```

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

The React application needs to be configured to communicate with the worker. Set the following environment variables in your Cloudflare Pages project:

### Production Environment Variables

- `VITE_API_URL`: The URL of your deployed worker (e.g., `https://marc-with-a-sea-worker.example.workers.dev/upload`)
- `VITE_UPLOAD_TOKEN`: The same token used in the worker for authentication
- `VITE_SIMULATE_UPLOAD`: Set to "false" for production

### Development Environment Variables

- `VITE_API_URL`: Local worker URL (e.g., `http://127.0.0.1:8787/upload`) or deployed dev worker
- `VITE_UPLOAD_TOKEN`: Development token (should match what's in the worker)
- `VITE_SIMULATE_UPLOAD`: Set to "true" to bypass actual API calls during development

## Security Considerations

- Keep the `UPLOAD_TOKEN` secret and use a strong, unique value
- Configure proper CORS settings to only allow requests from your application domain
- Review R2 bucket permissions to ensure files are not publicly accessible unless intended
- Use environment-specific tokens for development vs. production

## Troubleshooting

- Check worker logs in Cloudflare dashboard for errors
- Verify CORS settings if the frontend cannot connect
- Confirm environment variables are set correctly
- Review network requests in browser developer tools for error responses