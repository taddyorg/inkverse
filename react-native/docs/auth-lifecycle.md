# Auth Token Refresh Lifecycle

This document explains how token refresh is handled throughout the application lifecycle.

## Overview

The `AuthRefreshProvider` automatically handles token refresh in the background, ensuring users stay authenticated without manual intervention. It uses a combination of periodic refresh intervals and app lifecycle event monitoring.

## Key Features

### 1. **Automatic Token Refresh**
- Performs initial token refresh on every app open
- Refreshes access tokens every **15 minutes** while the app is active
- Uses `setInterval` to schedule periodic refreshes
- Only starts if a valid refresh token exists

### 2. **App Lifecycle Management**
- Monitors app state changes using React Native's `AppState` API
- Pauses refresh when app goes to background
- Resumes refresh when app comes back to foreground
- Performs immediate refresh if more than 15 minutes have passed while in background

### 3. **Smart Background Handling**
- **Background**: Stops all refresh intervals to preserve battery and resources
- **Foreground**: Checks time since last refresh and immediately refreshes if needed
- **No Memory Leaks**: Properly cleans up intervals and listeners

## Implementation Details

### Provider Structure
```tsx
<AppLoaderProvider>
  <AuthRefreshProvider>  {/* ← Handles token refresh */}
    <NavigationContainer>
      <PostHogProvider>
        {/* App content */}
      </PostHogProvider>
    </NavigationContainer>
  </AuthRefreshProvider>
</AppLoaderProvider>
```

### Lifecycle Events

| App State | Action |
|-----------|--------|
| **App Open** | Initial token refresh → Start 15-minute refresh interval |
| **Background/Inactive** | Stop refresh interval |
| **Active (returning)** | Check elapsed time → Immediate refresh if needed → Restart interval |

### Token Validation
- Checks for valid refresh token before starting intervals
- Stops interval if refresh token becomes unavailable
- Gracefully handles refresh failures with error logging

## Configuration

### Refresh Interval
```tsx
// Located in AuthRefreshProvider.tsx
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
```

To change the refresh frequency, modify this constant.

## Debugging

The provider includes comprehensive console logging:

- `✅ Token refresh interval started (every 15 minutes)`
- `⚡ Performing scheduled token refresh...`
- `📱 App state changed: background -> active`
- `🔄 App came to foreground, checking token refresh...`
- `🚫 No refresh token available, stopping interval`
- `❌ Scheduled token refresh failed: [error]`

## Benefits

1. **User Experience**: Seamless authentication without interruptions
2. **Battery Efficient**: Stops background processing when app is inactive  
3. **Network Efficient**: Only refreshes when necessary
4. **Memory Safe**: Proper cleanup prevents memory leaks
5. **Robust**: Handles edge cases like missing tokens and app state transitions

## Edge Cases Handled

- App killed and restarted
- No internet connection during refresh
- Refresh token expiration
- App backgrounded for extended periods (1+ hours)
- Multiple rapid app state changes
- Component unmounting during refresh

This implementation ensures your users stay authenticated reliably across all usage patterns. 