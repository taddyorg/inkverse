# CLAUDE.md - Shared Client

This file provides guidance to Claude Code when working with the Shared Client package in this repository.

## Package Overview

The Shared Client package (`@inkverse/shared-client`) provides common functionality shared between client applications, including the website and mobile app. It centralizes GraphQL operations, dispatch functions, and utility methods to ensure consistency across different client platforms.

## Development Commands

```bash
# Build the package
yarn build

# Install dependencies
yarn install
```

## Core Components

### 1. GraphQL Operations

The `src/graphql` directory contains shared GraphQL operations used across client applications:

- **Fragments** (`src/graphql/fragments/`): Reusable GraphQL fragments that define common data structures like `ComicIssueDetails`, `ComicSeriesDetails`, `CreatorDetails`, etc.
- **Queries** (`src/graphql/queries/`): GraphQL queries for data fetching (e.g., `GetComicIssue.graphql`, `GetCreator.graphql`)
- **Mutations** (`src/graphql/mutations/`): GraphQL mutations for data modification (e.g., `ReportComicSeries.graphql`)
- **Operations** (`src/graphql/operations.ts`): Auto-generated file containing GraphQL operations and TypeScript types
- **Types** (`src/graphql/types.ts`): Auto-generated TypeScript types from the GraphQL schema

### 2. Dispatch Functions

The `src/dispatch` directory contains client-side data management functions following a TypeScript-first approach:

- **Action Type Enums**: Strongly typed action constants using TypeScript enums
- **Action Creators**: Async functions that fetch data and optionally dispatch actions
- **Reducers**: Pure functions that handle state updates based on dispatched actions
- **Data Parsing**: Type-safe utilities to parse and normalize API responses
- **Dual Support**: Functions work with or without dispatch for flexibility

Key features of the new pattern:
- **TypeScript-first**: Full type safety with enums, interfaces, and union types
- **Optional dispatch**: Action creators return data directly and dispatch is optional
- **Granular loading states**: Separate loading states for different operations
- **Error handling**: Built-in error state management in reducers

Example dispatch pattern:
```typescript
// Action type enum
export enum ComicIssueActionType {
  GET_COMICISSUE_START = 'GET_COMICISSUE_START',
  GET_COMICISSUE_SUCCESS = 'GET_COMICISSUE_SUCCESS',
  GET_COMICISSUE_ERROR = 'GET_COMICISSUE_ERROR',
}

// Action types union
export type ComicIssueAction =
  | { type: ComicIssueActionType.GET_COMICISSUE_START }
  | { type: ComicIssueActionType.GET_COMICISSUE_SUCCESS; payload: ComicIssueLoaderData }
  | { type: ComicIssueActionType.GET_COMICISSUE_ERROR; payload: string }

// State type
export type ComicIssueLoaderData = {
  isComicIssueLoading: boolean;
  comicissue: ComicIssue | null;
  comicseries: ComicSeries | null;
  allIssues: ComicIssue[];
};

// Action creator with optional dispatch
export async function loadComicIssue(
  { publicClient, issueUuid, seriesUuid, forceRefresh = false }: GetComicIssueProps,
  dispatch?: Dispatch<ComicIssueAction>
): Promise<ComicIssueLoaderData | null> {
  if (dispatch) dispatch({ type: ComicIssueActionType.GET_COMICISSUE_START });

  try {
    const result = await publicClient.query<GetComicIssueQuery>({
      query: GetComicIssue,
      variables: { issueUuid, seriesUuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    const parsedData = parseLoaderComicIssue(result.data);

    if (dispatch) {
      dispatch({ 
        type: ComicIssueActionType.GET_COMICISSUE_SUCCESS, 
        payload: parsedData 
      });
    }
    
    return parsedData;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to load comic issue';
    
    if (dispatch) {
      dispatch({ 
        type: ComicIssueActionType.GET_COMICISSUE_ERROR, 
        payload: errorMessage 
      });
    }
    return null;
  }
}

// Reducer
export function comicIssueQueryReducer(
  state: ComicIssueLoaderData = comicIssueInitialState,
  action: ComicIssueAction
): ComicIssueLoaderData {
  switch (action.type) {
    case ComicIssueActionType.GET_COMICISSUE_START:
      return { ...state, isComicIssueLoading: true };
    case ComicIssueActionType.GET_COMICISSUE_SUCCESS:
      return { ...state, ...action.payload, isComicIssueLoading: false };
    case ComicIssueActionType.GET_COMICISSUE_ERROR:
      return { ...state, isComicIssueLoading: false };
    default:
      return state;
  }
}
```

### 3. Utilities

The `src/utils` directory contains shared utility functions:

- **Date Formatting** (`date.ts`): Functions for formatting dates consistently across the application
- **Link Icons** (`link-icons.ts`): Utilities for managing social and external link icons

## Integration Pattern

The shared client package is imported by client applications (website and mobile) and used as follows:

1. **Import Dispatch Functions**:
   ```typescript
   import { loadComicIssue, comicIssueReducer } from '@inkverse/shared-client/dispatch/comicissue';
   ```

2. **Use GraphQL Operations**:
   ```typescript
   import { GetComicIssue, GetComicSeriesQuery } from '@inkverse/shared-client/graphql/operations';
   ```

3. **Use Utility Functions**:
   ```typescript
   import { prettyFormattedDate } from '@inkverse/shared-client/utils/date';
   ```

## Key TypeScript Types

The package provides many TypeScript types for consistent type checking across applications:

- GraphQL query and mutation types (e.g., `GetComicIssueQuery`, `ReportComicSeriesMutation`)
- GraphQL fragment types (e.g., `ComicIssueDetailsFragment`)
- Enum types (e.g., `ContentRating`, `Genre`, `Language`, `LinkType`)
- State types for reducers (e.g., `ComicIssueLoaderData`)

## Best Practices

1. **Type Safety**:
   - Always leverage TypeScript types for better static analysis
   - Use GraphQL generated types for API interactions

2. **Code Organization**:
   - Keep GraphQL fragments modular and reusable
   - Follow the established pattern for dispatch functions
   - Keep utilities focused and well-tested

3. **Changes and Updates**:
   - When updating GraphQL operations, be mindful that multiple clients depend on them
   - When changing dispatch patterns, update all consumers
   - Consider backward compatibility when modifying APIs

4. **Performance**:
   - Be mindful of bundle size impacts when adding new dependencies
   - Optimize GraphQL queries to request only needed fields
   - Consider memoization for expensive operations

## Common Issues and Solutions

1. **GraphQL Type Generation**:
   - If GraphQL types are out of date, ensure the GraphQL code generator has been run
   - Check for schema changes that might affect type generation

2. **Dispatch Function Errors**:
   - Ensure Apollo Client is properly initialized in the consuming application
   - Check error handling pattern implementation

3. **Build Issues**:
   - Run `yarn build` to regenerate the dist folder
   - Check for TypeScript errors in the source files

4. **Importing from the shared client package**:
   - When importing from the shared client package, the `src` directory is ignored and not needed. ex) Use '@inkverse/shared-client/dispatch/comicissue' instead of '@inkverse/shared-client/src/dispatch/comicissue'