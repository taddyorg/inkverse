# CLAUDE.md for GraphQL server

This file provides specific guidance to Claude Code when working with the GraphQL server of Inkverse. 

## Project Overview

The GraphQL server is the centralized API layer for Inkverse, handling all data requests from both the website and mobile app clients.

## Key Files

- `src/server.ts`: Main server entry point
- `src/graphql/index.ts`: GraphQL schema setup
- `src/graphql/*.ts`: Type definitions and resolvers organized by domain
- `src/routes/*.ts`: Express routes for non-GraphQL endpoints
- `src/notion/index.ts`: Integration with Notion CMS

## Development Commands

```bash
# Install dependencies
yarn install

# Development server with hot reload
yarn run dev

# Build for production OR for type checking
yarn run build

# Start production server
yarn run start
```

## GraphQL Structure

- **Schema Organization**: Schema definitions are split by domain (comics, creators, etc.)
- **Resolvers**: Each schema file includes its own resolvers
- **Validation**: Query validation includes depth limiting and complexity analysis
- **Caching**: Uses Redis for server-side caching and Stellate for GraphQL CDN caching

## Security Measures

- **Authentication**: JWT-based authentication using the auth route
- **Rate Limiting**: Implemented at the Express level
- **Query Validation**: Prevents complex queries that could impact performance
- **Required Fields**: Enforces inclusion of specific fields for better caching

## External Services

- **Database**: PostgreSQL connection (via Knex.js)
- **Notion**: Used for content management and documentation
- **Stellate**: GraphQL CDN for caching

## Error Handling

- Centralized error handling with proper error codes
- Integration with Sentry for error tracking
- Custom GraphQL error extensions for client-friendly messages

## Common Tasks

- Adding a new GraphQL type: Create a new file in `src/graphql/` following existing patterns
- Modifying existing schemas: Update the corresponding file in `src/graphql/`
- Adding validation rules: Modify files in `src/graphql/validators/`
- Updating notion integration: Modify `src/notion/index.ts`