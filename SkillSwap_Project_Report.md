# SkillSwap — Peer-to-Peer Skill Exchange Platform
### Project Report (Full Feature & Function Specification)

---

## 1. Problem Statement

Millions of people have valuable skills (guitar lessons, coding help, graphic design, language tutoring, cooking, fitness coaching) but can't afford to pay for services they want in return, and can't monetize skills they already have without formal freelancing platforms that take commissions or require payment infrastructure.

**SkillSwap** solves this by letting users trade skills directly — no money involved. A graphic designer teaches someone Photoshop in exchange for that person teaching them Spanish. It's a barter economy for knowledge and services, built for students, early professionals, and communities.

This is a genuinely current problem: the "skill economy" and community-based bartering have grown post-2023 as people look for low-cost ways to learn and network, and no dominant, well-designed platform currently owns this space (unlike freelancing, which Upwork/Fiverr already dominate).

---

## 2. Objective

Build a full-stack MERN web application where users can:
- List skills they can **offer**
- List skills they **want** to learn
- Get matched with people whose "offer" fits their "want" (and vice versa)
- Negotiate and schedule a skill-swap session
- Rate and review each other after the swap
- Build a trust/reputation score over time

---

## 3. Target Users

| User type | Use case |
|---|---|
| Students | Learn new skills (coding, design, languages) without spending money |
| Working professionals | Upskill informally, network, teach what they know |
| Hobbyists | Exchange craft/creative skills (music, art, cooking, photography) |
| Communities/campuses | Localized skill-sharing within a college or neighborhood |

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Axios, plain CSS/Tailwind |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens) + bcrypt password hashing |
| Real-time chat | Socket.io |
| File uploads (profile pics, certificates) | Multer + Cloudinary (free tier) |
| Notifications | In-app (stored in DB) + optional email via Nodemailer |
| Deployment | Frontend → Vercel, Backend → Render, DB → MongoDB Atlas (all free tier) |

---

## 5. Core Concept — How It Works

1. User signs up and creates a profile.
2. User adds **Skills I Can Teach** and **Skills I Want to Learn**.
3. The system searches for users whose "can teach" list overlaps with the current user's "want to learn" list (and ideally a two-way match — mutual benefit).
4. User sends a **Swap Request** to a matched person.
5. The other user **accepts/declines/negotiates** (can propose a different skill in return).
6. Once accepted, both users **schedule a session** (date/time, online link or in-person location).
7. After the session, both users **mark it complete** and **leave a rating + review**.
8. Ratings build a **Trust Score** shown on each profile.

---

## 6. User Roles

| Role | Permissions |
|---|---|
| **Guest** | Browse public skill listings, cannot message or request swaps |
| **Registered User** | Full platform access — list skills, request swaps, chat, rate |
| **Admin** | Moderate listings/reports, view platform analytics, ban/warn users |

---

## 7. Full Feature List (Modules)

### Module 1: Authentication & Profile
- Register (name, email, password, location, bio)
- Login / Logout
- Edit profile (photo, bio, location, availability)
- View "My Trust Score" (average rating out of 5, number of completed swaps)
- Password reset via email (optional stretch feature)

### Module 2: Skill Listings
- **Add a skill I can teach** — title, category, description, proficiency level (Beginner/Intermediate/Expert), preferred mode (online/in-person)
- **Add a skill I want to learn** — same fields, marks intent
- Edit / delete a listed skill
- Browse all skills (public feed) with filters: category, mode, location, proficiency

### Module 3: Matching & Discovery
- **Smart Match** page: shows users whose "teach" list matches your "want" list
- **Mutual Match badge**: highlights when it's a two-way fit (you teach what they want AND they teach what you want)
- Search bar (search by skill name or keyword)
- Category filter chips (Tech, Music, Language, Fitness, Art, Cooking, Academic, Other)

