# CLAUDE.md for React Native App

This file provides guidance to Claude Code (claude.ai/code) when working with the React Native app code in this repository.

## Project Overview

The React Native app is the mobile client for Inkverse, available on iOS and Android. It provides a complete comic reading experience with features like browsing comics, reading issues, viewing creator profiles, and managing user profiles.

## Key Files and Directories

- `/app/screens/`: Screen components for each route
- `/app/components/`: Components organized by feature (comics, creator, list, etc.)
- `/app/components/ui/`: Shared UI components
- `/constants/`: App constants (Colors, Navigation)
- `/lib/`: Utilities and service integrations
- `/assets/`: Static assets (fonts, icons, images)
- `index.tsx`: App entry point
- `app.json`: Expo configuration
- `config.ts`: Environment configuration

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Type checking
yarn build

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

## Quick Setup
1. To use the production API:
   - Edit `config.ts` to use `developmentConfigButProductionData`
   - Run `yarn dev`

2. For local development:
   - Ensure local GraphQL server is running
   - Edit `config.ts` to use `developmentConfig`
   - Run `yarn dev`

## Architecture Patterns

### Navigation Structure
- Tab navigator with Home, Search, and Profile tabs
- Each tab has its own stack navigator
- Shared screens (comics, creators, lists) accessible from multiple tabs
- Deep linking support through Expo Linking

### Data Flow
1. User interaction triggers a dispatch function
2. Dispatch function calls the GraphQL API via Apollo Client
3. Apollo Client manages caching and network requests
4. Reducer updates component state with fetched data
5. Screen re-renders with updated data

### Component Organization
- Feature-based organization (`/comics`, `/creator`, etc.)
- Common UI components in `/ui` directory
- Screen components handle routing logic
- Wrapped screens add context providers and error boundaries

### State Management
- Reducer pattern with dispatch functions
- Apollo Client cache for GraphQL data
- AsyncStorage for persistent local storage
- Context providers for theme and app state

## Development Workflow

### Adding New Screens
1. Create screen component in `/app/screens/`
2. Update navigation in `/app/screens/root.tsx`
3. Add any necessary route types in `/constants/Navigation.ts`
4. Create wrapped screen if needed in `/app/screens/wrapped-screens/`

### Creating New Components
1. Add new component to appropriate feature directory
2. Follow existing patterns for theming and styling
3. Use `ThemedView`, `ThemedText`, etc. from `/app/components/ui/` for consistent theming
4. Export component if needed through feature directory index file

### Working with GraphQL
1. All GraphQL operations are in the shared client package
2. Dispatch pattern abstracts GraphQL operations
3. There are 2 Apollo Clients that can be used, one for the public queries and one for the user queries
4. Check Apollo cache policies for optimizing performance

### Theming
1. Theme values are in `/constants/Colors.ts`
2. Use themed components from `/app/components/ui/` when possible
3. Theme context is provided by `ThemeProvider.tsx`
4. Support both light and dark mode

## Performance Considerations
- Use FlashList instead of FlatList for long lists
- Implement proper memoization with React.memo and useMemo
- Optimize Apollo cache policies for frequently accessed data
- Use Expo Image for efficient image loading and caching
- Minimize re-renders by using useMemo and useCallback

## Integration Points
- Apollo Client connects to the GraphQL server
- Sentry for error tracking
- PostHog for analytics
- Expo Updates for OTA code delivery
- Web links to native screens via deep linking

## Troubleshooting

### Common Issues
- **Apollo Client Errors**: Check if GraphQL server is running and config points to correct URL
- **Theme Issues**: Ensure components use themed components from UI directory
- **Navigation Problems**: Check route params and navigation structure
- **Build Errors**: Update Expo SDK or check TypeScript errors with `yarn build`

### Debugging Tools
- React Native Debugger for runtime inspection
- Expo Dev Tools for device/emulator management
- Sentry for production error monitoring
- TypeScript for compile-time checking