# Backend/API contract status

The app currently has **no confirmed JSON API calls**. The project is deliberately configured without a default API hostname or speculative `/api/...` routes.

## What the saved website pages expose

These are ASP.NET Web Forms page/postback targets, not mobile API contracts:

| Website action | Observed page target | Web Forms control / evidence | Mobile API status |
|---|---|---|---|
| Login | `Home.aspx` POST | `ctl00$MainContent$btnSubmit`; email and password controls; ViewState/EventValidation | TODO: BACKEND/API REQUIRED |
| Registration | `UserRegistration.aspx` POST, role query on Sponsor/Volunteer/Applicant variants | `ctl00$MainContent$btnSave`; role, profile fields, ViewState/EventValidation | TODO: BACKEND/API REQUIRED |
| Contact | `ContactUs.aspx` POST | `ctl00$MainContent$Submit_Comments`; name/email/subject/message | TODO: BACKEND/API REQUIRED |
| Password recovery | `ForgetPassword.aspx` POST | `ctl00$MainContent$btnSend`; email | TODO: BACKEND/API REQUIRED |
| Profile edit | `ctl00$lnkEditProfile` postback | Server navigation to edit registration data is reported by local audit notes | TODO: BACKEND/API REQUIRED |
| Password change | `ctl00$lnkreset` postback | Destination behavior and form contract unknown | TODO: BACKEND/API REQUIRED |
| Logout | `ctl00$lnkLogOut` postback | Server session clear/redirect is reported by local audit notes | TODO: BACKEND/API REQUIRED |

The Web Forms posts depend on server-generated state and session behavior. The mobile app does not replay them or infer REST equivalents. No API requests are connected until the site owner supplies an API contract (or source and approval to define a backend adapter).

## Mobile service layer

`src/api/apiClient.ts` creates a JSON HTTP client only when `EXPO_PUBLIC_API_BASE_URL` is configured. Domain service methods currently fail with `BackendApiRequiredError`; they do not make requests, fabricate success, or persist synthetic records.

## Required backend information

- Supported mobile base URL and endpoint paths, methods, request/response schemas
- Login/session model, expiry, refresh, logout, and authorization by role
- Registration field constraints and success/error responses
- Contact message submission result and rate/validation rules
- Password recovery and password-change policies
- Profile read/update contract and the identity key used by the website
- Any cause metric source if the homepage progress value must remain live

No API endpoint is currently connected.
