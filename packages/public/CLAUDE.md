# CLAUDE.md - Public package

This file provides guidance to Claude Code (claude.ai/code) when working with the @inkverse/public package.

## Package Overview

The Public package (`/packages/public`) is a shared library that provides TypeScript types, constants, and utilities across all Inkverse applications. It acts as a single source of truth for GraphQL data structures, type definitions, and common utilities used by both frontend and backend applications.

## Development Commands

```bash
# Install dependencies
yarn install

# Build the package
yarn build

# Generate GraphQL types
yarn graphql-codegen
```

## Core Components

### GraphQL Types

The package centralizes all GraphQL type definitions using GraphQL Code Generator. These types are automatically generated from the GraphQL schema and provide strongly-typed interfaces for all GraphQL operations across applications.

Key types include:
- `ComicSeries`: Comic series details and metadata
- `ComicIssue`: Individual comic issue information
- `ComicStory`: Comic story components within issues
- `Creator`: Creator/author information
- `List`: Curated lists of comics

### Apollo Configuration

The package provides standard Apollo Client configuration for consistent caching behavior:

1. **Type Policies**: Defines key fields for proper cache normalization
   ```typescript
   // From apollo.ts
   export const typePolicies = {
     ComicSeries: {
       keyFields: ["uuid"],
     },
     ComicIssue: {
       keyFields: ["uuid"]
     },
     // other entities...
   }
   ```

2. **Default Options**: Standard fetch policy settings
   ```typescript
   export const defaultOptions = {
     watchQuery: {
       fetchPolicy: 'no-cache',
       errorPolicy: 'ignore',
     },
     query: {
       fetchPolicy: 'no-cache',
       errorPolicy: 'all',
     },
   };
   ```

### Utility Functions

The package provides helper functions for common operations like image URL generation:

```typescript
// Example from comicseries.ts
export const getCoverImageUrl = ({ coverImageAsString, variant = 'medium' }: GetCoverImageUrlProps): string | undefined => {
  try {
    if (!coverImageAsString) { throw new Error('getCoverImageUrl - coverImageAsString is null'); }
  
    const coverImage = JSON.parse(coverImageAsString) as Record<string, string>;
    const baseUrl = coverImage['base_url'];
    const imagePath = coverImage[ComicSeriesImageType.COVER + `_${variantMap[variant]}`];

    if (!baseUrl || !imagePath) { throw new Error('getCoverImageUrl - baseUrl or imagePath is null'); }

    return baseUrl + imagePath;
  } catch (error) {
    console.error('Error parsing coverImageAsString', error);
    return undefined;
  }
};
```

### Enums & Constants

Standardized enumerations for data consistency across applications:

- Content types and status indicators
- Geographic locations (countries)
- Languages 
- Content ratings and genres
- Link types (social media, websites)

## Usage Patterns

### Importing Types

```typescript
import type { ComicSeries, Creator, Genre, ContentRating } from "@inkverse/public";

// Type-safe comic series object
const series: ComicSeries = {
  uuid: "1234",
  name: "Example Comic",
  // ...other properties
};
```

### Using Apollo Configuration

```typescript
import { typePolicies, defaultOptions } from "@inkverse/public";

// Configure Apollo Client
const apolloClient = new ApolloClient({
  cache: new InMemoryCache({ typePolicies }),
  defaultOptions
});
```

### Using Utility Functions

```typescript
import { getCoverImageUrl, getBannerImageUrl } from "@inkverse/public";

// Get URL for comic cover image
const coverUrl = getCoverImageUrl({ 
  coverImageAsString: comicSeries.coverImageAsString,
  variant: 'large'
});
```

## Best Practices

1. **Type Safety**: Always use the provided types for GraphQL operations to ensure type safety.

2. **Cache Management**: Respect the type policies when configuring Apollo Client to maintain consistent cache behavior.

3. **Update Process**: When the GraphQL schema changes, regenerate types using the `graphql-codegen` command to keep types in sync.

4. **New Utilities**: When adding new utility functions, ensure they follow existing patterns and maintain error handling.

5. **Reuse Existing Types**: Avoid creating duplicate type definitions that already exist in this package.

## Common Issues

1. **Type Generation**: If you encounter issues with type generation, ensure the GraphQL server is running and accessible at the URL specified in `codegen.ts`.

2. **Parsing Errors**: The image URL utilities handle JSON parsing errors, but may log errors if data is malformed. Check error logs if images aren't loading.

3. **Type Incompatibility**: When GraphQL schema changes, ensure you rebuild this package to update the types before using them in other packages.

4. **Importing from the public package**:
   - When importing from the public package, the `src` directory is ignored and not needed. ex) Use '@inkverse/public/comicissue' instead of '@inkverse/public/src/comicissue'