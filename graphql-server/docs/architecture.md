# GraphQL Server Architecture
The GraphQL Server (`/graphql-server`) serves as the centralized API layer for Inkverse, handling all data requests from client applications. It processes all GraphQL queries and mutations, providing a unified interface for data access and manipulation across the platform.

## GraphQL Server Architecture Overview

```mermaid
graph TD
    direction TB
    
    %% Client Applications
    Website["Website (React)"]
    Mobile["Mobile App (React Native)"]
    
    %% Stellate Cache Layer
    Stellate["Stellate Cache"]
    
    %% GraphQL Server and its components
    subgraph GraphQLServer [GraphQL Server]
        Apollo[Apollo Server]
        TypeDefs[Type Definitions]
        Validators[Query Validators]
        Auth[Authentication]
        
        Apollo --> Resolvers
        Apollo --> TypeDefs
        Apollo --> Validators
        Auth --> Apollo
    end
    
    %% External Systems
    DB[(Database)]
    Cache[(Cache)]
    Worker[Worker Service]
    ThirdParty[Third-Party APIs]
    
    %% Shared Packages
    subgraph SharedPackages [Shared Packages]
        PkgSharedServer[shared-server]
        PkgPublic[public]
    end
    
    %% External Relationships
    Website -->|GraphQL Queries/Mutations| Stellate
    Mobile -->|GraphQL Queries/Mutations| Stellate
    Stellate -->|Cache Miss| GraphQLServer
    Website -->|Custom Routes| GraphQLServer
    Mobile -->|Custom Routes| GraphQLServer
    Resolvers --> PkgSharedServer
    Resolvers --> PkgPublic
    PkgSharedServer --> DB
    PkgSharedServer --> Cache
    PkgSharedServer --> Worker
    PkgSharedServer --> ThirdParty
    
    %% Styles
    style Apollo fill:#9e3a8a,stroke:#dd7bc8
    style Website fill:#3a8a9e,stroke:#7bc8dd
    style Mobile fill:#3a8f4a,stroke:#7bd08f
    style Worker fill:#b36b24,stroke:#ff9e57
    style DB fill:#6b8fcc,stroke:#a9c9ff
    style Cache fill:#6b8fcc,stroke:#a9c9ff
    style PkgPublic fill:#7a69b3,stroke:#b8a7ff,stroke-width:1.5px
    style PkgSharedServer fill:#7a69b3,stroke:#b8a7ff,stroke-width:1.5px
    style Stellate fill:#d9534f,stroke:#ff6b63,stroke-width:1.5px
```

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Apollo Server, Express
- **Database Access**: Access to the database models (via shared-server package)
- **Authentication**: JSON Web Tokens (JWT)
- **GraphQL Cache**: Stellate cache
- **Database Caching**: Redis (via shared-server package)

### Directory Structure
```
/graphql-server
  /docs                  # Documentation for this application
  /src
    /graphql
      /validators        # Query validation and complexity limits
        required-fields.ts # Validation for required fields
      comicseries.ts     # GraphQL schema and resolvers for comic series
      comicissue.ts      # GraphQL schema and resolvers for comic issues
      comicstory.ts      # GraphQL schema and resolvers for comic stories
      common.ts          # Common GraphQL types and utilities
      creator.ts         # GraphQL schema and resolvers for creators
      creatorcontent.ts  # GraphQL schema and resolvers for creator content
      error.ts           # Error handling and definitions
      home.ts            # GraphQL schema and resolvers for home page
      list.ts            # GraphQL schema and resolvers for lists
      search.ts          # GraphQL schema and resolvers for search
      docs.ts            # Documentation related schemas
      index.ts           # Main GraphQL schema assembly
      utils.ts           # GraphQL utilities
    /notion              # Notion integration for Blog posts
    /routes              # Express routes, including API endpoints
      auth.ts            # Authentication routes
      worker.ts          # Worker-related routes
  /dist                  # Compiled TypeScript code (can be ignored)
```

### Core Features

#### Queries and Mutations
- **Resolvers**: Implementation of all GraphQL queries and mutations
- **Error Handling**: Standardized error responses with proper status codes and messages

#### Query Validation and Security
- **Complexity Analysis**: Prevents resource-intensive queries using a complexity scoring system
- **Rate Limiting**: Enforces query rate limits for API stability
- **Input Sanitization**: Input validation for all queries and mutations

#### Authentication
- **JWT-based Authentication**: Secure user authentication with JSON Web Tokens

#### Integration Points
- **Database Access**: Has access to the database models (via shared-server)
- **Worker Tasks**: Triggers background processing tasks on the Worker service
- **Notion Integration**: CMS via Notion API

### Data Flow

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant Stellate as Stellate Cache
    participant Apollo as Apollo Server
    participant Auth as Authentication
    participant Resolvers as GraphQL Resolvers
    participant DB as Database Layer
    participant Cache as Database Cache (Redis)
    participant Worker as Worker Service
    participant ThirdParty as Third-Party APIs

    Client->>Auth: Authentication Request
    Auth->>Client: Authentication Response
    Client->>Stellate: GraphQL Query/Mutation
    
    alt Cached Query Available
        Stellate->>Client: Return Cached Response
    else Cache Miss
        Stellate->>Apollo: Forward Query/Mutation
        Apollo->>Apollo: Validate Query
        Apollo->>Resolvers: Execute Resolvers
        
        alt Cached Data Available
            Resolvers->>Cache: Check Cache
            Cache->>Resolvers: Return Cached Data
        else No Cache
            Resolvers->>DB: Database Query
            DB->>Resolvers: Return Data
            Resolvers->>Cache: Update Cache
        end
        
        alt External API Required
            Resolvers->>ThirdParty: API Request
            ThirdParty->>Resolvers: API Response
        end
        
        Resolvers->>Apollo: Resolver Results
        Apollo->>Stellate: Response Data
        Stellate->>Client: Response Data
        Stellate->>Stellate: Update Cache
    end
    
    alt Background Processing
        Resolvers->>Worker: Trigger Background Tasks
    end
```