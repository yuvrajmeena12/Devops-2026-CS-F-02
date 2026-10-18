# DATABASE SCHEMAS & API CONTRACT SPECIFICATION

## 1. Database Schema Specifications

### 1.1 Collection: `users` (Model: `User`)
- `name`: String, required, trim, max 60 chars.
- `email`: String, required, unique, lowercase, trim.
- `password`: String, required (bcrypt hash, cost 10–12).
- `phone`: String, default `''`, trim, max 20 chars.
- `bio`: String, default `''`, max 500 chars.
- `about`: String, default `''`, max 2000 chars.
- `qualification`: String, default `''`, max 200 chars.
- `hobbies`: Array of strings or comma-separated string.
- `awards`: Array of strings or comma-separated string.
- `location`: String, default `''`, max 120 chars.
- `profilePicUrl`: String, default `''`.
- `avatar`: Subdocument `{ file: String, mime: String }`.
- `rating`: Number (alias `ratingAvg`), default 0.
- `ratingCount`: Number, default 0.
- `completedSwapsCount`: Number (alias `completedSwaps`), default 0.
- `isVerified`: Boolean (alias `verified`), default false.
- `verifiedAt`: Date, default null.
- `tokenVersion`: Number, default 0 (session revocation).
- `failedLogins`: Number, default 0 (brute-force tracking).
- `lockUntil`: Date, default null (lockout timestamp).
- `resetPasswordToken`: String, default null.
- `resetPasswordExpire`: Date, default null.
- `role`: String, enum: `['user', 'admin']`, default `'user'`.
- `isBanned`: Boolean, default false.

### 1.2 Collection: `skills` (Model: `Skill`)
- `user`: ObjectId, ref: 'User' (alias `owner`), required, index: 1.
- `title`: String, required, trim, max 120 chars (alias `name`).
- `nameLower`: String, lowercase, index: 1.
- `category`: String, enum: 15 categories, required, index: 1.
- `description`: String, default `''`, max 2000 chars.
- `level`: String, enum: `['beginner', 'intermediate', 'advanced', 'expert']` (case-insensitive mapped), default `'beginner'`.
- `type`: String, enum: `['teach', 'want', 'learn']`, required, index: 1.
- `mode`: String, enum: `['online', 'in-person', 'both']`, default `'both'`.
- `hasProof`: Boolean, default false.
- `certificateFile`: String (or `proof.file`), default `''`.
- `certificateFileName`: String, default `''`.
- `certificateFileType`: String, default `''`.
- `isVerified`: Boolean, default false.
- Compound Index: `{ user: 1, nameLower: 1, type: 1 }` (unique).
- Compound Index: `{ type: 1, category: 1, createdAt: -1 }`.

### 1.3 Collection: `swaprequests` (Model: `SwapRequest`)
- `fromUser`: ObjectId, ref: 'User' (alias `requester`), required, index: 1.
- `toUser`: ObjectId, ref: 'User' (alias `provider`), required, index: 1.
- `offeredSkill`: ObjectId, ref: 'Skill', required: false.
- `requestedSkill`: ObjectId, ref: 'Skill', required: true.
- `message`: String, default `''`, max 1000 chars.
- `status`: String, enum: `['pending', 'accepted', 'rejected', 'declined', 'scheduled', 'in_progress', 'completed', 'cancelled']`, default `'pending'`, index: 1.
- `completionConfirmedBy`: [ObjectId, ref: 'User'], default `[]`.
- `completedAt`: Date, default null.
- `respondedAt`: Date, default null.
- Compound Index: `{ fromUser: 1, requestedSkill: 1, status: 1 }`.

### 1.4 Collection: `sessions` (Model: `Session`)
- `swapRequest`: ObjectId, ref: 'SwapRequest' (alias `swap`), required, index: 1.
- `participants`: [ObjectId, ref: 'User'], index: 1.
- `scheduledBy`: ObjectId, ref: 'User'.
- `scheduledDateTime`: Date (alias `scheduledAt`), required, index: 1.
- `durationMinutes`: Number, min 15, max 480, default 60.
- `mode`: String, enum: `['online', 'in-person']`, default `'online'`.
- `meetingLink`: String, default `''`.
- `address`: String, default `''`.
- `details`: String, default `''`, max 500 chars.
- `status`: String, enum: `['scheduled', 'completed', 'cancelled']`, default `'scheduled'`.
- `completedAt`: Date, default null.

### 1.5 Collection: `reviews` (Model: `Review`)
- `session`: ObjectId, ref: 'Session', required: false.
- `swap`: ObjectId, ref: 'SwapRequest', required: true, index: 1.
- `reviewer`: ObjectId, ref: 'User', required: true, index: 1.
- `reviewee`: ObjectId, ref: 'User', required: true, index: 1.
- `rating`: Number, min 1, max 5, required: true.
- `comment`: String, default `''`, max 1000 chars (alias `text`).
- Compound Unique Index: `{ swap: 1, reviewer: 1 }` (unique: true).

