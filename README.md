# GoMUN Delegate Arena

Free Model United Nations practice for students and teachers.

**Always free. No paid tiers planned for core practice.**

Live site: [https://coolmd12.github.io](https://coolmd12.github.io)

Founded by **Dhyanvi Mehta**.

---

## What this is

GoMUN Delegate Arena is a **classroom-private** MUN practice app:

| Feature | Status |
| --- | --- |
| Email/password accounts (**student** / **teacher**) | Done |
| Private classrooms + invite codes | Done |
| Post-signup profile customize (or skip) | Done |
| Profile page (name, school, photo) | Done |
| Conference directory (links to real organizers) | Done (basic) |
| Role-aware UI (signed out vs student vs teacher) | In progress |
| Live committee room (speakers, motions, timers) | Next (Phase 2) |
| AI practice with Gemini (solo / hybrid) | Later (Phase 3) |

**GoMUN does not host conferences.** The conference page is a guide to other organizers’ events.

**Video (V1):** optional Google Meet / Zoom links on classrooms — we link out; we don’t embed video SDKs yet.

---

## How a user flows through the app

1. **Sign up** — email, password, and role are required  
2. **Welcome** — optional display name, school/club, photo (or **Skip for now**)  
3. **Dashboard** — teachers create classrooms; students join with an invite code  
4. **Classroom** — members list, invite sharing, optional Meet/Zoom links  
5. **Practice / Conferences / Profile** — explore practice modes, find real MUNs, edit profile anytime  

Signed-in users see Dashboard CTAs instead of Sign up on the home page. More role-specific layouts are on the roadmap.

---

## Stack

- **Frontend:** React + TypeScript + Vite  
- **Auth / data:** Firebase Auth + Cloud Firestore (Spark / free tier)  
- **Photos:** Firebase Storage  
- **Hosting:** GitHub Pages (Vite build → `dist/` via GitHub Actions)

---

## Quick start

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill your Firebase web config (`VITE_FIREBASE_*`)
3. In [Firebase Console](https://console.firebase.google.com/):
   - Enable **Email/Password** authentication  
   - Create a **Firestore** database  
   - Enable **Storage** (needed for profile photos)  
4. Deploy / paste rules:
   - `firebase/firestore.rules`
   - `firebase/storage.rules`
5. `npm run dev` → [http://localhost:5173](http://localhost:5173)

In-app checklist: open `/setup`.

**Tip:** create one teacher account and one student account (incognito) so you can test create + join.

Do **not** commit `.env.local` or secrets.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | oxlint |

---

## Project layout (useful paths)

| Path | Purpose |
| --- | --- |
| `src/pages/` | Screens (landing, auth, welcome, dashboard, classroom, …) |
| `src/services/` | Firebase Auth / Firestore / Storage helpers |
| `src/contexts/AuthContext.tsx` | Signed-in user + profile |
| `firebase/firestore.rules` | Who can read/write classrooms & users |
| `firebase/storage.rules` | Who can upload avatars |
| `.github/workflows/deploy-pages.yml` | Production deploy to GitHub Pages |
| `ROADMAP.md` | Full product guide + phased build plan |

---

## Roadmap

See **[ROADMAP.md](./ROADMAP.md)** for:

- What the product is (and isn’t)  
- Locked product decisions  
- What’s shipped vs what’s next  
- Contributor checklist and “done means…” criteria for each phase  

**Next major build:** Phase 2 — live committee room (speakers list, motions, timers, chair controls).
