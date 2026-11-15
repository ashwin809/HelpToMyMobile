# HelpToYou Node API

Base URL: `EXPO_PUBLIC_API_BASE_URL` in the Expo app. JSON endpoints are versioned under `/api/v1`. Authenticated routes require `Authorization: Bearer <session-token>`.

## Implemented routes

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API and database health |
| POST | `/api/v1/auth/register` | Public, rate limited | Create account and session |
| POST | `/api/v1/auth/login` | Public, rate limited | Sign in and create session |
| POST | `/api/v1/auth/logout` | Authenticated | Revoke current session |
| GET | `/api/v1/auth/me` | Authenticated | Read own profile |
| PATCH | `/api/v1/profile` | Authenticated | Update own profile |
| POST | `/api/v1/contact-messages` | Public, rate limited | Submit a contact message |
| GET/POST | `/api/v1/community/questions` | Authenticated / Student or Applicant | Search/feed questions; learners can create questions |
| GET | `/api/v1/community/questions/:id` | Authenticated | Read question and up to 200 replies |
| POST | `/api/v1/community/questions/:id/responses` | Professor or Alumni | Reply with academic or mentoring guidance |
| POST | `/api/v1/community/questions/:id/responses/:responseId/accept` | Question author | Choose the answer that resolved the question |
| POST | `/api/v1/community/questions/:id/vote` | Authenticated | Toggle own vote |
| POST | `/api/v1/community/questions/:id/resolve` | Authenticated | Resolve own question |
| GET | `/api/v1/mentors` | Authenticated | Search public faculty and alumni mentor profiles |
| GET/POST | `/api/v1/connections` | Authenticated / Student or Applicant for requests | List connections or request a faculty/alumni connection |
| PATCH | `/api/v1/connections/:id` | Authenticated / mentor for accept or decline | Respond to or cancel a request |
| GET/POST | `/api/v1/blocks` | Authenticated | List or block account |
| DELETE | `/api/v1/blocks/:userId` | Authenticated | Unblock account |
| POST | `/api/v1/reports` | Authenticated | Submit a moderation report |
| GET | `/api/v1/notifications` | Authenticated | List own notifications |
| PATCH | `/api/v1/notifications/:id/read` | Authenticated | Mark own notification read |
| POST/DELETE | `/api/v1/push-tokens` | Authenticated | Register or remove own Expo push token |
| GET/POST | `/api/v1/chat/threads` | Authenticated | List or create one-to-one conversation |
| GET/POST | `/api/v1/chat/threads/:id/messages` | Participant | List messages or send a message |
| PATCH | `/api/v1/chat/threads/:id/messages/:messageId/read` | Participant | Mark received message read |
| GET/POST | `/api/v1/study-circles` | Authenticated | Browse or create study circles |
| POST | `/api/v1/study-circles/:id/join` | Authenticated | Join a study circle |
| GET/POST | `/api/v1/study-circles/:id/posts` | Circle member | Read or post a circle discussion update |
| GET/POST | `/api/v1/office-hours` | Authenticated / Professor or Alumni for publishing | Browse or offer a future session |
| POST | `/api/v1/office-hours/:id/book` | Student or Applicant | Request a session |
| PATCH | `/api/v1/office-hour-bookings/:id` | Professor or Alumni | Accept or decline a session request |
| GET | `/api/v1/calendar/google/status` | Authenticated | Check Google Calendar configuration and connection state |
| POST | `/api/v1/calendar/google/connect` | Authenticated | Start Google OAuth consent for calendar events |
| GET | `/api/v1/calendar/google/callback` | Google OAuth callback | Verify OAuth state and store an encrypted refresh token |
| DELETE | `/api/v1/calendar/google/connection` | Authenticated | Disconnect and revoke the user's Google Calendar token |
| POST | `/api/v1/calendar/google/events` | Confirmed appointment participant | Add an accepted office-hour appointment to the user's primary calendar |
| GET/POST | `/api/v1/opportunities` | Authenticated / Professor or Alumni for publishing | Browse or publish an opportunity |
| POST | `/api/v1/opportunities/:id/save` | Authenticated | Toggle a saved opportunity |
| GET/POST | `/api/v1/goals` | Authenticated | List or create own learning goals |
| PATCH/DELETE | `/api/v1/goals/:id` | Goal owner | Update progress or remove a goal |
| GET/POST | `/api/v1/resources` | Authenticated | Browse or share a learning resource |

Responses use `{ item }` or `{ items }` envelopes. Errors use `{ error }`; validation errors may include a `details` array. Profile directory responses omit email, address, phone, and mobile.

## Connection request lifecycle

Only Student and Applicant roles may request a connection with a Professor or Alumni profile. A recipient can disable connection requests in Profile settings; disabled profiles are excluded from the mentor directory and reject direct connection requests. A pending request may be accepted or declined by the recipient, or cancelled by its sender. Each pair of accounts has one connection record, so duplicate requests return the existing request and never create a second one. The recipient receives a notification when a request is created; the sender receives a notification when it is accepted or declined. Pending requests do not expire in the current MVP.

## Appointment coordination and calendar behavior

Connected learners may request a future office hour from a connected Professor or Alumni. The mentor accepts or declines the request; a learner may cancel a requested or accepted future appointment, which makes the office-hour slot available again. All appointment timestamps are validated as ISO datetimes, stored as PostgreSQL `TIMESTAMPTZ`, and shown in each device's local timezone. The Google Calendar MVP creates a private event only in the connected user's primary calendar after the appointment is accepted. It does not check availability, add guests, send invitations, synchronize changes, or reschedule events. If a user cancels after creating a Calendar event, the app tells them to remove that personal event. Google connection, token, timeout, and event-creation failures return actionable API errors; users can still use the prefilled Calendar link when their Google account is not connected.

## Role permissions

An account may select multiple roles. The API uses the union of those roles' permissions, so a Student + Alumni account can both request guidance and provide mentor guidance. All authenticated roles can view and edit their own profiles and browse community content. Student and Applicant roles can ask questions, request mentor connections, and book office hours. Professor and Alumni roles can reply to questions, receive/respond to mentorship connection requests, offer office hours, and publish opportunity listings. Sponsor roles can browse opportunities but cannot publish them. Volunteer verification actions are unavailable because no verification authority or workflow is defined yet. Community moderation and an approval workflow for published content are not implemented by this role matrix.

## Authentication and privacy

Passwords have a minimum length of eight characters and are stored as bcrypt hashes. A signed JWT references a server-side session row so logout can revoke the token before expiry. Private profile contact and address fields are returned only from the authenticated `/auth/me` and profile update responses. The mentor directory exposes only the fields selected by its SQL query.

## Known gaps

- Password recovery and email verification need a configured email provider and token flow.
- Google Calendar requires Google OAuth client credentials, an HTTPS callback URI, and a stable token-encryption key in `server/.env`.
- Connection and report moderation tools need an admin interface and authorization model.
- Chat and notification clients poll rather than use WebSockets or server-sent events.
- Community feed pagination exists in the API but the app has not added a “load more” UI.
- No deployment host, production database, backup policy, or environment secrets have been configured.
- Selected profile photos are compressed and stored as data URLs in PostgreSQL for the local app; a deployed app should move photo storage to object storage.
- Existing local-device records require an explicit export/import plan; there is no automatic migration.
