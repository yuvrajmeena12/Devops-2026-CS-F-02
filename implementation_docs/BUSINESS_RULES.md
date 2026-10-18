# SKILLSWAP: BUSINESS RULES, FORMULAS & STATE TRANSITIONS

This document specifies the exact business rules, calculation algorithms, state transitions, security constraints, and limits implemented in the SkillSwap platform.

---

## 1. Authentication & Session Security (OTP Excluded)

### 1.1 Non-OTP Authentication Invariant
- **Direct Account Activation**: Upon valid registration, user account is immediately active without email OTP gating.
- **Password Constraints**: 6–72 characters, hashed with `bcryptjs` (salt cost 10–12). Plaintext passwords and hashes are never exposed.
- **Brute-Force Lockout**: 
  - Failed login attempts increment `failedLogins`.
  - When `failedLogins >= 5`, account is locked until `lockUntil = Date.now() + 15 * 60 * 1000` (15 minutes).
  - Attempting to log in during lockout returns HTTP `429 Too Many Requests` (`message: 'Account is temporarily locked. Please try again later.'`).
  - Successful login resets `failedLogins = 0` and `lockUntil = null`.
- **Session Revocation via `tokenVersion`**:
  - Each user has a numeric `tokenVersion` (default 0).
  - JWT payload encodes `{ id, tokenVersion }`.
  - Changing password or resetting password increments `tokenVersion`, instantly invalidating all tokens issued prior to the change.
- **Cryptographic Token Password Recovery (Non-OTP)**:
  - Forgot password generates a cryptographically secure 32-byte hexadecimal token (`crypto.randomBytes(32).toString('hex')`).
  - Stored in database as SHA-256 hash in `resetPasswordToken` with `resetPasswordExpire = Date.now() + 15 * 60 * 1000` (15 minutes).
  - Reset request (`PUT /api/auth/reset-password/:token`) verifies token hash, sets new password, clears reset token fields, and increments `tokenVersion`.

---

## 2. Skill Catalog & Taxonomy

### 2.1 Predefined Categories (15 Industry Standards)
1. `Programming`
2. `Web Development`
3. `Data & AI`
4. `Design`
5. `Video & Photography`
6. `Music`
7. `Languages`
8. `Business`
9. `Marketing`
10. `Writing`
11. `Science & Math`
12. `Cooking`
13. `Fitness & Wellness`
14. `Public Speaking`
15. `Other`

### 2.2 Proficiency Levels (4 Tiers)
- `beginner`
- `intermediate`
- `advanced`
- `expert`

### 2.3 Inventory Limits & Duplicate Rules
- **Inventory Partitioning**: Separate `teach` (offered) and `learn`/`want` (desired) inventories.
- **Cap per User**: Maximum 50 skills of type `teach` and 50 skills of type `learn` (`MAX_SKILLS_PER_TYPE = 50`).
- **Duplicate Prevention**: A user cannot list two skills with the same normalized name (`nameLower` or `title.toLowerCase().trim()`) under the same type. Enforced by unique compound index `{ owner: 1, nameLower: 1, type: 1 }`.
- **Proof Attachment Restriction**: Proof files can ONLY be attached to skills of type `teach`. Any attempt to attach proof to a `learn` skill is rejected with HTTP `400 Bad Request`.
- **Active Swap Deletion Guard**: Skills currently involved in an active swap (`pending`, `accepted`, `scheduled`, `in_progress`) cannot be deleted or mutated.

---

## 3. Algorithmic Smart Match Engine

### 3.1 Eligibility & Input Processing
- Candidate search matches normalized skill names (`nameLower` / `title.toLowerCase()`).
- The current user's own skills and unverified/banned users are excluded.
- Evaluates intersections:
  - `theyTeachMe`: Skills the candidate teaches that the current user wants to learn.
  - `iTeachThem`: Skills the current user teaches that the candidate wants to learn.

### 3.2 Compatibility Classification
- **Reciprocal**: `theyTeachMe.length > 0 && iTeachThem.length > 0`
- **They Teach You (One-Way)**: `theyTeachMe.length > 0 && iTeachThem.length === 0`
- **You Teach Them (One-Way)**: `theyTeachMe.length === 0 && iTeachThem.length > 0`

### 3.3 Deterministic Scoring Formula
$$\text{Score} = (\text{isReciprocal} ? 100 : 40) + \min(\text{theyTeachCount}, 3) \times 8 + \min(\text{youTeachCount}, 3) \times 8 + (\text{isVerified} ? 6 : 0) + \min(\text{ratingAvg}, 5)$$

- Results are sorted descending by `Score`.
- Cached in memory for 30 seconds per user.

---

## 4. Swap Lifecycle & State Transitions

### 4.1 State Machine
Allowed statuses: `pending`, `accepted`, `rejected` (or `declined`), `scheduled`, `in_progress`, `completed`, `cancelled`.

