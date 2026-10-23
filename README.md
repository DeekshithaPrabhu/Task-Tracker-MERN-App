# Taskflow (MERN)

## Run
1. Start MongoDB locally (or put an Atlas URI in `server/.env`).
2. `npm run install:all`
3. `npm run dev` → web on http://localhost:5173, API on :5000

## API
- `GET /api/tasks/stats`: everything the dashboard needs in one call
- `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/extend` with `{ "days": 3 }`: pushes the due date forward

Overdue = not done and due before today (server local time).
