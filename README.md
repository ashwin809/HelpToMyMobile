# HelpToYou

HelpToYou is an Expo and React Native application for education guidance and community support. It runs on Android, iOS, and the web.

## Current state

This repository is a working product foundation, not a production-ready community service.

- Firebase Authentication handles email/password registration, sign-in, and password reset.
- Firebase Firestore stores authenticated user profiles, chat, reports, blocking, and notification data.
- Questions, replies, upvotes, mentor connections, and the member directory still use device-local storage or are not connected to a shared service. They are not visible to other users.
- The academic assistant is unavailable until a real AI service is configured; it does not generate responses.
- There are no sample accounts or fabricated community posts. Existing installations remove the app's old sample records during database initialization while preserving user-created local records.
- Contact submission and website-specific applicant, sponsor, volunteer, and profile workflows need a confirmed API contract. The existing website uses ASP.NET Web Forms; the app does not guess REST endpoints.
- Firestore security changes in `firestore.rules` must be deployed to Firebase before they protect the live project.

Do not present local preview content as a live, shared community or use this build to process real applicant information until the remaining backend and security work is complete.

## Run locally

1. Install Node.js and npm.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and configure the Firebase web API key for the Firebase project in `src/services/firebaseConfig.ts`.
4. Start the web preview with `npm run web`, or start Expo for a device/simulator with `npm run start:native`.
5. Run the TypeScript check with `npm run ts:check`.

Never commit `.env` or credentials. Keep public runtime configuration limited to values intended for client applications.

## Backend and release work

See [APP_PLAN.md](APP_PLAN.md), [API_CONTRACT.md](API_CONTRACT.md), and [TODO.md](TODO.md) for the data model, integration gaps, and release checklist. In particular, the shared question feed, mentor directory, connections, and role verification need production services and rules before release.
