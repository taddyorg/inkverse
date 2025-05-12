# Inkverse Authentication System – PRD

### TL;DR

A cross-platform authentication system for Inkverse that enables users to create accounts and sign in seamlessly across web and mobile platforms using social logins (Google, Apple) and email. Authentication is optional for basic app functionality - users can read comics without signing up. Account creation is only required for specific features like recommending comics, creating lists, or tracking reading progress. Add signup onboarding to collect username and age data.

---

## Goals

### Business Goals

- Increase user retention by enabling cross-device reading experiences
- Gather more accurate user demographic data to inform content recommendations and show age-appropriate content
- Improve conversion from anonymous readers to registered users
- Enable future personalization features that require user accounts

### User Goals

- Access personalized reading experience across multiple devices
- Save reading progress, lists, and preferences in one account
- Create an account quickly without interrupting the reading flow
- Feel confident that personal data is secure and properly used

### Non-Goals

- Complex profile creation with excessive personal information
- Manual account verification processes that add friction
- Offline login capabilities when network connectivity is limited
- Handling account merging when users create multiple accounts

---

## User Stories

### Primary Persona – "Comic Fan Across Devices"

- As a mobile reader, I want to sign in with my Google or Apple account so I can create an account without typing.
- As a web reader using Chrome, I want one-click Google sign-in so I can quickly access my account.
- As a web reader not using Chrome, I want to use Google or Apple or email to sign up or sign in.
- As a new user, I want to set my username and age during onboarding so I get age-appropriate content.
- As a mobile or web reader, I want to be able to continue as a guest so I can browse and read without creating an account.
- As a security-conscious user, I want to understand what data is collected so I can feel comfortable creating an account.
- As a returning user, I want to stay logged in across sessions so I don't have to authenticate repeatedly.

---

## Functional Requirements

- **Authentication Methods** (Priority: High)
  - Social login with Google (Mobile and Web)
  - Social login with Apple (Mobile and Web)
  - Email with magic link registration/login (Mobile and Web)
  - "Continue as Guest" option with clear messaging about which features remain accessible

- **Authentication Triggers** (Priority: High)
  - Strategic CTAs requiring authentication (recommending comics, creating lists, etc.)
  - Clear messaging about why authentication is needed for specific features
  - Non-disruptive prompts that don't interrupt the core reading experience

- **User Profile** (Priority: Medium)
  - Username creation with availability check
  - Age verification (bucketed by age group: Under 18, 18-24, 25-34, 35+). If the user is under 18, get them to pick the year they were born.

- **Web Signup Experience** (Priority: Medium)
  - Login state persistence with secure cookies (JWT tokens)

- **Account Management** (Priority: Low)
  - Update email address (confirm via magic link)
  - Logout option
  - Delete account option

---

## User Experience

### Entry Point & Onboarding

- User discovers Inkverse through web or app stores
- First-time users can browse and read all content without an account
- Strategic signup prompts appear only when accessing personalized features (recommending comics, creating lists, marking favorites)
- One-tap social login or simplified email registration
- Two-screen onboarding for username and age selection

### Core Experience

**Step 1:** User installs app or visits website
**Step 2:** User browses and reads content as guest with no login required
**Step 3:** When user attempts to use a feature requiring authentication (e.g., recommending a comic), a signup prompt appears
**Step 4:** User selects authentication method (Google, Apple, Email)
**Step 5:** After authentication, user enters age, then on a new screen enters username
**Step 6:** User returns to the feature they were attempting to use, now with full access
**Step 7:** When switching devices, user logs in with same credentials
**Step 8:** All preferences, reading history, and lists are immediately available

### Advanced Features & Edge Cases

- Magic link login flow for email accounts for returning users
- Simple / Graceful handling of authentication provider outages

### UI/UX Highlights

- Clean, minimal login screens that don't distract from content
- Persistent login state across app restarts
- Clear indicators of logged-in state
- Accessibility considerations for all authentication flows

---

## Success Metrics

### User-Centric Metrics

- % of new users who complete account creation
- % of users with accounts on both mobile and web
- Average time to complete signup process
- User retention rate for logged-in vs. anonymous users

### Business Metrics

- Increase in cross-platform usage
- Growth in registered user base
- Improvement in content engagement metrics

### Technical Metrics

- Authentication success rate
- Sync reliability across platforms
- Login load time performance

### Tracking Plan

- Account creation events by source
- Social login provider distribution
- Onboarding completion rate
- Cross-device authentication events

---

## Technical Considerations

### Technical Needs

- Authentication service with support for multiple providers
- Secure user data storage
- Cross-platform identity management
- JWT token-based authentication system

### Integration Points

- Google Identity Services API
- Apple Sign In API
- Use email as the unique identifier for Google, Apple, and email (Same that the same user does not have multiple accounts if they use the same email on multiple authentication providers)
- JWT token system for authentication
- Backend user database

### Data Storage & Privacy

- Save Username and Age
- Authentication tokens only stored on frontend device
- Compliance with COPPA and other relevant privacy regulations

### Scalability & Performance

- Efficient token refresh mechanisms. Refresh tokens (180 days) and access tokens (2 hours) are stored on the frontend device. You can use the refresh token to get a new access token when it expires. 

### Potential Challenges + Solutions
- Maintaining security while preserving convenience