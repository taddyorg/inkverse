# Inkverse Authentication Implementation Plan (Organized by Feature)

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

7. **Query & Mutation Authorization Model**: GraphQL queries and mutations are categorized as either public (anonymous access) or user-specific, each with distinct caching requirements. This approach eliminates the need for separate protected routes, as authorization is handled at the resolver level.

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

## Implementation Checklist (Organized by Feature)

### 1. Core Authentication Infrastructure (Foundation)

These tasks must be completed first as they're foundational for all other features:

- [x] Create database migration for user authentication fields (OAuth identifiers, email verification)
- [x] Create JWT utility functions (generate, verify, refresh) in shared-server
- [x] Implement token storage and retrieval utilities in shared-client
- [x] Define User type and authentication-related schemas in GraphQL
- [x] Define User and Authentication types in public package
- [x] Add authentication middleware for context creation
- [x] Add GraphQL fragments for user data in shared-client
- [x] Implement secure client-side token storage abstractions

### 2. Account Creation & Sign Up Flow

Tasks required to enable users to create new accounts:

- [x] Implement authentication mutations (signup) in GraphQL server
- [x] Implement exchangeOTPForTokens mutation for magic link authentication
- [x] Create token exchange utilities for refresh token rotation
- [x] Create login/signup modal component for website
- [x] Create account settings page (web)
- [ ] Update profile screen with authentication UI for mobile
- [ ] Create age verification and username collection forms (web)
- [ ] Create age verification and username collection screens (mobile)

#### 2.1 Social Login (Google & Apple)

- [x] Implement authentication resolvers with provider-specific logic in GraphQL server
- [x] Implement Google OAuth integration for web
- [x] Implement Apple Sign-In for web
- [ ] Implement Google Sign-In integration for mobile
- [ ] Implement Apple Sign-In integration for mobile. iOS only (not Android)

#### 2.2 Email Magic Link Authentication

- [ ] Add magic link email form and app link handling (mobile)
- [ ] Add deep linking support for magic links (mobile)

### 3. Authentication Session Management

Tasks related to maintaining authenticated sessions:

- [x] Implement authentication mutations (login) in GraphQL server
- [x] Implement token refresh resolver
- [x] Create token exchange resolver to handle refresh token rotation
- [x] Set up secure client-side token storage with HttpOnly cookies (web)
- [x] Configure secure token storage using AsyncStorage/SecureStore (mobile)
- [x] Implement token refresh and rotation logic in Apollo client (web)
- [x] Implement token refresh and rotation logic for mobile client
- [x] Implement token expiration and rotation policies
- [ ] Add CSRF protection for web authentication

### 4. Account Management

Tasks for allowing users to manage their accounts:

- [ ] Profile page links to account settings page
- [ ] Be able to edit username and age range after signup on account settings page
- [ ] Be able to delete account (server-side mutation)

### 5. Testing & Validation

Tasks to ensure the authentication system works as expected:

- [ ] Create authentication flow test cases
- [ ] Test cross-device synchronization
- [ ] Validate token security and refresh flow
- [ ] Test social login providers on all platforms
- [ ] Verify magic link email delivery and validation
- [ ] Test account management functions
- [ ] Validate token exchange and rotation functionality
- [ ] Test client-side token storage security

## Phased Implementation Approach

### Phase 1: Core Infrastructure
Complete all tasks in section 1 (Core Authentication Infrastructure) to establish the foundation.

### Phase 2: Basic Authentication
Implement sections 2 (Account Creation) and 3 (Session Management) to enable users to sign up and maintain sessions.

### Phase 3: Account Controls
Complete section 4 (Account Management) to give users control over their accounts.

### Phase 4: Data Synchronization
Complete section 5 (Cross-Device Synchronization) to enable seamless experience across devices.

### Phase 5: Testing & Refinement
Complete thorough testing (section 7) and address any issues before final deployment.