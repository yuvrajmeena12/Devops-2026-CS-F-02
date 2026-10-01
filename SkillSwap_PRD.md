# SkillSwap — Project Requirement Document (PRD)

**Project Name:** SkillSwap  
**Project Type:** MERN/FSD Skill Exchange Platform  
**Document Version:** 1.0

---

## 1. Project Idea

SkillSwap is a web-based skill exchange platform where users can **teach the skills they know and learn the skills they want**.

Instead of following only a traditional teacher-student model, SkillSwap allows every user to be both a skill provider and a learner. Users can create their profile, add skills they want to teach and learn, explore skills posted by other users, find suitable matches, communicate with users, send swap requests, schedule meetings, complete skill exchanges, and provide ratings.

The platform also introduces a **Verified Badge** based on actual completed skill-exchange activity and ratings rather than simply uploading certificates.

The complete user journey is:

**Landing Page → Sign Up/Login → Profile → Add Skills → Explore/Smart Match → Chat → Swap Request → Schedule Meeting → Complete Swap → Rating → Verified Status**

---

# 2. Problem Statement

People frequently want to learn practical skills from other people but face problems such as:

- Finding someone who can teach the required skill.
- Finding someone interested in exchanging skills.
- Knowing whether a user is active and experienced.
- Communicating before sending a formal request.
- Managing multiple swap requests and meetings.
- Tracking completed skill exchanges.
- Identifying trustworthy and experienced users.

SkillSwap solves these problems by providing a single platform for skill discovery, matching, communication, swapping, scheduling, tracking, and reputation building.

---

# 3. Aim

The main aim of SkillSwap is:

> **To develop an interactive, secure and user-friendly platform that enables people to teach and learn skills from each other through skill discovery, smart matching, communication, skill-swap requests, scheduled meetings and rating-based verification.**

---

# 4. Proposed Solution

SkillSwap provides each user with a complete profile containing personal and professional information along with:

- Skills the user wants to teach.
- Skills the user wants to learn.
- Skill descriptions.
- Experience/details.
- Uploaded proof or certificates for individual skills, where applicable.
- Ratings and completed swap history.
- Verified status when the required activity threshold is achieved.

Users can search and explore skills posted by other users. Each skill is displayed in a properly aligned card/container containing important information and actions.

Before sending a swap request, the user can **message/chat with the skill provider** to discuss the skill, requirements and expectations.

After a swap is accepted, users can schedule meetings/sessions, complete the exchange, and rate each other.

---

# 5. Project Goals

## 5.1 Functional Goals

1. Allow users to register and securely log in.
2. Verify new accounts through OTP and optionally support OTP-based login.
3. Support OTP-based account recovery/forgot-password flow.
4. Allow users to create and manage their profiles.
3. Allow users to add skills they want to teach.
4. Allow users to add skills they want to learn.
5. Allow proof/certificates to be uploaded for individual offered skills.
6. Allow users to explore all listed skills.
7. Provide search functionality for required skills.
8. Provide Smart Match functionality.
9. Allow users to message other users before requesting a swap.
10. Allow users to send and manage swap requests.
11. Allow users to schedule skill-exchange meetings.
12. Track all active and completed swaps.
13. Allow users to rate/review completed interactions.
14. Award a Verified Badge based on completed activity and ratings.
15. Provide a complete Manage Profile section.
16. Protect private and authenticated application areas.

## 5.2 User Experience Goals

The application should be:

- Interactive
- Clean
- Responsive
- Fast
- Easy to navigate
- Visually consistent
- Properly aligned
- Simple for first-time users
- Suitable for desktop and mobile layouts

---

# 6. User Roles

SkillSwap is primarily a **user-to-user skill exchange platform**.

There is no requirement for a separate administrative role in the normal SkillSwap user flow.

Every registered user can:

- Teach skills.
- Learn skills.
- Search skills.
- Match with users.
- Chat.
- Request swaps.
- Schedule meetings.
- Complete swaps.
- Rate other users.
- Build their own verified reputation.

---

# 7. Landing Page / Front Page

The first page shown to a visitor must be interactive and informative.

It should NOT simply show a plain login form.

