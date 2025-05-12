# Shared Client Architecture
The Shared Client package (`/packages/shared-client`) is an internal package that provides common functionality shared between client applications, including the website and mobile app. It centralizes GraphQL operations, dispatch functions, and utility methods to ensure consistency across different client platforms.

## Shared Client Architecture Overview

```mermaid
graph TD
    direction TB
    
    %% Client Applications
    Website["Website (React)"]
    Mobile["Mobile App (React Native)"]
    
    %% Shared Client Package
    subgraph SharedClientPackage [Shared Client Package]
        GraphQLOps[GraphQL Operations]
        Dispatch[Dispatch Functions]
        Utils[Utilities]
        
        GraphQLOps --> Fragments[Fragments]
        GraphQLOps --> Queries[Queries]
        GraphQLOps --> Mutations[Mutations]
        GraphQLOps --> Types[TypeScript Types]
    end
    
    %% External Systems
    GQLServer[GraphQL Server]
    
    %% Relationships
    Website --> SharedClientPackage
    Mobile --> SharedClientPackage
    Mutations --> GQLServer
    Queries --> GQLServer
    
    %% Styles
    style GraphQLOps fill:#9e3a8a,stroke:#dd7bc8
    style Dispatch fill:#3a8a9e,stroke:#7bc8dd
    style Utils fill:#3a8f4a,stroke:#7bd08f
    style Website fill:#6b8fcc,stroke:#a9c9ff
    style Mobile fill:#6b8fcc,stroke:#a9c9ff
    style GQLServer fill:#b36b24,stroke:#ff9e57
```

### Tech Stack
- **Language**: TypeScript
- **GraphQL Client**: Apollo Client (integration with client applications)
- **Code Generation**: GraphQL Code Generator for type-safe operations

### Directory Structure
```
/packages/shared-client
  /docs            # Documentation for this application
  /src
    /graphql
      /fragments     # Reusable GraphQL fragments
      /queries       # GraphQL query operations
      /mutations     # GraphQL mutation operations
      codegen.ts     # GraphQL code generation configuration
      operations.ts  # Generated GraphQL operations
      types.ts       # Generated TypeScript types
    /dispatch        # Client-side data management and operations
      comicissue.ts
      comicseries.ts
      comicslist.ts
      creator.ts
      homefeed.ts
      list.ts
      reports.ts
      search.ts
      utils.ts       # Dispatch-specific utilities
    /utils
      # Shared utility functions
      date.ts
      link-icons.ts
  /dist            # Compiled TypeScript code (can be ignored)
```

### Core Features

#### GraphQL Operations
- **Fragments**: Reusable GraphQL fragments for common data structures
- **Queries**: Shared GraphQL queries for data fetching
- **Mutations**: Shared GraphQL mutations for data modification
- **Type Definitions**: Auto-generated TypeScript types from GraphQL schema

#### Dispatch Functions
- **Data Management**: Functions for managing client-side data
- **API Integration**: Standardized methods for interacting with the GraphQL server
- **State Handling**: Common logic for handling application state changes

#### Utilities
 - **Link Icons**: Shared link icon utilities for consistent UI elements

### Data Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant Dispatch as Dispatch Functions
    participant GraphQLOps as GraphQL Operations
    participant GQLServer as GraphQL Server

    Client->>Dispatch: Invoke action
    Dispatch->>GraphQLOps: Execute query/mutation
    GraphQLOps->>GQLServer: Send request
    GQLServer->>GraphQLOps: Return response
    GraphQLOps->>Dispatch: Process data
    Dispatch->>Client: Update UI state
```

### Integration with Client Applications

The shared-client package is imported by client applications (website and mobile) to leverage common functionality:

- **Type Safety**: Provides consistent TypeScript types across platforms
- **Code Reuse**: Prevents duplication of GraphQL operations and business logic
- **Maintainability**: Centralizes changes to data structures and operations 