# GoMUN Delegate Arena — Outline

> Condensed README + ROADMAP. For setup detail see [README.md](./README.md). For full phases see [ROADMAP.md](./ROADMAP.md).

**Live:** [https://coolmd12.github.io](https://coolmd12.github.io) · **Founder:** Dhyanvi Mehta  
**Promise:** Free forever for core practice. No freemium upsell.

---

## What it is

Classroom-private **Model UN practice** for students and teachers: invite-code classrooms, conference *guides* (not hosting), a live **procedure floor** (speakers / motions / timers), Meet/Zoom link-outs for V1 voice/video, later in-app calling + AI practice.

| Is | Is not |
| --- | --- |
| Practice arena for clubs | Paid conference host |
| Private invite-code rooms | Public matchmaking lobby |
| Procedure floor + (later) optional in-app call | A Zoom/Meet clone |
| Links to other organizers’ MUNs | “Our” conference calendar |

---

## Who uses it

| Role | Job |
| --- | --- |
| **Teacher** | Create classroom, share invite, chair later |
| **Student** | Join with code, practice |
| **Both** | Same account can teach one room and join another as a delegate |
| **Parent / guardian** | Parent-only account; link kids via `@username` + family code; `/family` read-only activity + monthly summaries. |

**Direction:** account holds capabilities (`roles[]`); **per-classroom** membership / ownership is the real permission in a room. Details in [ROADMAP.md](./ROADMAP.md).

---

## User flow (today)

1. **Continue with Google** (signup or login)  
2. New users: **username** + display name + capabilities (student and/or teacher, **or** parent-only)  
3. Welcome: optional school (Skip OK) · avatars = **initials** · parents enter **date of birth** (18+)  
4. Dashboard (students/teachers) or **Parent portal** (`/family`) → practice / conferences / profile  

Google proves the email; no Resend verification code in the current UI.

---

## Status snapshot

| Area | Status |
| --- | --- |
| Landing, classrooms, invites | Done |
| **Google Sign-In** (primary auth) | Done |
| Username + roles onboarding | Done |
| Profile / welcome (school; initials) | Done |
| Signup / login UI (Google-only) | Done |
| Role-aware UX | Done (Phase 1.6) |
| Multi-role (student **and** teacher) | Done (`roles[]`) |
| Founder's Stats (`/admin` — `dhyanvim@gmail.com` only) | Done |
| Live committee floor (queue, timer, motions, gavel) | Done (Phase 2 core) |
| Basic room chat | Done (participants only; history shared) |
| Chair session start/stop + room audio cues | Done |
| Dashboard Your activity timeline | Done |
| Further room UX polish | As needed |
| Parent / guardian portal (`/family`) | Done (V1) — family-code link; activity + monthly summaries |
| Student My progress (`/progress`) | Done — own timeline + monthly summaries |
| Profile photos (Storage) | Paused (Blaze) |
| Email/password + Resend codes | Parked (needs verified sending domain) |
| AI (Gemini) | Phase 3 — deferred (free/Spark path TBD) |
| Conference filters | Phase 4 |
| Tutorials / inbox / drafting tools / notes | Phase 5 |
| In-app calling (voice / video) | Phase 6 — later |
| Speech & Debate (parallel practice mode) | Far future — parked |

---

## Locked decisions

- **Continue with Google** is the signup / login path (Spark-friendly; any Gmail)  
- Discord-style **username** (locked) + **display name** (editable)  
- Stay on Firebase **Spark** while building; no Blaze until photos/AI need it  
- No paid sending domain required for auth (Resend email-code path parked)  
- Conferences = outbound links only  
- Rooms = **open procedure floors** (any signed-in user; share link) — not classroom-gated, not video meetings  
- Hosted + joined rooms stay listed on dashboard / `/rooms` until **Close room** (recess ≠ closed)  
- Join: pick **chair** or **delegate** (editable in-room); delegate = **country**; chair = typed name; labels `Chair ·` / `Delegate ·`; raise **placard** → speaker queue  
- **Room chat:** per-room text for **participants only**; late joiners see history; seat labels stay current  
- Optional **meeting link** on create (Meet/Zoom/etc.) until Phase 6 calling  
- Motions: anyone proposes; multiple pending; chair opens vote; procedural **yes/no**; tally chair-only until closed  
- Speaker timer: custom duration; chair leftover-time bank (practice aid)  
- Chair **manual gavel** (one tap per click), synced to the room  
- **Enable sound** in-room (gavel + timer 10s warning + end chime)  
- Chair **start / resume** or **end session (recess)**  
- Founder **Founder's Stats** via `/admin` — hard-locked to `dhyanvim@gmail.com` only  
- **Parent portal V1:** parent-only accounts (`roles: ['parent']`); parent-initiated link with student `@username` + **family code** (no Approve/Deny); `/family` **Parent portal** shows linked students’ activity + monthly summaries (Aeries-style overview); parents enter **date of birth** (must be 18+; no ID upload); parents do not chair rooms or edit student work  

---

## Stack (one glance)

React + Vite + TypeScript · Firebase Auth (Google) + Firestore · GitHub Pages  
Dev: `npm run dev` → **http://localhost:5173** · Env: `.env.local` (`VITE_FIREBASE_*`)

Rules: `firebase/firestore.rules` · Parked Worker: `workers/email-verification/`

---

## Build order

1. ~~Google Sign-In for public signup (no paid Resend domain)~~ **Done**  
2. ~~Finish role-aware UX + multi-role accounts (Phase 1.6)~~ **Done**  
3. ~~Finish Phase 2~~ **Done** (chat, session controls, audio)  
4. ~~Dashboard Your activity~~ **Done**  
5. ~~**Parent / guardian portal V1** (`/family`)~~ **Done**  
6. ~~Parent activity reliability + student `/progress`~~ **Done**  
7. Phase 3 AI (deferred) · Phase 4 conferences · Phase 5 learning/ops  
8. **Phase 6** in-app calling · Photos when Blaze is OK  

---

## Open ideas (parked)

Revive email-code signup (verified domain) · login with username · richer profiles · deeper messaging · YouTube curriculum · **Speech & Debate** practice mode (same site as MUN — far future, not a near-term phase) · **appearance themes** (light default, optional dark / warm-gold)

### Parent / guardian accounts (V1 done; later parked)

**V1 (shipped):**

- Parent-only accounts (`roles: ['parent']`); multi-role parent+student/teacher later.
- Parent-initiated link: enter student `@username` + **family code** (shown on student Profile; rotatable). No student Approve/Deny queue.
- `/family`: linked students → read-only activity timeline + usage chips + **rule-based monthly summaries** (no AI narrative yet).
- Cap ~5 linked students per parent. Parent can unlink; student can rotate code (blocks new links) and unlink as a safety escape.
- Age: required **date of birth** on parent account (must calculate to 18+). No ID uploads. Stronger identity checks parked.
- Parents do **not** see chat, motions, room floor, or classroom rosters in V1.
- UX: Aeries-like **Parent portal** — pick a linked student, view their practice activity / summaries.

**Later (still parked):**

- multi-role; stronger identity checks; richer visibility; AI-written summary narratives.

**Shipped follow-ups:** Parent linked-child activity load hardened; students have **My progress** (`/progress`) with timeline + monthly summaries.

---

## Future Considerations

Extra MUN help is welcome — **integrity first:** tools guide format/procedure and find resources; they do **not** ghostwrite or enable plagiarism. The user always owns the writing.

- **Online conference practice:** real-time committee rooms for remote sessions and virtual practice rounds.
- **In-person conference operations:** chair-facing tools for inputting and organizing MUN data from physical conferences.
- **Smart Research Simulation Tools:**
  - Interactive Clause Builders / **resolution formatting**
  - Country Stance Aggregator
  - Procedural / **Rules-of-Procedure cheat sheets** ("Scripts of Motions")
  - **Position paper drafting tools** (guided structure / templates; user writes every sentence)
- **Prep notes & documents:** write notes **on the spot** in-app for later reference, **and/or** link/attach Google Docs, Slides, PDFs (not upload-only).
- **Built-in AI prep assistant:** ask questions, get resource links and general answers — **does not edit** speeches, resolutions, position papers, or notes.
- **In-app calling:** optional voice/video inside rooms (Phase 6); Meet/Zoom remains a fallback.
- **Appearance themes (parked):** user-selectable color themes — at least a default **light** theme (current direction), a **dark** theme, and optionally a softer **warm / gold-accent** or high-contrast mode. Keep brand (navy + gold) recognizable across themes; don’t force dark UI.

---

## Doc map

| File | Purpose |
| --- | --- |
| **OUTLINE.md** | This page — quick combined view |
| **README.md** | Setup, flow, layout |
| **ROADMAP.md** | Phases, checklists, decisions |
