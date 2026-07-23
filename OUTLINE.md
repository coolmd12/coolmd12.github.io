# GoMUN Delegate Arena — Outline

> Condensed README + ROADMAP. For setup detail see [README.md](./README.md). For full phases see [ROADMAP.md](./ROADMAP.md).

**Live:** [https://coolmd12.github.io](https://coolmd12.github.io) · **Founder:** Dhyanvi Mehta  
**Promise:** Free forever for core practice. No freemium upsell.

---

## What it is

Classroom-private **Model UN practice** for students and teachers: invite-code rooms, conference *guides* (not hosting), Meet/Zoom link-outs, future live floor + AI practice.

| Is | Is not |
| --- | --- |
| Practice arena for clubs | Paid conference host |
| Private invite-code rooms | Public matchmaking lobby |
| Links to other organizers’ MUNs | “Our” conference calendar |

---

## Who uses it

| Role | Job |
| --- | --- |
| **Teacher** | Create classroom, share invite, chair later |
| **Student** | Join with code, practice |
| **Both (planned)** | Same person can teach one room and join another as a delegate |
| **Parent / guardian** | Later — not built |

**Direction:** stop treating student/teacher as mutually exclusive account types. Keep **per-classroom** membership role as the real permission; let the account hold multiple capabilities (`roles[]`). Details in [ROADMAP.md](./ROADMAP.md).

---

## User flow (today)

1. Sign up: email (block if already registered) → **code** → password + **username** + display name + role  
2. Welcome: optional school (Skip OK) · avatars = **initials**  
3. Dashboard → classroom → practice / conferences / profile  

Account is created only when the user finishes signup and clicks **Create account** (code alone is not enough).

---

## Status snapshot

| Area | Status |
| --- | --- |
| Landing, classrooms, invites | Done |
| Secure signup (email code + username) | Done |
| Early email-already-exists on step 1 | Done (`emails/` + Auth lookup) |
| Profile / welcome (school; initials) | Done |
| Signup / login UI polish | Done |
| Role-aware UX | In progress |
| Multi-role (student **and** teacher) | Planned (Phase 1.6+) |
| Profile photos (Storage) | Paused (Blaze) |
| Live committee room | **Next — Phase 2** |
| AI (Gemini) | Phase 3 |
| Conference filters | Phase 4 |
| Tutorials / inbox / admin | Phase 5 |

---

## Locked decisions

- One **GoMUN password** (never Gmail password)  
- Email **verification code** via Resend + Cloudflare Worker  
- Discord-style **username** (locked) + **display name** (editable)  
- Stay on Firebase **Spark** while building; no Blaze until photos/AI need it  
- Conferences = outbound links only  
- Video V1 = Meet/Zoom URLs, not embedded SDKs  

---

## Stack (one glance)

React + Vite + TypeScript · Firebase Auth + Firestore · Resend + Cloudflare Worker · GitHub Pages  
Dev: `npm run dev` → **http://localhost:5173** · Env: `.env.local` (`VITE_FIREBASE_*`, `VITE_EMAIL_VERIFY_URL`)

Worker: `workers/email-verification/` · Rules: `firebase/firestore.rules`

---

## Build order

1. Harden signup ops (rules published — including `emails/` — Worker live, real Resend domain for public users)  
2. Finish role-aware UX + **multi-role accounts** (Phase 1.6)  
3. **Phase 2** live committee (speakers, motions, timers)  
4. Phase 3 AI · Phase 4 conferences · Phase 5 learning/ops  
5. Photos when Blaze is OK  

---

## Open ideas (parked)

Parent/guardian role · login with username · richer profiles · deeper messaging · YouTube curriculum  

---

## Doc map

| File | Purpose |
| --- | --- |
| **OUTLINE.md** | This page — quick combined view |
| **README.md** | Setup, flow, layout |
| **ROADMAP.md** | Phases, checklists, decisions |
