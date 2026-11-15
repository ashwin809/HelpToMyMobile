# HelpToYou mobile architecture

## App

- Expo and React Native with TypeScript
- React Navigation native stack and bottom tabs
- Axios API client using `EXPO_PUBLIC_API_BASE_URL`
- Shared API services for auth, own profile, Community, mentor discovery and connections, chat, notifications, safety reports/blocks, push token registration, and contact submissions
- Reusable common inputs, buttons, cards, headers, and feedback components

## Backend

- Node.js 22+, Express 5, PostgreSQL, `pg`, Zod validation, Helmet, CORS, and express-rate-limit
- Bcrypt password hashes and signed, database-revocable JWT sessions
- SQL schema in `schema.sql`; one-time initial migration via `server/src/migrate.js`
- SQL ownership checks ensure sessions and user-scoped actions use the authenticated user ID
- Private profile contact fields are omitted from the mentor directory query
- Chat/notification updates currently poll the API; no realtime transport is configured

## Architecture constraints

- The mobile client uses React Native and TypeScript. The active app backend is Node.js with PostgreSQL; PostgreSQL is the current database baseline, and SQL Server migration is out of scope.
- Supabase is not configured. Any selected Supabase service requires confirmation of the final service architecture before implementation.
- HelpToYou authentication, data storage, and deployment remain separate from Agoura Math Circle. No integration is configured; integration requires separate approval.
- Email is the required initial account identifier. Social sign-in and mandatory email verification remain undecided.
- Google Calendar integration is scoped to explicitly adding accepted appointments to a user's primary calendar, with the Calendar Events OAuth scope and refresh tokens encrypted by the Node API.

## Remaining product decisions

- Configure a real API host before end-to-end app use
- Configure password recovery email delivery; decide whether email verification is mandatory and whether social sign-in is included
- Confirm whether Supabase will provide any selected services
- Configure Google OAuth credentials, token encryption, and the public HTTPS callback before enabling Calendar linking
- Define review and approval for professional roles and moderation reports
- Decide export/import for any existing local-device records
- Confirm website-specific applicant/sponsor/volunteer workflows before implementing those distinct forms
- Configure hosting, backups, TLS, monitoring, privacy policy, account deletion, and support contact

## MVP prioritization

### P0 — Core MVP

Registration and sign-in, role selection, three-step profile setup, institution selection, profile view/edit, community browsing, helper and mentor discovery, backend authorization, and service error states are implemented as the core baseline.

### P1 — Confirm for MVP

Connection requests, community question creation and answers, notifications, profile statistics, and Google Calendar appointment support are implemented behind the current role and privacy rules. Product-owner approval is still required before treating these as release scope.

### P2 — Later phase or separate approval

Donor funding workflows, advanced student verification, advanced search and recommendations, expanded moderation/reporting, and advanced Calendar synchronization remain outside the current MVP baseline.

## Baseline decision register

1. **Authentication:** Email/password is the current required sign-in method. Email verification is not mandatory in the current build. Google sign-in is not required for the baseline.
2. **Roles:** Users may select multiple roles and may change them later from profile settings.
3. **Profile:** Email and password are required at account creation; first and last name plus one primary role are required in setup. Institution, field, expertise, specialization, biography, and contact details are optional. No identity or institution verification is in the baseline.
4. **Community:** Browsing, question posting, answers, voting, resolving a question, and reporting are implemented. Separate comments, bookmarks, and admin moderation are outside the approved baseline until explicitly added.
5. **Discovery:** Current discovery supports text search, role filtering, institution filtering, and profile-match ordering. Advanced filters and recommendation rules are deferred.
6. **Connections:** The statuses are `pending`, `accepted`, `declined`, and `cancelled`. Recipients accept or decline; senders cancel. Duplicate requests reuse the existing record. Notifications are sent for new requests and accept/decline results.
7. **Scheduling:** The first-release Calendar behavior creates a private event in the connected user’s primary Google Calendar after an appointment is accepted. It does not check availability, invite guests, synchronize changes, or reschedule.
8. **Statistics:** The signed-in user can see their own connections, conversations, questions, resolutions, answers, and resolved inquiries helped. These statistics are not exposed as private contact data to directory viewers.
9. **Sponsor/volunteer:** Funding workflows, donor transactions, student verification, and privileged volunteer verification actions are excluded from the baseline.
10. **Architecture:** Node.js and PostgreSQL provide the active backend and data services. Supabase is not configured or used.
11. **Operations:** Minimum iOS/Android versions, analytics, production support hours, incident response, backups, and retention targets still require approval before production release.
