# CLAUDE.md for Worker application

This file provides guidance to Claude Code (claude.ai/code) when working with the Worker application of Inkverse. 

## Project Overview

The Worker application handles background processing tasks for Inkverse, including:

- Image processing and optimization
- Feed management and comic imports
- Sitemap generation
- Cache management
- Database migrations

## Key Files and Directories

- `src/scripts/feeds/`: Comic feed processing and imports
- `src/scripts/images/`: Image processing and optimization
- `src/scripts/sitemap/`: Sitemap generation and management
- `src/scripts/cache/`: Cache management operations
- `src/scripts/utils/`: Shared utility functions
- `input/`: Input data for processing jobs
- `output/`: Generated outputs from worker tasks

## Development Commands

```bash
# Install dependencies
yarn install

# Run specific worker scripts
yarn run import-all-comics
yarn run build-sitemap
yarn run audit-images
yarn run db-migrate
```

## Script Categories

### Feed Management

Scripts in `src/scripts/feeds/` handle:
- Importing comics from external sources
- Auditing comic content for compliance
- Processing webhook events from content sources
- Adding new feeds by UUID

### Image Processing

Scripts in `src/scripts/images/` handle:
- Downloading and saving images from external sources
- Building optimized image variants (thumbnails, responsive sizes)
- Processing and validating image metadata

### Sitemap Generation

Scripts in `src/scripts/sitemap/` handle:
- Building XML sitemaps for SEO
- Splitting large sitemaps into manageable chunks
- Uploading sitemaps to storage/CDN

### Cache Management

Scripts in `src/scripts/cache/` handle:
- Invalidating stale cache entries
- Managing cache storage

## External Services

The Worker component interacts with:

- **PostgreSQL**: For storing and retrieving data
- **AWS SQS**: For processing queued tasks
- **Cloudflare R2**: For storing processed assets
- **Taddy API**: For sourcing comic content

## Error Handling

- All scripts should use structured error logging
- Critical errors are reported to Sentry
- Operations log to standard output for Docker log collection

## Common Tasks

### Adding a New Worker Script

1. Create a new script file in the appropriate category directory
2. Ensure proper error handling and logging
3. Update package.json with any new script commands
4. Create or update a Docker configuration if the root directory's docker folder

### Testing Worker Scripts Locally

```bash
# Run a script directly
tsx src/scripts/feeds/import-all-comics.ts
```

## Performance Considerations

- Worker scripts should be designed to be idempotent
- Use batch processing for large datasets
- Implement proper backoff and retry strategies for external service calls