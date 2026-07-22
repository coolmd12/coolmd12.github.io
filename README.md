# GoMUN Delegate Arena

Free Interactive AI Model United Nations practice for students and teachers.

**Always free. No paid tiers planned for core practice.**

## What this is

GoMUN Delegate Arena is a classroom-private MUN platform:

- **Live practice** with friends, classmates, and teachers
- **AI practice** (solo / hybrid) powered by existing models like Gemini — next phase
- **Conference directory** — curated shortcuts that link out to organizers’ own websites
- **Meet / Zoom links** on classrooms (recommended V1 video approach: link out, don’t embed)

## Stack

- React + TypeScript + Vite
- Firebase Auth + Cloud Firestore (free Spark plan)
- Deployable to Firebase Hosting or GitHub Pages (`dist/`)

## Phase 1 (this PR)

- Secure email/password accounts (student / teacher)
- Private classrooms with invite codes (Google Classroom–style)
- Firestore security rules
- Landing page + practice hub placeholders
- Conference shortcut directory (external links)

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill Firebase web config
3. Enable Email/Password auth in Firebase Console
4. Create Firestore and deploy rules from `firebase/firestore.rules`
5. `npm run dev`

Details: open `/setup` in the app.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run preview` — preview build
- `npm run lint` — oxlint

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
