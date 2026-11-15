# Project progress

**Stage:** Core Node.js/PostgreSQL migration and local demo flow verified; production hardening remains.

## Implemented

- Express API routes and PostgreSQL schema for authentication, profiles, community questions/replies/votes, mentor discovery/connections, chat, notifications, safety, push tokens, and contact messages
- Bcrypt password hashing and revocable, database-backed JWT sessions
- Mobile service layer connected to the API for the above features
- Node.js and PostgreSQL are the app's only active backend and deployment path
- Environment examples, API contract, migration script, and setup documentation

## Not yet connected or complete

- Local PostgreSQL is running and the API health endpoint reports `database: connected`. Registration, case-insensitive login, authenticated profile update, and logout have been smoke-tested locally.
- The API is still a local development host; configure a deployed API URL before release.
- Existing local-device content is not imported.
- Password recovery, email verification, admin moderation, verified academic credentials, account export/deletion, and production operations remain future work.
- Chat and notifications use polling, and the app does not yet offer pagination controls.
- Separate organization-site workflows still require product requirements.

## Verification completed

- `npm run ts:check` passes.
- Server entry points pass Node syntax checks.
- iOS and web Metro exports complete after excluding the broken OneDrive backup directory from Metro's file crawler.
