# CLAUDE.md for Shared Server package

## Project Overview

The Shared Server package (`@inkverse/shared-server`) is the foundation layer for all server-side functionality in Inkverse. It provides common utilities, database access, caching mechanisms, and external integration points shared across backend services including the GraphQL server and worker services.

## Development Commands

```bash
# Install dependencies
yarn install

# Build the package
yarn run build

# Run database migrations
yarn run migrate

# List available migrations
yarn run migrate:list

# Rollback migrations
yarn run migrate:rollback
```

## Core Components

### Data Models

The package provides object-relational mappings for database entities with standardized business logic:

- **ComicSeries**: Series management and metadata
- **ComicIssue**: Individual comic issue operations
- **ComicStory**: Story content management
- **Creator**: Creator profiles and information
- **CreatorContent**: Relationship between creators and content
- **UUIDLookup**: Global unique identifier handling across entities
- **Common**: Shared operations for all entities

Each model provides methods for:
- CRUD operations (get, add, update, delete)
- Data validation and transformation
- Transaction management
- Relationship handling

### Database Layer

The database layer provides:

- **Connection Management**: Centralized Knex.js configuration
- **Migrations**: Schema management via versioned migration files
- **Type Definitions**: TypeScript interfaces for database entities
- **Query Building**: Reusable query patterns and utilities

Each migration defines schema changes like:
```typescript
await knex.schema.createTable('comicseries', (table) => {
  table.bigIncrements('id', { primaryKey: false });
  table.uuid('uuid').primary();
  table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
  // Additional fields...
});
```

### knex and knex-stringcase

For the database layer, we use knex and knex-stringcase. Stringcase is useful to use camelCase for the database column names.

e.g.) In the database, the column name is google_id, but in the code, we use googleId.

```typescript
import { database } from "../database/index.js";
static async getUserByGoogleId(googleId: string): Promise<UserModel | null> {
   return await database("users")
   .where({ googleId })
   .first('*');
}
```

### Caching Layer

The cache module provides:

- **Redis Integration**: In-memory cache client
- **CDN Cache Management**: Purging and invalidation of cached content
- **Cache Keys**: Standardized cache key generation
- **Cache Policies**: TTL management for different data types

Key operations include:
- `purgeCacheOnCdn()`: Invalidate specific content on CDN
- `purgeApiCache()`: Clear GraphQL API cache
- `purgeWebsiteCache()`: Clear website cache

### Messaging

The messaging module handles notifications and email:

- **Slack Integration**: Send notifications to different Slack channels
- **Email Templates**: Standardized email templates
- **AWS SES**: Email delivery via AWS SES

### Queue Management

The queue module provides:

- **SQS Integration**: AWS SQS client for reliable message queuing
- **Queue Creation**: Tools to create new queues
- **Message Processing**: Standard patterns for receiving and processing messages
- **Error Handling**: Retry and dead-letter mechanisms

### Cloudflare Integration

The Cloudflare module handles:

- **R2 Storage**: Object storage integration
- **CDN Management**: Edge caching and distribution control
- **Workers**: Integration with Cloudflare Workers

### Taddy Integration

The Taddy module provides:

- **API Client**: GraphQL client for Taddy API
- **Webhook Processing**: Handle events from Taddy
- **GraphQL Query Templates**: Pre-defined GraphQL queries for comics data

### Utilities

The utilities module includes:

- **Error Handling**: Error capture and reporting to Sentry
- **Authentication**: JWT token management
- **Date Formatting**: Standardized date handling
- **Crypto**: Encryption and hashing utilities

## Integration Patterns

### Database Access Pattern

```typescript
import { database } from '@inkverse/shared-server/database';
import { ComicSeries } from '@inkverse/shared-server/models';

// Direct database access
const results = await database('comicseries')
  .where({ status: 'published' })
  .limit(10);

// Model-based access
const series = await ComicSeries.getComicSeriesByUuid('series-uuid-here');
```

### Cache Management Pattern

```typescript
import { purgeCacheOnCdn } from '@inkverse/shared-server/cache';

// After updating a comic series
await purgeCacheOnCdn({
  type: 'comicseries',
  id: 'series-uuid',
  shortUrl: 'series-short-url'
});
```

### Error Handling Pattern

```typescript
import { getSafeError, captureRemoteError } from '@inkverse/shared-server/utils/errors';

try {
  // Operation that might fail
} catch (error) {
  // Log to Sentry but return safe message to client
  throw getSafeError(error, 'Failed to process request');
}
```

### Message Queue Pattern

```typescript
import { receiveMessages } from '@inkverse/shared-server/queues';

// Process queue messages
await receiveMessages({
  queueUrl: process.env.QUEUE_URL,
  handler: async (message) => {
    // Process the message
  }
});
```

## External Integrations

The shared-server package connects to several external services:

- **PostgreSQL**: Primary data store
- **Redis**: In-memory caching
- **AWS SQS**: Message queuing
- **AWS SES**: Email delivery
- **Cloudflare R2**: Object storage
- **Cloudflare CDN**: Content delivery
- **Taddy API**: Comics data source
- **Slack API**: Internal notifications
- **Sentry**: Error tracking

## Best Practices

1. **Database Operations**:
   - Use transactions for multi-step operations
   - Validate input data before database operations
   - Use the models rather than direct database access where possible

2. **Error Handling**:
   - Always wrap external API calls in try/catch
   - Use `getSafeError()` to sanitize errors for client responses
   - Log detailed errors to Sentry

3. **Cache Management**:
   - Always purge relevant caches after data modifications
   - Use appropriate cache types for different content
   - Be aware of cache dependencies

4. **Environment Variables**:
   - Access environment variables through the dotenv setup
   - Provide fallbacks for non-critical configuration

5. **TypeScript**:
   - Leverage TypeScript interfaces for database models
   - When a migration is added, update the database/types.ts file to include the new or updated tables and columns
   - Define precise return types for functions
   - Use enums for constrained values

## Common Issues

1. **Database Connection Issues**:
   - Check PostgreSQL connection string in `.env`
   - Verify network connectivity to the database
   - Ensure required database migrations have been run

2. **Cache Purging Problems**:
   - Verify Cloudflare API token has appropriate permissions
   - Check Stellate API token for GraphQL cache purging
   - Ensure correct cache types are being used

3. **Queue Processing**:
   - Verify AWS credentials and region
   - Check SQS queue URL and permissions
   - Monitor for queue backlog or message retention issues

4. **Taddy API Issues**:
   - Verify Taddy API credentials
   - Check for rate limiting or API changes
   - Handle network timeouts appropriately

5. **TypeScript Build Errors**:
   - Run `yarn build` to identify type issues
   - Ensure dependencies are installed correctly
   - Check for circular dependencies between modules

6. **Importing from the shared server package**:
   - When importing from the shared server package, the `src` directory is ignored and not needed. ex) Use '@inkverse/shared-server/database' instead of '@inkverse/shared-server/src/database'