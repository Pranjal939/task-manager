# TaskFlow

A team task manager I built to help small teams stay organized. You can create projects, invite teammates, assign tasks, and track progress — all in one place.

## What it does

- Sign up and log in with JWT-based auth
- Create projects and invite members by email
- Two roles — Admin (full control) and Member (can view and create tasks)
- Create tasks with title, description, priority, due date, and assignee
- Kanban board view and list view
- Filter tasks by status or assignee
- Dashboard showing your personal task stats and overdue count

## Tech I used

- **Frontend** — React 18, Vite, Tailwind CSS, React Router v6
- **Backend** — Node.js, Express, Prisma ORM
- **Database** — PostgreSQL hosted on [Neon](https://neon.tech)
- **Auth** — JWT + bcrypt
- **Deployed on** — Railway

## Running it locally

You'll need Node.js 18+ and a PostgreSQL database.

**Backend**
```bash
cd backend
cp .env.example .env
# Add your DATABASE_URL and JWT_SECRET to .env
npm install
npx prisma migrate dev
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. API calls proxy to `http://localhost:5000`.

## Live demo

Frontend: https://exciting-alignment-production-1ea4.up.railway.app
