# TaskForge 🔥
### Team Task Manager with Role-Based Access Control

A full-stack productivity app for teams to manage projects, assign tasks, and track progress — built with **Express**, **SQLite**, and **React**.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=flat)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat&logo=railway)

---

## ✨ Features

- 🔐 **Authentication** — Signup & Login with JWT (7-day sessions)
- 👥 **Role-Based Access Control** — Global Admin/Member + per-project Admin/Member
- 📁 **Project Management** — Create color-coded projects, track progress, manage teams
- ✅ **Task Tracking** — Create, assign, prioritize, and set due dates on tasks
- 🔥 **Auto Overdue Detection** — Tasks past due date are automatically flagged
- 📊 **Dashboard** — Live stats, recent activity, per-project progress bars
- 🛡️ **Admin Panel** — Manage all users, change roles, delete accounts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT, bcryptjs |
| Frontend | React 18, React Router v6 |
| Build Tool | Vite |
| Deployment | Docker → Railway |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

### 2. Start the backend
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

Open **http://localhost:5173** and sign up with role **Admin** for full access.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | — | **Required in production.** Sign with `openssl rand -hex 32` |
| `DB_PATH` | `./taskmanager.db` | SQLite file path |
| `NODE_ENV` | `development` | Set to `production` on Railway |

---

## 🌐 Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Add environment variables in the Railway dashboard:
   - `JWT_SECRET` → `openssl rand -hex 32`
   - `DB_PATH` → `/data/taskmanager.db`
   - `NODE_ENV` → `production`
4. Add a **Volume** mounted at `/data` for persistent storage
5. Click **Generate Domain** — your app is live!

Railway auto-detects the `Dockerfile` and builds everything automatically.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project + members + stats |
| PUT | `/api/projects/:id` | Update (admin) |
| DELETE | `/api/projects/:id` | Delete (admin) |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filter by status/priority/assignee) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/dashboard/summary` | Dashboard stats |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Users *(Admin only)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List / search users |
| PUT | `/api/users/:id/role` | Change role |
| DELETE | `/api/users/:id` | Delete user |

---

## 🗄️ Database Schema

```sql
users            (id, name, email, password, role, created_at)
projects         (id, name, description, color, owner_id, created_at)
project_members  (project_id, user_id, role, joined_at)
tasks            (id, title, description, project_id, assignee_id,
                  creator_id, status, priority, due_date, created_at, updated_at)
```

---

## 🔐 Role-Based Access Control

### Global Roles
- **Admin** — Full access including user management panel
- **Member** — Access only to their own projects

### Project Roles
- **Project Admin** — Manage project, members, and all tasks
- **Project Member** — Create tasks and update status

### Permission Matrix

| Action | Member | Project Member | Project Admin | Global Admin |
|--------|:------:|:--------------:|:-------------:|:------------:|
| Create project | ✅ | ✅ | ✅ | ✅ |
| Edit project | ❌ | ❌ | ✅ | ✅ |
| Add/remove members | ❌ | ❌ | ✅ | ✅ |
| Create tasks | ❌ | ✅ | ✅ | ✅ |
| Edit all task fields | ❌ | ❌ | ✅ | ✅ |
| Update task status | ❌ | ✅ | ✅ | ✅ |
| Delete tasks | ❌ | Own only | ✅ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       ├── tasks.js
│       └── users.js
├── frontend/src/
│   ├── api.js
│   ├── App.jsx
│   ├── styles.css
│   ├── context/AuthContext.jsx
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── TaskCard.jsx
│   │   └── TaskModal.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Projects.jsx
│       ├── ProjectDetail.jsx
│       ├── Tasks.jsx
│       ├── Users.jsx
│       ├── Login.jsx
│       └── Signup.jsx
├── Dockerfile
├── railway.json
└── README.md
```

---

## 📄 License

MIT