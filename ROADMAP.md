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
- **Integrity / no plagiarism:** Prep and AI tools support learning — structure, format guidance, resources, and Q&A. They must **not** write, rewrite, or ghost-edit speeches, resolutions, position papers, or notes for the user. The delegate owns the words.
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
- **Backend:** Firebase Auth (**Google** sign-in) + Firestore. Serverless, real-time, free tier-friendly.
- **Hosting:** GitHub Pages. Free, simple CI/CD.
- **Avatars:** Initials only (Storage needs Blaze, avoided for now).
- **Email codes (parked):** Resend + Cloudflare Worker remain in-repo if we revive email/password signup later (needs a verified sending domain).

---

## 6. Current status (high level)

| Area | Status | Notes |
| --- | --- | --- |
| Setup (project, auth, deploy) | Done | CI/CD, Google auth, routing. |
| Signup / login (Continue with Google) | Done | Primary path; any Google/Gmail. |
| Username + roles onboarding | Done | After first Google sign-in. |
| Profile flow (display name, school, roles) | Done | Post-signup customize. |
| Classroom flow (create, invite, join) | Done | Role-aware permissions. |
| Practice rooms (text only) | Done | Simple free-form practice. |
| Conference directory | Done | Outbound links only. |
| Core UI/UX polish | Done | General app usability. |
| Role-aware UX | Done | Phase 1.6 completed. |
| Multi-role accounts | Done | Student **and** teacher. |
| Founder Stats (`/admin`) | Done | Hard-locked to `dhyanvim@gmail.com` only. |
| Profile photos (Storage) | Not built | Needs Firebase Blaze. |
| Email/password + Resend codes | Parked | Removed from UI; Worker kept for later. |
| Live committee floor | Phase 2 floor done | Speakers, timer, motions, gavel (real sample), chat, session start/stop, audio cues. |
| Dashboard Your activity | Done | Horizontal timeline + usage chips; live log + backfill from rooms/classrooms. |
| Parent / guardian portal | Done (V1) | Parent-only; `/family`; family-code link; activity + monthly summaries. |
| Student My progress | Done | `/progress` — own timeline + monthly summaries. |
| AI tools (Gemini) + prep Q&A assistant | Not built — deferred | Phase 3 after progress track; backend TBD (stay free / Spark). |
| Conference filters | Not built | Phase 4. |
| Tutorials / inbox / drafting / notes | Not built | Phase 5. |
| In-app calling (voice/video) | Not built — Later | Meet/Zoom links until then. |
| Speech & Debate (parallel practice mode) | Not built — Far future | Parked idea. |

---

## 7. Build phases (detailed)

### Phase 1 — Core MVP (signup, profile, classrooms, practice, conferences) ⬅️ done

- [x] Basic project setup (Vite, React, TS, Firebase)
- [x] Firebase Auth (email/password — legacy; **Google** is current UI)
- [x] Firestore setup (rules, data models for users, classrooms)
- [x] Email-code signup via Resend + Worker (built, then **parked** from UI)
- [x] **Continue with Google** signup / login (primary)
- [x] Username + display name + roles onboarding for Google users
- [x] User login / logout flows
- [x] Profile management (display name, school, avatar initials)
- [x] Create / join classrooms with invite codes
- [x] Classroom roster management
- [x] Basic text-based practice room
- [x] Conference directory (outbound links)
- [x] General UI/UX polish
- [x] Multi-role accounts (student **and** teacher on one UID)
- [x] Role-aware UI (dashboard, classroom controls)
- [x] Founder Stats page (`/admin`, `stats/app` counter)

### Phase 2 — Live committee room ⬅️ core done; polish next

**Goal:** Enable real-time, structured Model UN committee sessions.

