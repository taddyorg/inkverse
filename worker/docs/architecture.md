# Worker Architecture
The Worker (`/worker`) serves as the background processing system for Inkverse, handling tasks that are computationally intensive or can be done asynchronously. It performs various maintenance, generation, and data processing tasks that support the platform's operations.

## Worker Architecture Overview

```mermaid
graph TD
    direction TB
    
    %% Client Applications
    GraphQL["GraphQL Server"]
    Scheduler["Scheduled Jobs"]
    
    %% Worker and its components
    subgraph "Worker"
        Scripts[Script Runner]
        subgraph "Script Modules"
            ImageScripts[Image Processing]
            FeedScripts[Feed Management]
            SitemapScripts[Sitemap Generation]
            CacheScripts[Cache Management]
            UtilScripts[Utilities]
            ProcessTaddyWebhookEvent[Process Taddy Webhook Event]
        end
    end
    
    %% External Systems
    DB[(Database)]
    CDN[CDN/Storage]
    CloudflareR2[Cloudflare R2]
    
    %% Shared Packages
    subgraph "Shared Packages"
        PkgSharedServer[shared-server]
    end
    
    %% External Relationships
    GraphQL -->|Trigger Tasks| Scripts
    Scheduler -->|Schedule Tasks| Scripts
    Scripts --> ImageScripts
    Scripts --> FeedScripts
    Scripts --> SitemapScripts
    Scripts --> CacheScripts
    Scripts --> UtilScripts
    Scripts --> ProcessTaddyWebhookEvent
    
    ImageScripts --> PkgSharedServer
    FeedScripts --> PkgSharedServer
    SitemapScripts --> PkgSharedServer
    CacheScripts --> PkgSharedServer
    ProcessTaddyWebhookEvent --> PkgSharedServer
    
    PkgSharedServer --> DB
    ImageScripts --> CDN
    SitemapScripts --> CloudflareR2
    
    %% Styles
    style Scripts fill:#9e3a8a,stroke:#dd7bc8
    style GraphQL fill:#3a8a9e,stroke:#7bc8dd
    style Scheduler fill:#3a8f4a,stroke:#7bd08f
    style CDN fill:#b36b24,stroke:#ff9e57
    style DB fill:#6b8fcc,stroke:#a9c9ff
    style CloudflareR2 fill:#6b8fcc,stroke:#a9c9ff
    style PkgSharedServer fill:#7a69b3,stroke:#b8a7ff,stroke-width:1.5px
```

### Tech Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database Access**: PostgreSQL client (via shared-server package)
- **Storage**: File system, Cloudflare R2
- **Task Management**: Script-based execution

### Directory Structure
```
/worker
  /docs               # Documentation for this application
  /input              # Input files for worker tasks
  /output             # Generated output files
  /src
    /scripts          # Task-specific scripts
      /cache          # Cache management tasks
      /feeds          # Feed processing tasks
      /images         # Image processing tasks
      /sitemap        # Sitemap generation tasks
      /utils          # Shared utility functions
  /dist               # Compiled TypeScript code (can be ignored)
```

### Core Features

#### Script-Based Task Execution
- **Standalone Scripts**: Individual task runners for specific functions
- **Input/Output Management**: File-based data handling for task processing
- **Error Handling**: Robust error management and reporting

#### Image Processing
- **Download and Storage**: Fetching and storing images from external sources
- **Optimization**: Image resizing and optimization for performance
- **Asset Management**: Managing comic and creator images

#### Feed Management
- **Comic Import**: Importing comic data from external feeds
- **Feed Auditing**: Validating and ensuring data quality
- **Webhook Simulation**: Testing webhook-based integrations

#### Sitemap Generation
- **SEO Support**: Generating XML sitemaps for search engine optimization
- **Content Mapping**: Creating maps of all available content
- **Split and Upload**: Processing large sitemaps into manageable chunks

#### Cache Management
- **Cache Invalidation**: Clearing cached data when updates occur
- **Performance Optimization**: Maintaining system performance through selective cache management

#### Taddy Webhook Event Processing
- **Taddy Webhook Event**: Processing Taddy webhook events for comic series, comic issue, or creator. Adds or updates the data in the database.


### Data Flow

```mermaid
sequenceDiagram
    participant Trigger as Trigger Source
    participant Worker as Worker Script
    participant DB as Database
    participant Storage as Storage System
    participant Target as Target System
    
    Trigger->>Worker: Initiate Task
    Worker->>DB: Fetch Required Data
    DB->>Worker: Return Data
    
    alt File Processing Required
        Worker->>Worker: Process Data
        Worker->>Storage: Save Intermediate Results
    end
    
    Worker->>Target: Upload/Update Results
    Target->>Worker: Confirmation
    
    Worker->>Worker: Cleanup Temporary Files
    Worker->>Trigger: Task Completion Status
``` 