The landing page should explain:

- What SkillSwap is.
- How skill exchange works.
- Why users should use the platform.
- Teach-and-learn concept.
- Smart matching.
- Communication before swapping.
- Rating and verification system.

## Suggested Landing Page Sections

### Hero Section

A strong heading explaining the platform, for example:

**"Teach What You Know. Learn What You Want."**

Include interactive call-to-action buttons such as:

- Get Started
- Explore Skills
- Login
- Sign Up

### How It Works

A visual flow:

**Add Skills → Find People → Chat → Swap → Meet → Rate**

### Skill Exchange Section

Show examples of users teaching and learning different skills.

### Smart Match Section

Explain that the system can help users discover people based on their learning and teaching requirements.

### Verified User Section

Explain that users can earn a Verified Badge through completed and positively rated skill exchanges.

---

# 8. Authentication

Authentication is a critical requirement of SkillSwap.

## 8.1 Sign Up

The registration form must contain appropriate required fields.

Validation must be applied to all necessary fields.

Examples:

- Name — required
- Email — required and valid email format
- Phone number — required and valid format
- Password — required
- Confirm Password — required and must match
- Other mandatory registration information — required

The system should prevent:

- Empty required fields.
- Invalid email addresses.
- Invalid phone numbers.
- Weak/invalid passwords according to the defined rules.
- Password mismatch.
- Duplicate email/account registration.

Clear validation/error messages should be shown to the user.

## 8.2 Login

Login should validate:

- Email/username — required
- Password — required
- Input format

The system should display clear messages for invalid credentials.

## 8.3 Protected Routes

Authenticated sections must not be accessible to unauthenticated visitors.

Protected areas include:

- Dashboard
- Add Skill
- Smart Match
- Explore
- My Swaps
- Messages
- Manage Profile

---


# 8.4 OTP Verification and Authentication

SkillSwap should support OTP-based verification as an additional authentication and account-security feature.

OTP verification must remain separate from the SkillSwap **Verified Badge** system.

### OTP During Sign Up

After submitting the registration form:

```text
Sign Up Form
     ↓
Validate Required Fields
     ↓
Create/Reserve Registration Data
     ↓
Send OTP
     ↓
User Enters OTP
     ↓
OTP Verification
     ↓
Account Activated
     ↓
Login / Dashboard
```

The OTP can be delivered through the configured verified communication channel, such as email or phone.

### OTP Requirements

The system should provide:

- One-time verification code.
- OTP expiry time.
- Resend OTP option.
- Resend cooldown/timer.
- Maximum verification attempts.
- Clear invalid/expired OTP messages.
- Secure OTP generation and storage.
- Prevention of OTP reuse.
- Successful verification confirmation.

### OTP Login

The system may support OTP-based login in addition to normal email/password login.

Possible login options:

**Option 1 — Password Login**

```text
Email + Password → Validation → Login
```

**Option 2 — OTP Login**

```text
Email/Phone → Send OTP → Enter OTP → Verify → Login
```

If OTP login is enabled, the login interface should clearly provide the option to switch between password login and OTP login.

### Forgot Password

OTP should also be supported for account recovery:

```text
Forgot Password
      ↓
Enter Registered Email/Phone
      ↓
Send OTP
      ↓
Verify OTP
      ↓
Create New Password
      ↓
Login
```

### OTP Security Rules

- OTP must expire after a configurable period, such as 5–10 minutes.
- A used OTP cannot be reused.
- Excessive failed attempts should temporarily block further verification attempts.
- Resending OTP should have a cooldown period.
- OTP values should not be exposed in application logs or client-side code.
- Sensitive authentication information should be handled securely.

### Important Distinction

There are two different types of verification in SkillSwap:

| Verification | Purpose |
|---|---|
| **OTP Verification** | Confirms ownership of the registered email/phone and helps secure the account |
| **SkillSwap Verified Badge** | Represents completed and rated skill-exchange activity |

Therefore:

**OTP Verified Account ≠ SkillSwap Verified User Badge**

A user must still complete the required number of valid skill-exchange meetings and receive the required ratings to become eligible for the SkillSwap Verified Badge.

