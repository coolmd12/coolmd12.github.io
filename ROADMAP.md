# GoMUN Delegate Arena — Roadmap

> For a quick overview see [OUTLINE.md](./OUTLINE.md). For setup detail see [README.md](./README.md).

---

## 1. Goal (North Star)

Free classroom-private Model UN (and later, Speech & Debate) practice rooms with AI tools for feedback and training.

---

## 2. Constraints

- **Team:** One person, part-time
- **Budget:** Zero. Use only free services. Avoid Blaze tier. 
- **Scope:** No in-app video. Use Meet/Zoom URLs for live. Focus on text/timer/voting flows.
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
- Integrated video conferencing (beyond URL links)
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
| Live committee floor | **Not built** — Phase 2 (next big feature) | Main differentiator. |
| AI tools (Gemini) | Not built | Phase 3. |
| Conference filters | Not built | Phase 4. |
| Tutorials / inbox / admin | Not built | Phase 5. |
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

**Build:**

- [ ] Real-time speaker list (delegates can "raise hand")
- [ ] Speaker timer (chair controls, visible to all)
- [ ] **Motions** flow (at least: moderated caucus, unmoderated caucus, adjourn — expand later)
- [ ] Voting mechanism for motions
- [ ] Basic chat/messaging
- [ ] Chair controls (start/stop session, manage speakers, motions, timers)
- [ ] Delegate view (request to speak, vote, view timers)

Note: We'll provide a centralized "Rooms" hub (e.g. `/rooms`) that lists and exposes committee rooms. Over time the Rooms hub will host multiple room types: live committee rooms (Phase 2), AI practice rooms (Phase 3), and hybrid rooms that combine live and AI features.

### Phase 3 — AI integration

**Goal:** Provide AI-powered feedback and training.

**Build:**

- [ ] AI feedback on speeches (grammar, coherence, style)
- [ ] AI-generated research briefs for topics
- [ ] AI-powered delegate roles (practice solo)

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

**Goal:** Add beginner-friendly research and procedural support.

**Build:**

- [ ] Interactive Clause Builders
- [ ] Country Stance Aggregator
- [ ] Procedural Cheat-Sheet Generators
- [ ] In-app tutorials for MUN procedures
- [ ] Teacher inbox for student submissions/questions
- [ ] Basic admin dashboard (user/classroom management)

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
    - **Interactive Clause Builders:** interactive forms that prompt users for operative verbs, sub-clauses, and funding mechanisms to output properly formatted UN draft language.
    - **Country Stance Aggregator:** quick-reference dashboards that pull open-source UN data, voting records, and basic policy summaries for beginners.
    - **Procedural Cheat-Sheet Generators:** a customizable tool where a club can select its preferred rules of procedure (for example, UNA-USA or THIMUN) and generate a single-page downloadable "Script of Motions".

---

## 8. Recommended build order

1. Harden signup ops (rules published — including `emails/` + `roles` — Worker live, real Resend domain for public users)
2. ~~Finish role-aware UX + multi-role accounts (Phase 1.6)~~ **Done**
3. **Phase 2** (live committee — core differentiator)
4. Phase 3 AI · Phase 4 conferences · Phase 5 learning/ops
5. Photos when Blaze is OK

---

## 9. Key decisions

- **Firebase Spark:** Stay on free tier for now. Upgrade to Blaze only if essential (e.g., Firebase Storage for photos, complex Cloud Functions).
- **No in-app video:** Use external links (Meet, Zoom) for video conferencing. Focus on MUN-specific features.
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