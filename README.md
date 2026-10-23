# Taskflow (MERN)

## Run
1. Start MongoDB locally (or put an Atlas URI in `server/.env`).
2. `npm run install:all`
3. `server/.env` needs `JWT_SECRET` (see `.env.example`).
4. `npm run dev` → web on http://localhost:5173, API on :5000

## Accounts
- Passwords are hashed with bcrypt (cost 12). Sessions are a JWT in an httpOnly cookie.
- Every task and category belongs to a user; all queries are scoped to the logged-in user.
- Forgot password: the reset link is printed in the **server console** (`server/mailer.js`). Swap in nodemailer or an email API for production.
- Set `NODE_ENV=production` to make the cookie `secure` (needs HTTPS).

## API (all except /auth require login)
- `/api/auth`: register, login, logout, me, forgot-password, reset-password, profile, password
- `/api/tasks`: list/filter/sort (`q, status, priority, category, tag, dueFrom, dueTo, quick, sort, order`), `/stats`, `/tags`, create, update, `/:id/extend`, delete
- `/api/categories`: list, create, rename (updates tasks), delete (tasks become uncategorised)

Tasks created before accounts existed have no owner and won't appear for anyone.