**What a room is (clarify):** A GoMUN room is a **shared procedure dashboard** — speaker queue, timers, motions, voting, chat — that everyone in the session sees and updates together. It is **not** a Zoom/Meet clone. **Open to any signed-in user** (not classroom-gated): create a room, share the link, others join. Classrooms stay a separate club home. In-app voice/video (Phase 6) is especially important for these open ad-hoc rooms; until then Meet/Zoom link-out is the fallback.

**Locked decisions (Phase 2):**

- Rooms are **open** — any GoMUN account can create/join; share `/room/:roomId` (invite). Optional classroom link later, not required.
- Hosted + joined rooms stay on the **dashboard / `/rooms`** until host or chair **closes** the room (recess does not remove them).
- **Session role chosen on join** (editable in-room): **chair** or **delegate**.
- Delegate **displayName = country** (typed for now; assignment later); chair **displayName = typed name**. UI: `Chair · …` / `Delegate · …`.
- **Raise placard** → chair **recognizes** onto `speakerQueue`.
- Optional **meetingLink** on create (Meet/Zoom/etc.) until Phase 6.
- **Speaker timer:** live for everyone; **chair-only** controls; **custom duration**; leftover seconds per speech logged into a **chair-visible time bank** (practice aid — see note below). No auto-start yet.
- **Gavel:** chair-only **manual** single tap per click, synced so everyone hears; uses a **real wooden gavel sample** (not a synth thud). No auto time-warnings.
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
- [x] Basic chat/messaging (per-room text; participants only; full history; live seat labels)
- [x] Chair controls polish (start/stop session + clearer session status)
- [x] Delegate view polish (dedicated actions panel; recess messaging)
- [x] Room audio cues (gavel + timer warning/end; Enable sound unlock)

**Chat V1 (locked):** Each open room has its own `messages` subcollection. Late joiners see earlier messages. Labels follow the sender’s current seat while they are in the room; stored fallback updates on seat change so left users keep their latest label. Auto-scroll only when **you** send. Hard cap **1000 characters** per message (UI warning + Send disabled when over; rules enforce the same). No edit/delete, DMs, threads, reactions, @mentions, or uploads yet.

**Chat follow-ups (parked):** message moderation / delete; soft client history limit if Spark reads get heavy; richer formatting.

**Session controls V1:** Chair can **Start / resume session** (`open`) or **End session (recess)**. Ending clears active caucus / motion floor and banks leftover timer time. Motions can still move status (e.g. voting, caucus) as before. **Close room** (host or chair) is separate: marks `closedAt`, removes the room from everyone’s live dashboard/`/rooms` lists, and blocks new joins. Recess ≠ closed.

**Room persistence V1:** Dashboard and `/rooms` stream rooms you **hosted** (`createdBy`) and/or **joined** (participant doc). Lists survive refresh until **Close room**.

**Audio V1:** Browsers mute Web Audio until a user gesture. Room shows **Enable sound**; first click/key also unlocks. Gavel plays a **real wooden tap sample** for everyone on strike; timer plays a warning near 10s and a chime at 0.

Note: `/rooms` hub lists/creates open committee rooms. Later: AI practice rooms (Phase 3) and hybrid rooms.

### Phase 2.5 — Personal activity (dashboard) ⬅️ done

- [x] Per-user activity log `users/{uid}/activity` (append-only)
- [x] Log on classroom/room create, join, close (+ account created backfill)
- [x] Dashboard **Your activity** horizontal timeline with colored dots + usage chips
- [x] Merge live logs with backfill from rooms/classrooms (deduped)

**Parent note:** Parent accounts read linked students’ activity from the same collection (read-only). See Phase 2.6.

### Phase 2.6 — Parent / guardian portal ⬅️ V1 done

**Goal:** Parent-only accounts can link to students and monitor practice activity without joining rooms as the child.

**Locked V1 decisions:**

- Parent-only (`roles: ['parent']`); multi-role later.
- Parent-initiated link: `@username` + student **family code** (no Approve/Deny).
- `/family`: linked kids → activity timeline + usage chips + **rule-based monthly summaries**.
- 18+ via **date of birth** on the parent profile (no ID upload / attestation checkbox).
- Cap ~5 links per parent. Parents do not see chat / room floor / classroom rosters.
- UX modeled loosely on school **parent portals** (e.g. Aeries): select a student → view their practice activity.

