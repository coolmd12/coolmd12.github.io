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
| **Continue with Google** accounts | Done — primary signup / login |
| Discord-style **username** + display name + roles | Done |
| Private classrooms + invite codes | Done |
| Post-signup optional customize (school; Skip OK) | Done |
| Profile (display name, school, avatar initials) | Done |
| Conference directory (links to real organizers) | Done (basic) |
| Polished signup / login layouts | Done |
| Role-aware UI (signed out vs student vs teacher) | Done (Phase 1.6) |
| **Multi-role accounts** (student **and** teacher) | Done (Phase 1.6 — `roles[]`) |
| Founder **Founder's Stats** (`/admin` — `dhyanvim@gmail.com` only) | Done |
| Profile **photos** (Firebase Storage) | Paused — needs Blaze; initials for now |
| Email/password + Resend verification codes | Parked — not in UI (needs paid/verified sending domain) |
| Parent / guardian accounts | Later — parked sketch (link to students; read-only activity) |
| Dashboard **Your activity** timeline | Done — hosted/joined rooms, classrooms, usage chips |
| Live committee room (speakers, motions, timers, chat) | Phase 2 done — core floor, chat, session start/stop, audio cues |
| AI practice + prep Q&A assistant (Gemini) | Later (Phase 3) |
| RoP cheat sheets · resolution / position-paper tools · prep notes | Later (Phase 5) |
| **In-app calling** (voice / video inside rooms) | Later (Phase 6) — Meet/Zoom links until then |
| **Speech & Debate** practice (same site, parallel to MUN) | Far future — parked idea only |

**GoMUN does not host conferences.** The conference page is a guide to other organizers’ events.

**What a “room” is:** a shared **procedure floor** (speaker queue, placards, timers, motions, voting, basic chat) — **not** a Zoom/Meet clone. **Open to any signed-in user** (create → share link → join); classrooms are separate. Meet/Zoom beside it for V1 audio/video; **Phase 6** adds in-app calling (important for ad-hoc open rooms).

**Join:** pick **chair** or **delegate** (editable in-room); delegates enter a **country**; chairs enter a **name**. Labels show as `Chair · …` / `Delegate · …`. Raise **placard** → chair recognizes onto the speaker queue. Optional **meeting link** on create. Motions: anyone proposes; chair opens procedural **yes/no** votes (tally chair-only until closed). **Chat:** each room has its own text chat for **joined participants** only; late joiners see history. **Persistence:** rooms you host or join stay on the dashboard and `/rooms` until the host/chair **closes** the room (recess is not close).

***

## How a user flows through the app

1. **Sign up / log in** — **Continue with Google** (any Google / Gmail account)
2. **Finish account** (new users) — unique **username** + **display name** + capabilities (student and/or teacher)
3. **Welcome** — optional school/club only (or **Skip**); avatars use **initials**
4. **Dashboard** — teachers create classrooms; anyone can join with an invite code; dual-role users see both
5. **Classroom** — members list, invite sharing (owner), optional Meet/Zoom links
6. **Rooms / Practice / Conferences / Profile** — open committee floors, explore modes, find real MUNs, edit profile anytime

Signed-in users see Dashboard CTAs instead of Sign up on the home page.

### Roles & capabilities

| Layer | Meaning |
| --- | --- |
| Account `roles[]` | Site-wide capabilities (student, teacher, or both) |
| Classroom membership | What you are **in that room** (joiners default to student; owner is `teacherId`) |
| Session labels | Chair / delegate chosen when joining a live room |

See [ROADMAP.md](./ROADMAP.md) § multi-role.

### Account security

| Field | Required? | Notes |
| --- | --- | --- |
| Google account | Yes | Firebase **Google** sign-in; Google proves email ownership (no Resend domain needed) |
| Username | Yes | Unique `@handle`; **locked** after signup |
| Display name | Yes | Shown in rooms; editable later |
| Capabilities | Yes | Student and/or teacher at onboarding; **parent / guardian later** (see roadmap) |
| School | Optional | Welcome or Profile; Skip OK |
| Photo | Paused | Initials only until Firebase Storage (Blaze) is acceptable |

**User count:** only `dhyanvim@gmail.com` sees **Founder's Stats** in the nav (`/admin`). Exact Auth list: Firebase Console → Authentication → Users.

***

## Stack

- **Frontend:** React + TypeScript + Vite (dev server locked to port **5173**)
- **Auth / data:** Firebase Auth (**Google**) + Cloud Firestore (Spark / free tier)
- **Photos:** paused — initials avatars (Storage needs Blaze)
- **Hosting:** GitHub Pages (`dist/` via GitHub Actions)
- **Email codes (parked):** Resend + Cloudflare Worker still in `workers/email-verification/` if we revive email signup later

***

## Quick start

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill:
   - Firebase web config (`VITE_FIREBASE_*`)
   - Optional: nothing else required for auth beyond Google + Firestore rules
3. Firebase Console:
   - Enable **Google** under Authentication → Sign-in method (set a support email)
   - Authorized domains: `localhost` + `coolmd12.github.io`
   - Create **Firestore**
   - Publish rules from `firebase/firestore.rules` (includes `stats/` for user count)
4. `npm run dev` → <http://localhost:5173>

In-app checklist: `/setup`.

**Tip:** two Google accounts (or normal + incognito) to test create + join rooms.

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
| `src/pages/` | Screens (landing, auth, welcome, dashboard, rooms, admin, …) |
| `src/services/` | Auth, classrooms, rooms, motions, messages, activity, stats |
| `src/contexts/AuthContext.tsx` | Signed-in user + profile |
| `workers/email-verification/` | Parked Cloudflare Worker for email codes |
| `firebase/firestore.rules` | Users, usernames, classrooms, rooms, stats |
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

**Next major build:** Phase 3+ (AI, conferences, learning tools), then Phase 6 in-app calling. Parent/guardian linking is parked until activity is trusted. Room UX can keep getting small polish anytime.

Note: `/rooms` hub lists/creates open committee rooms. Later: AI practice rooms (Phase 3) and hybrid rooms (live + AI). These room types are planned to be free and integrated with classroom and dashboard flows.

**Far future (not scheduled):** Speech & Debate practice on the same site — same free / classroom-private spirit as MUN. See [ROADMAP.md](./ROADMAP.md) open ideas.
