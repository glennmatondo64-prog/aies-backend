# AIES Backend — the 0 → 100% build guide

This guide takes you from an empty folder to a deployed API. It's written for **you, the backend developer**, and it maps directly onto the 8 phases in your roadmap.

This starter repo already gets you through **Phases 0–5** with working code. Your job is to (a) run it, (b) understand it, (c) extend the parts marked *"Your turn"*, and (d) finish Phases 6–7. Each phase below tells you exactly what to do.

---

## How to work through this

For each phase:
1. **Read** the "What & why" so you understand the goal.
2. **Run or write** the code.
3. **Test** with curl or Postman (every phase has a test step).
4. **Commit** with a clear message, then tick the box in your roadmap tracker.

A good rhythm is one phase per sitting. Don't skip the testing step — a broken auth layer will haunt every later phase.

---

## Phase 0 — Scaffold & running server  ·  *Today*

**What & why.** Get a server that runs and a repo that's pushed. Everything hangs off this.

**Do it.** This repo *is* Phase 0, already done. To bring it to life:
```bash
npm install
cp .env.example .env        # then edit values
npm run dev
```
Open `http://localhost:5000/api/health` → `{"ok":true}`.

**Understand it.**
- `server.js` — starts the server, connects Prisma, handles graceful shutdown.
- `src/app.js` — the Express app: `helmet`, `cors`, JSON parsing, rate limiting, then routes, then error handling. **Order matters** — error handlers go last.
- `src/config/prisma.js` — one shared database client for the whole app (never create `new PrismaClient()` in each file).

**Test.** `curl http://localhost:5000/api/health`

**Commit.** `git commit -m "chore: scaffold express server"`

---

## Phase 1 — Database, schema & models  ·  *Week 1*

**What & why.** Your 8 SRS tables become a real, related schema. This is the single most important design step — get the relationships right and the rest is easy.

**Do it.** The schema is written for you in `prisma/schema.prisma`. Create the tables:
```bash
npm run prisma:generate     # builds the type-safe client from the schema
npm run prisma:migrate       # creates the tables in your database
npm run seed                 # optional sample data
npm run prisma:studio        # optional: open a visual DB browser
```

**Understand it.** Open `prisma/schema.prisma` and trace the relationships:
- A `User` holds login for **every** role. Role-specific data lives in `Student` / `Company` / `University` (linked by `userId`).
- `Application` is the join between a `Student` and an `Internship`, plus its status and supervisor assignments.
- `@@unique([studentId, internshipId])` stops a student applying twice.
- The enums (`Role`, `ApplicationStatus`, `ReportStatus`) keep bad values out of the database.