**Build:**

- [x] `parent` role + Firestore `parentLinks` + family code on student profile
- [x] Parent onboarding + date of birth (18+)
- [x] Student Profile: show / copy / rotate family code
- [x] `/family` Parent portal UI: link, list, timeline, monthly summary
- [x] Nav + guards (Parent portal link; hide teacher create for parent-only)
- [x] Parent activity load hardened — member-doc classroom backfill; isolate classroom failures so rooms + live log still show; clear UI on student switch + error banners
- [x] Student **My progress** (`/progress`) — own timeline + monthly summaries; nav + dashboard link

**Later (still parked):**

- Parent multi-role; stronger identity checks; richer visibility; AI-written summary narratives
- Phase 3 AI deferred until a free/Spark-friendly Gemini path is chosen

### Phase 3 — AI integration ⬅️ deferred (after progress track)

**Goal:** Provide AI-powered feedback, training, and a prep Q&A assistant — always as **help for prep**, never as a plagiarism / ghostwriting engine.

**Integrity boundary (locked):** The AI may answer general questions, explain procedure, and **find prep websites / resources**. It may give high-level feedback (e.g. “your speech is unclear on X”) in practice modes. It must **not** draft, rewrite, or paste-ready-edit the user’s speeches, resolutions, position papers, or notes.

**Build:**

- [ ] AI feedback on speeches (grammar, coherence, style) — coaching only; no auto-rewrite of the user’s text
- [ ] AI-generated research briefs for topics (background / pointers — not copy-paste position papers)
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

**Goal:** Extra MUN help for delegates — procedure, formatting, drafting structure, and personal notes — without doing the academic work for them.

**Build:**

- [ ] Interactive Clause Builders (resolution **formatting** guides — user still writes substance)
- [ ] Country Stance Aggregator
- [ ] Procedural / Rules-of-Procedure cheat sheets ("Scripts of Motions")
- [ ] Position paper drafting tools (templates / guided structure / outlines; **user writes the content** — no AI ghostwriting)
- [ ] Prep notes workspace — **write notes on the spot** in-app **and** link or attach existing Google Docs, Slides, PDFs (not upload-only)
- [ ] In-app tutorials for MUN procedures
- [ ] Teacher inbox for student submissions/questions
- [ ] Basic admin dashboard (user/classroom management)

### Phase 6 — In-app calling (voice / video) ⬅️ later

**Goal:** Optional built-in voice (then video) so clubs can run committee **without** leaving GoMUN for Meet/Zoom — while the procedure floor stays the product core.

**Why this matters:** Jumping between Zoom/Meet and the GoMUN procedure floor is awkward. A built-in call (same room page as queue, motions, chat, timers) keeps everything in one place — especially for open ad-hoc rooms with no classroom Meet link set up.

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
- **Smart Research Simulation Tools** (structure & procedure help — not ghostwriting):
    - **Interactive Clause Builders:** interactive forms that prompt users for operative verbs, sub-clauses, and funding mechanisms to output properly formatted UN draft language (**resolution formatting**).
    - **Country Stance Aggregator:** quick-reference dashboards that pull open-source UN data, voting records, and basic policy summaries for beginners.
    - **Procedural / Rules-of-Procedure cheat sheets:** a customizable tool where a club can select its preferred rules (for example, UNA-USA or THIMUN) and generate a single-page downloadable "Script of Motions".
    - **Position paper drafting tools:** guided templates and structure for drafting position papers; student writes every sentence; tools never rewrite their voice.
