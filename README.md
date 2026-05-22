# TaskFlow — Team Task Manager

A full-stack web app for managing team projects and tasks with role-based access control.

## Live Demo
> Add your Railway URL here after deployment

## Features

- **Auth** — JWT-based signup/login, persistent sessions
- **Projects** — Create projects, invite members by email
- **Role-based access** — Admin (full control) vs Member (view/create tasks)
- **Tasks** — Create, assign, set priority, due dates, track status
- **Dashboard** — Personal task stats, overdue count, progress bar
- **Kanban board** — Board and list views with status columns
- **Filters** — Filter tasks by status and assignee

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Railway |

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
npm install
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, proxies `/api` to `http://localhost:5000`.

## Deployment on Railway

### Backend

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
3. Deploy the `backend/` folder
4. Set environment variables:
   - `JWT_SECRET` — any long random string
   - `FRONTEND_URL` — your frontend Railway URL
5. Add a start command: `npm start`
6. After first deploy, run migrations:
   ```
   npx prisma migrate deploy
   ```

### Frontend

1. Create another Railway service for `frontend/`
2. Set environment variable:
   - `VITE_API_URL` — your backend Railway URL + `/api`
3. Build command: `npm run build`
4. Start command: `npx serve dist`

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail + tasks |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Invite member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |
| PATCH | `/api/projects/:id/members/:userId/role` | Change role (admin) |
| GET | `/api/tasks/dashboard` | My task stats |
| GET | `/api/tasks/project/:projectId` | Tasks for project |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Task detail |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Project Structure

```
task_manager/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.js
│   │   ├── lib/prisma.js
│   │   ├── middleware/auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── projects.js
│   │       ├── tasks.js
│   │       └── users.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── context/AuthContext.jsx
    │   ├── lib/api.js
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Modal.jsx
    │   │   ├── TaskCard.jsx
    │   │   ├── TaskForm.jsx
    │   │   └── InviteMemberForm.jsx
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── SignupPage.jsx
    │       ├── DashboardPage.jsx
    │       ├── ProjectsPage.jsx
    │       ├── ProjectDetailPage.jsx
    │       └── TaskDetailPage.jsx
    └── package.json
```