### Module 4: Swap Requests
- **Send Swap Request** button on a matched user's profile — choose which of your skills you're offering in exchange
- **Incoming Requests** tab — Accept / Decline / Counter-propose buttons
- **Sent Requests** tab — track status (Pending / Accepted / Declined)
- Once accepted, a **Swap Session** object is created

### Module 5: Scheduling
- Propose date & time for the session
- Mark mode: Online (auto-generates a placeholder meeting link field) or In-person (location field)
- Both parties must **Confirm** the schedule before it locks in
- **Reschedule** button if needed
- **Mark as Completed** button (both sides must confirm completion)

### Module 6: Real-time Chat
- Chat window per swap request/session (Socket.io powered)
- Text messages only (keep scope manageable for a first version)
- Online/offline indicator
- Unread message badge count

### Module 7: Ratings & Reviews
- After a session is marked completed, both users get a **Rate this swap** prompt
- 1–5 star rating + optional text review
- Reviews shown on public profile
- Trust Score = average of all ratings received

### Module 8: Notifications
- In-app notification bell: new swap request, request accepted, new message, session reminder, new review received
- Mark all as read button

### Module 9: Admin Panel
- View all users (search, ban/warn)
- View all skill listings (remove inappropriate ones)
- View reported users/content
- Basic analytics: total users, total swaps completed, most popular skill categories (simple counts, can use a chart)

---

## 8. Page-by-Page Breakdown (Every Page, Feature & Button)

### 8.1 Landing Page (Home) — Public
- Hero section: "Trade Skills, Not Money" + **Get Started** button
- "How it works" 3-step visual
- **Login** / **Register** buttons in navbar

### 8.2 Register Page
- Fields: Name, Email, Password, Location
- **Create Account** button
- Link: "Already have an account? Login"

### 8.3 Login Page
- Fields: Email, Password
- **Login** button
- Link: "New here? Register"

### 8.4 Dashboard (Home after login)
- Summary cards: My Active Swaps, Pending Requests, Trust Score, Unread Messages
- **+ Add Skill I Can Teach** button
- **+ Add Skill I Want to Learn** button
- Quick list: "Suggested Matches for You"

### 8.5 My Skills Page
- Two tabs: "I Can Teach" / "I Want to Learn"
- Each skill card shows: title, category, level, mode
- **Edit** button, **Delete** button per card
- **+ Add New Skill** button (opens a form/modal)

### 8.6 Explore / Browse Page
- Search bar + category filter chips + mode filter (Online/In-person)
- Grid of skill listing cards from other users
- Each card: user photo, name, skill title, level, **View Profile** button, **Request Swap** button

### 8.7 Smart Match Page
- List of matched users with a **Mutual Match** badge where applicable
- Shows: "They can teach you: X" / "You can teach them: Y"
- **Send Swap Request** button per match

### 8.8 User Profile Page (viewing someone else)
- Photo, name, location, bio, Trust Score (stars), completed swaps count
- Skills they teach / skills they want (two lists)
- Reviews section (list of past reviews)
- **Send Swap Request** button
- **Message** button (only enabled if a swap is active/accepted)

### 8.9 Swap Request Modal/Form
- Dropdown: "Which of your skills are you offering?"
- Dropdown: "Which of their skills do you want?"
- Optional message textarea
- **Send Request** button

### 8.10 My Swaps Page
- Tabs: Incoming Requests / Sent Requests / Active Swaps / Completed Swaps
- Incoming: **Accept**, **Decline**, **Counter-propose** buttons
- Active: **Schedule Session** button, **Open Chat** button, **Mark Completed** button
- Completed: **Leave a Review** button (if not already reviewed)

### 8.11 Schedule Session Modal
- Date picker, time picker
- Mode toggle: Online / In-person
- Conditional field: meeting link (if online) or address (if in-person)
- **Propose Schedule** button → other user sees **Confirm** / **Suggest New Time** buttons

### 8.12 Chat Page
- Message list (real-time via Socket.io)
- Text input + **Send** button
- Header shows other user's name, photo, online status

### 8.13 Rate & Review Modal
- Star selector (1–5)
- Text review box
- **Submit Review** button

