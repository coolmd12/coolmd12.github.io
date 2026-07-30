# GoMUN Delegate Arena — Roadmap

> For a quick overview see [OUTLINE.md](./OUTLINE.md). For setup detail see [README.md](./README.md).

---

## 1. Goal (North Star)

Free classroom-private Model UN (and later, Speech & Debate) practice rooms with AI tools for feedback and training.

---

## 2. Constraints

- **Team:** One person, part-time
- **Budget:** Zero. Use only free services. Avoid Blaze tier. 
- **Scope (Phase 2):** Rooms are **procedure floors**, not video meetings. Focus on speakers / timers / motions / voting. Voice/video stays Meet/Zoom link-outs until a later in-app calling phase.
- **Audience:** High school Model UN students and teachers. 

---

## 3. Principles (product decisions)

- **Privacy:** Classrooms are private; no public lobbies. No social graph.
- **Ease of use:** Simple UI/UX for common MUN flows. Fast, low friction.
- **Education-first:** Tools help students learn, teachers teach.
- **Scalability:** Built on serverless (Firebase) for low ops burden.
- **Security:** Robust auth, data integrity.

---

## 4. Anti-goals (what we are not building)

- Public social networking features
- Complex admin tools for large conferences
- Becoming a Zoom/Meet clone (in-app calling is a later add-on, not the product core)
- Monetization features (ads, subscriptions, freemium)

---

## 5. Technology (stack decisions)

- **Frontend:** React + Vite + TypeScript. Fast dev, small bundle.
- **Backend:** Firebase Auth + Firestore. Serverless, real-time, free tier-friendly.
- **Email verification:** Resend + Cloudflare Worker. Serverless, cheap, reliable.
- **Hosting:** GitHub Pages. Free, simple CI/CD.
- **Avatars:** Initials only (Storage needs Blaze, avoided for now).

---

## 6. Current status (high level)

| Area | Status | Notes |
| --- | --- | --- |
| Setup (project, auth, deploy) | Done | Basic CI/CD, auth, routing. |
| Signup flow (email/code/pw/username) | Done | Includes email verification. |
| Profile flow (display name, school, roles) | Done | Post-signup customize. |
| Classroom flow (create, invite, join) | Done | Role-aware permissions. |
| Practice rooms (text only) | Done | Simple free-form practice. |
| Conference directory | Done | Outbound links only. |
| Core UI/UX polish | Done | General app usability. |
| Role-aware UX | Done | Phase 1.6 completed. |
| Multi-role accounts | Done | Student **and** teacher. |
| Profile photos (Storage) | Not built | Needs Firebase Blaze. |
| Live committee floor | Early scaffolding — Phase 2 next | Procedure floor (speakers/motions/timers) — **not** a video meeting. |
| AI tools (Gemini) + prep Q&A assistant | Not built | Phase 3 — feedback, briefs, solo AI; also resource/Q&A (no editing user work). |
| Conference filters | Not built | Phase 4. |
| Tutorials / inbox / admin / drafting / notes | Not built | Phase 5 — RoP cheat sheets, clause builders, position papers, prep notes. |
| In-app calling (voice/video) | Not built — Later | After core floor works; optional Meet/Zoom links remain until then. |
| Speech & Debate (parallel practice mode) | Not built — Far future | Parked idea. |

---

## 7. Build phases (detailed)

### Phase 1 — Core MVP (signup, profile, classrooms, practice, conferences) ⬅️ done

- [x] Basic project setup (Vite, React, TS, Firebase)
- [x] Firebase Auth (email/password)
- [x] Firestore setup (rules, data models for users, classrooms)
- [x] User signup flow (email → code → password/username/roles)
- [x] Email verification with Resend + Cloudflare Worker
- [x] User login / logout flows
- [x] Profile management (display name, school, avatar initials)
- [x] Create / join classrooms with invite codes
- [x] Classroom roster management
- [x] Basic text-based practice room
- [x] Conference directory (outbound links)
- [x] General UI/UX polish
- [x] Multi-role accounts (student **and** teacher on one UID)
- [x] Role-aware UI (dashboard, classroom controls)

### Phase 2 — Live committee room ⬅️ next major build

**Goal:** Enable real-time, structured Model UN committee sessions.

**What a room is (clarify):** A GoMUN room is a **shared procedure dashboard** — speaker queue, timers, motions, voting, chat — that everyone in the session sees and updates together. It is **not** a Zoom/Meet clone. **Open to any signed-in user** (not classroom-gated): create a room, share the link, others join. Classrooms stay a separate club home. In-app voice/video (Phase 6) is especially important for these open ad-hoc rooms; until then Meet/Zoom link-out is the fallback.

**Locked decisions (Phase 2):**

