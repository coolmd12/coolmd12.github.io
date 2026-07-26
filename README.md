# GoMUN Delegate Arena

Free Model United Nations practice for students and teachers.

**Always free. No paid tiers planned for core practice.**

Live site: <https://coolmd12.github.io>

Founded by **Dhyanvi Mehta**.

Docs: [OUTLINE.md](./OUTLINE.md) (short overview) · [ROADMAP.md](./ROADMAP.md) (full plan)

***

## What this is

GoMUN Delegate Arena is a **classroom-private** MUN practice app:

| Feature | Status |
| --- | --- |
| Email/password accounts | Done |
| Email verification **code** + Discord-style **username** | Done (Phase 1.7) |
| Private classrooms + invite codes | Done |
| Post-signup optional customize (school; Skip OK) | Done |
| Profile (display name, school, avatar initials) | Done |
| Conference directory (links to real organizers) | Done (basic) |
| Polished signup / login layouts | Done |
| Early “email already registered” check on signup step 1 | Done (`emails/` + Auth lookup) |
| Role-aware UI (signed out vs student vs teacher) | Done (Phase 1.6) |
| **Multi-role accounts** (student **and** teacher) | Done (Phase 1.6 — `roles[]`) |
| Profile **photos** (Firebase Storage) | Paused — needs Blaze; initials for now |
| Parent / guardian accounts | Later |
| Live committee room (speakers, motions, timers) | Next (Phase 2) |
| AI practice with Gemini (solo / hybrid) | Later (Phase 3) |
| **Speech & Debate** practice (same site, parallel to MUN) | Far future — parked idea only |

**GoMUN does not host conferences.** The conference page is a guide to other organizers’ events.

**Video (V1):** optional Google Meet / Zoom links on classrooms — we link out; we don’t embed video SDKs yet.

***

## How a user flows through the app

1. **Sign up** — email (rejects if already registered) → **6-digit verification code** → GoMUN password + unique **username** + **display name** + capabilities (student and/or teacher)
2. **Welcome** — optional school/club only (or **Skip**); username + display name already set; avatars use **initials**
3. **Dashboard** — teachers create classrooms; anyone can join with an invite code; dual-role users see both
4. **Classroom** — members list, invite sharing (owner), optional Meet/Zoom links
5. **Practice / Conferences / Profile** — explore modes, find real MUNs, edit profile anytime

Signed-in users see Dashboard CTAs instead of Sign up on the home page.

### Roles & capabilities

| Layer | Meaning |
| --- | --- |
| Account `roles[]` | Site-wide capabilities (student, teacher, or both) |
| Classroom membership | What you are **in that room** (joiners default to student; owner is `teacherId`) |
| Session labels | Chair / observer later (Phase 2) |

See [ROADMAP.md](./ROADMAP.md) § multi-role.

### Account security (Discord-style)

| Field | Required? | Notes |
| --- | --- | --- |
| Email | Yes | **6-digit code** before the Auth account is created; step 1 blocks emails already in use |
| GoMUN password | Yes | One site password — never the user’s Gmail/Outlook password |
| Username | Yes | Unique `@handle`; **locked** after signup |
| Display name | Yes | Shown in rooms; editable later |
| Capabilities | Yes | Student and/or teacher at signup; parent / guardian later |
| School | Optional | Welcome or Profile; Skip OK |
| Photo | Paused | Initials only until Firebase Storage (Blaze) is acceptable |

Email codes: **Resend** + **Cloudflare Worker** (`workers/email-verification/`). Never put `RESEND_API_KEY` in `VITE_*` env.

***

## Stack

- **Frontend:** React + TypeScript + Vite (dev server locked to port **5173**)
- **Auth / data:** Firebase Auth + Cloud Firestore (Spark / free tier)
- **Email codes:** Resend + Cloudflare Worker (no Firebase Blaze required for mail)
- **Photos:** paused — initials avatars (Storage needs Blaze)
- **Hosting:** GitHub Pages (`dist/` via GitHub Actions)

***

## Quick start

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill:
   - Firebase web config (`VITE_FIREBASE_*`)
   - `VITE_EMAIL_VERIFY_URL` (Worker URL, no trailing slash)
3. Firebase Console:
   - Enable **Email/Password** auth
   - Create **Firestore**
   - Publish rules from `firebase/firestore.rules`
4. Deploy email Worker — see `workers/email-verification/README.md`
5. `npm run dev` → <http://localhost:5173>

In-app checklist: `/setup`.

**Tip:** teacher + student accounts (incognito) to test create + join.

Do **not** commit `.env.local` or secrets.

***

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local server at <http://localhost:5173> |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | oxlint |

***

## Project layout

| Path | Purpose |
| --- | --- |
| `src/pages/` | Screens (landing, auth, welcome, dashboard, …) |
| `src/services/` | Auth, classrooms, email verification |
| `src/contexts/AuthContext.tsx` | Signed-in user + profile |
| `workers/email-verification/` | Cloudflare Worker for signup codes |
| `firebase/firestore.rules` | Users, usernames, classrooms |
| `firebase/storage.rules` | Avatars (when Storage is enabled later) |
| `OUTLINE.md` | Condensed README + roadmap |
| `ROADMAP.md` | Full phased product plan |
| `.github/workflows/deploy-pages.yml` | GitHub Pages deploy |

***

## Future direction

GoMUN is expanding into two complementary product lanes:

- **Online conference practice:** real-time committee rooms for remote sessions, practice rounds, and virtual workshops.
- **In-person conference operations:** chair-facing tools for inputting and organizing MUN data from physical conferences.

### In-person conference data management
A dedicated operations workspace for chairs to track delegate registration, committee assignments, resolutions, amendments, voting records, and awards for physical MUN events.

### Smart Research Simulation Tools
- **Interactive Clause Builders:** guided forms for operative verbs, sub-clauses, and funding mechanisms that output properly formatted UN draft language.
- **Country Stance Aggregator:** quick-reference dashboards that pull open-source UN data, voting records, and policy summaries for beginner delegates.
- **Procedural Cheat-Sheet Generators:** customizable tools that let clubs generate downloadable "Scripts of Motions" for their preferred rules of procedure (for example, UNA-USA or THIMUN).

***

## Docs map

| File | Use when you want… |
| --- | --- |
| [OUTLINE.md](./OUTLINE.md) | A one-page overview |
| [README.md](./README.md) | Setup + how the app works today |
| [ROADMAP.md](./ROADMAP.md) | Phases, decisions, what’s next |

**Next major build:** Phase 2 — live committee room.

Note: A future centralized "Rooms" hub (for example `/rooms`) will host live committee rooms and, later, additional room types such as AI practice rooms and hybrid rooms (live + AI). These room types are planned to be free and integrated with classroom and dashboard flows.

**Far future (not scheduled):** Speech & Debate practice on the same site — same free / classroom-private spirit as MUN. See [ROADMAP.md](./ROADMAP.md) open ideas.
