# CLAUDE.md for Cloud Services

This file provides guidance to Claude Code (claude.ai/code) when working with the cloud services in this repository.

## Component Overview

The `/cloud` directory contains Inkverse's Cloudflare Workers-based edge computing services. These lightweight, serverless functions run on Cloudflare's global network to provide low-latency operations closer to users.

Currently implemented workers:
- **ink-sitemaps**: Edge delivery worker for sitemap files

## Key Files and Directories

- `/cloud`
  - `README.md`: Basic setup and usage instructions
  - `/docs`: Documentation for cloud services
    - `architecture.md`: Overall architecture with diagrams
  - `/ink-sitemaps`: Sitemap delivery worker
    - `src/index.ts`: Main worker code
    - `wrangler.jsonc`: Worker configuration
    - `package.json`: Dependencies and scripts
    - `/test`: Test files using Vitest

## Development Commands

```bash
# Install Cloudflare Wrangler CLI
brew install wrangler

# Login to Cloudflare
wrangler login

# Run a worker locally (from worker directory)
cd cloud/ink-sitemaps
yarn run dev  # alias for wrangler dev

# Run tests
yarn test

# Deploy to production
yarn run deploy  # alias for wrangler deploy

# Generate TypeScript types for Cloudflare bindings
yarn cf-typegen
```

## Architecture and Patterns

### Edge Computing Model

Cloudflare Workers run on Cloudflare's edge network, distributed across 300+ locations worldwide. These workers:

1. Receive incoming requests
2. Process them close to the user
3. Return responses with minimal latency
4. Can access Cloudflare services (R2, KV, Durable Objects, etc.)

### Request Handling

Workers use a fetch handler pattern:
```typescript
export default {
  async fetch(request, env, ctx): Promise<Response> {
    // Process request and return response
  }
}
```

Key concepts:
- `request`: The incoming HTTP request
- `env`: Environment bindings (R2 buckets, KV namespaces, secrets)
- `ctx`: Context with utilities like waitUntil()
- Return value: A Response object

### Error Handling

Workers should implement proper error handling to prevent service disruptions:
```typescript
try {
  // Process request
} catch (error) {
  console.error('Error:', error);
  return new Response('Error processing request', { status: 500 });
}
```

### Caching Strategy

Workers often implement caching to reduce origin load:
```typescript
return new Response(content, {
  headers: {
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=86400',
  }
});
```

## Current Workers

### ink-sitemaps

Purpose: Deliver sitemap XML files from the edge to improve performance and reduce origin load.

Key functionality:
- Intercepts requests to `/sitemap/*` paths
- Fetches sitemap content from origin
- Serves it with appropriate headers and caching
- Handles errors gracefully

## Integration Points

Cloud workers have these integration points:
- **Origin Servers**: Workers can fetch from Inkverse's origin servers
- **External APIs**: Can call external services when needed
- **Cloudflare Services**: May use R2, KV, Durable Objects, etc.

Workers do NOT have direct access to Inkverse's internal systems (databases, etc.).

## Performance Considerations

1. **Memory Usage**: Workers have a 128MB memory limit
2. **CPU Time**: Limited execution time (50ms CPU time on free plan)
3. **Bandwidth**: Consider data transfer costs
4. **Cold Starts**: First invocation may be slower

## Deployment Process

1. Ensure you're logged in to Cloudflare: `wrangler login`
2. Navigate to the worker directory: `cd cloud/ink-sitemaps`
3. Deploy: `yarn run deploy`

## Troubleshooting

Common issues:
- **401 Unauthorized**: Run `wrangler login` again
- **Missing Bindings**: Check wrangler.jsonc for proper configuration
- **Deployment Errors**: Verify Cloudflare permissions and worker configuration
- **Type Errors**: Run `yarn cf-typegen` to update typing

## Future Development Guidelines

When creating new workers:
1. Create a new directory in `/cloud`
2. Use the Wrangler CLI: `wrangler init my-new-worker`
3. Configure properly in wrangler.jsonc
4. Document in this CLAUDE.md file
5. Add comprehensive tests

## Security Best Practices

1. Use Cloudflare secrets for sensitive data: `wrangler secret put MY_SECRET`
2. Validate all input data
3. Implement proper CORS headers when needed
4. Consider rate limiting for public endpoints