- Rooms are **open** — any GoMUN account can create/join; share `/room/:roomId` (invite). Optional classroom link later, not required.
- **Session role chosen on join** (editable in-room): **chair** or **delegate**.
- Delegate **displayName = country** (typed for now; assignment later); chair **displayName = typed name**. UI: `Chair · …` / `Delegate · …`.
- **Raise placard** → chair **recognizes** onto `speakerQueue`.
- Optional **meetingLink** on create (Meet/Zoom/etc.) until Phase 6.
- **Speaker timer:** live for everyone; **chair-only** controls; **custom duration**; leftover seconds per speech logged into a **chair-visible time bank** (practice aid — see note below). No auto-start yet.
- **Gavel:** chair-only **manual** single tap per click (click again for more taps), synced so everyone hears; chair chooses when. No auto time-warnings.
- **Motions:** anyone may propose; **multiple** proposed motions allowed; chair opens one for voting (`activeMotionId`); procedural votes **yes/no** (no abstain); **running tally chair-only until closed**; after pass, chair starts caucus/timer **manually** (no automation yet).
- Room doc holds: name, status, chair, settings, timer, `speakerQueue`, `speechTimeBank`, optional `activeMotionId`, optional `meetingLink`, optional `lastGavel`.
- Participants, motions, messages as subcollections.

**MUN procedure notes (research):**

- **Leftover speaking time:** In real MUN, unused GSL time is usually **yielded** (to chair, questions, or another delegate) — not pooled into a “bank for another full speech.” In **moderated caucus**, unused speaker time is typically **forfeited**. GoMUN’s chair time bank is a **practice helper**, not official **RoP** (Rules of Procedure).
- **Present vs Present and Voting:** On roll call, **Present** usually allows **abstain** on *substantive* votes (resolutions/amendments); **Present and Voting** means yes/no only (no abstain) on substantive votes. **Procedural** votes (motions) generally **require** yes/no — **no abstain**. Attendance types come later with substantive voting.
- **Later (parked):** auto-start timer on recognize; public live tallies; auto-start caucus after motion passes; yields; roll-call attendance; automatic gavel time-warnings.

**Build:**

- [x] Firestore rules + data model for `rooms` / participants (open rooms)
- [x] Join gate: pick chair vs delegate (+ country / chair name)
- [x] In-room edit role / country / chair name
- [x] Raise placard + recognize → live speaker queue
- [x] Speaker timer (chair start / pause / resume / clear; custom duration; leftover bank)
- [x] Optional meeting link on create
- [x] **Motions** flow (moderated caucus, unmoderated caucus, adjourn)
- [x] Voting on motions (yes/no; chair tally until closed)
- [x] Manual chair gavel (one tap per click; click again for more)
- [ ] Basic chat/messaging
- [ ] Chair controls polish (start/stop session)
- [ ] Delegate view polish

Note: `/rooms` hub lists/creates open committee rooms. Later: AI practice rooms (Phase 3) and hybrid rooms.

### Phase 3 — AI integration

**Goal:** Provide AI-powered feedback, training, and a prep Q&A assistant.

**Build:**

- [ ] AI feedback on speeches (grammar, coherence, style)
- [ ] AI-generated research briefs for topics
- [ ] AI-powered delegate roles (practice solo)
- [ ] **Built-in AI prep assistant** — ask general MUN / procedure / topic questions; suggest prep websites and resources
- [ ] Explicit boundary: assistant **finds resources and answers questions**; it does **not** edit the user’s speeches, resolutions, position papers, or notes

### Phase 4 — Conference features & operations

**Goal:** Expand beyond the conference directory into both online practice and in-person conference operations.

**Build:**

- [ ] Filters for conference listings (level, region, date)
- [ ] Save / track favorite conferences
- [ ] User-submitted conference listings (moderated)
- [ ] Online conference practice flows (sessions, agendas, speaker lists, motions)
- [ ] In-person conference operations workspace for chairs
- [ ] Delegate registration and committee assignment management
- [ ] Resolution and amendment tracking
- [ ] Voting record compilation and analysis
- [ ] Awards and recognition tracking

### Phase 5 — Research tools & learning

**Goal:** Add beginner-friendly research, drafting, notes, and procedural support.

**Build:**

- [ ] Interactive Clause Builders (resolution formatting)
- [ ] Country Stance Aggregator
- [ ] Procedural / Rules-of-Procedure cheat sheets ("Scripts of Motions")
- [ ] Position paper drafting tools (templates / guided structure; user writes the content)
- [ ] Prep notes workspace — write notes in-app **and** link/upload Docs, Slides, PDFs for later reference
- [ ] In-app tutorials for MUN procedures
- [ ] Teacher inbox for student submissions/questions
- [ ] Basic admin dashboard (user/classroom management)