# 9. Dashboard

After successful login, the user enters the main application dashboard.

The dashboard is the central area from which users can access their major SkillSwap functions.

## 9.1 Navbar

The authenticated navbar should contain:

- **Dashboard**
- **Add Skill**
- **Smart Match**
- **Explore**
- **My Swaps**

The **Dashboard** item must take the user back to the main dashboard page.

## 9.2 Right Side of Navbar

The corner/right side of the navbar should contain:

- **Chat/Message Icon**
- **User Profile Icon**

The message icon should provide quick access to chats.

The profile icon should provide access to the user's profile/manage profile section.

---

# 10. Add Skill

The Add Skill page is used to manage skills that the user wants to teach or learn.

## 10.1 Skill Type

The user must be able to specify:

### Skills I Want to Teach

Examples:

- C++
- Python
- Web Development
- React
- Graphic Design
- Video Editing

### Skills I Want to Learn

Examples:

- Machine Learning
- UI/UX
- Data Analytics
- Public Speaking
- Cloud Computing

A user can have both teaching and learning skills at the same time.

---

# 11. Proof / Certificate for Individual Skills

Proof/certificate uploading should be available **inside the Add Skill functionality for each individual skill**.

For example:

**Skill:** Python  
**Type:** Teaching  
**Description:** Python programming and basic automation  
**Experience:** Intermediate  
**Proof/Certificate:** Upload certificate/proof

The uploaded proof should be associated with that specific skill.

Important:

> **Uploading a proof or certificate must NOT automatically give the user a Verified Badge.**

The proof/certificate is supporting information for the skill profile, while verification is based on actual completed skill-exchange activity and ratings.

The system should support appropriate file validation such as:

- Allowed file types.
- File size limit.
- Secure upload handling.
- Clear upload status/error messages.

---

# 12. Verified Badge System

The Verified Badge is designed to represent demonstrated activity on the platform.

## 12.1 Verification Principle

A user should not become verified merely by uploading a certificate.

Verification should be based on:

- Completed skill-exchange meetings/swaps.
- Ratings received from other users after those interactions.

## 12.2 Verification Threshold

The project should support a configurable threshold between **5 and 10 completed and rated interactions**.

Recommended implementation:

**Verified Badge = Required number of completed skill-exchange meetings + required valid ratings**

For example:

- After 5 completed and rated meetings → eligible for verification, if the configured threshold is 5.
- Alternatively, the system can configure the threshold as 10.

The exact threshold should be stored as a configurable system value rather than hard-coded throughout the application.

## 12.3 Important Rules

- A pending swap does not count.
- A cancelled swap does not count.
- A scheduled but incomplete meeting does not count.
- A completed meeting counts only when the required rating/review process is completed.
- Uploaded certificates do not directly grant verification.
- The badge should be displayed on the user's profile and relevant skill cards after verification.

---

# 13. Explore Skills

The Explore section should contain all publicly listed/available skill entries posted by users.

Users should be able to:

- Search for a required skill.
- Browse available skills.
- View skill details.
- Identify the person offering the skill.
- Check whether the person is verified.
- See when the skill was posted.
- Message the person.
- Request a skill swap.

## 13.1 Skill Card / Container

Each skill entry should appear inside a clean, properly aligned card/container.

A card should contain:

- User Name
- Profile image/avatar
- Skill Name
- Skill Type
- Short Skill Description
- Experience/level where available
- Verified Badge, if applicable
- Skill Posted Date
- Proof/Certificate indicator, if available
- **Request Swap** button
- **Message** button

The layout should remain consistent across different screen sizes.

---

# 14. Search

The Explore section must provide a search facility.

Users should be able to search for skills such as:

- "Python"
- "React"
- "Graphic Design"
- "Video Editing"
- "C++"
- "Data Analytics"

Search should return relevant skill entries rather than requiring the user to manually browse every listing.

---

# 15. Smart Match

Smart Match is intended to help users discover potentially suitable skill-exchange partners.

The matching logic can consider:

- Skills the current user wants to learn.
- Skills another user wants to teach.
- Skills the current user wants to teach.
- Skills another user wants to learn.
- Skill category.
- Experience level where applicable.
- Availability/preferences where implemented.

