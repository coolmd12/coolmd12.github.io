# GoMUN Delegate Arena — Roadmap

## Product decisions (locked)

| Topic | Decision |
| --- | --- |
| Brand | **GoMUN Delegate Arena** — formal/diplomatic + modern UN |
| Cost | Free for students & teachers |
| Privacy | Classroom-private groups with invite codes |
| AI | Live people **or** solo AI (Gemini); hybrid later; user-selectable modes |
| Video (V1) | Paste Google Meet / Zoom links into classrooms/sessions |
| Conferences | Aggregate/link existing web conferences — do not host our own |
| Backend | Firebase Auth + Firestore (free tier) |
| Later ideas | In-app email/inbox for GoMUN accounts; YouTube tutorial series embed |

## Build phases

### Phase 1 — Foundation (current)

- [x] App shell + UN/diplomatic visual language
- [x] Auth (register / login / logout) with roles
- [x] User profiles in Firestore
- [x] Teacher-created classrooms + invite codes
- [x] Student join flow
- [x] Security rules for private membership
- [x] Conference directory (curated external links)
- [x] Practice hub placeholders (live / AI / hybrid)
- [ ] Wire your Firebase project via `.env.local`

### Phase 2 — Live committee room

- [ ] Realtime speakers list, motions, timers
- [ ] Caucus / moderated discussion flows
- [ ] Session meet/zoom link per meeting
- [ ] Basic chat / notes for the room
- [ ] Teacher chair controls

### Phase 3 — AI arena (Gemini)

- [ ] Solo practice against AI delegates
- [ ] AI procedure helper (points, motions)
- [ ] Speech & resolution coaching
- [ ] Hybrid seats (humans + AI)

### Phase 4 — Conference feed polish

- [ ] Scheduled refresh / admin tools for directory data
- [ ] Filters by date, level, cost, format
- [ ] “Submit a conference link” moderated form (optional)

### Phase 5 — Learning & messaging

- [ ] Embedded YouTube tutorial series
- [ ] Account email / inbox notifications (session invites, announcements)
- [ ] Position paper upload & feedback

## Video recommendation

**Use Meet/Zoom URL fields first.** Free, familiar for schools, no SDK billing, works today. Revisit embedded WebRTC or official embeds only if teachers ask for in-app video.