### Phase 6 — In-app calling (voice / video) ⬅️ later

**Goal:** Optional built-in voice (then video) so clubs can run committee **without** leaving GoMUN for Meet/Zoom — while the procedure floor stays the product core.

**Build (high level — TBD when we reach it):**

- [ ] Voice calling inside a live committee room (WebRTC or similar free-tier-friendly path)
- [ ] Optional camera / video tiles (still secondary to the floor UI)
- [ ] Mute / unmute, join/leave call, chair can mute if needed
- [ ] Keep Meet/Zoom link-out as a fallback for clubs that prefer external tools
- [ ] Evaluate cost: Spark limits, TURN servers, Cloudflare Calls / LiveKit / Daily / etc. before committing

**Why later:** Calling is ops-heavy (media servers, bandwidth, permissions, moderation). Phase 2 must prove the MUN floor first.

---

## Future Feature Ideas

Two future product lanes will expand the platform beyond basic classroom practice:

- **Online conference practice:** a parallel mode for remote sessions, practice tournaments, and virtual committee events.
- **In-person conference data management:** a chair-facing workspace for organizing physical conference logistics and outcomes. This could include:
    - Delegate registration and assignment management.
    - Resolution and amendment tracking.
    - Voting record compilation and analysis.
    - Awards and recognition tracking.
- **Smart Research Simulation Tools:**
    - **Interactive Clause Builders:** interactive forms that prompt users for operative verbs, sub-clauses, and funding mechanisms to output properly formatted UN draft language (**resolution formatting**).
    - **Country Stance Aggregator:** quick-reference dashboards that pull open-source UN data, voting records, and basic policy summaries for beginners.
    - **Procedural / Rules-of-Procedure cheat sheets:** a customizable tool where a club can select its preferred rules (for example, UNA-USA or THIMUN) and generate a single-page downloadable "Script of Motions".
    - **Position paper drafting tools:** guided templates and structure for drafting position papers without the AI rewriting the student’s voice.
- **Prep notes & documents:** personal (and optionally classroom-shared) notes — write on the spot, and/or attach or link Google Docs, Slides, PDFs, and similar for conference prep.
- **Built-in AI prep assistant:** in-app Q&A that answers general questions and finds prep resources/websites; **does not edit** user work (speeches, resolutions, notes, position papers).
- **In-app calling:** voice/video inside committee rooms so Meet/Zoom is optional, not required (Phase 6).

---

## 8. Recommended build order

1. Harden signup ops (rules published — including `emails/` + `roles` — Worker live, real Resend domain for public users)
2. ~~Finish role-aware UX + multi-role accounts (Phase 1.6)~~ **Done**
3. **Phase 2** (live committee procedure floor — core differentiator)
4. Phase 3 AI · Phase 4 conferences · Phase 5 learning/ops
5. **Phase 6** in-app calling (after the floor is solid)
6. Photos when Blaze is OK

---

## 9. Key decisions

- **Firebase Spark:** Stay on free tier for now. Upgrade to Blaze only if essential (e.g., Firebase Storage for photos, complex Cloud Functions).
- **Procedure floor first:** Phase 2 rooms = speakers / motions / timers / votes — not a video app. V1 voice/video = Meet/Zoom links. **In-app calling** comes later (Phase 6) and is especially for open ad-hoc rooms.
- **Open committee rooms:** not limited to classroom members; any signed-in user can create and invite others via link.
- **Join-time session role:** chair or delegate chosen when entering (editable in-room); delegate display name = country (manual until country assignment); chair name is typed; UI shows `Chair · …` / `Delegate · …`.
- **Meeting link on create:** optional Meet/Zoom/etc. URL on the room until Phase 6 in-app calling.
- **Multi-role accounts:** A single user ID can have multiple roles (student, teacher). UX adapts dynamically.
- **Email verification:** Mandatory 6-digit code for signup via Resend + Cloudflare Worker.
- **Username:** Discord-style unique handle, locked after signup. Display name is editable.
- **Private classrooms:** No public lobbies or social features.

---

## 10. Glossary (quick)

- **Caucus:** A temporary suspension of debate in a Model UN committee. Can be moderated (speakers on a list for a topic) or unmoderated (free discussion).
- **Delegate:** A student representing a country in a Model UN committee.
- **Chair:** The teacher or student presiding over a Model UN committee session.
- **Motion:** A formal proposal by a delegate to take a specific action.
- **Directive:** A short instruction from the Chair to delegates (e.g., "yield the floor").

---

## 11. Doc map

| File | Purpose |
| --- | --- |
| [OUTLINE.md](./OUTLINE.md) | Quick overview (this file) |
| [README.md](./README.md) | Setup and current app flow |
| [ROADMAP.md](./ROADMAP.md) | Full phased product plan (this file) |