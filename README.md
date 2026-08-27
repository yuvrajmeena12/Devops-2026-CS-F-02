# SkillSwap — Peer-to-Peer Skill Exchange Platform (MERN Stack)

A full-stack MERN application where users trade skills with each other instead of money.
See `SkillSwap_Project_Report.md` for the full feature specification (every page, button, and function explained).

---

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT + bcrypt
- **Deployment:** Vercel (frontend) + Render (backend) + MongoDB Atlas (database) — all free tier

---

## Folder Structure

```
skillswap/
├── backend/
│   ├── config/db.js
│   ├── models/          (User, Skill, SwapRequest, Session, Review, Message, Notification)
│   ├── middleware/auth.js
│   ├── controllers/     (auth, skill, swap, session, review, message, notification, admin)
│   ├── routes/          (matching controllers)
│   ├── utils/notify.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── context/AuthContext.jsx
    │   ├── components/  (Navbar, ProtectedRoute, SkillCard, StarRating, RequestSwapModal, ScheduleModal, ReviewModal)
    │   ├── pages/        (Home, Login, Register, Dashboard, MySkills, Explore, SmartMatch, Profile, MySwaps, Chat, Notifications, Admin)
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## Step 1 — Get a Free Database (MongoDB Atlas)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **free (M0) cluster** — pick any cloud provider/region close to you.
3. Under **Database Access**, create a database user (username + password — save these).
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) — fine for a student project.
5. Click **Connect** on your cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
6. Replace `<username>` and `<password>` with your database user's credentials, and add `skillswap` as the database name before the `?`:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/skillswap
   ```
7. Paste this into `backend/.env` as `MONGO_URI`.

---

## Step 2 — Run Locally in VS Code

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: paste your MONGO_URI, and set JWT_SECRET to any random long string
npm run dev
```
Backend runs on `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Default VITE_API_URL already points to http://localhost:5000/api — no change needed for local dev
npm run dev
```
Frontend runs on `http://localhost:5173`.

Open `http://localhost:5173` in your browser — register two test accounts (open one in an incognito window) so you can test the full swap flow between two users.

---

## Step 3 — Making Yourself an Admin (to test the Admin Dashboard)

The Admin Dashboard requires `role: "admin"` on a user, which isn't exposed in the UI for security reasons. To test it:
1. Register a normal account.
2. Open MongoDB Atlas → Browse Collections → `skillswap` database → `users` collection.
3. Find your user document and manually edit the `role` field from `"user"` to `"admin"`.
4. Log out and log back in — the "Admin" link will now appear in the navbar.

---

## Step 4 — Deployment (All Free)

### Backend → Render
1. Push this project to a GitHub repository.
2. Go to https://render.com → **New** → **Web Service** → connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables (from your `.env`): `MONGO_URI`, `JWT_SECRET`, `PORT` (Render sets this automatically, but keep it as fallback), `CLIENT_URL` (set this to your Vercel frontend URL once deployed in Step below).
7. Deploy. Render gives you a URL like `https://skillswap-backend.onrender.com`.

> Note: Render's free tier spins down after inactivity, so the first request after idle time may take ~30-50 seconds to wake up. This is normal and fine for an internship demo — just mention it if your evaluator notices a slow first load.

### Frontend → Vercel
1. Go to https://vercel.com → **New Project** → import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable: `VITE_API_URL` = `https://skillswap-backend.onrender.com/api` (your Render backend URL + `/api`).
4. Deploy. Vercel gives you a URL like `https://skillswap.vercel.app`.
5. Go back to Render and update the `CLIENT_URL` environment variable to your Vercel URL, then redeploy the backend so CORS allows requests from it.

---

## Known Simplifications (mention these honestly in your evaluation — evaluators respect this)

- **Chat** uses simple polling (refetches every 4 seconds) instead of Socket.io, to keep the codebase approachable for a first full-stack project. The project report documents Socket.io as the "future scope" upgrade — you can mention you're aware of this trade-off.
- **File uploads** (profile pictures) use a plain URL field for now instead of actual image upload, to avoid needing a paid storage service. You can extend this with Cloudinary's free tier if you want file uploads.
- **Email notifications** are not implemented — only in-app notifications. Nodemailer + Gmail SMTP (free) can be added later.

These are reasonable, defensible scope decisions for a first MERN project — not bugs.

---

## Suggested Order to Understand the Code (for learning, not just running it)

1. `backend/models/` — understand the data shapes first
2. `backend/routes/` + `backend/controllers/` — see how each model is exposed via API
3. `backend/middleware/auth.js` — understand how JWT protects routes
4. `frontend/src/context/AuthContext.jsx` — how login state is shared across the app
5. `frontend/src/pages/MySkills.jsx` — a simple CRUD page, good starting point
6. `frontend/src/pages/SmartMatch.jsx` + `backend/controllers/skillController.js` (`getMatches`) — the core "smart matching" logic, the most unique part of this project
