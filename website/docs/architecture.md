# Website Application Architecture
The Website application (`/website`) serves as the web client for Inkverse.

## Architecture Overview

```mermaid
graph TD
    direction TB
    
    %% Entry Point
    Entry["entry.client.tsx (Client Entry)"]
    
    %% Main Components
    subgraph "App Container"
        Root["Root Component (Layout)"]
        Providers["Providers (Apollo, PostHog)"]
        
        Root --> Routes
        Root --> Providers
    end
    
    %% Navigation Structure
    subgraph "Routing"
        Routes["routes.ts (Route Configuration)"]
        Routes --> HomeRoute["Home Route"]
        Routes --> ComicSeriesRoute["Comic Series Route"]
        Routes --> ComicIssueRoute["Comic Issue Route"]
        Routes --> CreatorRoute["Creator Route"]
        Routes --> ListRoute["List Route"]
        Routes --> TagRoute["Tag Route"]
        Routes --> BlogRoute["Blog Route"]
        Routes --> ErrorRoute["Error Handling"]
    end
    
    %% Component Structure
    subgraph "Components"
        UIComponents["Common UI Components"]
        ComicComponents["Comic Components"]
        CreatorComponents["Creator Components"]
        HomeComponents["Home Components"]
        ListComponents["List Components"]
    end
    
    %% Data & Services
    subgraph DataLayer [Data Fetching and State Management]
        Apollo["Apollo Client"]
        Loaders["Route Loaders"]
        SEO["SEO Utilities"]
    end

    subgraph SharedClient ["Shared Client (/packages/shared-client)"]
        Queries["Queries"]
        Mutations["Mutations"]
        Fragments["Fragments"]
    end
    
    %% External Systems
    GraphQLServer["GraphQL Server"]
    
    %% Connections
    Entry --> Root
    Loaders --> Apollo
    Apollo --> SharedClient
    SharedClient --> GraphQLServer
    Routing --> Loaders
    Routing --> Components
    %% Styles
    style Apollo fill:#9e3a8a,stroke:#dd7bc8
    style GraphQLServer fill:#6b8fcc,stroke:#a9c9ff
    style Root fill:#3a8a9e,stroke:#7bc8dd
    style Routes fill:#3a8f4a,stroke:#7bd08f
```

### Tech Stack
- **Framework**: React Router 7 (with server-side rendering)
- **Language**: TypeScript
- **State Management**: Apollo Client (for GraphQL data)
- **Data Fetching**: Apollo Client with GraphQL
- **UI Components**: Custom components with Tailwind CSS
- **Styling**: Tailwind CSS
- **Analytics**: PostHog
- **Build Tools**: Vite
- **Rendering**: Server-side rendering (SSR) with React Router

### Directory Structure
```
/website
  /docs                 # Documentation for this application
  /app                  # Application source code
    /components         # Reusable components organized by feature
      /comics           # Comic-related components
      /creator          # Creator-related components
      /home             # Home screen components
      /list             # List-related components
      /ui               # Shared UI components
    /routes             # Route components and handlers
    app.css             # Global styles
    entry.client.tsx    # Client-side entry point
    root.tsx            # Root layout component
    routes.ts           # Route definitions
  /assets               # Static assets
    /favicon            # Favicon files
  /lib                  # Utilities and services
    /action             # Action handlers
    /apollo             # Apollo client configuration
    /loader             # Route data loaders
    /meta               # Metadata utilities
    /seo                # SEO utilities
  config.ts             # Environment configuration
  vite.config.ts        # Vite configuration
  react-router.config.ts # React Router configuration
  /.react-router        # Generated React Router files (can be ignored)
```

### Key Features

#### Routing Architecture
- **Declarative Routes**: Routes defined in routes.ts with path patterns
- **Data Loading**: Each route has a corresponding loader for data fetching
- **Error Handling**: Centralized error handling with dedicated error route
- **Meta Tags**: Route-specific meta tag generation for SEO

#### Data Management
- **Reducer-Based State Management**: Screens use reducer pattern with dispatch functions
- **Dispatch Functions**: Centralized data fetching logic in shared client package
- **Apollo Client**: GraphQL client for data fetching/mutations
- **SSR Data Hydration**: Server-rendered data hydrated on client
- **Route Loaders**: Data fetching abstracted in loader functions
- **Error Boundaries**: Graceful error handling within routes

#### UI/UX Design
- **Component Hierarchy**: Modular components organized by feature
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Light/Dark Mode**: Theme support with user preference persistence
- **Zoom Controls**: Accessibility features for content scaling

#### Performance Optimization
- **Server-Side Rendering**: Initial HTML rendered on server
- **Apollo Cache**: GraphQL query caching for improved performance
- **Code Splitting**: Route-based code splitting for faster loading
- **Asset Optimization**: Static asset optimization with Vite

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant RouteLoader
    participant Apollo
    participant GraphQL as GraphQL Server
    
    User->>Browser: Request Page
    Browser->>Server: HTTP Request
    Server->>RouteLoader: Invoke Route Loader
    RouteLoader->>Apollo: Query Data
    Apollo->>GraphQL: Request Data
    GraphQL->>Apollo: Return Data
    Apollo->>RouteLoader: Process Data
    RouteLoader->>Server: Return Loader Result
    Server->>Browser: HTML + Apollo State
    Browser->>User: Render Page
    
    Note over Browser,Apollo: Client Hydration
    
    User->>Browser: Interaction
    Browser->>Apollo: Client-side Query/Mutation
    Apollo->>GraphQL: Request Data
    GraphQL->>Apollo: Return Result
    Apollo->>Browser: Update UI
    Browser->>User: Updated View
```

### Integration Points
- **GraphQL Server**: Primary data source via Apollo Client
- **PostHog**: Analytics integration for user behavior tracking
- **Shared Packages**: Utilizes shared client code from workspace packages
- **SEO Optimization**: Meta tag generation for search engine visibility
- **Notion Integration**: Content rendering from Notion for blog posts

### Deployment and CI/CD
- **Build System**: React Router build process for SSR
- **Hosting**: AWS Copilot for container deployment
- **Environment Config**: Environment-specific configuration 
- **Container Deployment**: Docker-based deployment with load balancing
- **Sitemap Generation**: Custom tooling for search engine indexing 