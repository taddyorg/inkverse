# Cloud Architecture
The `/cloud` package provides edge computing services using Cloudflare Workers. These serverless functions handle specialized tasks closer to users, acting as an intermediary layer between client applications and the origin server.

## Cloud Architecture Overview

```mermaid
graph TD
    %% Client Applications
    Clients["Client Apps (Website/Mobile)"]
    
    %% Cloud Services
    subgraph EdgeWorkers["Cloudflare Workers"]
        FetchSitemap["Fetch Sitemap"]
    end
    
    %% External Systems
    CDN["CDN/Caching Layer"]
    
    %% Relationships
    Clients -->|Asset Requests| CDN
    Clients -->|Run Worker| EdgeWorkers
    
    %% Styles
    style Clients fill:#3a8a9e,stroke:#7bc8dd
    style FetchSitemap fill:#9e3a8a,stroke:#dd7bc8
    style CDN fill:#6b8fcc,stroke:#a9c9ff
```

### Tech Stack
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Configuration**: Wrangler
- **Deployment**: Cloudflare
- **Testing**: Vitest with Cloudflare Workers pool

### Directory Structure
```
/cloud
  /docs                   # Documentation for this application
  /ink-sitemaps           # Sitemap edge delivery worker
```

### Structure of an edge worker

```
/.wrangler            # Wrangler configuration state
/src                  # Source code
/test                 # Test files
wrangler.jsonc        # Worker configuration
```

### Core Features

#### Sitemap edge delivery worker (ink-sitemaps)
Serving sitemap files from the network edge, a background worker generates the sitemap data daily and uploads it to Cloudflare R2. This function fetches the sitemap file from Cloudflare R2 and serves it to the client.

### Data Flow

```mermaid
sequenceDiagram
    participant User as User (Website, Mobile App, etc.)
    participant Edge as Cloudflare Edge
    
    User->>Edge: Run Cloudflare Worker
    Edge->>User: Deliver Response
```

### Integration with Other Systems

The Cloud services only has access to Cloudflare services and does not integrate with other Inkverse components. You can do a public request to Inkverse services to get a response that can be used in your worker.

### Benefits of Edge Computing

These Cloud services provide several advantages:
- **Lower Latency**: Faster response times by serving from geographically distributed locations
- **Reduced Origin Load**: Offloading traffic from the main servers
- **Improved Reliability**: Continued operation even during origin outages
- **Global Scale**: Automatic worldwide distribution of content