# TaskForge — Team Task Manager

A full-stack team task manager with role-based access control, built with **Express + SQLite + React**.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Express, better-sqlite3    |
| Frontend  | React 18, React Router v6, Vite     |
| Auth      | JWT (jsonwebtoken), bcryptjs        |
| Deploy    | Docker → Railway                    |

---

## Features

- **Authentication** — Signup/Login with JWT, 7-day sessions
- **Role-Based Access** — Global Admin/Member + per-project Admin/Member
- **Projects** — Create, edit, delete; color-coded; progress tracking
- **Tasks** — Create, assign, status/priority, due dates, overdue auto-detection
- **Dashboard** — Live stats, recent activity, project progress bars
- **User Management** — Admin panel to manage roles and delete users

---

## Local Development

### Prerequisites
- Node.js 18+

### 1. Install backend dependencies
```bash
cd backend
npm install
```

### 2. Install frontend dependencies
```bash
cd frontend
npm install
```

### 3. Start the backend (port 5000)
```bash
cd backend
npm run dev
```

### 4. Start the frontend (port 5173)
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 — API calls are proxied to localhost:5000.

---

## Environment Variables

Set these in Railway (or a `.env` file locally):

| Variable       | Default                    | Description                     |
|----------------|----------------------------|---------------------------------|
| `PORT`         | `5000`                     | Server port                     |
| `JWT_SECRET`   | `super_secret_dev_key_...` | **Change this in production!**  |
| `DB_PATH`      | `./taskmanager.db`         | SQLite database file path       |
| `FRONTEND_URL` | `*`                        | CORS allowed origin             |

> ⚠️ **Always set a strong `JWT_SECRET` in production.**

---

## Deploying to Railway

### Option A: Deploy via GitHub (Recommended)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo — Railway auto-detects the `Dockerfile`
4. Add environment variables:
   - `JWT_SECRET` → a long random string (use `openssl rand -hex 32`)
   - `DB_PATH` → `/data/taskmanager.db` (if using a persistent volume)
5. (Optional) Add a Railway Volume mounted at `/data` for SQLite persistence
6. Deploy!

### Option B: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Persistent Storage

SQLite data is stored in the container filesystem by default (resets on redeploy). For persistent storage:

1. In Railway: Project → Add Volume → Mount at `/data`
2. Set env var: `DB_PATH=/data/taskmanager.db`

---

## API Reference

### Auth
| Method | Endpoint         | Auth | Description      |
|--------|------------------|------|------------------|
| POST   | /api/auth/signup | —    | Register         |
| POST   | /api/auth/login  | —    | Login            |
| GET    | /api/auth/me     | ✓    | Current user     |
| PUT    | /api/auth/me     | ✓    | Update profile   |

### Projects
| Method | Endpoint                              | Auth  | Description           |
|--------|---------------------------------------|-------|-----------------------|
| GET    | /api/projects                         | ✓     | List my projects      |
| POST   | /api/projects                         | ✓     | Create project        |
| GET    | /api/projects/:id                     | ✓ mbr | Get project details   |
| PUT    | /api/projects/:id                     | admin | Update project        |
| DELETE | /api/projects/:id                     | admin | Delete project        |
| POST   | /api/projects/:id/members             | admin | Add member            |
| DELETE | /api/projects/:id/members/:userId     | admin | Remove member         |

### Tasks
| Method | Endpoint                      | Auth | Description         |
|--------|-------------------------------|------|---------------------|
| GET    | /api/tasks                    | ✓    | List tasks (filter) |
| POST   | /api/tasks                    | ✓    | Create task         |
| GET    | /api/tasks/dashboard/summary  | ✓    | Dashboard stats     |
| GET    | /api/tasks/:id                | ✓    | Get task            |
| PUT    | /api/tasks/:id                | ✓    | Update task         |
| DELETE | /api/tasks/:id                | ✓    | Delete task         |

### Users (Admin only)
| Method | Endpoint             | Auth  | Description       |
|--------|----------------------|-------|-------------------|
| GET    | /api/users           | ✓     | List/search users |
| PUT    | /api/users/:id/role  | admin | Change role       |
| DELETE | /api/users/:id       | admin | Delete user       |

---

## Database Schema

```sql
users            (id, name, email, password, role, created_at)
projects         (id, name, description, color, owner_id, created_at)
project_members  (project_id, user_id, role, joined_at)
tasks            (id, title, description, project_id, assignee_id, creator_id,
                  status, priority, due_date, created_at, updated_at)
```

---

## Role-Based Access Control

### Global Roles
- **Admin** — Full access to all projects, tasks, and user management
- **Member** — Access only to projects they're a member of

### Project Roles  
- **Project Admin** — Can manage project settings, members, and all tasks
- **Project Member** — Can create tasks, update status, view all project tasks

### Rules
- Project owners always have admin-level access to their project
- Only project/global admins can add/remove members
- Task deletion requires: creator, project admin, or global admin
