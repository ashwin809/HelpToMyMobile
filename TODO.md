# Node.js and PostgreSQL delivery checklist

## Local backend

- [x] Add PostgreSQL schema for application accounts, community, mentor connections, chat, notifications, safety, push tokens, and contact messages.
- [x] Add Express API routes and validation for those services.
- [x] Move app authentication, profiles, community, mentors, chat, notifications, safety actions, push-token registration, and contact messages to the Node API.
- [x] Use Node.js and PostgreSQL as the mobile app's only active backend and data service.
- [x] Configure the local PostgreSQL database and apply its migrations.
- [ ] Exercise all API routes using authenticated accounts and verify authorization boundaries (basic auth/profile smoke flow is now verified).
- [ ] Add automated API and PostgreSQL integration tests.
- [ ] Configure password recovery email delivery; decide whether email verification is mandatory.
- [ ] Confirm whether selected Supabase services will be part of the final architecture.
- [x] Implement optional Google Calendar linking for accepted appointments using the Calendar Events scope.
- [ ] Configure Google OAuth credentials, a public HTTPS callback, and the stable refresh-token encryption key.
- [ ] Keep HelpToYou data, authentication, and deployment separate from Agoura Math Circle unless a separate integration is approved.
- [ ] Store native session tokens in platform secure storage.
- [ ] Add data export/import for old local-device records if needed.
- [ ] Add admin workflows for professional-role review and report moderation.
- [ ] Add user-visible feed/message pagination, offline handling, and submit deduplication.
- [ ] Replace polling for chat and notification updates if realtime delivery is required.

## Release

- [ ] Choose API and PostgreSQL hosting; configure TLS, secrets, database backups, monitoring, and migrations.
- [ ] Verify Android, iOS, and web against the deployed API.
- [ ] Complete accessibility, privacy, account deletion, retention, and support-contact review.
- [ ] Obtain and verify any organization-specific applicant, sponsor, and volunteer workflow requirements before implementing them.
- [ ] Confirm fundraising metrics with an authoritative source before showing progress numbers.