**Your turn (optional).** Add fields the SRS hints at but I kept minimal — e.g. `attendance` records, or a `Notification` table (you'll need it in Phase 6). To change the schema: edit `schema.prisma`, then `npm run prisma:migrate`.

**Test.** Run `npm run prisma:studio` and confirm all 8 tables exist with the seed rows.

**Commit.** `git commit -m "feat: database schema and models"`

---

## Phase 2 — Authentication & role-based access  ·  *Week 1–2*

**What & why.** The gatekeeper. Every other endpoint trusts this layer to say *who* the caller is and *what role* they have.

**Do it.** Already implemented:
- `src/controllers/auth.controller.js` — `register` (hashes the password with bcrypt, creates the role profile in a transaction), `login` (verifies password, issues a JWT), `me`.
- `src/middleware/auth.js` — `authenticate` (verifies the token, loads the user) and `authorize(...roles)` (the role gate).

**Understand the pattern.** A protected, role-restricted route looks like:
```js
router.post('/', authenticate, authorize('COMPANY'), createInternship);
//                 ^ who are you?   ^ are you allowed?   ^ do the work
```
`authenticate` runs first and attaches `req.user`; `authorize` checks `req.user.role`. This same two-step guards every sensitive endpoint in the app.

**Your turn.** The SRS lists **email verification** and **forgot password**. Add them:
1. Add `isVerified Boolean @default(false)` and `resetToken String?` to the `User` model, migrate.
2. On register, generate a token and email a verification link (use the Phase 6 notification service).
3. Add `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` routes.

**Test.**
```bash
# register → login → hit a protected route with the returned token
curl -X POST localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@aies.dev","password":"password123"}'
curl localhost:5000/api/dashboard/admin -H "Authorization: Bearer <TOKEN>"
```
Confirm a Student token is **rejected** (403) on the admin route.

**Commit.** `git commit -m "feat: auth and role-based access control"`

---

## Phase 3 — Profiles & internship opportunities  ·  *Week 2–3*

**What & why.** The core CRUD everything else references: student profiles, and the internship postings companies create and students browse.

**Do it.** Implemented:
- `student.controller.js` — get/update my profile, list students.
- `internship.controller.js` — list (with `search`, `location`, `skill` filters), get one, create, update, delete. Note the **ownership check**: a company can only edit *its own* internships.

**Understand the pattern.** Filtering is done by building a Prisma `where` object from query params — see `listInternships`. Copy this pattern anywhere you need search.

**Your turn.**
- **CV / file upload.** Right now `cv` is just a string field. In Phase 6 you'll wire real file uploads; until then a client can PUT a URL.
- **University module.** Add endpoints for a university to manage departments and approve placements (mirror the student controller's structure).

**Test.**
```bash
# as a company, create an internship; as a student, browse it
curl "localhost:5000/api/internships?skill=node"
```

**Commit.** `git commit -m "feat: profiles and internship module"`

---

## Phase 4 — Applications, monitoring & weekly reports  ·  *Week 3–4*

**What & why.** The internship lifecycle: a student applies → company accepts → supervisors are assigned → the student submits weekly reports → supervisors review them.

**Do it.** Implemented:
- `application.controller.js` — `apply`, `myApplications`, `applicantsForInternship`, `reviewApplication` (accept/reject), `assignSupervisors` (+ start/end dates for monitoring).
- `report.controller.js` — `submitReport`, `myReports`, `reportsForStudent`, `reviewReport`.

**Understand the flow.** Trace one application through its statuses: `PENDING` → (company reviews) → `ACCEPTED` → (supervisors assigned, dates set) → weekly reports submitted → `COMPLETED`.

**Your turn.**
- **Attendance.** The SRS wants attendance tracking. Add an `Attendance` table (`studentId`, `date`, `present`) and endpoints, or a simple counter on the application.
- **Notifications.** Fire a notification on "application accepted" and "report approved" (Phase 6).

**Test.** Apply as `student@aies.dev`, then as `company@aies.dev` accept the application and check the status changes.

**Commit.** `git commit -m "feat: applications, monitoring, weekly reports"`

---

## Phase 5 — Evaluation & dashboards  ·  *Week 4–5*

**What & why.** Turn all the collected data into scores and the summary numbers each role's dashboard shows.

**Do it.** Implemented:
- `evaluation.controller.js` — create an evaluation (technical / professional / overall, each 1–5) and list a student's evaluations.
- `dashboard.controller.js` — `adminStats` (uses Prisma `count` and `groupBy`) and `studentStats`. These are your **templates**.

**Your turn.** Build the remaining dashboards from the SRS by copying the pattern:
- **Company dashboard** — internship posts, applicant counts, current interns, evaluations given.
- **University dashboard** — number of students, active vs. completed internships, performance stats.
Each is a handful of `prisma.<model>.count(...)` / `groupBy(...)` calls returned as JSON.

**Test.** `curl localhost:5000/api/dashboard/admin -H "Authorization: Bearer <ADMIN_TOKEN>"`

**Commit.** `git commit -m "feat: evaluations and dashboard stats"`

---

## Phase 6 — Notifications, files & security  ·  *Week 5–6*  ·  *Your turn*

**What & why.** The two cross-cutting systems (notifications, file uploads) plus hardening the SRS explicitly requires.

**Build it.**

1. **Notifications.** Add a `Notification` model (`userId`, `message`, `type`, `read`, `createdAt`). Create a small service:
   ```js
   // src/services/notification.service.js
   async function notify(userId, message, type) {
     await prisma.notification.create({ data: { userId, message, type } });
     // optional: also send email with nodemailer
   }
   ```
   Call `notify(...)` from the relevant controllers (application accepted, report approved, new internship, evaluation completed). Add `GET /api/notifications` for the logged-in user.

2. **File uploads.** Install `multer`. Add an upload route that stores CVs, internship agreements, and final reports, saving the file path onto the record. For production, upload to cloud storage (S3, Cloudinary) instead of local disk.
   ```bash
   npm install multer
   ```

3. **Security checklist** (the SRS section 8):
   - Password encryption — ✅ already (bcrypt).
   - Role permissions — ✅ already (`authorize`).
   - `helmet` + rate limiting — ✅ already in `app.js`.
   - Add input sanitization everywhere (extend the express-validator rules).
   - Add a document/API of what each role may access, and confirm no endpoint leaks another user's data.
   - Plan database backups (your DB host usually provides automated backups).

4. **API docs.** Add Swagger (`swagger-ui-express` + `swagger-jsdoc`) or export a Postman collection so the frontend team can self-serve.

**Test.** Trigger each notification path; upload and retrieve a file; run through the security checklist.

**Commit.** `git commit -m "feat: notifications, uploads, security hardening"`

---

## Phase 7 — Testing & deployment  ·  *Week 6+*  ·  *Your turn*

**What & why.** Make it trustworthy, then put it online so the frontend can connect.

**Build it.**

1. **Tests.** Install `jest` + `supertest`. Cover the critical paths first: register/login, role rejection, apply → review, submit → review report.
   ```bash
   npm install --save-dev jest supertest
   ```
   ```js
   // example test
   const request = require('supertest');
   const app = require('../src/app');
   test('health check', async () => {
     const res = await request(app).get('/api/health');
     expect(res.body.ok).toBe(true);
   });
   ```

2. **Deploy.**
   - Push to GitHub (`github.com/UpSkillHub`).
   - Host the database (Neon / Supabase / Railway give you a `DATABASE_URL`).
   - Deploy the API to **Render** (or Railway / AWS): set the env vars, build command `npm install && npx prisma generate`, start command `npx prisma migrate deploy && node server.js`.
   - Set `CLIENT_URL` to the deployed frontend URL so CORS allows it.

3. **Smoke test production.** Run your key curl commands against the live URL. Hand the base URL + API reference (README) to the frontend team.

**Commit.** `git commit -m "test: core coverage + deploy config"`

---

## You're at 100%

When every phase is checked off you'll have: a deployed, documented, role-secured API backing all 6 user types and the full internship lifecycle from application to evaluation — exactly the backend the SRS describes.

**Suggested order if you ever feel stuck:** get Phases 0–2 rock solid first (setup, database, auth). Everything after that is the same pattern repeated — a route, a role guard, a controller, a Prisma call. Once you've written two or three, the rest go fast.

Happy building. 🚀
