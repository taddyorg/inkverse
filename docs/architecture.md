# Inkverse Architecture
Inkverse is a monorepo using yarn workspaces. It includes a React website, a React Native mobile app, a Node.js GraphQL server, a Node.js worker, and 3 internal packages (shared-client, shared-server, public).

## System Overview

```mermaid
graph TD
    direction LR
    Inkverse["Inkverse Monorepo"]

    %% Applications
    subgraph "Applications"
        direction TB
        Inkverse --> Website["Website (React)"]
        Inkverse --> Mobile["Mobile App (React Native)"]
        Inkverse --> GraphQLServer["GraphQL Server (Node.js)"]
        Inkverse --> Worker["Worker (Node.js)"]
        Inkverse --> Cloud["Cloud Services (Cloudflare Workers)"]
    end

    %% Internal Packages
    subgraph "Internal Packages"
        direction TB
        Inkverse --> PkgPublic["Public Utilities<br>(packages/public)"]
        Inkverse --> PkgSharedClient["Shared Client Utilities<br>(packages/shared-client)"]
        Inkverse --> PkgSharedServer["Shared Server Utilities<br>(packages/shared-server)"]
    end

    %% Dependencies
    Website --> PkgSharedClient
    Website --> PkgPublic
    Mobile --> PkgSharedClient
    Mobile --> PkgPublic
    GraphQLServer --> PkgSharedServer
    GraphQLServer --> PkgPublic
    Worker --> PkgSharedServer
    Worker --> PkgPublic

    %% Styles
    style Inkverse fill:#b08f3a,stroke:#e6c670,stroke-width:2px
    style Website fill:#3a8a9e,stroke:#7bc8dd
    style Mobile fill:#3a8f4a,stroke:#7bd08f
    style GraphQLServer fill:#9e3a8a,stroke:#dd7bc8
    style Worker fill:#b36b24,stroke:#ff9e57
    style Cloud fill:#6b8fcc,stroke:#a9c9ff
    style PkgPublic fill:#7a69b3,stroke:#b8a7ff,stroke-width:1.5px
    style PkgSharedClient fill:#7a69b3,stroke:#b8a7ff,stroke-width:1.5px
    style PkgSharedServer fill:#7a69b3,stroke:#b8a7ff,stroke-width:1.5px
```

## Core Components

### Website (`/website`)
- **Purpose**: Provides the main web interface for users to interact with Inkverse
- **Tech Stack**: React, React Router, Apollo Client, TailwindCSS
- **Key Features**:
  - Comic viewing and navigation
  - Creator tools and interfaces
  - User profiles and personalization
  - List management
  
### Mobile App (`/react-native`)
- **Purpose**: Delivers the Inkverse experience on mobile devices
- **Tech Stack**: React Native, Expo, React Navigation, Apollo Client
- **Key Features**:
  - Native mobile comic reader
  - Offline reading capabilities
  - Push notifications
  - Mobile-optimized creator tools

### GraphQL Server (`/graphql-server`)
- **Purpose**: Centralized API layer that serves data to client applications
- **Tech Stack**: Node.js, Apollo Server, Express
- **Key Features**:
  - Validated GraphQL queries and mutations
  - Database access layer
  - Authentication and authorization
  - Rate limiting and query complexity management

### Worker (`/worker`)
- **Purpose**: Handles background processing and scheduled tasks
- **Tech Stack**: Node.js
- **Key Features**:
  - Email notifications
  - Push notifications
  - Image processing
  - Feed generation
  - Sitemap creation

### Cloud Services (`/cloud`)
- **Purpose**: Edge computing services for performance-critical operations
- **Tech Stack**: Cloudflare Workers, R2, D1
- **Key Features**:
  - Sitemap generation
  - Edge caching
  - Image optimization
  - Geolocation services

## Shared Packages

### Public Utilities (`/packages/public`)
- **Purpose**: Common utilities and types shared across all applications
- **Key Components**:
  - TypeScript interfaces and type definitions
  - Shared constants
  - Common utility functions

### Shared Client (`/packages/shared-client`)
- **Purpose**: Client-side utilities shared between web and mobile
- **Key Components**:
  - GraphQL queries, mutations, and fragments
  - Data fetching patterns via dispatchers
  - Client-side state management utilities

### Shared Server (`/packages/shared-server`)
- **Purpose**: Server-side utilities shared between API and backend services
- **Key Components**:
  - Database schemas and query builders
  - Message queue integration
  - Third-party API clients
  - Caching utilities
  - Email templates and sending logic

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant WebMobile as Web/Mobile Clients
    participant GraphQL as GraphQL Server
    participant DB as Database
    participant Worker as Background Worker
    participant Cloud as Cloud Services

    User->>WebMobile: Interacts with UI
    WebMobile->>GraphQL: GraphQL Query/Mutation
    GraphQL->>DB: Database Operations
    GraphQL->>WebMobile: Response Data
    GraphQL->>Worker: Trigger Background Tasks
    Worker->>User: Notifications (email, push)
    User->>Cloud: Asset Requests (images, etc.)
    Cloud->>User: Optimized Assets
```

## External Integrations (see `docs/shared-server` for more details)

- **Queue**: AWS SQS
- **GraphQL Edge Caching**: Stellate
- **Storage**: Cloudflare R2
- **Email**: EmailOctopus
- **Analytics**: PostHog
- **Internal Notifications**: Slack

TALK ABOUT SSS