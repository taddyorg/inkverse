# Inkverse Authentication – PRD

### TL;DR

Inkverse authentication will provide a seamless, low-friction way for users to create accounts, sign in across devices, and access personalized features without disrupting their reading experience. The system will support social login (Google, Apple) and passwordless email login via magic links, with a focus on maintaining the app's minimalist, reader-friendly approach while enabling greater personalization and cross-device continuity.

---

## Goals

### Business Goals

- Increase user retention by enabling cross-device reading progress sync
- Enable personalized features that drive deeper engagement with content
- Support future monetization options through authenticated user accounts
- Build a foundation for community features that align with Inkverse's focus on discovery and engagement

### User Goals

- Access personalized features like reading progress, custom lists, and recommendations
- Maintain a consistent reading experience across multiple devices
- Control personal data and privacy preferences easily
- Sign up and sign in with minimal friction or interruption to reading

### Non-Goals

- Implementing a password-based authentication system
- Creating a complicated profile system with extensive user information
- Requiring authentication for basic reading functionality
- Developing social networking features beyond the core authentication scope
- Converting all existing anonymous users to registered users
- Offline login capabilities when network connectivity is limited
- Handling account merging when users create multiple accounts

---

## User Stories

### Primary Persona – "Casual Comic Reader"

- As a new user, I want to browse and read comics without being forced to create an account, so I can explore content before committing.
- As a reader, I want to save my reading progress, so I can continue reading where I left off on any device.
- As a returning user, I want to log in quickly without typing passwords, so I can get back to reading immediately.
- As a privacy-conscious user, I want to control my account data, so I can manage what information is stored about me.
- As a reader using multiple devices, I want my preferences to sync automatically, so I don't have to recreate them on each device.
- As a new or returning user, I want to sign up Google or Apple so I can create an account without typing.
- As a new or returning user, I want to sign up with email so I don't need to use a social login.
- As a new or returning user, If I signup with Google but later forget and try to sign up or login with the same email via Apple or email authentication, it should not create multiple accounts.
- As a mobile user using Chrome, I want sign in with one click using Google.

---

## Functional Requirements

- **Account Creation** (Priority: High)
  - Social login integration (Google, Apple) on both web and mobile
  - Email-based passwordless authentication with magic links
  - Post-signup onboarding to collect username and age information
  - Age verification with age range buckets (Under 18, 18-24, 25-34, 35+)
  - Year of birth collection for users under 18
  - Able to leave signup flow and return to reading comics without creating an account

- **Authentication Flow** (Priority: High)
  - Mobile-optimized login screens
  - Web-responsive login interface
  - Persistent login with secure refresh tokens

- **Data Synchronization** (Priority: High)
  - Reading progress synced across devices
  - Custom lists and library content synced across devices
  - Liked and bookmarked content synced across devices

- **Account Management** (Priority: Medium)
  - Account settings accessible from profile section
  - Email address update functionality
  - Username and age information edit functionality
  - Connected social accounts management
  - Account deletion with clear data removal explanation
  - Logout functionality on all platforms

- **Authentication-Gated Features** (Priority: Medium)
  - Clear indication of which features require authentication
  - Smooth prompting for authentication when needed

- **Security Measures** (Priority: High)
  - Secure token storage
  - Token refresh mechanism

---

## User Experience

### Entry Point & Onboarding

- Users can access and read most content without authentication
- Authentication prompts appear when users attempt to:
  - Create a custom list
  - Save reading progress across devices
  - Access premium/early content
  - Comment or engage socially
- Soft prompts for authentication appear occasionally on the home screen or after completing multiple episodes
- First-time authentication includes minimal onboarding that highlights the benefits
- After signup, users proceed through a brief onboarding flow to:
  - Select a username (required)
  - Choose an age range (Under 18, 18-24, 25-34, 35+), users selecting "Under 18" will be prompted to enter their birth year for appropriate content filtering (required)

### Core Experience

- **Step 1:** User is reading comics in anonymous mode
- **Step 2:** User attempts to save progress or create a list, triggering authentication prompt
- **Step 3:** User selects preferred authentication method (Apple, Google, or Email)
- **Step 4:** For social login, standard signup / login modal appears
- **Step 5:** For email, user enters email and receives magic link
- **Step 6:** Upon successful authentication, user returns to previous activity with new capabilities
- **Step 7:** Reading progress and preferences now automatically sync across devices when the user logs in elsewhere

### Advanced Features & Edge Cases

- Offline authentication support with cached tokens
- Session recovery if connection is interrupted during authentication
- Automatic token refresh when expired
- Account merging process if a user has used multiple auth methods
- Recovery options if user loses access to authentication method
- Ability to update username and age information through profile settings

### UI/UX Highlights

- Authentication modals are minimal, non-intrusive, and on-brand
- Clear visual indicators of authenticated state (subtle profile icon)
- Authentication forms follow accessibility best practices
- Responsive design ensures consistent experience across all device sizes
- Error messages are clear, helpful, and jargon-free
- Authentication UI maintains the minimalist aesthetic of the main app

---

## Narrative

Alex is a college student who discovers Inkverse while searching for new indie comics. They start by casually browsing some popular series without creating an account. After reading a few episodes of "Moonlight Creatures," they're hooked and want to save their progress.

On the Profile Screen, Alex taps the "Sign Up" button, a modal appears offering Google, Apple, or email sign-in options. Alex chooses Google, and with two taps, their account is created. They're then guided through a quick onboarding where they select the username "comicexplorer" and indicate they fall in the 18-24 age range. A brief welcome message highlights that their reading progress will now be saved and synced across devices.

Later that week, Alex opens Inkverse on their laptop between classes. They're automatically prompted to log in with Google, and after doing so, they're logged into their account, with access to their saved reading progress and custom lists. Alex creates a custom list called "Fantasy Favorites" to organize the series they've discovered.

That weekend, back on their phone, all of Alex's lists and progress have seamlessly been synced.

---

## Success Metrics

### User-Centric Metrics

- Authentication conversion rate: % of users who create accounts after using the app
- Authentication abandonment rate: % of users who start but don't complete authentication
- Feature adoption: % increase in use of authenticated-only features
- Session frequency: Average number of reading sessions per week for authenticated vs. non-authenticated users

### Business Metrics

- User retention: 7-day, 30-day, and 90-day retention rates before and after authentication implementation
- Engagement depth: Average reading time and episodes completed for authenticated vs. non-authenticated users
- Premium conversion: % of authenticated users who access premium content
- Feature utilization: % of authenticated users who create lists, like content, or use other personalization features

### Technical Metrics

- Authentication success rate: % of authentication attempts that succeed
- Authentication response time: Average time to complete authentication process
- Token refresh success rate: % of successful token refreshes
- Error rates: % of users experiencing authentication errors
---

## Technical Considerations

### Technical Needs

- JWT-based authentication system
- OAuth integration for Google and Apple
- Email service integration for magic links
- Secure token storage mechanism
- Cross-platform implementation (web, iOS, Android)

### Integration Points

- Google Sign-In API
- Apple Sign-In API
- Email delivery service

### Data Storage & Privacy

- Minimal user data collection (email address, username, age range, birth year for under 18)
- Clear user data deletion process upon account termination
- Compliance with GDPR, CCPA, and other privacy regulations
- Transparency about data usage in privacy policy
- No sharing of authentication data with third parties
- Age information used for content filtering and recommendation purposes only

### Scalability & Performance

- Authentication services must handle peak traffic periods
- Performance target: < 2 second authentication completion time

### Potential Challenges

- Social login provider changes to their APIs
- Email deliverability issues for magic links
- Cross-device sync conflicts