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
| Live committee room (speakers, motions, timers) | Next (Phase 2) — procedure floor; early scaffolding started |
| AI practice + prep Q&A assistant (Gemini) | Later (Phase 3) |
| RoP cheat sheets · resolution / position-paper tools · prep notes | Later (Phase 5) |
| **In-app calling** (voice / video inside rooms) | Later (Phase 6) — Meet/Zoom links until then |
| **Speech & Debate** practice (same site, parallel to MUN) | Far future — parked idea only |

**GoMUN does not host conferences.** The conference page is a guide to other organizers’ events.

**What a “room” is:** a shared **procedure floor** (speaker queue, placards, timers, motions, voting) — **not** a Zoom/Meet clone. **Open to any signed-in user** (create → share link → join); classrooms are separate. Meet/Zoom beside it for V1 audio/video; **Phase 6** adds in-app calling (important for ad-hoc open rooms).

**Join:** pick **chair** or **delegate** (editable in-room); delegates enter a **country**; chairs enter a **name**. Labels show as `Chair · …` / `Delegate · …`. Raise **placard** → chair recognizes onto the speaker queue. Optional **meeting link** on create. Motions: anyone proposes; chair opens procedural **yes/no** votes (tally chair-only until closed).

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
- **Interactive Clause Builders:** guided forms for operative verbs, sub-clauses, and funding mechanisms that output properly formatted UN draft language (**resolution formatting**).
- **Country Stance Aggregator:** quick-reference dashboards that pull open-source UN data, voting records, and policy summaries for beginner delegates.
- **Procedural / Rules-of-Procedure cheat sheets:** customizable tools that let clubs generate downloadable "Scripts of Motions" for their preferred rules (for example, UNA-USA or THIMUN).
- **Position paper drafting tools:** structured prompts and templates to help delegates outline and draft position papers (user owns the writing; tools guide format and structure).

### Prep notes & documents
A personal (and optionally classroom-shared) notes space where users can:
- **Link or attach** prep materials — Google Docs, Slides, PDFs, and similar
- **Write notes on the spot** for future reference without uploading an existing file

### Built-in AI prep assistant (not an editor)
An in-app AI (planned with Gemini in Phase 3) that users can ask questions of and get **resources** from — e.g. find helpful websites for research, answer general MUN / procedure / topic questions. **It will not edit the user’s work** (speeches, resolutions, notes); it points people to prep help and explains concepts.

### In-app calling (Phase 6)
Optional voice (then video) **inside** a live committee room so clubs don’t *have* to open Meet/Zoom. The procedure floor stays primary; calling is an add-on. External Meet/Zoom links remain as a fallback. Cost / media-server choices TBD when we reach Phase 6.

***

## Docs map

| File | Use when you want… |
| --- | --- |
| [OUTLINE.md](./OUTLINE.md) | A one-page overview |
| [README.md](./README.md) | Setup + how the app works today |
| [ROADMAP.md](./ROADMAP.md) | Phases, decisions, what’s next |

**Next major build:** Phase 2 — live committee **procedure floor** (not in-app video yet).

Note: A future centralized "Rooms" hub (for example `/rooms`) will host live committee rooms and, later, additional room types such as AI practice rooms and hybrid rooms (live + AI). These room types are planned to be free and integrated with classroom and dashboard flows.

**Far future (not scheduled):** Speech & Debate practice on the same site — same free / classroom-private spirit as MUN. See [ROADMAP.md](./ROADMAP.md) open ideas.
