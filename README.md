# HelpToYou

HelpToYou is an Expo and React Native app for education guidance and community support. The mobile app uses a Node.js REST API with PostgreSQL for its application backend.

## Architecture baseline and open decisions

- The mobile client is React Native with TypeScript. Its application identifier is `org.helptoyou.mobile`.
- The current backend baseline is the HelpToYou Node.js API with PostgreSQL. PostgreSQL is the selected database direction; SQL Server migration is outside this baseline.
- Supabase is not currently configured or used. Whether to add selected Supabase services remains an architecture decision; do not introduce them until that decision is confirmed.
- HelpToYou has its own account, data, and deployment boundary. The mobile app does not integrate with Agoura Math Circle; any future integration requires separate approval.
- Email is the account identifier. Social sign-in and mandatory email verification are undecided. Current email/password registration does not require verified email.
- Appointment requests and mentor office hours are implemented in the app and Node API. Confirmed sessions can be added to a connected user's primary Google Calendar using the Calendar Events scope.

## Backend status

- Node.js API: Express, request validation, rate limits, and bearer-token sessions.
- PostgreSQL stores accounts, private profiles, community questions and replies, votes, mentor connections, chat, notifications, reports, blocks, push tokens, and contact messages.
- Passwords are hashed with bcrypt. API sessions are signed JWTs backed by revocable database session records.
- Community, mentor discovery/connections, chat, safety actions, notifications, and contact messages use the Node API. Chat and notification updates currently poll the API.
- The academic assistant sends authenticated requests to the Node API, which calls the configured LLM provider. The provider key stays in `server/.env`; assistant conversations are not saved to PostgreSQL.
- The mobile app and active backend use the HelpToYou Node API and PostgreSQL for application data and authentication.

The local PostgreSQL schema is initialized and the database runs in a Docker volume. The API is still a local development service, not a deployed production host. Password recovery is implemented but requires SMTP credentials in `server/.env`. Email verification, account export/deletion, and production operations still need implementation. Existing device-local content is not automatically copied into PostgreSQL.

## Run the API locally

1. Install Node.js 22 or later and Docker Desktop (or install PostgreSQL yourself).
2. Start the local PostgreSQL container with `npm run db:up`. It creates the `helptoyou` database and keeps its data in a Docker volume. The default password is for local development only; set `POSTGRES_PASSWORD` in your shell before starting if you want a different one.
3. Copy `server/.env.example` to `server/.env`; make `DATABASE_URL` use the same database credentials, set a random `JWT_SECRET` with at least 32 characters, and set `LLM_API_KEY` plus `LLM_MODEL` for the academic assistant. Keep the provider key in `server/.env`, never in the mobile app's `.env`.
4. Install API dependencies with `npm --prefix server ci`.
5. Create the schema with `npm run db:migrate`.
6. Start the API with `npm run api:dev`.
7. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL`. Use `http://localhost:4000` for web or the iOS simulator, `http://10.0.2.2:4000` for the Android emulator, or your computer's LAN IP for a physical device.
8. Start the app with `npm run web` or `npm run start:native`.

For a native Android build from a fresh checkout, generate a local debug keystore first (requires the JDK):

```sh
keytool -genkeypair -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US" -keyalg RSA -keysize 2048 -validity 10000
```

Signing keystores and local `.env` files stay outside Git.

Stop the database with `npm run db:down`. This preserves its data volume; `docker compose down -v` deletes the local database data.

The API health endpoint is `GET /health`. Do not commit either `.env` file or production credentials.

The authenticated assistant endpoint is `POST /api/v1/ai/assistant`. It accepts `{ "message": "...", "history": [{ "role": "user" | "assistant", "content": "..." }] }` and returns `{ "reply": "..." }`. The default provider configuration uses Groq's OpenAI-compatible Responses API; set `LLM_API_URL` and `LLM_MODEL` to values supported by your provider account. The endpoint limits each message and conversation history and applies a per-IP request limit.

## Password recovery email

The API sends password reset links through SMTP. For Gmail or Google Workspace, set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, and `SMTP_SECURE=false` in `server/.env` (STARTTLS). Set `SMTP_USER` to the full sending email address, `SMTP_PASS` to a Google app password, and `SMTP_FROM` to a sender name plus that address. A Google app password requires 2-Step Verification and may be unavailable for some managed Workspace accounts. Set `APP_PUBLIC_URL` to the web app origin. The app URL must be reachable from the device opening the email; `http://localhost:8081` is suitable only for this computer's local web presentation. Never commit SMTP credentials. Restart the API after editing `server/.env`.

Reset links expire after 30 minutes, can be used once, and are stored in the database as SHA-256 hashes. Resetting a password revokes the account's existing sessions.

## Google Calendar setup

Calendar linking uses server-side Google OAuth. The app requests only `https://www.googleapis.com/auth/calendar.events`; refresh tokens are encrypted in PostgreSQL and never returned to the mobile client. A user connects their Google account from Mentor office hours, then explicitly adds each accepted appointment. Disconnecting removes the stored token and requests token revocation.

1. In Google Cloud Console, enable the Google Calendar API and create a Web application OAuth client.
2. Add the exact value of `GOOGLE_OAUTH_REDIRECT_URI` as an authorized redirect URI in that OAuth client. It must point to the public HTTPS Node API at `/api/v1/calendar/google/callback`.
3. Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, and a stable 32-byte hex `GOOGLE_TOKEN_ENCRYPTION_KEY` in `server/.env`. Generate the encryption key with `openssl rand -hex 32`; keep it backed up and secret, because changing it prevents decrypting existing Calendar refresh tokens.
4. Run `npm run db:migrate` and restart the API.

For local-device development, the OAuth callback still needs a publicly reachable HTTPS address that forwards to the same API instance and database. The Metro API proxy alone does not expose the OAuth callback to Google. Configure the OAuth consent screen and authorized test users in Google Cloud Console as required by your deployment.

## Checks

- App types: `npm run ts:check`
- API syntax: `node --check server/src/index.js`
- Database schema: `schema.sql`
- Non-functional requirement baseline: [NFR.md](NFR.md)

## Production work

See [TODO.md](TODO.md) for the PostgreSQL migration, security review, email delivery, testing, and deployment checklist. Configure TLS, a managed PostgreSQL database, API hosting, backups, monitoring, privacy policy, and support contact before processing real user data.
