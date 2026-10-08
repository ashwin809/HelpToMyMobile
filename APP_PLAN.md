# HelpToYou mobile architecture plan

This plan uses the audit inventory in `WEBSITE_ANALYSIS.md`, constrained by the live-site access limitation documented in `README.md` and `API_CONTRACT.md`.

## Screen inventory

- Home (hero/cause snapshot, participation choices, sign-in entry, contact and social links)
- Login
- Register: Sponsor, Volunteer (regional-lead request), Applicant, and general role selection
- Forgot Password
- What we do
- Who we are
- Contact Us
- Edit Profile (registration fields in edit mode)
- Change Password
- Logout action

No dashboard, admin, applicant case workflow, cause directory, donations, notifications, settings, or FAQ screen is included because those were not established by the audit.

## Architecture

- Expo and React Native with TypeScript; React Navigation native stack and bottom tabs
- Firebase email/password authentication with React Native AsyncStorage persistence and Firestore profiles keyed by Firebase UID
- Axios client created without a guessed base URL
- Auth and contact service contracts return an explicit backend-required error
- Reusable common inputs, buttons, cards, headers, and feedback components
- Environment configuration uses `EXPO_PUBLIC_API_BASE_URL`, unset until an API is supplied

## Backend integration gate

Firebase Authentication handles app sign-in, registration, password reset, and logout. Website-specific actions still require a mobile API contract or server-side source because the site exposes Web Forms postbacks that depend on ViewState/EventValidation; no JSON endpoint has been verified. Endpoint inventory and required backend information are in `API_CONTRACT.md`.

## Foundation acceptance

- [x] Audited pages are reachable through typed navigation
- [x] Role-specific registration entry points are represented
- [x] Backend-driven actions clearly identify missing API support
- [x] No mock login, synthetic API success, guessed endpoint, or fake seed record remains in active services
- [x] TypeScript check passes
- [x] Expo configuration resolves and Metro bundles Android/iOS
- [ ] Backend API contract supplied and connected
- [ ] Live-site flows and role permissions verified
