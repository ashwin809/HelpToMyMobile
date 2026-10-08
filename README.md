# HelpToYou — Education Community Connect Mobile & Web Application

A modern, high-fidelity React Native (Expo) community platform built for [HelpToYou](http://helptoyou.org/). 

It connects students and aspirants with university professors, alumni mentors, and educational sponsors to seek admission guidance, syllabus support, research opportunities, and scholarships.

---

## 🌟 Key Features

1. **Education Community Board (`CommunityFeedScreen`)**:
   - Real-time question feed with category filtering:
     - 🎓 University Admissions
     - 🔬 Research & Thesis
     - 📚 Syllabus & Exam Preparation
     - 💰 Scholarships & Financial Assistance
     - 💼 Career Guidance & Mentorship
   - Search by university (Anna University, IIT Madras, Stanford, NIT Trichy, etc.), course, or keyword.
   - Upvoting system and discussion threads.
   - Interactive "+ Ask For Help" modal.

2. **Help Request & Verified Advice Threads (`HelpDetailScreen`)**:
   - Detailed inquiry breakdown with urgency badges and tags.
   - Advice threads with verified status tags (`Verified Professor`, `Alumni Mentor`, `Accepted Solution`).
   - In-app advice submission form with instant database updates.
   - "Mark as Resolved" option for authors.

3. **Campus Mentors Directory (`MentorsScreen`)**:
   - Discover and connect with university faculty, alumni, and senior students.
   - Filter by university and academic role.
   - "Connect / Request Guidance" action with real-time status (`Pending`, `Connected`).
   - "Ask Direct Question" shortcut.

4. **Multi-Role Registration (`RegisterScreen`)**:
   - Role-specific profiles:
     - 👨‍🎓 **Student / Aspirant** (seeking admissions, coursework advice, peer notes)
     - 🎓 **Professor / Faculty** (curriculum, research, academic counseling)
     - 💼 **Alumni / Mentor** (industry transitions, tech interview preparation)
     - 🤝 **Sponsor / Donor** (tuition & educational aid)
     - 🌟 **Volunteer** (field verification and student aid coordination)
   - Dynamic profile capture: University, Department, Academic Title / Status, Guidance Skills, Bio, Location.

5. **Authentication & Instant Demo Switcher (`LoginScreen`, `ProfileScreen`)**:
   - Full credentials authentication (`email` + `password`).
   - **1-Tap Demo Logins**:
     - 🎓 **Dr. R. Sundaram** (Senior Professor, Anna University)
     - 🎓 **Dr. Emily Watson** (Associate Professor, Stanford AI Lab)
     - 👨‍🎓 **Arun Kumar** (M.Tech Aspirant, Anna University)
     - 👨‍🎓 **Karthik Raja** (Final Year B.Tech, Anna University)
     - 💼 **Priya Natarajan** (Software Architect & Alumni, IIT Madras)
     - 🤝 **Senthil Krishnaswamy** (Co-Founder & Sponsor, HelpToYou)
   - Instant persona toggle on the Profile tab to test asking and answering from different perspectives.

6. **HelpToYou Mission & Cause Tracker (`AboutUsScreen`)**:
   - Live cause progress bar: `$8,365` raised of `$14,000` goal for higher education scholarships.
   - Leadership roster with original website assets (Pranav Kalyan, Senthil Krishnaswamy, Sathya Ramaswamy, Manivannan Arumugam, Kalyana Kumar Mohan).
   - Foundation contact and donation links.

---

## 💾 Local Database & Production Migration

- **Current Local Database (`src/storage/db.ts`)**:
  - Implements a self-contained persistent repository using `@react-native-async-storage/async-storage`.
  - Provides complete CRUD operations for:
    - `users`
    - `help_requests`
    - `help_responses`
    - `institutions`
    - `connections`
- **Production Migration Schema (`schema.sql`)**:
  - Contains PostgreSQL / SQLite compatible DDL tables, foreign keys, constraints, and indexes.
  - When ready to connect to your live database, execute `schema.sql` on your SQL server.

---

## 🚀 Running the Application

### 1. Web Preview (Local Dev Server)
The Expo dev server is running on **port 8085**:
```sh
npm start
# or
npx expo start --web --port 8085
```
Open **[http://localhost:8085](http://localhost:8085)** in your web browser.

### 2. Mobile (Android & iOS)
- **Expo Go App**: Scan the QR code printed by `npm run start:native`.
- **Android Simulator / Device**: `npm run android`
- **iOS Simulator / Device**: `npm run ios`

### 3. Type Checking
```sh
npm run ts:check
```
