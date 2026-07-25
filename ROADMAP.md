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

**Today:** two account roles chosen at signup (stored as a single `users.role` in Firestore):

| Role | Typical use |
| --- | --- |
| **Teacher / advisor** | Creates a classroom, shares an invite code, chairs / moderates practice |
| **Student / delegate** | Joins with a code, participates in practice sessions |

**Later:** **Parent / guardian** — monitor linked students (roadmap only; not built yet).

Later we may also add labels like **chair** or **observer** inside a session — those are session roles, not necessarily new account types.

### Multi-role accounts (Phase 1.6 ✅)

Real clubs need people who are **both**: e.g. Dhyanvi joins Period 3 as a student but runs a mentorship room as teacher for younger delegates. One email / one password — not two accounts.

**Product rule**

| Layer | What it means |
| --- | --- |
| **Account capabilities** | What this person *may* do site-wide (`roles: ['student', 'teacher']`) |
| **Classroom membership** | What they *are* in a given room (`classrooms/{id}/members/{uid}.role`) — **source of truth for permissions** |
| **Session labels** | Chair / observer / etc. inside a live committee (Phase 2+) |

**Shipped**

1. **Data:** `roles: UserRole[]` on profile; legacy `role` kept as primary; helpers `profileRoles` / `canTeach`.  
2. **Signup:** multi-select (“Practice as a delegate” / “Run classrooms”) — at least one required.  
3. **Permissions:** create classroom if `canTeach`; join for everyone; join membership defaults to **student**.  
4. **Dashboard:** Create **and** Join when both capabilities.  
5. **Rules:** `canTeachAccount()` with legacy `role == 'teacher'` fallback.  
6. **Profile toggle** to add/remove capabilities later — still optional / not built.

The UI adapts to:

1. **Signed out** vs **signed in**
2. **Capabilities** (can teach / can join) and **classroom ownership** (`teacherId`)

Example: dual-role users see Create and Join on the dashboard; non-owners get a participate-focused classroom view.

## 3. How the product works today (mental model)

```
Visitor → Sign up
       → Email → verification code (Resend via Cloudflare Worker)
       → GoMUN password + unique username + display name + capabilities (student and/or teacher)
       → Welcome (school optional — or Skip; avatars = initials for now)
       → Dashboard
            ├─ Teacher-capable: create classroom → get invite code → share
            └─ Anyone: enter invite code (join membership = student)
       → Classroom page (members, optional Meet/Zoom links; owner shares invite)
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
| Experience | UI adapts to auth state + role **capabilities** (multi-role soon) | Same person may teach one room and join another |
| Profiles | Unique **username** + **display name** at signup; school optional; **photos paused** (initials) | Discord-style ID; stay on Spark without Storage/Blaze |
| Account security | Email **verification code** before create; **step 1** rejects emails already registered; one GoMUN password | Don’t make users finish signup only to hit “email in use” |
| Billing | Stay on Firebase **Spark** for Auth/Firestore; no Blaze until photos/AI need it | Founder’s choice — avoid unexpected charges while building |
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
| Role-aware UX everywhere | **Done** (Phase 1.6) |
| Multi-role accounts (student **and** teacher) | **Done** (Phase 1.6 — `roles[]`) |
| Email code signup + Discord-style username | **Done** (Phase 1.7 — harden ops: rules live incl. `emails/`, Resend domain) |
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

### Phase 1.6 — Role-aware & auth-aware experience ✅ done

**Goal:** The site should never feel “generic.” Signed-out visitors see marketing; signed-in people see tools that match what they can do — including **both** teaching and joining when they hold both roles.

**Shipped**

- [x] Header: Sign up / Log in ↔ profile chip + Sign out
- [x] Landing CTAs: signed-in users get Dashboard (not Sign up); capability-aware wording
- [x] Practice hub: signed-in CTA points to dashboard with capability-aware label
- [x] **Multi-role accounts**
  - [x] `roles: UserRole[]` on profile (+ migrate legacy `role` on login)
  - [x] Signup: multi-select student and/or teacher (not exclusive radio)
  - [x] Dashboard: Create **and** Join panels when capabilities allow both
  - [x] Firestore rules: create classroom if teacher capability (legacy fallback)
- [x] **Dashboard layouts** — teacher / join / dual empty states
- [x] **Practice & Conferences pages** — next steps by capability
- [x] **Classroom page** — owner (`teacherId`) manages invite share; non-owners get participate view
- [x] **Nav / empty states** aligned with capabilities
- [ ] Optional later: session labels (**chair**, **observer**) with their own UI
- [ ] Optional later: profile toggle to add/remove capabilities

**Done means:** a stranger can tell what they can do from the UI; a mentor-delegate with one account can run one room and sit in another.

---

### Phase 1.7 — Secure signup (email code + Discord-style profile) ✅ shipped

**Goal:** Prove the user owns their email with a typed code, then collect Discord-style identity before the account exists in Firebase Auth.

**Shipped**

- [x] Multi-step signup: email → 6-digit code → password + username + display name + role
- [x] Cloudflare Worker + Resend (`workers/email-verification/`); secrets never in `VITE_*`
- [x] Unique `usernames/{username}` claims; username **locked** after signup
- [x] Welcome = optional school only (Skip OK); polished signup/login layouts
- [x] Legacy accounts missing `username` gated to `/choose-username`
- [x] Signup step 1 rejects emails already registered (`emails/{email}` claim + Auth lookup). Code/details steps re-check before advancing so Create account is never attempted for a taken email. Login backfills `emails/` for older accounts.
- [ ] Parent / guardian role — **not in this phase**
- [ ] Ops harden for public launch: verify Resend sending domain (not only `onboarding@resend.dev`)
- [ ] Optional: if Firebase **Email enumeration protection** hides Auth lookups, ensure legacy users log in once (writes `emails/`) or backfill claims

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

1. **Harden Phase 1.7 ops** (Firestore rules published incl. `emails/` + `roles`; Worker live; Resend domain when inviting others)
2. ~~**Finish Phase 1.6**~~ **Done** (role-aware UX + multi-role accounts)
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
- **Speech & Debate** practice on the same website (far future) — a parallel arena beside MUN: same free / classroom-private promise, invite-code rooms, and teacher–student flow, but for speech & debate formats (e.g. rounds, timers, judging) instead of committee procedure. Do **not** start this until MUN live sessions (Phase 2) and core practice are solid; when promoted, give it its own phase with acceptance criteria.

If you promote an idea into a real phase, add acceptance criteria — don’t leave it as a one-line wish.
