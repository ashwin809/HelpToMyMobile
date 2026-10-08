# HelpToYou (helptoyou.org) — Website Analysis & Investigation

**Analysis Date:** September 2026  
**Target URL:** `http://helptoyou.org/Home.aspx`  
**Domain:** helptoyou.org  
**Technology Stack:** ASP.NET 4.0 / WebForms (IIS, C#/.NET backend, Microsoft SQL Server database)  
**Primary Brand Color:** `#00BD62` (Vibrant Emerald / Charity Green)  
**Secondary Colors:** `#303030` (Charcoal dark), `#4b4b4b` (Slate), `#f5f5f5` / `#ffffff` (Card & Background)  

---

## 1. Website Pages

Through automated crawling, HTTP header probing, form postback execution, and code inspection, the following pages were verified:

| Page URL | Status | Description | Access / Roles |
| :--- | :--- | :--- | :--- |
| `Home.aspx` | 200 OK | Main landing page: hero slider, organization overview, fundraising/cause progress meter, sign-in widget, role cards (Sponsor, Volunteer, Applicant), social share links. | Public / All |
| `whatWeDo.aspx` (also `WhatWeDo.aspx`) | 200 OK | Explains the mission of HelpToYou, how the screening and matching process works, and how applications are handled. | Public / All |
| `AboutUs.aspx` | 200 OK | "Who we are" mission statement and profiles of the core leadership/team members (Pranav Kalyan, Senthil Krishnaswamy, Sathya Ramaswamy, Manivannan Arumugam, Kalyana Kumar Mohan) with LinkedIn/web links. | Public / All |
| `ContactUs.aspx` | 200 OK | Contact information (`info@helptoyou.org`) and interactive message submission form (Email, Name, Subject, Message). | Public / All |
| `ForgetPassword.aspx` | 200 OK | Password recovery form requesting registered Email address with "Retreive Password" and "Cancel" buttons. | Public / All |
| `UserRegistration.aspx?UserType=Sponsor` | 200 OK | Comprehensive registration form for Sponsors (donors wanting to fund/support causes and students). | Public |
| `UserRegistration.aspx?UserType=Volunteer` | 200 OK | Comprehensive registration form for Volunteers (includes Regional Lead Role request checkbox). | Public |
| `UserRegistration.aspx?UserType=Applicant` | 200 OK | Comprehensive registration form for Applicants (under-privileged students/families seeking educational support). | Public |
| `UserRegistration.aspx` (plain) | 200 OK | General registration form with User Type dropdown (`ddlUserType`). | Public |
| `ChangePassword.aspx` / `lnkreset` | Postback / 200 | Change password action available in navigation bar when authenticated. | Authenticated Users |
| `EditProfile.aspx` / `lnkEditProfile` | Postback / 200 | Profile editing view that populates `UserRegistration.aspx` with user's stored data (`ctl00$MainContent$hifId`). | Authenticated Users |
| `Error.aspx` | 200 OK | ASP.NET custom error page (handles 404/500 routing). | System |

---

## 2. Website Features

1. **Hero Carousel**: 3-slide visual showcase highlighting:
   - "Help to you - Connecting those who help and those who need help" (`slide_4.png`)
   - "Give Them Hope - Make lives by giving" (`slide_2.png`)
   - "Provide Better Future - To bring about a significant positive change" (`slide_3.png`)
2. **Featured Urgent Cause / Progress Meter**:
   - Cause: "How to help anyone else"
   - Real-time progress slider: Min 0, Max 14,000, Current value 8,365 (funds raised for underprivileged education).
   - "Read more" link navigating to `whatWeDo.aspx`.
3. **Three-Tier User Participation Structure ("How you can be a part")**:
   - **Sponsor ("I would like to Help!")**: Donate and provide financial/material assistance to underprivileged individuals.
   - **Volunteer ("I would like to be Involved!")**: Volunteer energy, talents, and resources to identify recipients and coordinate logistics. Option to apply for "Regional Lead Role".
   - **Applicant ("I need help!")**: Education-focused assistance application to break the cycle of poverty.
4. **Member Authentication & Account Management**:
   - Sign-in box right on the homepage (`Email ID` + `Password`).
   - Forgot Password assistance workflow via email retrieval.
   - Session bar (`lblUserName`, `Change Password`, `Edit Profile`, `Log Out`).
5. **Direct Communication**:
   - Inquiry form on `ContactUs.aspx` sending structured email tickets to `info@helptoyou.org`.
   - Direct `mailto:info@helptoyou.org` links in header and footer.
6. **Social Sharing**:
   - One-click Facebook and Twitter sharing with pre-filled campaign URLs.
7. **Team / Foundation Transparency**:
   - Detailed team roster on `AboutUs.aspx` highlighting founders, mentors, and technologists with external LinkedIn credentials.

---

## 3. User Flows

### A. Visitor / Exploration Flow
1. Visitor arrives on `Home.aspx`.
2. Views hero slider and mission statement.
3. Views current cause progress (Raised 8,365 / Target 14,000).
4. Navigates via header to:
   - `whatWeDo.aspx` -> Learns the screening, review, and matching process.
   - `AboutUs.aspx` -> Learns about the team and foundation story.
   - `ContactUs.aspx` -> Reaches out for questions or partnerships.

### B. Registration Flow
1. From `Home.aspx`, user selects their role:
   - Clicks "Sponsor Register" -> opens `UserRegistration.aspx?UserType=Sponsor`.
   - Clicks "Volunteer Register" -> opens `UserRegistration.aspx?UserType=Volunteer`.
   - Clicks "Applicant Register" -> opens `UserRegistration.aspx?UserType=Applicant`.
2. User fills:
   - User Type (Sponsor / Volunteer / Applicant)
   - If Volunteer: "Request for regional lead role" checkbox
   - Email Address
   - First Name & Last Name
   - Address Line 1 & Address Line 2
   - City, State, Country, Postcode (numeric validation)
   - Phone & Mobile (numeric validation)
3. Clicks "Save" (Postback to database).
4. System validates inputs and displays success or error notification.

### C. Authentication Flow
1. User enters Email ID and Password into the homepage widget.
2. Clicks "Login".
3. Upon successful validation, the header updates:
   - Displays `lblUserName` (user's name/greeting).
   - Shows "Change Password" and "Edit Profile".
   - Shows "Log Out".
4. User can update profile details or change credentials.
5. Clicking "Log Out" clears session and redirects back to Home.

### D. Password Recovery Flow
1. User clicks "Forgot your password ?" on Home.
2. Navigates to `ForgetPassword.aspx`.
3. Inputs Email ID.
4. Clicks "Retreive Password".
5. Backend looks up account and sends reset instructions or password to the registered email.

### E. Contact / Support Flow
1. User navigates to `ContactUs.aspx`.
2. Fills Name, Email, Subject, and Message.
3. Clicks "Submit".
4. System submits postback, sends email/ticket, and displays status banner.

---

## 4. Forms and Fields

### Form 1: Homepage Sign In (`Home.aspx`)
- `ctl00$MainContent$txtEmail`: Text (Email ID), required (`MainContent_reqUserName`).
- `ctl00$MainContent$txtPassword`: Password, required (`MainContent_reqPassword`).
- `ctl00$MainContent$btnSubmit`: Submit button (Value: "Login", ValidationGroup: "Group1").
- Error label: `MainContent_lblError`.
- Link: `ForgetPassword.aspx` ("Forgot your password ?").

### Form 2: User Registration (`UserRegistration.aspx`)
- `ctl00$MainContent$hifId`: Hidden ID field (for record ID / edit profile mode).
- `ctl00$MainContent$ddlUserType`: Dropdown (User Type: Sponsor, Volunteer, Applicant).
- `ctl00$MainContent$chrequest`: Checkbox ("Request for regional lead role", visible/relevant for Volunteers).
- `ctl00$MainContent$txtEmail`: Text (Email Address), max length 100, required (`MainContent_EmailRequired`), regex email validator (`MainContent_remail`).
- `ctl00$MainContent$txtFirstName`: Text (First name), max length 150, required (`MainContent_FirstNameRequired`).
- `ctl00$MainContent$txtLastName`: Text (Last name), max length 150, required (`MainContent_LastNameRequired`).
- `ctl00$MainContent$txtAddress1`: Text (Address Line1), max length 150, required (`MainContent_Address1Required`).
- `ctl00$MainContent$txtAddress2`: Text (Address Line2), max length 150, optional.
- `ctl00$MainContent$txtCity`: Text (City), max length 150, required (`MainContent_RequiredFieldValidator3`).
- `ctl00$MainContent$txtPostCode`: Text (Postcode), max length 20, required (`MainContent_PostCodeRequired`), numbers only (`isNumberKey`).
- `ctl00$MainContent$txtState`: Text (State), max length 150, required (`MainContent_RequiredFieldValidator2`).
- `ctl00$MainContent$txtCountry`: Text (Country), max length 150, required (`MainContent_RequiredFieldValidator1`).
- `ctl00$MainContent$txtPhone`: Text (Phone), max length 20, optional, numbers only (`isNumberKey`).
- `ctl00$MainContent$txtMobile`: Text (Mobile), max length 20, optional, numbers only (`isNumberKey`).
- `ctl00$MainContent$btnSave`: Submit button (Value: "Save", ValidationGroup: "Group1").
- `ctl00$MainContent$btnCancel`: Cancel button (Value: "Cancel").
- Status feedback: `#divMessage` (`dnnFormMessage dnnFormSuccess` / `dnnFormValidationSummary` / `dnnFormWarning`).

### Form 3: Contact Us (`ContactUs.aspx`)
- `ctl00$MainContent$txtName`: Text (Name), required (`MainContent_RequiredFieldValidator1`: "Name can't be empty !").
- `ctl00$MainContent$txtEmailID`: Text (Email), required (`MainContent_RequiredFieldValidator4`: "Email Address can't be empty !").
- `ctl00$MainContent$txtSubject`: Text (Subject), required (`MainContent_RequiredFieldValidator3`: "Subject can't be empty !").
- `ctl00$MainContent$txtBody`: Textarea (Message), required (`MainContent_RequiredFieldValidator2`: "message can't be empty !").
- `ctl00$MainContent$Submit_Comments`: Submit button (Value: "Submit").

### Form 4: Forget Password (`ForgetPassword.aspx`)
- `ctl00$MainContent$hifId`: Hidden field.
- `ctl00$MainContent$txtEmail`: Text (Email Address), required (`MainContent_OldPasswordRequired`).
- `ctl00$MainContent$btnSend`: Submit button (Value: "Retreive Password", ValidationGroup: "Group1").
- `ctl00$MainContent$btnCancel`: Cancel button (Value: "Cancel").

---

## 5. Authentication Flow

- **Session Architecture:** Standard ASP.NET FormsAuthentication / Session state.
- **Login Credentials:** Email address (`txtEmail`) and Password (`txtPassword`).
- **Postback Mechanism:** Form submits via HTTP POST to `./Home.aspx` with ASP.NET ViewState and EventValidation payloads.
- **Post-Login State:** When valid, ASP.NET populates server controls:
  - `#lblUserName` (displays the user's name)
  - `#lnkMain` (unhides "Change Password" and "Edit Profile")
  - `#lnkOut` (unhides "Log Out")
  - Hides or collapses the login widget.
- **Logout:** Submits postback `ctl00$lnkLogOut`, abandons session, clears cookie, redirects to Home.

---

## 6. API / Backend Observations

- **Web Server:** Microsoft IIS (ASP.NET 4.0 runtime).
- **Architecture:** Classic ASP.NET WebForms (`.aspx` pages) using ASP.NET ScriptManager, UpdatePanels (`upPropertyManager`), and ViewState.
- **REST Endpoints:** No public REST JSON endpoints (`/api/...`) exist in the legacy application. Everything relies on ASP.NET WebForms postbacks and `WebResource.axd` / `ScriptResource.axd`.
- **API Modernization Requirement:** For the modern mobile application, we design a RESTful API contract (`src/api/` and `src/services/`) that mirrors the business functions of the WebForms application (Authentication, User Profile, Registration, Contact Us, Password Recovery, and Causes/Metrics).

---

## 7. Database-Related Observations

- **Database Engine:** Microsoft SQL Server.
- **Live Database Status:** When inspecting `UserRegistration.aspx`, the page scripts revealed the live diagnostic message:
  > *"A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible. Verify that the instance name is correct and that SQL Server is configured to allow remote connections. (provider: Named Pipes Provider, error: 40 - Could not open a connection to SQL Server)"*
- **Implication:** The remote SQL Server instance on the host is currently offline or unreachable.
- **Data Model Inferred:**
  - `Users` table: `Id`, `Email`, `PasswordHash`, `FirstName`, `LastName`, `UserType` (Sponsor/Volunteer/Applicant), `IsRegionalLead`, `Address1`, `Address2`, `City`, `State`, `Country`, `PostCode`, `Phone`, `Mobile`, `CreatedAt`, `IsActive`.
  - `Causes` / `Fundraising` table: `Id`, `Title`, `Description`, `TargetAmount`, `RaisedAmount`, `ImageUrl`.
  - `ContactMessages` / `Tickets` table: `Id`, `Name`, `Email`, `Subject`, `Message`, `SubmittedAt`.
  - `Applications` table: Links Applicant user with screening status, needed assistance, and assigned sponsor/lead.

---

## 8. Images and Assets Discovered

All core brand assets were downloaded and preserved directly from `http://helptoyou.org/`:

1. `logo.png` (HelpToYou official logo with hands holding a heart icon)
2. `slide_4.png` (Slide 1: "Connecting those who help and those who need help")
3. `slide_2.png` (Slide 2: "Give Them Hope - Make lives by giving")
4. `slide_3.png` (Slide 3: "Provide Better Future - To bring about a significant positive change")
5. `slide_urgent_2.png` (Featured cause image: student study group / education)
6. `pranav.png` (Profile photo for Pranav Kalyan)
7. `senthil.png` (Profile photo for Senthil Krishnaswamy)
8. `sathya.png` (Profile photo for Sathya Ramaswamy)
9. `mani.png` (Profile photo for Manivannan Arumugam)
10. `kalyan.png` (Profile photo for Kalyana Kumar Mohan)
11. `favico.png` (Site favicon)

---

## 9. Mobile App Screen Mapping

| Website Component | Mobile App Screen | Mobile Navigation |
| :--- | :--- | :--- |
| Splash & Welcome | `SplashScreen` | App Startup Flow |
| Onboarding / Mission Intro | `OnboardingScreen` | First-time Launch / Swiper |
| `Home.aspx` (Hero, Cause meter, Roles) | `HomeScreen` | Bottom Tab: Home |
| `Home.aspx` Sign-in Widget | `LoginScreen` | Auth Stack / Profile Tab |
| `UserRegistration.aspx` (Sponsor / Volunteer / Applicant) | `RegisterScreen` | Auth Stack / Role Cards |
| Role Selection Modal / Cards | `RoleSelectScreen` / In-Register | Register Flow |
| `ForgetPassword.aspx` | `ForgotPasswordScreen` | Auth Stack |
| `whatWeDo.aspx` (What we do / How we work) | `WhatWeDoScreen` | Explore Stack / Drawer |
| `AboutUs.aspx` (Team & Mission) | `AboutUsScreen` | Bottom Tab: About |
| `ContactUs.aspx` (Contact Form, Email, Social) | `ContactUsScreen` | Bottom Tab: Contact |
| `lnkEditProfile` / `ctl00$MainContent$hifId` | `ProfileScreen` | Bottom Tab: Profile |
| `lnkreset` (Change Password) | `ChangePasswordScreen` | Profile Stack |
| Causes / Needs List & Detail | `CausesScreen` & `CauseDetailScreen` | Explore Stack |
| Applicant Need Submission | `ApplyForHelpScreen` | Applicant Dashboard |
| Settings & Theme | `SettingsScreen` | Profile Stack |
| Notifications / Updates | `NotificationsScreen` | Top Header Action |

---

## 10. Unknown Information (Needs Backend Information)

The following items cannot be determined solely from the client-facing website because the backend is an ASP.NET WebForms monolith and the remote SQL Server is presently offline:

1. **UNKNOWN / NEEDS BACKEND INFORMATION:** Exact password hashing algorithm (e.g. ASP.NET Membership Provider SHA1/PBKDF2 vs ASP.NET Identity BCrypt).
2. **UNKNOWN / NEEDS BACKEND INFORMATION:** Whether token-based authentication (JWT / OAuth2) or session cookie authentication is desired for the modern API gateway.
3. **UNKNOWN / NEEDS BACKEND INFORMATION:** SMTP server configuration or third-party mailing service (SendGrid/AWS SES) used for `ForgetPassword.aspx` and `ContactUs.aspx`.
4. **UNKNOWN / NEEDS BACKEND INFORMATION:** Admin portal URL and internal database schema IDs for causes/sponsorship disbursement.

*Architectural Resolution:* The mobile app implements a clean, decoupled service layer (`src/api/` and `src/services/`) with realistic mock fallbacks, comprehensive field validation matching the ASP.NET validator constraints, and full `.env` configuration (`API_BASE_URL`) so that whenever the backend API is connected, only the URL endpoint needs to be configured.