### 8.14 Notifications Page
- List of all notifications, unread highlighted
- **Mark all as read** button
- Clicking a notification navigates to the relevant swap/chat

### 8.15 Admin Dashboard (admin role only)
- Stats cards: Total Users, Total Swaps Completed, Active Listings
- Simple bar chart: Top 5 skill categories by listing count
- Users table: **Ban** / **Warn** buttons per row
- Reported content table: **Remove Listing** / **Dismiss Report** buttons

---

## 9. Database Schema (MongoDB Collections)

**User**
```
name, email, password (hashed), bio, location, profilePicUrl,
trustScore (avg), completedSwapsCount, role (user/admin),
createdAt
```

**Skill**
```
user (ref User), title, category, description, level (Beginner/Intermediate/Expert),
type (teach/want), mode (online/in-person/both), createdAt
```

**SwapRequest**
```
fromUser (ref User), toUser (ref User),
offeredSkill (ref Skill), requestedSkill (ref Skill),
status (pending/accepted/declined/completed),
message, createdAt
```

**Session**
```
swapRequest (ref SwapRequest), scheduledDateTime, mode,
meetingLink / address, confirmedByBoth (boolean),
status (scheduled/completed/cancelled)
```

**Review**
```
session (ref Session), reviewer (ref User), reviewee (ref User),
rating (1-5), comment, createdAt
```

**Message**
```
session (ref Session), sender (ref User), text, createdAt, read (boolean)
```

**Notification**
```
user (ref User), type, message, isRead (boolean), relatedId, createdAt
```

---

## 10. Key API Endpoints (Backend Routes)

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/skills                 (browse/filter all)
POST   /api/skills                 (add new)
PUT    /api/skills/:id
DELETE /api/skills/:id
GET    /api/skills/matches         (smart match for logged-in user)

POST   /api/swaps                  (send swap request)
GET    /api/swaps/incoming
GET    /api/swaps/sent
PUT    /api/swaps/:id/accept
PUT    /api/swaps/:id/decline

POST   /api/sessions               (schedule)
PUT    /api/sessions/:id/confirm
PUT    /api/sessions/:id/complete

POST   /api/reviews
GET    /api/reviews/user/:userId

GET    /api/messages/:sessionId
POST   /api/messages                (also emitted via Socket.io)

GET    /api/notifications
PUT    /api/notifications/read-all

GET    /api/admin/users
PUT    /api/admin/users/:id/ban
GET    /api/admin/reports
```

---

## 11. Non-Functional Requirements

- Passwords hashed with bcrypt, never stored in plain text
- JWT-protected routes for all authenticated actions
- Input validation on both frontend and backend (avoid empty/invalid skill entries)
- Mobile-responsive UI (most students will demo this on a laptop, but responsiveness is expected in evaluation)
- Rate-limit swap requests to prevent spam (basic middleware, stretch goal)

---

## 12. Suggested Build Order (Matches Learning Roadmap)

1. Auth (Register/Login/JWT) — reuses everything you already learned in the resume analyzer
2. Skill CRUD (add/edit/delete/browse)
3. Matching logic (simple overlap query first, refine later)
4. Swap request flow (send/accept/decline)
5. Scheduling
6. Reviews & trust score
7. Chat (Socket.io) — add this last, it's the most complex new piece
8. Admin panel
9. Polish UI + deploy

---

## 13. Future Scope (mention in your evaluation as "future work" — impresses evaluators)

- AI-based skill matching using NLP (semantic similarity instead of exact keyword match) — you already know how to do this from the resume analyzer's local-NLP approach
- Video call integration for online sessions
- Skill verification via certificates/badges
- Gamification: badges for "Top Teacher", streaks for consistent swapping
- Mobile app version

---

*Prepared as a working specification for MERN stack development. Every feature listed above is scoped to be buildable by a 3rd-year student with the roadmap already covered (JS → React → Node → Express → MongoDB → JWT).*
