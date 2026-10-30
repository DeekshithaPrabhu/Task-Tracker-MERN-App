# Task Tracker App (MERN)

## Run locally

1. Start MongoDB (or use an Atlas URI).
2. Copy `server/.env.example` to `server/.env` and fill it in.
3. `npm run install:all`
4. `npm run dev`: web on http://localhost:5173, API on http://localhost:5000

## Project structure

```
Task-Tracker-App/
├── package.json              root scripts (install:all, dev)
├── server/                   Express + MongoDB API
│   ├── server.js             entry: exports the app (Vercel) and listens locally
│   └── src/
│       ├── app.js            builds the Express app (middleware, routes, errors)
│       ├── config/           env.js (settings), db.js (MongoDB connection)
│       ├── routes/           URL -> controller wiring, one file per resource
│       ├── controllers/      request handlers (auth, task, subtask, comment, category, notification, health)
│       ├── services/         reusable logic: token/cookie, activity log, task queries, mail
│       ├── middleware/       auth, cors, rate limits, DB guard, 404, error handler
│       ├── models/           Mongoose schemas (User, Task, Category, Activity)
│       └── utils/            asyncHandler, dates
└── client/                   React + Vite app
    ├── index.html, vite.config.js, jsconfig.json, vercel.json
    └── src/
        ├── main.jsx, App.jsx entry and route table
        ├── api/              http.js (fetch wrapper) + auth / tasks / categories / notifications
        ├── context/          AuthContext (session state)
        ├── routes/           guards.jsx (Protected, Guest)
        ├── pages/            Dashboard, Board, Tasks, Profile, NotFound, auth/*
        ├── components/       auth/, dashboard/, layout/, tasks/
        ├── hooks/            useForm
        ├── utils/            constants, format, theme
        └── styles/           index.css
```

`@/` in client imports means `client/src/` (for example `import { api } from '@/api'`).

## Deploying the API on Vercel

- **API project:** Root Directory `server`. Env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL).
- Check the API and database at `https://YOUR-API/api/health?db=1`.

## API

- `/api/auth`: register, login, logout, me, forgot-password, reset-password, profile, password
- `/api/tasks`: list (`q, status, priority, category, tag, dueFrom, dueTo, quick, sort, order`), `/stats`, `/tags`, create, `/:id` (get, update, delete), `/:id/extend`, `/bulk`, `/bulk/delete`, `/:id/subtasks`, `/:id/activity`, `/:id/comments`
- `/api/categories`, `/api/notifications`, `/api/health`
