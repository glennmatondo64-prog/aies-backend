# AIES — Backend API

Backend for the **Academic Internship Evaluation System**: a platform connecting students, companies, universities, and supervisors around internships.

Built with **Node.js + Express + Prisma (PostgreSQL)**, JWT auth, and role-based access for all 6 user roles.

> New here? Read **[GUIDE.md](./GUIDE.md)** — it walks the project from 0 to 100% phase by phase and explains how to extend this starter.
Live API: https://aies-backend.onrender.com/api/health
---

## What's already built

| Area | Status |
|------|--------|
| Project scaffold (MVC) | ✅ Done |
| Database schema — all 8 tables | ✅ Done |
| Auth: register / login / me (bcrypt + JWT) | ✅ Done |
| Role-based access control (6 roles) | ✅ Done |
| Student profiles | ✅ Done |
| Internships (CRUD + search/filter) | ✅ Done |
| Applications (apply, review, assign supervisors) | ✅ Done |
| Weekly reports (submit, review) | ✅ Done |
| Evaluations (scores + comments) | ✅ Done |
| Dashboard stat endpoints (admin, student) | ✅ Starter |
| Notifications, file uploads, tests, deploy | 🔜 See GUIDE.md |

---

## Quick start

### 1. Prerequisites
- **Node.js** 18+
- **PostgreSQL** running locally (or a hosted URL, e.g. from [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Then edit `.env` — set your real `DATABASE_URL` and a long random `JWT_SECRET`.

### 4. Set up the database
```bash
npm run prisma:generate   # generate the Prisma client
npm run prisma:migrate     # create the tables
npm run seed               # (optional) add sample users
```

### 5. Run
```bash
npm run dev                # auto-restart with nodemon
```
Visit **http://localhost:5000/api/health** — you should see `{"ok":true,...}`.

### Seeded test accounts
All use password **`password123`**:
`student@aies.dev` · `company@aies.dev` · `university@aies.dev` · `academic@aies.dev` · `mentor@aies.dev` · `admin@aies.dev`

---

## API reference

All protected routes need an `Authorization: Bearer <token>` header. Get a token from `/api/auth/login`.

### Auth
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/register` | Public | Create account + role profile |
| POST | `/api/auth/login` | Public | Get a JWT |
| GET | `/api/auth/me` | Any logged-in | Current user + profile |

### Students
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/students/me` | Student | My profile |
| PUT | `/api/students/me` | Student | Update my profile |
| GET | `/api/students` | University, Admin | List students |

### Internships
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/internships?search=&location=&skill=` | Public | Browse + filter |
| GET | `/api/internships/:id` | Public | One internship |
| POST | `/api/internships` | Company | Create post |
| PUT | `/api/internships/:id` | Company (owner) | Update |
| DELETE | `/api/internships/:id` | Company (owner) | Delete |

### Applications
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/applications` | Student | Apply (`{ internshipId }`) |
| GET | `/api/applications/mine` | Student | My applications |
| GET | `/api/applications/internship/:id` | Company (owner) | Applicants |
| PATCH | `/api/applications/:id/status` | Company | Accept/reject (`{ status }`) |
| PATCH | `/api/applications/:id/assign` | Company, University, Admin | Assign supervisors + dates |

### Reports (weekly)
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/reports` | Student | Submit weekly report |
| GET | `/api/reports/mine` | Student | My reports |
| GET | `/api/reports/student/:studentId` | Supervisors, Admin | A student's reports |
| PATCH | `/api/reports/:id/review` | Supervisors, Admin | Comment + approve/reject |

### Evaluations
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/evaluations` | Supervisors, Admin | Score a student (1–5) |
| GET | `/api/evaluations/student/:studentId` | Any logged-in | A student's evaluations |

### Dashboards
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/dashboard/admin` | Admin | System-wide stats |
| GET | `/api/dashboard/student` | Student | My summary counts |

---

## Example requests

Register a student:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@test.com","password":"secret123","role":"STUDENT","profile":{"department":"CS"}}'
```

Log in and call a protected route:
```bash
# 1. login → copy the token from the response
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@aies.dev","password":"password123"}'

# 2. use it
curl http://localhost:5000/api/students/me \
  -H "Authorization: Bearer <PASTE_TOKEN>"
```

---

## Project structure
```
aies-backend/
├─ prisma/
│  ├─ schema.prisma      # all 8 tables + enums
│  └─ seed.js            # sample data
├─ src/
│  ├─ config/prisma.js   # shared Prisma client
│  ├─ middleware/        # auth (authenticate + authorize), errors, validation
│  ├─ utils/             # jwt, ApiError, asyncHandler
│  ├─ controllers/       # business logic per feature
│  ├─ routes/            # endpoint definitions + validation + role guards
│  └─ app.js             # express app (security, routing)
├─ server.js             # entry point
├─ .env.example
└─ GUIDE.md              # the 0→100 build guide
```
