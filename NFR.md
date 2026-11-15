# HelpToYou non-functional requirements

This baseline uses React Native with TypeScript for the mobile client, Node.js with Express for the API, and PostgreSQL for application data. Supabase is not configured or used. The mobile app, API, database, and deployment configuration are separate from Agoura Math Circle.

## Release decisions and controls

| ID | Baseline status |
| --- | --- |
| NFR-01 Platform | Expo SDK 58 supports the current iOS and Android development targets. The exact minimum iOS version and Android API level remain release decisions and must be recorded in `app.json`/native build configuration before production distribution. |
| NFR-02 Maintainability | API routes and role behavior are documented in `API_CONTRACT.md`; environment setup is documented in `README.md` and `.env.example`; shared TypeScript models are under `src/models`. |
| NFR-03 Backend and data | Node.js and PostgreSQL are the selected baseline. Supabase is not part of the architecture. Database changes are versioned under `server/migrations`. |
| NFR-04 Security | Passwords use bcrypt; sessions use revocable server-side records and signed JWTs; Calendar refresh tokens are encrypted; provider keys remain in `server/.env`; the mobile client contains only the API base URL. |
| NFR-05 Privacy | Public directory queries omit email, address, phone, and mobile. Backend role and ownership checks protect authenticated actions; profile collection is limited to the approved account and profile fields. |
| NFR-06 Reliability | API errors use safe messages, rate limits and timeouts are configured, mobile requests expose loading/empty/error/retry states, and profile setup saves each completed step. |
| NFR-07 Accessibility | Shared inputs and buttons provide labels, required markers, error text, focus styling, disabled/loading states, and minimum touch-friendly button dimensions. Role and selection controls expose accessible states. |
| NFR-08 Separation | No Agoura Math Circle integration, shared storage, or shared authentication boundary is configured. |
| NFR-09 Observability | API failures receive a request ID and are logged with method, path, error name, and code without logging request bodies, tokens, passwords, or provider responses. The request ID is returned to clients for support. |

Before production release, record the supported OS matrix, configure TLS and managed PostgreSQL operations, establish backups/monitoring, and complete the privacy and security review.