## Example

User A:

**Wants to Learn:** React  
**Wants to Teach:** Python

User B:

**Wants to Learn:** Python  
**Wants to Teach:** React

The Smart Match system can identify these users as a potentially relevant skill exchange.

Smart Match results should use the same clean card/container style as Explore.

Each result should provide:

- User Name
- Relevant Skill
- Match information
- Verified Badge
- Profile information
- Message
- Request Swap

---

# 16. Messaging / Chat

Users should be able to communicate with other users.

The primary purpose is to allow users to discuss a skill before sending a formal swap request.

## Chat Access

The chat should be accessible:

- From the navbar message icon.
- From a skill card.
- From a Smart Match result.
- From the user's profile where appropriate.

## Example Flow

**Explore Skill → Find Provider → Message → Discuss Requirements → Request Swap**

This prevents users from being forced to send a swap request without first communicating.

---

# 17. Request Swap

Every relevant skill card should provide a **Request Swap** action.

The user can send a swap request after reviewing the skill and optionally communicating with the provider.

The request should contain relevant information such as:

- Requesting User
- Skill Provider
- Requested Skill
- Request Date
- Optional message/note
- Current status

Possible statuses include:

- Pending
- Accepted
- Rejected
- Scheduled
- In Progress
- Completed
- Cancelled

---

# 18. Scheduling Meetings

After a swap request is accepted, users should be able to schedule a skill-exchange meeting/session.

Scheduling information may include:

- Date
- Time
- Session details
- Meeting/session status

Users should be able to see scheduled sessions from the relevant swap information.

---

# 19. My Swaps

The **My Swaps** section should contain all the user's skill-swap information and history.

It should include:

- Sent swap requests.
- Received swap requests.
- Accepted swaps.
- Rejected swaps.
- Pending swaps.
- Scheduled meetings.
- In-progress swaps.
- Completed swaps.
- Cancelled swaps.
- Ratings/reviews associated with completed swaps.

Each swap record should clearly show:

- Other user's name.
- Skill exchanged.
- Request date.
- Meeting date/time where applicable.
- Current status.
- Chat option.
- Relevant action buttons.

This page acts as the user's central skill-exchange history.

---

# 20. Manage Profile

The Manage Profile section should allow users to manage all information displayed on their public profile.

The profile should have a social-profile-style presentation inspired by familiar profile platforms, while maintaining SkillSwap's own design.

## 20.1 Profile Information

The user should be able to manage:

- Profile photo/avatar
- Name
- Email
- Phone number
- Short Bio
- Description/About
- Qualification
- Hobbies
- Awards
- Other relevant profile information

## 20.2 Skills in Profile

The profile should also contain:

### Skills I Want to Teach

The complete teaching-skill list should be visible and manageable from the profile.

### Skills I Want to Learn

The complete learning-skill list should also be visible and manageable from the profile.

Users should be able to:

- Add skills.
- Edit skills.
- Remove skills.
- Update descriptions/details.
- Manage relevant proof/certificate information for teaching skills.

The Add Skill page and Manage Profile page must remain synchronized so that changes made in either appropriate interface are reflected throughout the platform.

## 20.3 Profile Display

A public/user profile can display:

- Profile photo
- Name
- Verified Badge
- Bio
- Qualification
- Hobbies
- Awards
- Skills Offered
- Skills Wanted
- Completed Swaps
- Ratings/Reviews
- Relevant skill proof/certificate indicators

---

# 21. Skill Card Design Requirements

All Explore and Smart Match skill entries should use a consistent card/container structure.

### Required visual information

```text
┌─────────────────────────────────────────────┐
│  Profile / User Name          ✓ Verified    │
│                                             │
│  Skill: Python                              │
│  Type: Teaching                             │
│  Description: Python & Automation           │
│                                             │
│  Posted: 22 September 2026                  │
│                                             │
│  [ Request Swap ]       [ Message ]         │
└─────────────────────────────────────────────┘
```

The exact visual design can change, but the information hierarchy should remain clear.

---

# 22. Notifications

The platform should provide notifications for important events such as:

