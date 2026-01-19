# Authentication Journey Epic

**Status**: 📋 PLANNED  
**Goal**: Implement secure OAuth-based authentication (Google/Apple) with magic link fallback, enabling users to access Rigdzen features without password management burden

## Overview

Users need frictionless, secure authentication to access Rigdzen features (meal ordering, practice tracking, calendar). Traditional password-based auth creates barriers for diverse age groups and maintenance overhead. By implementing OAuth 2.0 (Google/Apple) as primary method with email magic link fallback, we eliminate password management while maintaining security. The system automatically creates accounts, links OAuth providers by email, and manages 7-day sessions with auto-refresh.

---

## Database Schema for Authentication

Extend Prisma schema with User model, OAuth accounts, and session management.

**Requirements**:
- Given a new authentication system, should store user email, name, role, and timestamps
- Given OAuth authentication, should store multiple OAuth provider IDs per user (Google ID, Apple ID)
- Given account linking, should support multiple OAuth providers linked to same email address
- Given dietary restrictions, should store optional dietary preferences as JSON array
- Given profile completion, should track whether first-time user has completed profile

---

## Login Page UI

Create public login page with Rigdzen logo and OAuth authentication buttons.

**Requirements**:
- Given an unauthenticated user, should display login page with logo and OAuth buttons (Google, Apple)
- Given OAuth provider selection, should show magic link fallback option clearly labeled
- Given diverse age groups, should use clean, minimal design with clear visual hierarchy

---

## OAuth Integration - Google

Implement Google OAuth 2.0 flow with redirect and callback handling.

**Requirements**:
- Given user clicks "Continue with Google", should redirect to Google OAuth consent screen
- Given OAuth callback, should exchange authorization code for access token and ID token
- Given ID token, should extract user email and name for account creation
- Given successful authentication, should redirect back to Rigdzen with auth state

---

## OAuth Integration - Apple

Implement Apple Sign-In OAuth flow handling email hiding feature.

**Requirements**:
- Given user clicks "Continue with Apple", should redirect to Apple Sign-In
- Given Apple authentication, should handle private relay email addresses for account linking
- Given ID token, should extract user email (or relay email) and name for account creation

---

## Account Creation and Linking

Create or link user accounts based on OAuth email matching.

**Requirements**:
- Given first-time OAuth authentication, should automatically create user account from ID token data
- Given existing email match, should link OAuth provider to existing account instead of creating duplicate
- Given multiple OAuth providers, should store all provider IDs on same user account
- Given account creation, should assign default participant role (non-admin)

---

## Magic Link Authentication

Implement email-based passwordless authentication as OAuth fallback.

**Requirements**:
- Given OAuth failure or user preference, should provide email magic link option
- Given email submission, should generate secure, time-limited (15-minute) magic link token
- Given magic link click, should validate token expiration and single-use, then authenticate user
- Given used or expired link, should reject authentication and prompt for new link

---

## Session Management

Implement 7-day session creation with auto-refresh and secure storage.

**Requirements**:
- Given successful authentication, should create secure session token with user ID and role
- Given 7-day expiration, should auto-refresh tokens before expiration to maintain active session
- Given session storage, should use httpOnly Secure SameSite=Strict cookies (not localStorage)
- Given expired session, should redirect to login with clear expiration message

---

## Profile Completion (First-Time Users)

Display profile completion form after account creation for first-time users only.

**Requirements**:
- Given first-time user after account creation, should show profile completion screen
- Given name field, should pre-fill from OAuth data and allow editing before confirmation
- Given dietary restrictions, should provide optional field with common options (vegetarian, vegan, gluten-free, allergies)
- Given optional fields, should allow skip with ability to complete later from account settings
- Given profile completion, should redirect to dashboard after confirmation

---

## Protected Routes and Dashboard

Implement route protection and dashboard redirect after authentication.

**Requirements**:
- Given authenticated user, should allow access to protected routes (dashboard, features)
- Given unauthenticated user, should redirect to login page from protected routes
- Given successful authentication, should redirect to dashboard automatically
- Given session validation, should check session on protected route access

---

## Error Handling and Edge Cases

Handle OAuth failures, account conflicts, and authentication errors gracefully.

**Requirements**:
- Given OAuth provider failure or timeout, should display clear error message with magic link fallback option
- Given different OAuth provider with non-matching email, should create new account (no auto-linking)
- Given session expiration during use, should detect and redirect to login with expiration message
- Given magic link delivery issues, should provide helpful error message about email delivery
