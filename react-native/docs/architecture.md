# React Native App Architecture
The React Native app (`/react-native`) serves as the mobile client for Inkverse, available on iOS and Android.

## Architecture Overview

```mermaid
graph TD
    direction TB
    
    %% Entry Point
    Entry["index.tsx (Entry Point)"]
    
    %% Main Components
    subgraph "App Container"
        Root["Root Component (Navigation)"]
        Providers["Providers (Apollo, AppLoader)"]
        
        Root --- Providers
        Root --- TabNav
    end
    
    %% Navigation Structure
    subgraph "Navigation"
        TabNav["Tab Navigator"]
        TabNav --> HomeStack["Home Tab"]
        TabNav --> SearchStack["Search Tab"]
        TabNav --> ProfileStack["Profile Tab"]
        
        HomeStack --> HomeScreen["Home Screen"]
        HomeStack --> SharedScreens["Shared Screens"]
        
        SearchStack --> SearchScreen["Search Screen"]  
        SearchStack --> SharedScreens
        
        ProfileStack --> ProfileScreen["Profile Screen"]
        ProfileStack --> SharedScreens
        ProfileStack --> SettingsScreen["Settings Screen"]
        
        SharedScreens --> ComicSeriesScreen["Comic Series"]
        SharedScreens --> ComicIssueScreen["Comic Issue"]
        SharedScreens --> CreatorScreen["Creator"]
        SharedScreens --> ListScreen["List"]
    end
    
    %% Component Structure
    subgraph "Components"
        UIComponents["UI Components"]
        ComicComponents["Comic Components"]
        CreatorComponents["Creator Components"]
        HomeComponents["Home Components"]
        ListComponents["List Components"]
        ProfileComponents["Profile Components"]
        ProviderComponents["Provider Components"]
    end
    
    %% Data & Services
    subgraph DataLayer [Data Fetching and State Management]
        Dispatchers["Screen Dispatchers"]
        Apollo["Apollo Client"]
        Utilities["Utilities"]
        LocalStorage["AsyncStorage"]
        
        Dispatchers -->|uses|Apollo
    end

    subgraph SharedClient ["Shared Client (/packages/shared-client)"]
        Queries["Queries"]
        Mutations["Mutations"]
        Fragments["Fragments"]
        DispatchFunctions["Dispatch Functions"]
        Reducers["Reducers"]
        
        DispatchFunctions --> Queries
        DispatchFunctions --> Mutations
    end
    
    %% External Systems
    GraphQLServer["GraphQL Server"]
    
    %% Connections
    Entry --> Root
    Navigation -->|useReducer|DataLayer
    Navigation -->|loadData|DispatchFunctions
    Navigation -->|displays|Components
    Apollo --> SharedClient
    SharedClient --> GraphQLServer
    
    %% Styles
    style Apollo fill:#9e3a8a,stroke:#dd7bc8
    style GraphQLServer fill:#6b8fcc,stroke:#a9c9ff
    style Root fill:#3a8a9e,stroke:#7bc8dd
    style TabNav fill:#3a8f4a,stroke:#7bd08f
    style Dispatchers fill:#8a3a6b,stroke:#c87bdd
    style DispatchFunctions fill:#8a3a6b,stroke:#c87bdd
    style GraphQLClient fill:none,stroke:none
```

### Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v7
- **State Management**: Dispatch for each screen
- **Data Fetching**: Apollo Client with GraphQL
- **GraphQL Caching**: Apollo Client Cache
- **UI Components**: Custom components with Expo libraries
- **Storage**: AsyncStorage
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Deployment**: Expo EAS Build and Updates

### Directory Structure
```
/react-native
  /docs                # Documentation for this application
  /app
    /components        # Reusable components organized by feature
      /comics          # Comic-related components
      /creator         # Creator-related components
      /home            # Home screen components
      /list            # List-related components 
      /profile         # Profile-related components
      /providers       # Provider components (context, etc.)
      /ui              # Shared UI components
    /screens           # Screen components
      /wrapped-screens # HOC-wrapped screen components
  /assets
    /fonts            # Custom fonts
    /icons            # App icons
    /images           # Static images
  /constants          # App constants
  /lib                # Utilities and services
  /credentials        # Platform-specific credentials
  app.json            # Expo configuration
  index.tsx           # App entry point
  config.ts           # Environment configuration
  /.expo              # Expo configuration
```

### Key Features

#### Navigation Architecture
- **Tab Navigation**: Main app navigation with Home, Search, and Profile tabs
- **Stack Navigation**: Each tab has its own navigation stack
- **Deep Linking**: Support for app links through Expo Linking
- **Screen Sharing**: Common screens (Comic Series, Comic Issue, etc.) shared across navigation stacks

#### Data Management
- **Reducer-Based State Management**: Screens use reducer pattern with dispatch functions
- **Dispatch Functions**: Centralized data fetching logic in shared client package
- **Apollo Client**: Two clients (public and user) for public/anonymous and authenticated requests
- **GraphQL Integration**: Connected to the Inkverse GraphQL Server for data fetching/mutations
- **Error Handling**: Centralized error handling with Sentry integration

#### UI/UX Design
- **Component Hierarchy**: Modular components organized by feature
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Platform Specifics**: Platform-specific behavior using Platform API
- **Theme Support**: Light and dark mode support

#### Performance Optimization
- **Hermes Engine**: Optimized JavaScript engine for React Native
- **FlashList**: Efficient list rendering for large datasets
- **Expo Image**: Optimized image loading and caching
- **Apollo Cache**: GraphQL query caching for improved performance

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Screen
    participant Reducer
    participant Dispatcher as Dispatch Function
    participant Apollo
    participant GraphQL as GraphQL Server
    participant AsyncStorage
    
    User->>Screen: Interaction
    
    alt Data Fetching
        Screen->>Dispatcher: Call load function (e.g., loadComicSeries)
        Dispatcher->>Reducer: Dispatch REQUEST action
        
        Reducer->>Screen: Update loading state
        Screen->>User: Show loading indicator
        
        Dispatcher->>Apollo: Execute GraphQL query
        Apollo->>AsyncStorage: Check Cache
        
        alt Cache Hit
            AsyncStorage->>Apollo: Return Cached Data
        else Cache Miss
            Apollo->>GraphQL: Request Data
            GraphQL->>Apollo: Return Data
            Apollo->>AsyncStorage: Update Cache
        end
        
        Apollo->>Dispatcher: Return query result
        Dispatcher->>Reducer: Dispatch SUCCESS action with data
        Reducer->>Screen: Update state with data
        Screen->>User: Display content
    end
    
    alt Data Mutation
        Screen->>Dispatcher: Call mutation function
        Dispatcher->>Reducer: Dispatch REQUEST action
        Dispatcher->>Apollo: Execute GraphQL mutation
        Apollo->>GraphQL: Send Mutation
        GraphQL->>Apollo: Return Result
        Apollo->>AsyncStorage: Update Cache
        Dispatcher->>Reducer: Dispatch SUCCESS action
        Reducer->>Screen: Update state
        Screen->>User: Display Updated UI
    end
```

### Integration Points
- **GraphQL Server**: Primary data source via Apollo Client
- **External Services**: Sentry for error tracking, PostHog for analytics
- **Deep Linking**: Integration with web platform via URL scheme
- **Shared Packages**: Uses shared client code from workspace packages

### Deployment and CI/CD
- **Build System**: Expo EAS Build for native builds
- **OTA Updates**: Expo Updates for over-the-air code updates
- **Distribution**: App Store and Google Play via EAS Submit
- **Environment Config**: Environment-specific configuration via config.ts 