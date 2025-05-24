# Schema Structured Syndication (SSS) - Exclusive Content Implementation

## Overview

Schema Structured Syndication (SSS) is an open-source specification that enables creators to self-publish their content to any compatible app. It's inspired by podcast RSS feeds but designed for modern content distribution with support for exclusive/paid content.

## Key Differences from Traditional RSS

1. **JSON instead of XML** - Modern, easier to parse
2. **Schema.org vocabulary** - Standardized semantic structure
3. **Premium content support** - Built-in OAuth for exclusive content
4. **Real-time updates** - WebSub protocol support
5. **ETag/Last-Modified headers** - Efficient caching

## How Exclusive Content Works

### 1. Content Marking

Exclusive content is marked at two levels:

#### Series Level
```json
{
  "identifier": "comic-uuid",
  "name": "Amazing Comic Series",
  "scopesForExclusiveContent": ["patreon", "substack", "ghost"]
}
```

#### Issue Level
```json
{
  "issueNumber": 5,
  "name": "Special Episode",
  "scopesForExclusiveContent": ["patreon"],
  "dateExclusiveContentIsAvailable": "2024-12-01T00:00:00Z"
}
```

### 2. OAuth Flow for Exclusive Content

The SSS OAuth flow adds an extra step to standard OAuth by requiring content-specific tokens:

```
1. User Authorization
   ├─> User clicks "Unlock with Patreon"
   ├─> Redirect to hosting provider's authorize URL
   └─> User grants permission

2. Token Exchange
   ├─> Exchange authorization code for access/refresh tokens
   └─> Server-side operation (requires client secret)

3. Content Token Request
   ├─> Use access token to request content-specific token
   ├─> Specify series/issue identifier
   └─> Receive temporary content token (2 hours)

4. Access Protected Content
   └─> Append content token to image URLs
```

### 3. Token Types and Lifetimes

- **Authorization Code**: ~5 minutes (one-time use)
- **Access Token**: ~2 hours (for API requests)
- **Refresh Token**: ~180 days (to get new access tokens)
- **Content Token**: ~2 hours (series-specific access)

### 4. Implementation Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│ Your Server  │────▶│ Hosting Provider│
│ (Web/Mobile)│     │   (Inkverse) │     │    (Taddy)      │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │                      │
       │                    ├── Stores tokens      │
       │                    ├── Manages refresh    │
       └────────────────────┴──────────────────────┘
                   Protected content flow
```

### 5. Required OAuth Endpoints

Your server needs to handle:

1. **Authorization Redirect**
   - Redirect users to hosting provider's `authorizeUrl`
   - Include: `client_id`, `redirect_uri`, `response_type=code`

2. **Token Exchange Endpoint**
   - Receive authorization code
   - Exchange for access/refresh tokens
   - Store tokens securely

3. **Content Token Request**
   - Use access token to get content-specific token
   - Cache content tokens (2-hour expiry)

4. **Token Refresh**
   - Refresh access tokens before expiry
   - Handle refresh token rotation

### 6. Accessing Protected Images

Protected content URLs require the content token:

```
Original: https://cdn.example.com/comic/issue-5/page-1.jpg
Protected: https://cdn.example.com/comic/issue-5/page-1.jpg?contentToken=xyz123
```

### 7. User Experience Flow

1. **Discovery**: User browses comic, sees "Exclusive on Patreon" badge
2. **Authorization**: Click "Unlock with Patreon" → OAuth flow
3. **Access**: Comic pages load with content tokens
4. **Persistence**: Refresh tokens maintain access across sessions

### 8. Security Considerations

- **Never expose client secret** in client-side code
- **Use PKCE** for additional security (recommended)
- **Validate state parameter** to prevent CSRF
- **Store tokens securely** (encrypted in database)
- **Implement token rotation** for refresh tokens

### 9. Free Content Countdown

For temporarily exclusive content:

```json
{
  "scopesForExclusiveContent": ["patreon"],
  "dateExclusiveContentIsAvailable": "2024-12-01T00:00:00Z"
}
```

Apps should display: "Free in X days" countdown

### 10. Error Handling

Common scenarios:
- **401 Unauthorized**: Token expired, needs refresh
- **403 Forbidden**: User lacks required subscription
- **404 Not Found**: Content doesn't exist
- **429 Rate Limited**: Too many requests

## Benefits for Creators

1. **Platform Independence**: Not locked to single distribution platform
2. **Direct Monetization**: Connect existing subscriber base
3. **Flexible Pricing**: Use any payment platform
4. **Gradual Free Release**: Time-delayed free access option
5. **Analytics**: Track engagement across all platforms

## Benefits for Platforms (like Inkverse)

1. **No Payment Processing**: Leverage existing creator subscriptions
2. **Reduced Infrastructure**: No need for payment systems
3. **Creator-Friendly**: Attracts creators with existing audiences
4. **Standardized Integration**: One implementation for multiple payment providers