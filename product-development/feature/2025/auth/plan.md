# Inkverse Authentication Implementation Plan

## Feature Summary
Implement a cross-platform authentication system enabling passwordless login via social providers (Google, Apple) and magic links with secure JWT tokens to support user identification, personalization, and cross-device data syncing.

## Architecture Overview

The authentication system will be integrated into the existing Inkverse architecture through these components:

1. **GraphQL Server**: 
   - Add authentication resolver and types
   - Implement JWT generation and validation
   - Create context middleware for user authentication

2. **Frontend Clients** (Website & Mobile):
   - Create authentication UI components 
   - Implement OAuth flows (Google, Apple)
   - Add token management

3. **Database**:
   - Extend users table with authentication fields

4. **Shared Packages**:
   - Create authentication utilities in shared-server package
   - Add user-related types to public package
   - Implement token handling in shared-client package

## Key Technical Decisions

1. **JWT-based Authentication**: Using JWTs for stateless authentication with refresh token rotation for security.

2. **Passwordless Authentication Only**: Implementing social login and magic links without password option to reduce friction and security risks.

3. **Cross-Platform OAuth Integration**: Using platform-specific OAuth implementations while maintaining a consistent token exchange process.

4. **Token Client-Side Storage Strategy**: Secure token storage using AsyncStorage/SecureStore for mobile and HttpOnly cookies for web.

5. **Token Server-Side Storage Strategy**: Tokens are not stored in the database, but are stored in the client-side storage. A user can exchange their valid access or refresh token for a new one if they have a valid refresh token. A user can also login with a magic link, and the token will be stored in the client-side storage.

6. **Centralized Authentication Logic**: Core authentication logic implemented in shared-server package to ensure consistency.

## Dependencies & Assumptions

1. **External Dependencies**:
   - Google OAuth API access for web and mobile platforms
   - Apple Sign-In API access for iOS and web platforms
   - Email delivery service for magic links

2. **Technical Assumptions**:
   - PostgreSQL database with existing users table
   - Express.js server with Apollo GraphQL
   - React and React Native clients with Apollo Client
   - Shared monorepo structure for code reuse

3. **Data Requirements**:
   - Minimal user data collection (email, username, age range)
   - Cross-device synchronization of reading progress
   - Privacy compliance with GDPR, CCPA standards

## Implementation Checklist

### Database & Models
- [ ] Create database migration for user authentication fields (OAuth identifiers, email verification)

### Shared Packages
- [ ] Define User and Authentication types in public package
- [ ] Create JWT utility functions (generate, verify, refresh) in shared-server
- [ ] Implement token storage and retrieval utilities in shared-client
- [ ] Add GraphQL fragments for user data in shared-client
- [ ] Create token exchange utilities for refresh token rotation
- [ ] Implement secure client-side token storage abstractions

### GraphQL Server
- [ ] Define User type and authentication-related schemas in GraphQL
- [ ] Implement authentication mutations (login, signup, verify, logout)
- [ ] Create authentication resolvers with provider-specific logic
- [ ] Add authentication middleware for context creation
- [ ] Implement token refresh resolver
- [ ] Add authorization checks for protected resolvers
- [ ] Create token exchange resolver to handle refresh token rotation
- [ ] Implement magic link token generation and validation

### Email Service
- [ ] Integrate email service for magic link delivery
- [ ] Create email templates for authentication links
- [ ] Implement secure token generation for magic links
- [ ] Add rate limiting for email-based authentication

### Website (React)
- [ ] Create login/signup modal component
- [ ] Implement Google OAuth integration for web
- [ ] Implement Apple Sign-In for web
- [ ] Add magic link email form and flow
- [ ] Create account settings page
- [ ] Implement token management in Apollo client
- [ ] Add authenticated routes and redirects
- [ ] Create age verification and username collection forms
- [ ] Set up secure client-side token storage with HttpOnly cookies
- [ ] Implement token refresh and rotation logic in Apollo client

### Mobile App (React Native)
- [ ] Update profile screen with authentication UI
- [ ] Implement Google Sign-In integration
- [ ] Implement Apple Sign-In integration
- [ ] Add magic link email form and app link handling
- [ ] Update settings screen with account management
- [ ] Create age verification and username collection screens
- [ ] Add deep linking support for magic links
- [ ] Configure secure token storage using AsyncStorage/SecureStore
- [ ] Implement token refresh and rotation logic for mobile client

### Cross-Platform Features
- [ ] Implement reading progress synchronization
- [ ] Add custom lists synchronization
- [ ] Create bookmarks and liked content sync
- [ ] Add account preferences synchronization
- [ ] Implement cross-device token validation

### Security & Privacy
- [ ] Implement token refresh mechanism
- [ ] Add CSRF protection for web authentication
- [ ] Create account deletion functionality
- [ ] Implement logging for security events
- [ ] Add privacy notice screens
- [ ] Create age-appropriate content filtering
- [ ] Implement token expiration and rotation policies
- [ ] Add token revocation mechanisms for logout across devices

### Testing & Validation
- [ ] Create authentication flow test cases
- [ ] Test cross-device synchronization
- [ ] Validate token security and refresh flow
- [ ] Test social login providers on all platforms
- [ ] Verify magic link email delivery and validation
- [ ] Test account management functions
- [ ] Validate token exchange and rotation functionality
- [ ] Test client-side token storage security