- New swap request.
- Swap request accepted.
- Swap request rejected.
- New message.
- Meeting scheduled.
- Meeting updated/cancelled.
- Swap completed.
- Rating/review received.
- Verified Badge achieved.

---

# 23. Ratings and Reviews

After a completed skill-exchange interaction, users should be able to rate/review the other participant.

The rating system should help build trust within the platform.

Ratings may contain:

- Star/rating value.
- Optional written review.
- Related completed swap.

Only valid completed interactions should contribute to the verification calculation.

---

# 24. Verification and Rating Relationship

The platform should clearly separate **proof of skill** from **platform verification**.

### Proof/Certificate

Shows that the user has uploaded supporting documentation for a particular skill.

### Verified Badge

Shows that the user has demonstrated activity on SkillSwap by completing the configured number of skill-exchange meetings and receiving the required ratings.

Therefore:

**Certificate ≠ Automatic Verification**

Instead:

**Completed + Rated Skill Exchanges → Verification Eligibility → Verified Badge**

---

# 25. Navigation Structure

The recommended authenticated navigation structure is:

```text
Dashboard
│
├── Add Skill
│   ├── Skills I Want to Teach
│   ├── Skills I Want to Learn
│   └── Proof/Certificate for Individual Skills
│
├── Smart Match
│
├── Explore
│   ├── Search Skills
│   ├── Skill Cards
│   ├── Request Swap
│   └── Message
│
├── My Swaps
│   ├── Pending
│   ├── Accepted
│   ├── Scheduled
│   ├── Completed
│   └── History
│
├── Messages
│
└── Profile
    └── Manage Profile
```

---

# 26. Complete User Flow

## New Visitor

```text
Landing Page
     ↓
Explore Introduction
     ↓
Sign Up / Login
     ↓
Create/Complete Profile
     ↓
Add Teaching Skills
     ↓
Add Learning Skills
     ↓
Dashboard
```

## Finding a Skill

```text
Dashboard
     ↓
Explore / Smart Match
     ↓
Search Required Skill
     ↓
View Skill Card
     ↓
Check User + Verified Badge + Details
     ↓
Message User
     ↓
Discuss Skill
     ↓
Request Swap
```

## Skill Exchange

```text
Request Swap
     ↓
Accepted
     ↓
Schedule Meeting
     ↓
Skill Exchange
     ↓
Mark Completed
     ↓
Rate / Review
     ↓
Completed Interaction Count Updated
     ↓
Verification Threshold Checked
     ↓
Verified Badge When Eligible
```

---

# 27. Non-Functional Requirements

## Performance

- Pages should load efficiently.
- Search should return results quickly.
- API calls should be handled efficiently.
- Images/files should be appropriately managed.

## Responsiveness

The application should work properly on:

- Desktop
- Laptop
- Tablet
- Mobile

## Security

The application should implement:

- Secure authentication.
- Password hashing.
- Protected routes.
- Token-based authorization where applicable.
- Input validation.
- File-upload validation.
- Proper access control.
- Secure handling of user data.

## Usability

- Clear navigation.
- Consistent buttons.
- Clear error messages.
- Loading indicators where necessary.
- Empty-state messages.
- Confirmation messages for important actions.

---

# 28. Suggested Technology Stack

### Frontend

- React.js
- JavaScript
- HTML
- CSS / Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- JWT
- bcrypt/bcryptjs

### File Upload

- Multer or equivalent secure upload mechanism

### Development / Deployment

- Git/GitHub
- Docker
- Docker Compose
- Jenkins where required for CI/CD

---

# 29. Major Data Entities

The application can be structured around entities such as:

### User

- Name
- Email
- Phone
- Password hash
- Profile photo
- Bio
- Qualification
- Hobbies
- Awards
- Teaching skills
- Learning skills
- Verification status
- Rating information

### Skill

- Skill name
- Category
- Description
- Skill type
- Experience level
- Owner
- Posted date
- Proof/certificate metadata

### Swap Request

- Requester
- Provider
- Skill
- Message/note
- Status
- Request date

### Session

- Swap reference
- Participants
- Date/time
- Status
- Completion information

### Review