### 1.6 Collection: `messages` (Model: `Message`)
- `conversationKey`: String, required, index: 1 (`minId:maxId`).
- `sender`: ObjectId, ref: 'User', required: true, index: 1.
- `recipient`: ObjectId, ref: 'User', required: true, index: 1.
- `swapRequest`: ObjectId, ref: 'SwapRequest', index: 1.
- `skill`: ObjectId, ref: 'Skill'.
- `text`: String, required, trim, max 2000 chars (alias `content`).
- `read`: Boolean, default false (alias `readAt`: Date).

### 1.7 Collection: `notifications` (Model: `Notification`)
- `user`: ObjectId, ref: 'User' (alias `recipient`), required, index: 1.
- `actor`: ObjectId, ref: 'User', default null.
- `type`: String, required, enum: `['swap_request', 'swap_accepted', 'swap_rejected', 'swap_cancelled', 'message', 'session_scheduled', 'session_cancelled', 'swap_completed', 'review_received', 'badge_earned', 'new_request', 'request_accepted', 'request_declined', 'new_message', 'new_review', 'verified_badge']`.
- `message`: String, required.
- `link`: String, default `'/'`.
- `relatedId`: ObjectId, default null.
- `dedupeKey`: String, default null.
- `isRead`: Boolean, default false (alias `readAt`: Date).
- TTL index on `createdAt` (90 days).

---

## 2. API Endpoint Matrix

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register with email/password (no OTP). |
| `POST` | `/api/auth/login` | Public | Login with brute-force lockout & tokenVersion. |
| `POST` | `/api/auth/forgot-password` | Public | Generate 32-byte secure reset token. |
| `PUT` | `/api/auth/reset-password/:token` | Public | Reset password using valid unexpired token. |
| `GET` | `/api/auth/me` | Protected | Current user private profile & session validation. |
| `PUT` | `/api/auth/me` & `/api/users/me` | Protected | Update profile whitelist fields. |
| `POST` | `/api/auth/change-password` | Protected | Change password with current password verification. |
| `POST` | `/api/auth/logout` | Protected | Invalidate session / clear cookies. |
| `POST` | `/api/auth/me/profile-picture` | Protected | Upload avatar with magic-byte check. |
| `DELETE` | `/api/auth/me/profile-picture` | Protected | Remove avatar. |
| `GET` | `/api/auth/user/:id` & `/api/users/:id` | Public | Retrieve member public profile. |
| `GET` | `/api/public/overview` | Public | Community counts & recent teaching skills (60s cache). |
| `GET` | `/api/skills/categories` | Public/Protected | 15 categories & counts (60s cache). |
| `GET` | `/api/skills/explore` & `/api/skills` | Protected/Public | Explore skill catalog with search, filter, pagination. |
| `GET` | `/api/skills/mine` | Protected | Current user's teaching and learning skills. |
| `POST` | `/api/skills` | Protected | Create skill (proof file allowed for teach only). |
| `PUT` | `/api/skills/:id` | Protected | Update skill (owner only, active swap guard). |
| `DELETE` | `/api/skills/:id` | Protected | Delete skill (owner only, active swap guard). |
| `GET` | `/api/skills/:id/proof` & `/certificate` | Protected | Stream attached proof with CSP sandbox header. |
| `GET` | `/api/matches` & `/api/skills/matches` | Protected | Deterministic Smart Match scoring & pagination. |
| `POST` | `/api/swaps` | Protected | Propose swap request with collision guard. |
| `GET` | `/api/swaps` | Protected | Paginated swap requests with tab & direction filters. |
| `GET` | `/api/swaps/counts` | Protected | Tab count pills & incoming pending total. |
| `PATCH/PUT` | `/api/swaps/:id/accept` | Protected | Provider accepts proposal. |
| `PATCH/PUT` | `/api/swaps/:id/reject` & `/decline` | Protected | Provider rejects proposal. |
| `PATCH/PUT` | `/api/swaps/:id/cancel` | Protected | Cancel swap with cascading session cancellation. |
| `POST` | `/api/sessions` | Protected | Schedule/reschedule session (min 5 min lead time). |
| `GET` | `/api/sessions` | Protected | List sessions by scope. |
| `PATCH` | `/api/sessions/:id/cancel` | Protected | Cancel session & revert swap to accepted. |
| `PATCH/PUT` | `/api/sessions/:id/complete` | Protected | Two-party time-gated mutual completion confirm. |
| `POST` | `/api/reviews` | Protected | Submit post-completion review (completed swaps only). |
| `GET` | `/api/reviews/user/:userId` | Protected | List member reviews with pagination. |
| `GET` | `/api/messages/conversations` | Protected | List active conversation threads with unread counts. |
| `GET` | `/api/messages/unread-count` | Protected | Global unread messages count. |
| `GET` | `/api/messages/:userId` & `/user/:userId` | Protected | Thread history & auto read receipt marking. |
| `POST` | `/api/messages` & `/:userId` | Protected | Send direct message (rate limited 60/min). |
| `GET` | `/api/notifications` | Protected | Paginated notifications with optional unread filter. |
| `GET` | `/api/notifications/unread-count` | Protected | Global unread notifications count. |
| `PATCH/PUT` | `/api/notifications/:id/read` | Protected | Mark single notification read. |
| `PATCH/PUT` | `/api/notifications/read-all` | Protected | Bulk mark all notifications read. |
| `GET` | `/api/dashboard` | Protected | Consolidated dashboard aggregation with 5 milestones. |
