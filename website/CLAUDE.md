# CLAUDE.md for Inkverse Website

This file provides specific guidance to Claude Code when working with the Inkverse website codebase. 

## Project Overview

The website component is a React-based web client with server-side rendering (SSR) that serves as the primary user-facing web interface for Inkverse. It uses React Router 7 for routing and Apollo Client for data fetching from the GraphQL server.

## Key Files and Directories

- **Entry Points**:
  - `app/entry.client.tsx`: Client-side entry point
  - `app/entry.server.tsx`: Server-side entry point
  - `app/root.tsx`: Root layout component
  - `app/routes.ts`: Route definitions

- **Component Structure**:
  - `app/components/`: Reusable components organized by feature
    - `comics/`: Comic-related components (issues, series details)
    - `creator/`: Creator profile components
    - `list/`: List-related components
    - `ui/`: Shared UI components

- **Routes**:
  - `app/routes/`: Route components and handlers
    - Key routes: home, comicseries, comicissue, creator, list, etc.

- **Data Layer**:
  - `lib/apollo/`: Apollo Client configuration
  - `lib/loader/`: Route data loaders for server-side rendering of every route
  - `lib/action/`: Action handlers

- **Configuration**:
  - `config.ts`: Environment configuration
  - `vite.config.ts`: Vite configuration
  - `react-router.config.ts`: React Router configuration
  - `tailwind.config.ts`: Tailwind CSS configuration

## Development Commands

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production OR for type checking
yarn build

# Start production server
yarn start
```

## Architecture Patterns

### Routing Architecture
- **Declarative Routes**: Defined in `routes.ts` with path patterns
- **Route Loaders**: Each route has a corresponding loader for data fetching in `/lib/loader/`
- **Error Handling**: Centralized error handling with dedicated error route

### Data Flow
1. Client requests a page
2. Server invokes route loader
3. Loader uses Apollo Client to query GraphQL server
4. Data is processed and returned to the server
5. Server renders HTML with Apollo state
6. Client hydrates the application
7. Further interactions use client-side Apollo queries/mutations

### Component Organization
- Components are organized by feature area (comics, creator, list, etc.)
- UI components are shared across features
- Route components handle the overall page layout and composition

### State Management
- Apollo Client for GraphQL data state
- Reducer pattern with dispatch functions for local component state
- SSR data hydration for initial state population

## Development Workflow

### Local Development Setup
1. Choose configuration in `config.ts`:
   - `developmentConfig`: Use local GraphQL server
   - `developmentConfigButProductionData`: Use production API

2. Start the development server:
   ```bash
   yarn dev
   ```

3. The website runs on [inkverse.test:8082](http://inkverse.test:8082)

### Common Development Tasks

#### Adding a New Route
1. Define the route in `app/routes.ts`
2. Create a route component in `app/routes/`
3. Create a loader in `lib/loader/` if data fetching is needed
4. Add SEO metadata in the route component

#### Creating New Components
1. Create component in the appropriate feature folder
2. Use Tailwind CSS for styling
3. Follow existing component patterns
4. Import shared UI components as needed

#### Working with GraphQL
1. GraphQL queries are typically defined in the shared client package
2. Dispatch pattern abstracts GraphQL operations
3. There are 2 Apollo Clients that can be used, one for the public queries and one for the user queries
4. Route loaders handle server-side data fetching

## Performance Considerations

- Server-side rendering improves initial load performance
- Apollo Cache optimizes data fetching
- Route-based code splitting reduces bundle size
- Use `React.lazy` for component code splitting
- Optimize images with appropriate dimensions and formats

## SEO Optimization

- Meta tags are generated for each route in `lib/seo/`
- Sitemap generation via `generate-primary-sitemap.ts`
- Server-side rendering provides better SEO than client-only rendering

## Integration Points

- **GraphQL Server**: Primary data source via Apollo Client
- **PostHog**: Analytics integration for user behavior tracking
- **Shared Client Package**: Reuses queries, mutations, and fragments
- **Notion Integration**: Content rendering from Notion CMS

## Troubleshooting

### Common Issues

- **Apollo Errors**: Check if local GraphQL server is running (or switch to production data)
- **Styling Issues**: Verify Tailwind classes and check for conflicts
- **Route Errors**: Check route definitions and loader functions
- **SSR Hydration Warnings**: Look for mismatches between server and client rendering

### Debugging Tips

- Check browser console for client-side errors
- Examine network requests for GraphQL errors
- Use React Developer Tools to inspect component hierarchy
- Review route loader functions for data fetching issues