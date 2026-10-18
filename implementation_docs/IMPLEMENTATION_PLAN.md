# IMPLEMENTATION PLAN: SKILLSWAP FULL-STACK FEATURE PARITY (OTP EXCLUDED)

## Project Overview
Implementation of the complete functional specification documented in `features skill swap.txt` into the SkillSwap destination project (`SKILL_SWAP_FSD`).
All OTP functionality is completely excluded; email-and-password authentication, cryptographic token password recovery, and enterprise session security are implemented instead.

---

## Phase Breakdown & Execution Sequence

### Phase 0: Audit, Baseline & Infrastructure Foundations
- **Scope**: Inspect existing codebase, document all current schemas, endpoints, UI routes, and identify gaps against reference specification.
- **Dependencies**: None.
- **Deliverables**: Audit analysis, initialization of 6 required tracking documents (`IMPLEMENTATION_PLAN.md`, `FEATURE_PARITY_MATRIX.md`, `BUSINESS_RULES.md`, `DATABASE_AND_API_CHANGES.md`, `TESTING_REPORT.md`, `IMPLEMENTATION_CHANGELOG.md`).

### Phase 1: Authentication & Session Security (Module A) & User Profiles (Module B)
- **Scope**: 
  - Exclude all OTP registration, OTP login, and OTP reset workflows.
  - Implement secure email-and-password registration with immediate account activation.
  - Implement brute-force protection with account-level exponential lockout (`failedLogins`, `lockUntil`).
  - Implement JWT token issuance with `tokenVersion` session revocation support.
  - Implement password change requiring current-password verification with global session invalidation.
  - Implement cryptographic token-based password reset (`crypto.randomBytes(32)` with 15-minute expiration) without OTP.
  - Implement User Profile retrieval (own vs public), field whitelist updates, avatar upload with magic-byte validation (JPEG, PNG, WEBP), and avatar removal.
  - Implement automated reputation calculation and Verified Member badge qualification (threshold: $\ge 5$ completed swaps with $\ge 3.5$ rating average).
- **Dependencies**: Database models (`User`), middleware (`auth`, `rateLimiter`, `validators`).
- **Status**: Planned.

### Phase 2: Skill Catalog & Management (Module C)
- **Scope**:
  - Implement 15 predefined reference categories: `Programming`, `Web Development`, `Data & AI`, `Design`, `Video & Photography`, `Music`, `Languages`, `Business`, `Marketing`, `Writing`, `Science & Math`, `Cooking`, `Fitness & Wellness`, `Public Speaking`, `Other`.
  - Implement 4 proficiency tiers: `beginner`, `intermediate`, `advanced`, `expert`.
  - Enforce separate `teach` (offered) and `learn`/`want` (desired) inventories.
  - Enforce max 50 skills per user per type.
  - Enforce duplicate listing prevention (`owner + nameLower + type`).
  - Restrict proof file uploads strictly to `teach` skills with magic-byte validation (PDF, PNG, JPG, WEBP $\le 5$ MB).
  - Implement secure proof streaming with `Content-Security-Policy: default-src 'none'; sandbox` and `X-Content-Type-Options: nosniff`.
  - Guard skill deletion and modification against participating in active swaps.
  - Implement `GET /api/public/overview` platform metrics with 60s caching.
  - Implement `GET /api/skills/categories` aggregate counts with 60s caching.
  - Implement `GET /api/skills/explore` with search, category/level filtering, pagination, and owner trust hydration.
- **Dependencies**: `Skill` model, `upload.js` utility, `cache.js` utility.
- **Status**: Planned.

### Phase 3: Deterministic Smart Match Engine (Module D) & Swap Lifecycle (Module E)
- **Scope**:
  - Implement deterministic compatibility matching formula:
    $$\text{Score} = (\text{isReciprocal} ? 100 : 40) + \min(\text{theyTeachCount}, 3) \times 8 + \min(\text{youTeachCount}, 3) \times 8 + (\text{isVerified} ? 6 : 0) + \min(\text{ratingAvg}, 5)$$
  - Classification: `reciprocal`, `they_teach_you`, `you_teach_them`.
  - Paginated Smart Match directory (`GET /api/matches` and `GET /api/skills/matches`) with 30s caching.
  - Propose swap request with offered skill and requested skill validation (`POST /api/swaps`).
  - Server-side collision guard preventing duplicate open proposals between same user and skill.
  - Swap listing with tab buckets (`pending`, `active`, `completed`, `closed`, `all`), direction filtering, and batch hydration of sessions and reviews.
  - State machine transitions: `pending` $\to$ `accepted` (provider only), `pending` $\to$ `rejected` (provider only), `cancel` (requester if pending; either participant if active, with cascading cancellation of scheduled sessions).