```
                    ┌──────────────┐
                    │   pending    │
                    └───┬──────┬───┘
          Provider      │      │     Provider
          Accepts       │      │     Rejects
                        ▼      ▼
                 ┌──────────┐ ┌──────────┐
                 │ accepted │ │ rejected │
                 └────┬─────┘ └──────────┘
           Schedule   │
           Session    ▼
                 ┌───────────┐
                 │ scheduled │
                 └─────┬─────┘
        1st Partner    │ (Start time must be in past)
        Confirms Done  ▼
               ┌─────────────┐
               │ in_progress │
               └──────┬──────┘
        2nd Partner   │
        Confirms Done ▼
                ┌───────────┐
                │ completed │
                └───────────┘
```

- **Cancel Rule**:
  - `pending` swap can be cancelled/withdrawn by `requester`.
  - `accepted` or `scheduled` swap can be cancelled by either participant.
  - Cancelling an active swap automatically sets any scheduled sessions for that swap to `status: 'cancelled'`.
  - Swaps in `in_progress` or `completed` cannot be cancelled.

---

## 5. Scheduled Exchange Sessions & Completion Consensus

### 5.1 Scheduling Validation Rules
- **Lead Time**: `scheduledAt` must be at least 5 minutes in the future (`MIN_LEAD_MS = 5 * 60 * 1000`) and at most 1 year ahead.
- **Duration**: Integer between 15 and 480 minutes (default 60).
- **Meeting URL**: Optional, but if provided must match `/^https:\/\/[^\s]+$/i` (HTTPS required).
- **Rescheduling**: Scheduling a new session for a swap automatically marks any existing scheduled session for that swap as `cancelled`. Swap status is refreshed to `scheduled` and `completionConfirmedBy` is reset to empty.

### 5.2 Two-Party Time-Gated Completion Protocol
1. **Time Gate**: `session.scheduledAt.getTime() <= Date.now()`. If start time has not passed, throw HTTP `403 Forbidden` (`message: 'You can mark a session complete once its start time has passed'`).
2. **Authorization**: Only the two authorized swap participants may submit completion confirmation.
3. **Idempotence**: Adds participant's user ID to `SwapRequest.completionConfirmedBy` using `$addToSet`.
4. **Single Confirmation**: If 1 participant confirms, swap moves to `in_progress`. Counterpart is notified: `"User marked the session done. Confirm to finish the swap."`.
5. **Dual Confirmation**: When both participants have confirmed:
   - Swap status transitions to `completed`, `completedAt = new Date()`.
   - Session status transitions to `completed`.
   - `recomputeReputation` is automatically executed for both participants.
   - Completion notifications sent to both participants encouraging peer reviews.

---

## 6. Reputation Engine & Verified Member Badge

### 6.1 Reputation Recalculation Formula
- Executed on every review submission and swap completion:
  $$\text{ratingCount} = \text{total eligible reviews received by user}$$
  $$\text{ratingAvg} = \frac{\sum \text{ratings}}{\text{ratingCount}} \quad \text{(rounded to 2 decimal places)}$$
  $$\text{completedSwaps} = \text{total swaps where user is participant and status is 'completed'}$$

### 6.2 Verified Member Qualification Threshold
$$\text{isVerified} = (\text{completedSwaps} \ge 5) \land (\text{ratingAvg} \ge 3.5)$$
- If user earns the badge for the first time, `verifiedAt = new Date()` is recorded, and an in-app `badge_earned` notification is dispatched.
- Users can NEVER manually modify their `isVerified`, `ratingAvg`, `ratingCount`, or `completedSwaps` fields directly.

---

## 7. Direct Messaging & Anti-Spam

### 7.1 Deterministic Keying
- Every conversation key is deterministically generated:
  $$\text{key} = \min(\text{userA}, \text{userB}) + \text{":"} + \max(\text{userA}, \text{userB})$$
  Ensures exactly one conversation thread exists between any two members.

### 7.2 Rate Limiting & Notification Debouncing
- Rate limit: 60 messages per minute per user.
- Notification debouncing: in-app notification sent with deduplication key:
  $$\text{dedupeKey} = \text{"message:"} + \text{senderId} + \text{":"} + \lfloor \text{Date.now()} / 600000 \rfloor \quad \text{(10-minute window)}$$
  Prevents flood of notifications during active chat.

---

## 8. Dashboard Aggregation & Milestones

### 8.1 Profile Readiness Milestones (Exact 5 Items)
1. `email`: **Email Verified** (always `done: true` in non-OTP mode)
2. `bio`: **Add Profile Bio** (`done: Boolean(user.bio && user.bio.trim().length > 0)`)
3. `avatar`: **Upload Avatar** (`done: Boolean(user.profilePicUrl || (user.avatar && user.avatar.file))`)
4. `teach`: **List a Skill to Teach** (`done: teachCount > 0`)
5. `learn`: **List a Skill to Learn** (`done: learnCount > 0`)

$$\text{percentage} = \text{Math.round}\left(\frac{\text{completedMilestones}}{5} \times 100\right)$$

### 8.2 Road to Verified Milestones
- Swap progress: $\min(\text{completedSwaps}, 5) / 5$ (requires 5 completed swaps).
- Rating threshold: requires $\ge 3.5$ rating average.
