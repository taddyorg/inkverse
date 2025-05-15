# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inkverse is a comics platform with multiple components:

- **Website**: React-based web client with SSR
- **Mobile App**: React Native app for iOS and Android
- **GraphQL Server**: Centralized API layer
- **Worker**: Background processing system
- **Cloud**: Cloudflare Workers for edge computing

## Development Commands

### Setup

```bash
# Install dependencies for all packages
yarn install

# Run database migrations
yarn run migrate

# Generate GraphQL types
yarn run graphql-codegen
```

## Architecture

### System Components

Inkverse follows a monorepo structure with yarn workspaces:

1. **Client Applications**:
   - Website (React, React Router 7, Apollo Client, TailwindCSS)
   - Mobile App (React Native with Expo, React Navigation, Apollo Client)

2. **Server Components**:
   - GraphQL Server (Apollo Server, Express, Node.js)
   - Worker (Node.js, TypeScript for background processing)
   - Cloud Services (Cloudflare Workers for edge computing)

3. **Internal Packages**:
   - Public (shared types and constants)
   - Shared-Client (shared client utilities)
   - Shared-Server (shared server utilities)

### Internal Packages Usage Guidelines

When to use each internal package:

- **Public Package** (@inkverse/public):
  - Use for defining shared TypeScript types
  - Store global constants and enums
  - Maintain type consistency across client and server
  - Ideal for data structures that are used in multiple parts of the application

- **Shared-Client Package** (@inkverse/shared-client):
  - Shared codebase for client apps (web & mobile) that ensures consistency and DRY across frontends
  - Centralized GraphQL fragments, queries, mutations, and auto-generated types for type-safe API access
  - Standardized dispatch functions, reducers, and error handlers for state management
  - Data parsing, normalization, and async operation patterns for client-side applications
  - Common helpers for UI consistency (e.g. prettyFormattedDate, link-icons)

- **Shared-Server Package** (@inkverse/shared-server):
  - Core foundation for all backend services (GraphQL API, workers, etc.)
  - CRUD operations for database models
  - Authentication (JWT generation and validation)
  - Caching layer with Redis and CDN cache invalidation
  - Queue management via AWS SQS with retry/dead-letter logic
  - Messaging support including Slack notifications and AWS SES email delivery
  - Cloudflare integration (R2 object storage, CDN, Workers)
  - Taddy API client for comics metadata and webhook processing
  - Utility functions for dates, crypto, logging, and API-safe error responses
  - Handle common server-side operations like logging, error handling

### Data Flow

1. Clients make GraphQL requests to the API layer
2. GraphQL server authenticates, validates requests and accesses database
3. Background tasks are processed asynchronously by the Worker
4. Cloudflare Workers serve optimized assets from the edge

### Key Features

- **Website**: Server-side rendering, SEO optimization, comic viewing
- **Mobile App**: Native comic reader, offline reading, push notifications
- **GraphQL Server**: Schema validation, resolvers, query validation
- **Worker**: Image processing, feed management, sitemap generation
- **Cloud**: Performance-critical edge operations

### Code Patterns

- **State Management**: Reducer pattern with dispatch functions
- **Data Fetching**: Apollo Client with GraphQL
- **Caching**: Apollo Cache (client), Redis (server), Stellate (GraphQL)
- **UI Components**: Modular components organized by feature
- **Error Handling**: Centralized error handling with Sentry

## External Integrations

- **Database**: PostgreSQL with Knex.js
- **Storage**: Cloudflare R2
- **Queues**: AWS SQS
- **CMS**: Notion integration
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Notifications**: Slack API
- **Content Source**: Taddy API and webhooks

## Testing

- There are no tests for this project.

## Linting

- There are no linting rules for this project.

## Deployment

- **Website/GraphQL Server**: Docker containers via AWS Copilot
- **Mobile App**: Expo EAS Build and Updates
- **Worker**: Docker containers for specialized jobs
- **Cloud**: Cloudflare Workers via Wrangler