- **Prep notes & documents:** personal (and optionally classroom-shared) notes space — **write on the spot** for future reference, **and/or** link or attach Google Docs, Slides, PDFs (not upload-only).
- **Built-in AI prep assistant:** in-app Q&A that answers general questions and finds prep resources/websites; **does not edit** user work (speeches, resolutions, notes, position papers). Anti-plagiarism stance: help prep, don’t produce copy-paste deliverables.
- **Appearance / color themes (parked — do when the time is right):**
  - Default **light** theme (current product direction — bright auth stages, light app chrome, navy + gold accents).
  - Optional **dark** theme for users who prefer it (not the forced default).
  - Optional **warm / gold-accent** or high-contrast accessibility theme.
  - Themes should share the same layout and brand signals; only tokens (backgrounds, surfaces, text, accents) swap.
- **In-app calling:** voice/video inside committee rooms so Meet/Zoom is optional, not required (Phase 6).
- **Parent / guardian portal (V1 shipped; progress follow-ups done):**
  - V1: parent-only; parent-initiated `@username` + family code; `/family` Parent portal activity + monthly summaries; date of birth (18+).
  - Linked-child activity load hardened (member-doc classroom backfill; no silent wipe).
  - **Student self-progress** at `/progress` (timeline + monthly summaries).
  - Later: multi-role parent+student/teacher; stronger identity checks; richer visibility; AI summary narratives.
  - Parents cannot chair rooms or edit student work; no chat/room floor in V1.

---

## 8. Recommended build order

1. ~~Google Sign-In for public users (no paid Resend domain)~~ **Done**
2. ~~Finish role-aware UX + multi-role accounts (Phase 1.6)~~ **Done**
3. ~~Finish Phase 2~~ **Done** (chat, session controls, audio cues, delegate actions) — more UX polish anytime
4. ~~Dashboard Your activity timeline~~ **Done**
5. ~~**Parent / guardian portal V1** (`/family`)~~ **Done**
6. ~~Parent activity reliability + student `/progress`~~ **Done** (this track)
7. Phase 3 AI (deferred — free/Spark path TBD) · Phase 4 conferences · Phase 5 learning/ops
8. **Phase 6** in-app calling · Photos when Blaze is OK · optional revive email-code signup · parent multi-role / stronger identity

---

## 9. Key decisions

- **Firebase Spark:** Stay on free tier for now. Upgrade to Blaze only if essential (e.g., Firebase Storage for photos, complex Cloud Functions).
- **Google Sign-In:** Primary auth so any Gmail can join without a paid email-sending domain. Email/password + Resend codes are parked.
- **Procedure floor first:** Phase 2 rooms = speakers / motions / timers / votes — not a video app. V1 voice/video = Meet/Zoom links. **In-app calling** comes later (Phase 6) and is especially for open ad-hoc rooms.
- **Open committee rooms:** not limited to classroom members; any signed-in user can create and invite others via link.
- **Join-time session role:** chair or delegate chosen when entering (editable in-room); delegate display name = country (manual until country assignment); chair name is typed; UI shows `Chair · …` / `Delegate · …`.
- **Meeting link on create:** optional Meet/Zoom/etc. URL on the room until Phase 6 in-app calling.
- **Multi-role accounts:** A single user ID can have multiple roles (student, teacher). UX adapts dynamically.
- **Username:** Discord-style unique handle, locked after signup. Display name is editable.
- **Private classrooms:** No public lobbies or social features.
- **Founder Stats:** `/admin` (“Founder's Stats”) is hard-locked to `dhyanvim@gmail.com` in the UI and Firestore read rules. Exact Auth roster stays in Firebase Console.
- **Parent portal V1:** Parent-only accounts; link via student family code; `/family` is an Aeries-style read-only activity portal + rule-based monthly summaries; parents set **date of birth** (must be 18+; no ID upload).
- **AI & prep tools vs plagiarism:** GoMUN may add RoP cheat sheets, resolution formatting, position-paper structure tools, prep notes (write + link Docs/Slides/PDFs), and an AI that answers questions / finds resources. None of these may write or rewrite the user’s graded/submitted work for them.

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