- Reviewer
- Reviewed user
- Related swap/session
- Rating
- Review text
- Date

### Message

- Sender
- Receiver
- Message content
- Timestamp
- Read/unread status

### Notification

- Recipient
- Notification type
- Message
- Related entity
- Read/unread status
- Timestamp

---

# 30. Core Functional Requirements Summary

| Module | Requirement |
|---|---|
| Landing Page | Interactive introduction and clear CTAs |
| Authentication | Secure signup/login with complete validation and OTP verification/login/recovery support |
| Dashboard | Central authenticated home page |
| Navbar | Dashboard, Add Skill, Smart Match, Explore, My Swaps |
| Profile Icon | Access/manage user profile |
| Chat Icon | Quick access to messages |
| Add Skill | Manage teaching and learning skills |
| Proof Upload | Upload proof/certificate for individual skills |
| Explore | Browse/search all listed skills |
| Smart Match | Find potentially compatible skill partners |
| Skill Card | User, skill, badge, date, actions and details |
| Message | Chat before requesting a swap |
| Request Swap | Send/manage skill swap requests |
| Scheduling | Arrange skill-exchange meetings |
| My Swaps | Complete swap history and status tracking |
| Ratings | Rate completed interactions |
| Verification | Badge based on completed/rated interactions |
| Manage Profile | Manage personal, professional and skill details |
| Notifications | Inform users about important platform activity |

---

# 31. Key Business Rules

1. Every registered user can both teach and learn.
2. Required account verification should be completed through OTP before the account is treated as fully verified for protected authentication flows.
3. OTP verification must remain separate from the SkillSwap Verified Badge.
2. Teaching skills and learning skills must be separately identifiable.
3. A skill can have an optional proof/certificate.
4. Uploading a certificate does not automatically verify a user.
5. Verification depends on completed and rated skill-exchange interactions.
6. The verification threshold must be configurable between 5 and 10 completed/rated interactions.
7. Only valid completed interactions should contribute to verification.
8. Users should be able to message a skill provider before requesting a swap.
9. Explore and Smart Match results should provide both **Message** and **Request Swap** actions.
10. Swap history must be available under My Swaps.
11. Teaching and learning skills must also be manageable from Manage Profile.
12. Required signup/login fields must be validated.
13. Protected pages require authentication.
14. The landing page should be interactive before authentication.
15. Skill cards should present information in a clean and consistently aligned layout.
16. Verification status should be visible on relevant profiles and skill cards.
17. Profile information should be editable by the profile owner.
18. Completed swaps should be connected to ratings/reviews.
19. The system should prevent invalid or incomplete data from entering core workflows.

---

# 32. Success Criteria

The SkillSwap project will be considered functionally complete when a user can:

1. Visit an interactive landing page.
2. Register with proper validation.
3. Verify the account through OTP.
4. Log in securely using password or the supported OTP login flow.
5. Recover the account/password using OTP when required.
4. Complete/manage their profile.
5. Add skills they want to teach.
6. Add skills they want to learn.
7. Upload optional proof/certificates for relevant teaching skills.
8. Explore all available skill listings.
9. Search for a required skill.
10. Use Smart Match to discover relevant users.
11. View user and skill information.
12. Check verification status.
13. Message another user.
14. Send a swap request.
15. Accept/manage swap requests.
16. Schedule a skill-exchange meeting.
17. Complete the exchange.
18. Rate/review the participant.
19. Track all activity in My Swaps.
20. Reach the configured verification threshold through completed and rated exchanges.
21. Receive and display a Verified Badge.
22. Manage personal details and both teaching/learning skills from the profile.

---

# 33. Final Project Concept

SkillSwap is not simply a platform for listing skills.

It is a complete **skill-exchange ecosystem**:

**Discover → Match → Communicate → Request → Schedule → Exchange → Complete → Rate → Build Trust**

The platform combines skill discovery, user profiles, Smart Match, real-time communication, swap management, scheduling, ratings, proof/certificate support and activity-based verification into one integrated application.

The core principle is:

> **Users prove their participation and reliability through real skill exchanges, while certificates remain supporting evidence for individual skills rather than an automatic verification mechanism.**
