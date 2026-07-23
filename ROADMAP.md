# GoMUN Delegate Arena — Roadmap

> **Audience:** anyone new to this repo (contributor, reviewer, or curious reader).  
> **Purpose:** explain *what* the product is, *why* decisions were made, *what’s already built*, and *exactly what to build next*.

Live site: [https://coolmd12.github.io](https://coolmd12.github.io)  
Repo / Pages source: this project (built with Vite → `dist/`, deployed via GitHub Actions).

For local setup, see [README.md](./README.md). For a one-page overview, see [OUTLINE.md](./OUTLINE.md).
The in-app `/setup` page also has a checklist.

---

## 1. What is this project?

**GoMUN Delegate Arena** is a **free** web app where students and teachers practice **Model United Nations (MUN)** — the classroom simulation of the United Nations where delegates represent countries, debate issues, use parliamentary procedure, and draft resolutions.

### The problem

MUN clubs need a place to practice that is:

- **Free** (many schools can’t pay for SaaS tools)
- **Private** (a class shouldn’t spill into a public lobby)
- **Realistic** (speakers list, motions, timers — not just a Google Doc)
- **Flexible** (practice with classmates *or* alone with AI when no one else is free)

### What GoMUN is (and isn’t)

| GoMUN **is** | GoMUN is **not** |
| --- | --- |
| A practice arena for clubs and classrooms | A paid conference hosting platform |
| Private rooms joined with invite codes | A public matchmaking lobby |
| A guide to *real* conferences worldwide (external links) | The organizer of those conferences |
| Built to stay free for core practice | A freemium funnel (“Join free” → upsell) |

**Founder:** Dhyanvi Mehta (credited on the landing page).

---

## 2. Who uses it?

Right now there are two account roles (chosen at signup; stored in Firestore):

| Role | Typical use |
| --- | --- |
| **Teacher / advisor** | Creates a classroom, shares an invite code, chairs / moderates practice |
| **Student / delegate** | Joins with a code, participates in practice sessions |

**Later:** **Parent / guardian** — monitor linked students (roadmap only; not built yet).

Later we may also add labels like **chair** or **observer** inside a session — those are session roles, not necessarily new account types.

The UI should feel different depending on:

1. **Signed out** vs **signed in**
2. **Student** vs **teacher** (and future roles)

Example: a signed-in user should not see “Sign up” as the main home CTA; a teacher’s empty dashboard should push “Create a classroom,” while a student’s should push “Enter invite code.”

---

## 3. How the product works today (mental model)

```
Visitor → Sign up
       → Email → verification code (Resend via Cloudflare Worker)
       → GoMUN password + unique username + display name + role
       → Welcome (school optional — or Skip; avatars = initials for now)
       → Dashboard
            ├─ Teacher: create classroom → get invite code → share
            └─ Student (or teacher joining another room): enter invite code
       → Classroom page (members, optional Meet/Zoom links)
       → Practice hub (placeholders for live / AI / hybrid)
       → Conferences page (curated list of external conference sites)
       → Profile page (edit display name / school; username locked; initials avatar)
```

**Privacy model:** classrooms are private. You only get in with an invite code (or by creating the room). Firestore security rules enforce membership — don’t “fix” privacy only in the UI.

**Video (for now):** teachers paste optional Google Meet / Zoom URLs. We do **not** embed video SDKs yet (cost, complexity, school firewalls). Link-out is intentional for V1.

**Conferences:** we help people *find* existing MUNs. We do **not** run those events. Copy on the site should never sound like “our conference calendar.”

---

## 4. Tech stack (so you know where to look)

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | `src/`; dev port **5173** (`strictPort`) |
| Routing | React Router | `src/App.tsx` |
| Auth | Firebase Auth (email/password) | After email **code** verify via Worker |
| Database | Cloud Firestore | `users`, `usernames`, `classrooms`, … |
| Email codes | Resend + Cloudflare Worker | `workers/email-verification/` |
| Files | Firebase Storage | **Paused** — needs Blaze; initials avatars |
| Hosting | GitHub Pages | Workflow builds `dist/` |
| Config | `.env.local` | `VITE_FIREBASE_*` + `VITE_EMAIL_VERIFY_URL`; never commit secrets |

**Important ops files**

- `firebase/firestore.rules` — users, usernames, classrooms, members
- `firebase/storage.rules` — avatars (when Storage is enabled later)
- `workers/email-verification/` — signup OTP Worker
- `.github/workflows/deploy-pages.yml` — production deploy
- `OUTLINE.md` — condensed overview
- `ROADMAP.md` (this file) — product direction
- `README.md` — quick start

---

## 5. Product decisions (locked — don’t reverse casually)

These are intentional. If you change one, update this table and explain why in the PR.

| Topic | Decision | Why |
| --- | --- | --- |
| Brand | **GoMUN Delegate Arena** — formal/diplomatic + modern UN | Should feel like serious practice, not a toy game |
| Cost | Free for students & teachers — no paid tiers for **core** practice | Accessibility for school clubs |
| CTAs | Prefer **Sign up** / **Log in** | Avoid “Join free” (sounds freemium) |
| Privacy | Invite-code classrooms | Teachers need closed groups |
| Profiles | Unique **username** + **display name** at signup; school optional; **photos paused** (initials) | Discord-style ID; stay on Spark without Storage/Blaze |
| Account security | Email **verification code** (Resend + Cloudflare Worker) before create; one GoMUN password | Prove inbox ownership without Firebase Blaze for mail |
| Billing | Stay on Firebase **Spark** for Auth/Firestore; no Blaze until photos/AI need it | Founder’s choice — avoid unexpected charges while building |
| Experience | UI adapts to auth state + role | Same site, different jobs for teacher vs student |
| AI | Live people **or** solo AI (Gemini); hybrid later | Practice even without a full committee |
| Video V1 | Meet / Zoom URL fields | Free, familiar, no SDK billing |
| Conferences | Curated outbound links only | We’re a guide, not a host |
| Backend | Firebase Spark + GitHub Pages + Worker for email codes | Stay free / cheap while building |
| Ops later | In-app admin tools | Don’t rely on Firebase Console forever |

---

## 6. Current status (high level)

| Area | Status |
| --- | --- |
| Landing, classrooms, invite codes | **Done** (Phase 1) |
| Conference directory (curated) | **Done** (basic) |
| Profile customize + welcome step | **Done** (Phase 1.5; photos paused → initials) |
| Role-aware UX everywhere | **Started** (Phase 1.6) |
| Email code signup + Discord-style username | **Done** (Phase 1.7 — harden ops: rules live, Resend domain for public launch) |
| Parent / guardian accounts | **Later** — documented only |
| Live committee floor | **Not built** — Phase 2 (next big feature) |
| AI arena (Gemini) | **Not built** — Phase 3 |
| Conference filters / auto-refresh | **Not built** — Phase 4 |
| Tutorials, inbox, admin tooling | **Not built** — Phase 5 |

---

## 7. Build phases (detailed)

Use these as the source of truth for “what’s next.”  
When you finish a checklist item, mark it `[x]` in this file in the same PR.

### Phase 1 — Foundation ✅ done

**Goal:** A real app people can log into, form private classrooms, and explore the site.

**Shipped**

- [x] App shell + UN / diplomatic visual language
- [x] Auth: register / login / logout with **student** and **teacher** roles
- [x] User profiles in Firestore (`users/{uid}`)
- [x] Teachers create classrooms + invite codes
- [x] Students join via invite code (teachers can also join other rooms)
- [x] Firestore security rules for private membership
- [x] Conference directory (curated worldwide links + guide copy)
- [x] Practice hub placeholders (live / AI / hybrid)
- [x] Firebase wired locally + GitHub Actions secrets for production
- [x] GitHub Pages deploy from built `dist/`
- [x] Landing polish (parallax hero, What is MUN, founder section)

**If you’re verifying Phase 1 works**

1. Sign up as teacher → create classroom → copy invite code  
2. Sign up as student (incognito) → join with code → see classroom  
3. Confirm a signed-out visitor cannot read that classroom in Firestore  
4. Open Conferences and confirm links go to external organizers  

---

### Phase 1.5 — Profile customization ✅ mostly done

**Goal:** Each user can control how they appear across the app — including right after signup.

**Done**

- [x] `/profile` settings page (display name, school / club)
- [x] Header avatar / name links to profile (initials fallback)
- [x] Avatars / names on classroom member lists (initials when no photo)
- [x] **Post-signup customize step** (`/welcome`)
  - **Required at signup:** email (+ code), password, username, display name, role
  - **Optional on welcome:** school / club
  - **Skip for now** allowed
  - Gated until save/skip (`profileSetupComplete`)
- [x] Profile **photos paused** on purpose (Firebase Storage requires Blaze) — initials only

**Still to do**

- [ ] Optional **bio**, **pronouns**, **grade level**
- [ ] Propagate names into future chat / speakers list
- [ ] Re-enable photo upload when Blaze + Storage are acceptable; publish `firebase/storage.rules`

**Done means:** new users hit welcome after signup; can skip; username locked; display name editable; no forced photo.

---

### Phase 1.6 — Role-aware & auth-aware experience (in progress)

**Goal:** The site should never feel “generic.” Signed-out visitors see marketing; signed-in students and teachers see tools that match their job.

**Done**

- [x] Header: Sign up / Log in ↔ profile chip + Sign out
- [x] Landing CTAs: signed-in users get Dashboard (not Sign up); light teacher vs student wording
- [x] Practice hub: signed-in CTA points to dashboard with role-aware label

**Still to do**

- [ ] **Dashboard layouts**
  - Teacher empty state: “Create your first classroom”
  - Student empty state: “Ask your teacher for an invite code”
  - Don’t bury the primary action under the wrong panel
- [ ] **Practice & Conferences pages**
  - Clear next steps by role (create/open room vs join/enter)
- [ ] **Classroom page**
  - Teacher: manage links, share invite, (later) chair controls
  - Student: participate-focused view; hide or demote teacher-only actions
- [ ] **Nav / empty states** aligned with role everywhere
- [ ] Optional later: session labels (**chair**, **observer**) with their own UI

**Done means:** a stranger can tell, from the UI alone, whether they’re a guest, a student, or a teacher — without reading docs.

---

### Phase 1.7 — Secure signup (email code + Discord-style profile) ✅ shipped

**Goal:** Prove the user owns their email with a typed code, then collect Discord-style identity before the account exists in Firebase Auth.

**Shipped**

- [x] Multi-step signup: email → 6-digit code → password + username + display name + role
- [x] Cloudflare Worker + Resend (`workers/email-verification/`); secrets never in `VITE_*`
- [x] Unique `usernames/{username}` claims; username **locked** after signup
- [x] Welcome = optional school only (Skip OK); polished signup/login layouts
- [x] Legacy accounts missing `username` gated to `/choose-username`
- [ ] Parent / guardian role — **not in this phase**
- [ ] Ops harden for public launch: publish latest Firestore rules everywhere; verify Resend sending domain (not only `onboarding@resend.dev`)

**Constraints**

- Stay off Firebase Blaze for mail and for photos (for now)
- One GoMUN password only

**Done means:** cannot finish signup without a valid email code + unique username; Resend key not in the public bundle.

---

### Phase 2 — Live committee room ⬅️ next major build

**Goal:** Inside a classroom, run a practice session that feels like a real committee floor.

**Build**

- [ ] Create / start a **session** tied to a classroom (topic, committee name, status: draft / live / ended)
- [ ] **Speakers list** (realtime): raise hand / add / next speaker
- [ ] **Motions** flow (at least: moderated caucus, unmoderated caucus, adjourn — expand later)
- [ ] **Timers** (speech time, caucus time) visible to the room
- [ ] Per-session optional **Meet / Zoom** link (override classroom default)
- [ ] Basic **room chat** or shared notes (keep simple; moderated if needed)
- [ ] **Teacher / chair controls**: open/close speakers list, recognize speakers, set timer, end session
- [ ] Student view: request to speak, see queue, see timer — not full chair powers

**Technical notes for implementers**

- Prefer Firestore realtime listeners (`onSnapshot`) for speakers / session state
- Put session docs under `classrooms/{id}/sessions/{sessionId}` (rules already sketch this)
- Keep rules strict: only members read; only teacher (or designated chair) writes controls
- Don’t block on video embedding — reuse URL fields

**Done means:** a teacher can open a live session, students see a shared speakers list and timer update live, and the session can be ended cleanly.

---

### Phase 3 — AI arena (Gemini)

**Goal:** Practice when a full human committee isn’t available.

**Build**

- [ ] Solo mode: user vs **AI delegates** (Gemini) with a clear country / topic setup
- [ ] AI **procedure helper** (points of order, motions — educational, not cheating through a real graded conference)
- [ ] Speech & resolution **coaching** (feedback on structure, clarity, diplomacy)
- [ ] **Hybrid** seats: some humans + some AI in one room
- [ ] Mode picker remains user-visible: Live / AI / Hybrid (already sketched on Practice hub)

**Constraints**

- API keys / Gemini access must not ship in the public frontend; use a safe backend or Firebase-callable pattern when this phase starts
- Keep core practice free; if model costs become an issue, document options before adding any limits

**Done means:** a signed-in student can run a solo practice round end-to-end without another human online.

---

### Phase 4 — Conference feed polish

**Goal:** Make the conference directory trustworthy, searchable, and easier to maintain.

**Build**

- [ ] Automatic or scheduled **refresh** of directory data from the web (with human review if needed)
- [ ] Admin tools to **review / publish** listings (don’t silently scrape nonsense into production)
- [ ] Filters: date, level (HS / university / open), cost, format
- [ ] Filter: **online vs in-person**
- [ ] Location fields / filters: **country, state/province, city** (+ region)
- [ ] Optional: “Submit a conference link” form (moderated)

**Copy rule:** always make clear these are **other organizers’ events**. GoMUN does not host them.

**Done means:** a delegate can filter to “online + my country + this month” and get useful outbound links.

---

### Phase 5 — Learning, messaging & ops

**Goal:** Support learning and day-to-day club ops without living in Firebase Console.

**Build**

- [ ] Embedded **YouTube tutorial** series (how to use GoMUN + MUN basics)
- [ ] Lightweight **inbox / email-style notifications** (session invites, classroom announcements)
- [ ] **Position paper** upload & teacher feedback
- [ ] In-app **admin** tools: user lookup, classroom support, ban/reset helpers

**Done means:** a teacher can announce a session and review a position paper without leaving the app; an admin can help a stuck user without raw Console edits for common cases.

---

## 8. Recommended build order

If you’re picking up work cold, do this order:

1. **Harden Phase 1.7 ops** (Firestore rules published; Worker live; Resend domain when inviting others)
2. **Finish Phase 1.6** (dashboard / classroom role UX)
3. **Phase 2** (live committee — core differentiator)
4. **Phase 3** (AI) once session model is stable
5. **Phase 4** then **Phase 5**
6. Revisit **photos** only when Blaze is OK

---

## 9. How to work on this repo (contributor checklist)

1. Read [OUTLINE.md](./OUTLINE.md) or this roadmap + [README.md](./README.md)
2. `npm install` → `.env.example` → `.env.local` (Firebase + `VITE_EMAIL_VERIFY_URL`)
3. Enable Auth + Firestore; publish `firebase/firestore.rules`
4. Deploy `workers/email-verification` (never put `RESEND_API_KEY` in frontend env)
5. `npm run dev` → http://localhost:5173
6. Test teacher + student paths (full signup including email code → Create account)
7. Pick an unchecked item; implement; mark `[x]` here
8. `npm run build` before a PR
9. Don’t commit `.env.local` or secrets

**Production:** GitHub Actions secrets need all `VITE_FIREBASE_*` **and** `VITE_EMAIL_VERIFY_URL`.

---

## 10. Glossary (quick)

| Term | Meaning here |
| --- | --- |
| **MUN** | Model United Nations |
| **Delegate** | Student representing a country / position |
| **Username** | Unique Discord-style `@handle` (locked after signup) |
| **Display name** | Friendly name shown in rooms (editable) |
| **Classroom** | Private practice group with an invite code |
| **Session** | A single practice meeting inside a classroom (Phase 2) |
| **Chair** | Person running procedure (usually teacher; may be designated later) |
| **Caucus** | Timed discussion format (moderated = structured speakers; unmoderated = informal) |
| **Resolution** | Draft proposal text delegates negotiate |
| **Spark** | Firebase free tier |

---

## 11. Video recommendation (reminder)

**Use Meet/Zoom URL fields first.** Free, familiar for schools, no SDK billing, works today.  
Revisit embedded WebRTC or official embeds only if teachers explicitly ask for in-app video *and* we have a cost/privacy plan.

---

## 12. Open ideas (not committed)

These are parked so they don’t distract from Phases 2–3:

- **Parent / guardian** account role — monitor a student’s classrooms / progress without full delegate powers (document for later; not built in Phase 1.7)
- Deeper in-app email / messaging product
- Larger YouTube curriculum beyond a simple embed
- Extra session roles (observer, dias staff) with dedicated UI
- Richer profile customization (badges, club affiliations)
- Log in with username instead of email

If you promote an idea into a real phase, add acceptance criteria — don’t leave it as a one-line wish.
