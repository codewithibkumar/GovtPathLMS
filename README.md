# GovPath Academy — LMS + CRM

A production-ready Learning Management System and lightweight CRM for selling online courses to **Indian government-job aspirants (Class 9–12)** and **graduate students**.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · MongoDB/Mongoose · NextAuth · Razorpay · Cloudflare R2 (S3-compatible)**.

---

## ✨ Features

**Public site** — hero, course catalog with filters (exam / class / subject / price / teacher), full course detail with instructor info, Razorpay "Buy now".

**Student dashboard** (`/dashboard`) — enrolled courses with progress, secure video player (modules + lessons, resume playback, mark complete, notes), certificate download on completion, purchase history, wishlist.

**Teacher dashboard** (`/teacher`) — CRUD for own courses, thumbnail + multi-video upload (direct to R2), drag-and-drop curriculum builder, enrolled-student counts, earnings overview.

**Admin dashboard** (`/admin`) — approve/publish teacher courses, user management with role assignment, visitor & sales analytics (funnel, revenue, top courses), platform stats.

**CRM tracking** — `course_visited`, `checkout_initiated`, `checkout_completed`, `checkout_abandoned` events power the admin analytics funnel.

**Security** — role-based middleware + server-side guards (RBAC), teachers limited to their own courses, signed short-lived URLs for private video playback, Razorpay signature + webhook verification.

---

## 🗂️ Tech & structure

```
src/
  app/            # routes (public, auth, dashboard, teacher, admin) + /api
  components/     # ui/ (shadcn), navbar, video-player, course-editor, ...
  lib/            # db, auth, rbac, razorpay, s3, analytics, queries
  models/         # User, Course, Module, Lesson, Enrollment, Progress, Order, AnalyticsEvent
middleware.ts     # edge RBAC route protection
scripts/seed.ts   # demo data
Dockerfile        # standalone image for Coolify
docker-compose.yaml
```

### Data model relationships
- `User (role)` 1─*→ `Course (teacherId)`
- `Course` 1─*→ `Module` 1─*→ `Lesson`
- `User` *─*→ `Course` via `Enrollment` (+ `Order`)
- `Progress` = (User × Lesson) completion / watch position / notes
- `AnalyticsEvent` = funnel log

---

## 🚀 Local setup

**Requirements:** Node 20+ (tested on 22/24), a MongoDB instance.

```bash
cd govpath-academy
cp .env.example .env.local      # fill in the values (see below)
npm install
npm run seed                    # optional: demo admin/teacher/student + courses
npm run dev                     # http://localhost:3000
```

Demo logins after seeding (password `Password123`):
`admin@govpath.demo` · `teacher@govpath.demo` · `student@govpath.demo`

### Environment variables
See [.env.example](.env.example). Key ones:

| Var | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth session signing + base URL |
| `GOOGLE_CLIENT_ID/SECRET` | optional Google login |
| `RAZORPAY_KEY_ID` / `_SECRET` / `_WEBHOOK_SECRET` | payments |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | browser checkout key (build-time) |
| `R2_*` | Cloudflare R2 bucket + credentials for media |

> Promote an admin: register normally, then in Mongo set the user's `role` to `admin`, or seed and use `admin@govpath.demo`. Self-service signup only allows `student`/`teacher`.

---

## 💳 Razorpay setup
1. Get **Key ID + Secret** from the Razorpay dashboard → put in env.
2. Add a **Webhook**: URL `https://<your-domain>/api/payments/webhook`, secret → `RAZORPAY_WEBHOOK_SECRET`, subscribe to `payment.captured` and `payment.failed`.
3. The browser flow verifies the signature client-side for instant access; the webhook is the source of truth (idempotent fulfilment).

## 🎞️ Cloudflare R2 setup
1. Create a bucket (e.g. `govpath-media`) — keep **videos private**.
2. Create an R2 API token (Access Key ID + Secret) → env.
3. `R2_ENDPOINT = https://<accountid>.r2.cloudflarestorage.com`.
4. For thumbnails, enable a public bucket / custom domain and set `R2_PUBLIC_BASE_URL`.
Videos are streamed only via signed URLs minted by `/api/media/[lessonId]` after an access check.

---

## 🐳 Deploy on Coolify (Contabo VPS)

This repo ships a **standalone Dockerfile** (`output: "standalone"` in `next.config.js`).

1. In Coolify → **New Resource → Application → from your Git repo** (set base directory to `govpath-academy` if it lives in a subfolder).
2. **Build pack:** Dockerfile.
3. **Environment variables:** paste everything from `.env.example` with real values. Mark `NEXT_PUBLIC_*` as **build-time** (Coolify "Build Variable") so they get inlined.
4. **Port:** `3000`.
5. **Domain:** set your domain; Coolify provisions HTTPS via its proxy.
6. Set `NEXTAUTH_URL` to the public HTTPS URL.
7. **MongoDB:** either a Coolify "MongoDB" service (use its internal connection string) or MongoDB Atlas. Point `MONGODB_URI` at it.
8. Deploy. After first deploy, optionally exec `npm run seed` once (or create your admin manually).

> Alternatively `docker compose up -d` with the included `docker-compose.yaml` brings up app + Mongo together.

---

## 🔐 RBAC summary
- `middleware.ts` gates `/admin/*` (admin), `/teacher/*` (teacher+admin), `/dashboard/*` (any auth).
- API routes re-check with `requireRole(...)` / `canManageCourse(...)` — never trust the client.
- Teachers can only edit/delete courses where `teacherId === their id`; admins bypass.

## 📍 Key routes
| Page | Path |
|---|---|
| Catalog | `/courses` |
| Course detail | `/courses/[slug]` |
| Student | `/dashboard`, `/dashboard/learn/[courseId]`, `/dashboard/wishlist` |
| Teacher | `/teacher`, `/teacher/courses/new`, `/teacher/courses/[id]` |
| Admin | `/admin`, `/admin/users`, `/admin/courses`, `/admin/analytics` |

---

Built for India's aspirants. 🇮🇳
