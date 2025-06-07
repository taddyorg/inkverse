Feature:
Authentication for Inkverse. This will enable users to sign up, log in, and manage their accounts across web and mobile platforms.

## Technical Considerations
- Most of the app can be accessed without authentication, but some features are restricted to authenticated users.
- Want to use JWT for the authentication system (Access token lasts 2 hours, Refresh token lasts 180 days)
- Want to use Social Login (Google, Apple) for both web and mobile
- Want to use Email with magic link, instead of password, for both web and mobile
- Allow logout, and delete account