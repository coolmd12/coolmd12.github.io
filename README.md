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
| Email verification **code** before signup + Discord-style username | Phase 1.7 |
| Private classrooms + invite codes | Done |
| Post-signup optional customize (school; Skip OK; photos paused) | Done |
| Profile page (display name, school; username locked; initials avatar) | Done |
| Conference directory (links to real organizers) | Done (basic) |
| Role-aware UI (signed out vs student vs teacher) | In progress |
| Parent / guardian accounts | Later (see roadmap) |
| Live committee room (speakers, motions, timers) | Next (Phase 2) |
| AI practice with Gemini (solo / hybrid) | Later (Phase 3) |

**GoMUN does not host conferences.** The conference page is a guide to other organizers’ events.

**Video (V1):** optional Google Meet / Zoom links on classrooms — we link out; we don’t embed video SDKs yet.

---

## How a user flows through the app

1. **Sign up** — enter email → type the **verification code** from Resend → create one GoMUN password, unique **username**, **display name**, and role (student / teacher)  
2. **Welcome** — optional school/club and photo only (or **Skip for now**); username + display name are already set  
3. **Dashboard** — teachers create classrooms; students join with an invite code  
4. **Classroom** — members list, invite sharing, optional Meet/Zoom links  
5. **Practice / Conferences / Profile** — explore practice modes, find real MUNs, edit profile anytime  

Signed-in users see Dashboard CTAs instead of Sign up on the home page. More role-specific layouts are on the roadmap.

### Account security (Discord-style)

| Field | Required? | Notes |
| --- | --- | --- |
| Email | Yes | Must pass a **6-digit code** sent to that inbox before the account is created |
| GoMUN password | Yes | One site password — never ask for the user’s Gmail/Outlook password |
| Username | Yes | Unique `@handle` (`a-z`, `0-9`, `_`, `.`); **locked** after signup |
| Display name | Yes | Friendly name shown in rooms; editable later |
| Role | Yes | Student / teacher today; **parent / guardian** planned later |
| Photo, school | Optional | Welcome step or Profile; Skip allowed |

Email codes are sent by **Resend** through a **Cloudflare Worker** (`workers/email-verification/`) so `RESEND_API_KEY` never ships in the Vite/`VITE_*` frontend. See that folder’s README for deploy steps.

---

## Stack

- **Frontend:** React + TypeScript + Vite  
- **Auth / data:** Firebase Auth + Cloud Firestore (Spark / free tier)  
- **Email codes:** Resend + Cloudflare Worker (no Firebase Blaze required)  
- **Photos:** paused for now (initials avatars) — Firebase Storage needs Blaze; revisit later  
- **Hosting:** GitHub Pages (Vite build → `dist/` via GitHub Actions)

---

## Quick start

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill:
   - Firebase web config (`VITE_FIREBASE_*`)
   - `VITE_EMAIL_VERIFY_URL` (your deployed Cloudflare Worker base URL, no trailing slash)
3. In [Firebase Console](https://console.firebase.google.com/):
   - Enable **Email/Password** authentication  
   - Create a **Firestore** database  
   - (Optional later) Enable **Storage** for profile photos when you’re ready for Blaze  
4. Deploy / paste rules:
   - `firebase/firestore.rules`
   - `firebase/storage.rules` (only once Storage is enabled)
5. Deploy the email-verification Worker (see `workers/email-verification/README.md`) with Resend + KV secrets  
6. `npm run dev` → [http://localhost:5173](http://localhost:5173)

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
| `src/services/` | Firebase Auth / Firestore / Storage / email-verify helpers |
| `src/contexts/AuthContext.tsx` | Signed-in user + profile |
| `workers/email-verification/` | Cloudflare Worker: request / verify / consume signup codes |
| `firebase/firestore.rules` | Who can read/write classrooms, users, usernames |
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
