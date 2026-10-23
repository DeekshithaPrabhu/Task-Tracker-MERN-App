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



## Task details, reminders, bulk actions
- Click a task title (list or board) to open details: subtasks checklist, comments, and a history of status/field edits and subtask changes.
- Reminders (bell in the top bar) are computed from open tasks: overdue, due today, due in the next 2 days. They refresh every minute; `+1d` snoozes a task.
- On All tasks, tick tasks to complete, change status/priority/category/due date, or delete them in one go. Bulk updates are all-or-nothing.
- Extra API: `GET /api/tasks/:id`, `/:id/subtasks`, `/:id/activity`, `/:id/comments`, `PATCH /api/tasks/bulk`, `POST /api/tasks/bulk/delete`, `GET /api/notifications`.

## Pagination, errors, sessions
- `GET /api/tasks?page=1&limit=10` returns `{ tasks, total, page, pages, limit }` (limit 1 to 100). Without `page` it returns a plain array (the Board uses this).
- Unknown API URLs return JSON 404; unknown pages show a 404 screen; a deleted or missing task shows "could not be found".
- If a session expires or the cookie is invalid, the app returns to the login screen with a notice and brings you back to the page you were on after you log in.

## Troubleshooting login
Login attempts only count toward the rate limit (20 per 15 minutes) when the password is wrong. If you still see an error, note the exact message: "Invalid email or password" means the server rejected what it received; "The server is not responding properly" means the API isn't reachable (check `server` is running and MongoDB is up).
