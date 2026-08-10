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
| **Parent / guardian** | Later — link to students; view their activity (read-only). Not built. |

**Direction:** account holds capabilities (`roles[]`); **per-classroom** membership / ownership is the real permission in a room. Details in [ROADMAP.md](./ROADMAP.md).

---

## User flow (today)

1. **Continue with Google** (signup or login)  
2. New users: **username** + display name + capabilities (student and/or teacher)  
3. Welcome: optional school (Skip OK) · avatars = **initials**  
4. Dashboard → classroom / rooms → practice / conferences / profile  

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
| Parent / guardian role | Parked — after activity; see sketch below |
| Profile photos (Storage) | Paused (Blaze) |
| Email/password + Resend codes | Parked (needs verified sending domain) |
| AI (Gemini) | Phase 3 |
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
5. Phase 3 AI · Phase 4 conferences · Phase 5 learning/ops  
6. **Phase 6** in-app calling  
7. Parent / guardian linking · Photos when Blaze is OK  

---

## Open ideas (parked)

Revive email-code signup (verified domain) · login with username · richer profiles · deeper messaging · YouTube curriculum · **Speech & Debate** practice mode (same site as MUN — far future, not a near-term phase)

### Parent / guardian accounts (parked sketch)

Not built yet. When we add it:

- New account capability **`parent`** in `roles[]` (can combine with student/teacher later if needed).
- Parent **links** to one or more **student** accounts (invite/code or student-approved link — exact UX TBD).
- Parent can **view linked students’ activity** (same timeline / usage idea as the student dashboard) **read-only** — not chair rooms, not edit student work.
- **Privacy:** student must consent to the link; parent cannot see unrelated classrooms or open rooms.
- Build **after** student/teacher own-activity is solid; before or beside Phase 3 is fine, not blocking AI.

---

## Future Considerations

- **Online conference practice:** real-time committee rooms for remote sessions and virtual practice rounds.
- **In-person conference operations:** chair-facing tools for inputting and organizing MUN data from physical conferences.
- **Smart Research Simulation Tools:**
  - Interactive Clause Builders / **resolution formatting**
  - Country Stance Aggregator
  - Procedural / **Rules-of-Procedure cheat sheets** ("Scripts of Motions")
  - **Position paper drafting tools** (guided structure; user writes the content)
- **Prep notes & documents:** write notes in-app **and** link/attach Google Docs, Slides, PDFs for later prep reference.
- **Built-in AI prep assistant:** ask questions, get resource links and general answers — **does not edit** the user’s work.
- **In-app calling:** optional voice/video inside rooms (Phase 6); Meet/Zoom remains a fallback.

---

## Doc map

| File | Purpose |
| --- | --- |
| **OUTLINE.md** | This page — quick combined view |
| **README.md** | Setup, flow, layout |
| **ROADMAP.md** | Phases, checklists, decisions |