- **Dependencies**: `Skill`, `SwapRequest`, `Notification`, `matchController.js`, `swapController.js`.
- **Status**: Planned.

### Phase 4: Session Scheduling & Two-Party Time-Gated Completion (Module F)
- **Scope**:
  - Schedule / reschedule session for accepted swap with minimum 5-minute lead time, 15–480 minute duration validation, and HTTPS meeting link verification.
  - Automatic cancellation of prior scheduled session on reschedule.
  - Cancel scheduled session with automatic reversion of swap back to `accepted`.
  - Two-Party Mutual Time-Gated Completion:
    1. Check `session.scheduledAt <= Date.now()`. Throw 403 Forbidden if called before scheduled start time!
    2. Add caller to `completionConfirmedBy` idempotently using `$addToSet`.
    3. If 1 confirmation: swap transitions to `in_progress`, counterpart is notified.
    4. If 2 confirmations: swap transitions to `completed`, `completedAt` set, session marked `completed`, reputation recalculation triggered for both users, completion notifications sent to both!
- **Dependencies**: `Session`, `SwapRequest`, `reputation.js`, `notify.js`.
- **Status**: Planned.

### Phase 5: Peer Reviews, Ratings & Reputation Recalculation (Module G)
- **Scope**:
  - Submit post-completion review (`POST /api/reviews`):
    - Gated strictly to completed swaps.
    - 1 to 5 integer rating, optional testimonial text.
    - Enforce exactly one review per participant per swap via unique compound index (`swap + reviewer`).
    - Immediate invocation of `recomputeReputation(reviewee)`.
    - Auto-award Verified Member badge if user reaches $\ge 5$ completed swaps with $\ge 3.5$ rating average.
  - List peer reviews for member (`GET /api/reviews/user/:userId`) with pagination.
- **Dependencies**: `Review`, `SwapRequest`, `User`, `reputation.js`.
- **Status**: Planned.

### Phase 6: Direct Messaging (Module H) & Notifications (Module I)
- **Scope**:
  - Bilateral messaging with deterministic conversation keys (`minId:maxId`).
  - Active conversation listing with unread count badges without N+1 queries.
  - Global unread message counter for navigation header.
  - Cursor-based message history retrieval (`before`) with automatic read receipt marking on initial load.
  - Anti-spam message rate limiting (60/min) and debounced notification generation (10-minute window).
  - Centralized notification service (`utils/notify.js`) with deduplication key partial index.
  - Notification listing with pagination, unread filter, single read, and bulk read-all operations.
  - 90-day automatic document expiration via TTL index.
- **Dependencies**: `Message`, `Notification`, `notify.js`.
- **Status**: Planned.

### Phase 7: Consolidated Dashboard Aggregator (Module J)
- **Scope**:
  - Unified member dashboard endpoint (`GET /api/dashboard`).
  - Parallel query execution with `Promise.all`.
  - Skill inventory counts, swap pipeline counts, completed session hours.
  - Profile readiness checklist with the 5 exact milestones:
    1. Email Verified (done: true)
    2. Add Profile Bio (done: bio && bio.length > 0)
    3. Upload Avatar (done: profilePicUrl / avatar.file)
    4. List a Skill to Teach (done: teachCount > 0)
    5. List a Skill to Learn (done: learnCount > 0)
  - Road to Verified progress indicator.
  - Upcoming scheduled sessions, top 3 smart matches, recent activity feed.
  - 15-second in-memory caching per user.
- **Dependencies**: All modules.
- **Status**: Planned.

### Phase 8: Hardening, Automated Testing & Verification
- **Scope**:
  - Comprehensive automated tests covering all modules (auth, security, profiles, skills, smart match, swap lifecycle, sessions time-gating, dual completion, reviews, messaging, notifications, dashboard).
  - Validation of error responses, security headers, role enforcement, and edge cases.
  - Verification of full-stack UI operations with zero OTP dependencies.
- **Dependencies**: Testing suite, server running.
- **Status**: Planned.
