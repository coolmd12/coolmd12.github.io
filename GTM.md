# GoMUN Delegate Arena — Go-To-Market (GTM) Plan

> Standalone go-to-market plan for GoMUN Delegate Arena. Product roadmap stays in [ROADMAP.md](./ROADMAP.md); this file owns **who we sell to, how we reach them, what we say, what we measure, and what we do week by week**. Founder's Stats expansion ([ROADMAP.md](./ROADMAP.md) § Phase 2.7) exists so this plan can run on real data.

| | |
| --- | --- |
| **Product** | GoMUN Delegate Arena |
| **Live site** | [https://coolmd12.github.io](https://coolmd12.github.io) |
| **Founder** | Dhyanvi Mehta |
| **Budget** | $0 (Firebase Spark, GitHub Pages, free channels) |
| **Team** | One person, part-time |
| **Promise** | Free forever for core practice — no freemium upsell |
| **Status** | Draft GTM — refine targets after 2–4 weeks of Founder's Stats baselines |

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Product & market context](#2-product--market-context)
3. [Ideal customer profiles (ICPs)](#3-ideal-customer-profiles-icps)
4. [Jobs-to-be-done & pain map](#4-jobs-to-be-done--pain-map)
5. [Positioning & messaging](#5-positioning--messaging)
6. [Competitive landscape](#6-competitive-landscape)
7. [Funnel & conversion paths](#7-funnel--conversion-paths)
8. [Channel strategy](#8-channel-strategy)
9. [Outreach playbooks](#9-outreach-playbooks)
10. [Content & assets](#10-content--assets)
11. [90-day plan (30 / 60 / 90)](#11-90-day-plan-30--60--90)
12. [Goals, KPIs & Founder's Stats](#12-goals-kpis--founders-stats)
13. [Website quality checklist](#13-website-quality-checklist)
14. [Risks, constraints & anti-goals](#14-risks-constraints--anti-goals)
15. [Founder operating cadence](#15-founder-operating-cadence)
16. [Decision log](#16-decision-log)
17. [Doc map](#17-doc-map)

---

## 1. Executive summary

GoMUN is a **free classroom-private Model UN practice app**. The core wedge is the **live procedure floor** — speaker queue, placards, timers, motions, voting, chat — plus classrooms, a parent portal, and student progress. It is **not** a Zoom/Meet clone and **not** a paid conference host.

**GTM thesis:** High school MUN clubs already practice. They currently stitch together Google Meet + paper timers + verbal queues. GoMUN wins by putting the **procedure** in one shareable room link, with zero cost and Google sign-in.

**Near-term GTM job:** Prove that clubs will (1) sign up, (2) create/join a room, (3) start a real session, and (4) come back — then amplify the channel that produces those outcomes.

**Immediate product dependency:** Expand **Founder's Stats** (`/admin`) beyond a single user count so we can see reach, activation, feature usage, and quality signals. Without that, GTM is guessing.

---

## 2. Product & market context

### 2.1 What we sell (and what we don’t)

| We are | We are not |
| --- | --- |
| Practice arena for clubs | Paid conference registration platform |
| Private invite-code classrooms | Public matchmaking / social lobby |
| Procedure floor + optional Meet/Zoom link | A video-meeting product (in-app calling is Phase 6) |
| Guide to *other* organizers’ conferences | “Our” conference calendar / host |
| Prep tools later (structure, RoP, resources) | An AI that writes speeches or position papers |

### 2.2 Market shape (practical, not TAM theater)

- **Primary market:** U.S. (and English-speaking) high school MUN clubs — advisors + student chairs.
- **Buying motion:** There is no purchase. Adoption is **advisor trust + student habit**. “Sale” = a club runs practice on GoMUN instead of Meet-only.
- **Seasonality:** Fall conference prep and spring conference season are high-intent windows. Summer is slower for school clubs but good for building assets and advisor relationships.
- **Switching cost:** Low — Google login, share a link. That helps adoption **and** churn; retention must come from habit and classroom stickiness (parent portal, progress, invite codes).

### 2.3 Constraints that shape GTM

- One founder → one primary channel at a time.
- Spark free tier → no heavy analytics infra; prefer aggregate counters + optional free GA4.
- Privacy-first product → no public leaderboards of schools/students for marketing bragging.
- Integrity promise → never market “AI writes your position paper.”

---

## 3. Ideal customer profiles (ICPs)

### 3.1 Priority matrix

| Priority | Persona | Role in adoption | Status |
| --- | --- | --- | --- |
| **P0** | Club advisor / teacher | Often the gatekeeper; creates classroom; legitimizes tool | Chase now |
| **P0** | Student chair / Secretariat-ish student | Creates rooms, runs practice, shares links | Chase now |
| **P1** | Regular delegate (student) | Fills rooms; returns if practice is useful | Acquire via rooms, not cold ads |
| **P1** | Parent / guardian | Trust + retention via `/family` | Activate after club is live |
| **P2** | College MUN / conference ops | Phase 4+ | Do not prioritize in V1 GTM |
| **P2** | Speech & Debate coaches | Far-future parallel mode | Parked |

### 3.2 Persona cards

#### Persona A — “Advisor Alex” (teacher / club advisor)

- **Context:** Runs after-school MUN; 10–40 students; limited time; already uses Google Classroom / Meet.
- **Goal:** Structured practice without buying software or fighting IT procurement.
- **Trigger:** “We need better practice before [conference name].”
- **Success:** Creates a classroom, students join with a code, one live room runs with timer + motions.
- **Fear:** Student data privacy; tool looks unfinished; another login to manage.
- **Message that works:** Free forever · Google sign-in · classroom-private · procedure tools, not another video app.
- **Ask:** “Try one 20-minute practice block this week; I’ll send the room link template.”

#### Persona B — “Chair Casey” (student chair)

- **Context:** Runs GSL / moderated caucus practice for friends or club.
- **Goal:** Look competent; keep debate moving; not juggle Meet + stopwatch + chat chaos.
- **Trigger:** “Practice tonight — who has a timer?”
- **Success:** Creates room → shares `/room/:id` → starts session → recognizes speakers → opens a motion vote.
- **Fear:** Confusing UI mid-session; sound doesn’t work; people can’t join.
- **Message that works:** Share one link · chair controls · placards + timer + motions in one place.
- **Ask:** “Host next practice on GoMUN; paste the room link in the group chat.”

#### Persona C — “Delegate Dana” (student)

- **Context:** Joins via invite or room link; cares about speaking time and clarity.
- **Goal:** Practice speaking as a country; track that they showed up (`/progress`).
- **Acquisition:** Rarely cold; arrives through classroom invite or chair’s room link.
- **Message:** Join with Google · pick country · raise placard · see your progress later.

#### Persona D — “Parent Pat”

- **Context:** Wants proof the club is practicing without reading chat logs.
- **Goal:** See activity timeline + monthly summary on `/family`.
- **Acquisition:** Club email / advisor note after the product is already in use.
- **Message:** Family code on student Profile · read-only · no room floor / chat visibility in V1.

### 3.3 Who we explicitly do **not** chase (yet)

- Large conference SaaS buyers / RFP processes
- Public “find a random committee” social networking
- Paid ads at national scale
- Speech & Debate as a primary wedge
- Schools that require lengthy vendor security reviews before a free tool trial (park and revisit with a one-pager later)

---

## 4. Jobs-to-be-done & pain map

| Job | Current workaround | Pain | GoMUN substitute |
| --- | --- | --- | --- |
| Run a practice committee | Meet + verbal queue + phone timer | Chaos; unfair speaking time; no motion trail | Live room: queue, timer, motions, votes |
| Keep the club organized | Spreadsheet + GroupMe | Invite sprawl; no shared “club home” | Classroom + invite code |
| Show parents something happened | “Trust me” / screenshots | No structured proof | Parent portal activity + summaries |
| Student self-reflection | Memory / advisor notes | No personal history | My progress (`/progress`) |
| Find real conferences | Random Google / Instagram | Fragmented | Conference directory (links only) |

**Primary JTBD (wedge):** *When my club practices, help us run procedure in one place so debate feels like real committee — for free.*

---

## 5. Positioning & messaging

### 5.1 Positioning statement

For **high school Model UN advisors and student chairs** who need **structured practice without buying software**, GoMUN Delegate Arena is a **free procedure-floor practice app** that lets clubs **run speakers, timers, motions, and votes in a shared room**. Unlike **Zoom/Meet alone or paper timers**, GoMUN is built for **MUN procedure**, stays **classroom-private**, and is **free forever for core practice**.

### 5.2 Category we own

**“MUN procedure practice floor”** — not “edtech video,” not “conference SaaS,” not “AI essay helper.”

### 5.3 Message house

| Layer | Copy |
| --- | --- |
| **Brand** | GoMUN Delegate Arena |
| **Promise** | Free forever for core practice |
| **Headline** | Practice committee the way you run it — queue, motions, timers — free |
| **Subhead** | Classroom-private Model UN practice. Share a room link. Chair the floor. Meet/Zoom optional until in-app calling. |
| **Proof** | Live at coolmd12.github.io · Google sign-in · Speakers, placards, motions, votes, chat · Parent portal + student progress |

### 5.4 Audience-specific one-liners

| Audience | Line |
| --- | --- |
| Advisor | “Free practice floor for your club — invite codes, no procurement.” |
| Chair | “One link for queue, timer, and motions — stop juggling apps mid-caucus.” |
| Delegate | “Join, pick your country, raise your placard, track your practice.” |
| Parent | “See that practice is happening — without reading the room chat.” |

### 5.5 Objection handling

| Objection | Response |
| --- | --- |
| “Isn’t this just Zoom?” | No. GoMUN is the **procedure dashboard**. Keep Meet/Zoom for voice if you want; we don’t replace video yet (Phase 6). |
| “What’s the catch / pricing?” | Core practice is **free forever**. No freemium upsell planned for the floor. |
| “Is student data public?” | Classrooms are **private** (invite codes). Rooms are **invite-by-link**, not a public lobby. Founder's Stats are founder-only. |
| “Will AI write their papers?” | No. Future AI is for **questions / resources / coaching**, not ghostwriting. |
| “Our school blocks random sites.” | It’s a normal HTTPS GitHub Pages site + Google sign-in. If blocked, advisor IT whitelist is the path — we don’t fight MDM in V1. |
| “Looks early.” | True that we’re building in public. Offer a **guided 20-minute practice** and ask for friction notes — early clubs shape the product. |

### 5.6 Words to use / avoid

| Use | Avoid |
| --- | --- |
| Practice floor, procedure, committee room | “The Zoom for MUN” (sets wrong expectation) |
| Free forever (core) | “Freemium,” “pro plan,” “limited free tier” |
| Classroom-private, invite link | “Social network,” “match with strangers” |
| Prep help / RoP / formatting (later) | “AI writes your speech / position paper” |

---

## 6. Competitive landscape

GoMUN rarely loses to a single branded competitor; it loses to **inertia** (Meet + stopwatch).

| Alternative | Why clubs use it | GoMUN advantage | GoMUN gap |
| --- | --- | --- | --- |
| Google Meet / Zoom alone | Already installed | Procedure tools (queue, motions, votes) | No in-app A/V yet |
| Phone timer + verbal queue | Zero setup | Shared live state for everyone | Requires signup |
| Spreadsheets for speakers | Familiar | Real-time room UX | Less customizable than a sheet |
| Conference platforms (paid) | Registration, awards, ops | Free practice focus; no procurement | Not full conference ops (Phase 4) |
| Generic edtech | District deals | MUN-specific language & flows | Less “official” institutional cover |

**Positioning vs inertia:** Don’t say “switch platforms.” Say “keep Meet if you want — add the floor beside it.”

---

## 7. Funnel & conversion paths

### 7.1 North-star funnel

```text
Aware → Visit landing → Sign up (Google) → Finish profile
      → Activate (create/join classroom OR create/join room)
      → Engage (start session; placard/timer/motion/vote/chat)
      → Retain (return ≤7 days; parent link optional)
      → Refer (share room link / classroom invite / tell another club)
```

### 7.2 Path A — Advisor-led (highest trust)

1. Advisor hears about GoMUN (DM, flyer, friend).
2. Signs in with Google → teacher capability → creates **classroom** → shares invite code.
3. Students join classroom → advisor or chair creates **room** (optional Meet link).
4. Practice runs → parents optionally link via family code.

**Success metric:** Classroom with ≥1 member + ≥1 room session started.

### 7.3 Path B — Chair-led (fastest viral)

1. Student chair creates room → pastes link in Discord/GroupMe.
2. Friends join as delegates (country names).
3. Chair starts session → recognizes speakers → motions.

**Success metric:** Room with ≥2 participants + session started.

### 7.4 Path C — Parent (retention, not top-of-funnel)

Only pitch after Path A/B works. Parent signup without student activity creates empty-portal disappointment.

### 7.5 Drop-off points to watch (quality)

| Step | Failure mode | Product / GTM fix |
| --- | --- | --- |
| Landing → signup | Unclear value / “is it real?” | Stronger hero clarity; demo GIF |
| Signup → profile done | Friction in username/roles | Keep Google-only; short copy |
| Profile → first room | Don’t know what to click | Dashboard CTA; “Create room” prominence |
| Join gate | Confused chair vs delegate | Clear join copy; maybe short tooltip |
| In-room silence | No sound / empty queue | Enable sound prompt; chair checklist |
| Return | One-off novelty | Classroom home + progress + parent loop |

---

## 8. Channel strategy

### 8.1 Principles

1. **Zero budget first** — time is the scarce resource, not ad spend.
2. **One primary channel per month** — measure, then double down or kill.
3. **Product-led loop** — room links and classroom invites are the best “ads.”
4. **Advisor trust > vanity reach** — 3 sticky clubs beat 300 idle signups.

### 8.2 Channel portfolio

| Channel | Cost | Fit | When |
| --- | --- | --- | --- |
| **Direct personal outreach** | Time | Highest conversion | Always (primary Month 1–2) |
| **Club / school flyers + QR** | Print / PDF | Local density | After messaging is solid |
| **MUN Facebook groups / Discords** | Time | Broad HS MUN | Month 2+ with demo asset |
| **Reddit (e.g. r/MUN)** | Time | Mixed; easy to look spammy | Soft, value-first posts only |
| **Instagram / TikTok demos** | Time | Student chairs | When you have a 15–30s screen recording |
| **Conference hallway / booth** | Travel | High intent | Later / if already attending |
| **Paid ads** | Money | Premature | Parked until activation is proven |
| **School district RFPs** | Heavy | Wrong stage | Avoid |

### 8.3 Channel priority (V1)

1. **Warm outreach** to advisors/chairs you know (or 1-hop introductions).
2. **Room-link virality** inside clubs already practicing.
3. **One public community post per week** once you have a demo GIF + clear CTA.
4. **Parent portal** as a stickiness add-on, not a growth engine.

---

## 9. Outreach playbooks

### 9.1 Warm advisor DM / email (template)

**Subject:** Free MUN practice floor for [Club name]?

Hi [Name] — I built **GoMUN Delegate Arena**, a free tool for club practice: speaker queue, timers, motions, and voting in one shared room (Meet/Zoom still optional for voice).

Would you be open to a **20-minute practice trial** with a few students? I can set up the room link and sit in as backup chair if useful.

Live site: https://coolmd12.github.io  
No paid plan for core practice.

Thanks,  
Dhyanvi

### 9.2 Student chair GroupMe / Discord blurb

Practice tonight on GoMUN (free):  
1) Open https://coolmd12.github.io → Continue with Google  
2) Join this room: [paste `/room/...` link]  
3) Pick **Delegate** + your country  
Chair will run timer + motions. Enable sound in-room if you want the gavel.

### 9.3 Advisor classroom rollout checklist

- [ ] Advisor creates classroom → copies invite code  
- [ ] Posts code in Google Classroom / email  
- [ ] Creates first room with optional Meet link  
- [ ] Runs one moderated caucus practice (15–25 min)  
- [ ] Asks 2 students: “What confused you?”  
- [ ] Optional: share family-code instructions with parents  

### 9.4 Public community post (non-spammy)

Lead with **help**, not launch hype:

> Built a free procedure floor for HS MUN practice (queue / motions / timer). Looking for 1–2 clubs willing to try a practice session and tell me what breaks. Link: …

Avoid daily cross-posts; engage in comments on other threads first when possible.

### 9.5 Follow-up sequence (if no reply)

| Day | Action |
| --- | --- |
| 0 | Initial ask |
| 5–7 | Soft bump + offer specific time window |
| 14 | Final bump with “happy to share a 30s demo instead” |
| — | Stop; don’t burn the relationship |

---

## 10. Content & assets

Minimum asset kit before broader posting:

| Asset | Purpose | Format |
| --- | --- | --- |
| **15–30s demo** | Show create room → join → timer → motion | Screen recording GIF/MP4 |
| **One-pager PDF** | Advisor forward to co-advisor / admin | 1 page: what / not / privacy / link |
| **Flyer + QR** | Club fair / classroom door | Points to live site |
| **Join instructions card** | Paste into Discord | 4-step text (see §9.2) |
| **Parent blurb** | Club newsletter | Family code + `/family` explanation |
| **Founder's Stats weekly note** | Your private ops log | What grew / what stalled |

**Do not wait** for a perfect brand film. A raw Loom of a real practice is enough for V1.

---

## 11. 90-day plan (30 / 60 / 90)

> Dates are relative to “GTM start” (when Phase 2.7 metrics begin collecting). Adjust to your school calendar.

### Days 0–30 — Instrument + first clubs

**Product**

- [x] Ship Founder's Stats V1 expansion (counters + `/admin` panels) — see Phase 2.7
- [ ] Publish `firestore.rules` + run founder backfill once
- [ ] Optional: add free web analytics (landing → signup) if decided
- [ ] Fix any join/create friction found in first trials

**GTM**

- [ ] List 10 warm advisor/chair contacts
- [ ] Send 5 personalized outreach messages
- [ ] Run **2 live practice sessions** (even small)
- [ ] Capture 1 demo GIF from a real session
- [ ] Baseline all KPIs (no aggressive targets yet)

**Exit criteria:** ≥1 external club or friend-group has completed a real session; stats counters are trustworthy going forward.

### Days 31–60 — Repeatable loop

**Product**

- [ ] Polish top drop-off from stats / feedback
- [ ] Ensure classroom + room CTAs are obvious on dashboard

**GTM**

- [ ] Convert outreach into a weekly habit (e.g. 3 messages/week)
- [ ] Post **1** community update with demo
- [ ] Try flyer/QR with one local club if possible
- [ ] Activate parent portal only for clubs already practicing
- [ ] Set first numeric targets from baselines

**Exit criteria:** Activation rate known; at least one channel shows repeatable signups → rooms.

### Days 61–90 — Double down or cut

**Product**

- [ ] Decide next product bet using stats (room UX vs Phase 4/5), not vibes alone

**GTM**

- [ ] Kill channels with awareness but no activation
- [ ] Double down on the winning path (advisor-led vs chair-led)
- [ ] Draft a short “club success story” (even informal quote)
- [ ] Revisit messaging house with real objections heard

**Exit criteria:** Clear primary acquisition motion + documented quality issues backlog ranked by impact.

---

## 12. Goals, KPIs & Founder's Stats

### 12.1 How we define “quality” and “enough reach”

| Question | Bad proxy | Good signal |
| --- | --- | --- |
| Reaching enough people? | Raw pageviews only | Registered users **and** weekly growth; landing → signup rate |
| Website / product quality good? | Opinions only | Activation %, session-start rate, return ≤7d, fewer join errors, club feedback |
| Features used? | “People seem to like it” | Motions, votes, chat, classrooms, parent links, progress views |

### 12.2 KPI definitions

| KPI | Definition | Source |
| --- | --- | --- |
| **Registered users** | Profiles finished (username setup complete) | `stats/app` (exists) |
| **Role mix** | Counts by student / teacher / parent / multi | Founder's Stats (Phase 2.7) |
| **Activation (7d)** | % of new users who create or join a room within 7 days | Counters + optional cohort later |
| **Session rate** | Rooms with chair **Start session** / rooms created | Founder's Stats |
| **Procedure depth** | Motions proposed, votes cast, chat messages | Founder's Stats |
| **Classroom adoption** | Classrooms created; with ≥1 member | Founder's Stats |
| **Family adoption** | Parent links created | Founder's Stats |
| **Retention (7d)** | Users who return within 7 days of signup | Analytics or activity-based later |
| **Landing conversion** | Landing visitors → signup start / complete | Optional GA4 |

### 12.3 Draft 90-day targets (set numbers after baseline week)

Until baselines exist, use directional goals:

| Goal | Directional target |
| --- | --- |
| Reach | Steady **week-over-week** registered-user growth |
| Activation | **≥40%** of new signups create/join a room within 7 days |
| Engagement | Rising % of rooms that **start a session** |
| Depth | Active rooms show **non-zero** motions and/or chat |
| Retention | Establish baseline, then improve month 2→3 |
| Outreach | **≥5** personalized asks / month; **≥2** completed external practices / month |

### 12.4 Founder's Stats instrumentation plan

`/admin` now shows **Reach · Activation · Feature usage** from `stats/app` + `stats/product` (Phase 2.7 shipped). Founder must publish Firestore rules and run **Backfill from existing data** once. Optional later:

**A. Firestore aggregate counters** (Spark-friendly, founder-read)

Increment on successful actions — do **not** scan all collections on every admin load:

- Users by role  
- Classrooms created (optional: with ≥1 member)  
- Rooms created / joined / closed  
- Sessions started  
- Motions proposed / votes cast  
- Chat messages sent  
- Parent links created  

**B. Optional web analytics** (free)

- Landing → auth conversion  
- Top pages / exit pages  
- Device mix (mobile vs desktop for club use)  

**C. Qualitative log**

After each trial practice: 3 bullets — what broke, what delighted, what to build next.

Historical totals: run the founder **Backfill from existing data** button once after publishing rules, then live increments onward.

---

## 13. Website quality checklist

Use this when interpreting Founder's Stats and deciding polish vs growth.

### 13.1 First-run quality

- [ ] Landing explains procedure floor in one screen (not “another dashboard”)
- [ ] Google signup works on school Chromebooks / common browsers
- [ ] Username + roles onboarding is understandable
- [ ] Dashboard makes **Create room** / **Join classroom** obvious
- [ ] Room join gate (chair vs delegate) is hard to mess up
- [ ] Enable sound is discoverable before first gavel

### 13.2 Live-session quality

- [ ] Timer visible to everyone; chair controls clear  
- [ ] Placard → recognize → queue feels fast  
- [ ] Motions + voting understandable mid-debate  
- [ ] Chat usable without stealing focus from the floor  
- [ ] Recess vs Close room distinction doesn’t strand users  

### 13.3 Trust quality

- [ ] Privacy story matches product (private classrooms; no public lobby)  
- [ ] Parent portal doesn’t over-promise (no chat/floor in V1)  
- [ ] No marketing claims that AI will write student work  
- [x] Header stays one row on desktop; hamburger under ~1024px (do **not** darken hero/auth photos)  
- [x] Terms and Conditions + Procedure integrity copy are public and cross-linked  

---

## 14. Risks, constraints & anti-goals

### Risks

| Risk | Mitigation |
| --- | --- |
| Signups without activation | Optimize dashboard CTAs; measure activation hard |
| Advisor privacy concerns | Lead with classroom-private + Google; no public social graph |
| Spark read limits from bad admin queries | Aggregate counters only |
| Spammy community reputation | Low-frequency, help-first posts |
| Building Phase 4/5 before proving the floor loop | Let stats decide; GTM focuses on room activation first |
| Single-founder burnout | Cap outreach volume; one channel focus |

### Anti-goals (GTM)

- Do not run paid acquisition before activation is healthy  
- Do not promise in-app calling or AI writing to close a club  
- Do not scrape / publish student or school lists for marketing  
- Do not expand to Speech & Debate GTM until MUN loop is proven  

---

## 15. Founder operating cadence

| Cadence | Ritual |
| --- | --- |
| **Daily (light)** | If practicing outreach day: send 1–3 messages max |
| **Weekly** | Open Founder's Stats; write 5 lines: reach / activation / depth / one bug / one win |
| **Biweekly** | One new club ask **or** one public post (not both if time-poor) |
| **Monthly** | Re-read this GTM; update targets; kill one ineffective tactic; update Decision log |

**Weekly stats note template:**

```text
Week of:
Registered users:
New rooms / sessions started:
Top feature movement:
Biggest drop-off / complaint:
Outreach sent / replies / practices run:
Next week one focus:
```

---

## 16. Decision log

Record GTM choices here so the plan stays honest.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-06 | Create standalone detailed GTM.md; expand Founder's Stats as Phase 2.7 | Need data for reach, quality, feature usage before Phase 4/5 |
| | Primary wedge = HS club procedure practice (advisor + chair) | Highest urgency + matches shipped product |
| | Zero-budget channels first; paid ads parked | Budget $0; activation unproven |
| 2026-09-06 | **Counters first; GA4 later** | Product usage unblocks GTM weekly ritual; traffic analytics follow |
| | **One-time founder backfill**, then live increments | Seed historical totals without scanning on every `/admin` load |
| | Sessions started = create + resume-after-recess; backfill ≈ rooms created | Rooms are born `open`; no durable session history |
| | Phase 2.7 shipped (`stats/product` + `/admin` panels) | Founder must publish rules + run backfill once |
| 2026-09-06 | **Next build = Phase 5.1** Scripts of Motions / RoP cheat sheets (before Phase 4) | Strengthens procedure floor; education-first; Spark-friendly; helps GTM activation |
| | Ship **Terms and Conditions** with 5.1 (academic honesty · conference AI policies · practice vs events) | Reduce accountability risk; many conferences ban generative AI in committee / for papers |
| | Phase 5.1 + Terms and Conditions shipped (`/motions`, `/terms`, TERMS.md) | Practice script only; strong disclaimers; counsel review still recommended |
| 2026-09-07 | Header/nav chrome: single-row desktop + hamburger; keep navy/gold; **do not** darken photos | Founder Stats + Procedure links overflowed the bar; image overlays stay as-designed |

---

## 17. Doc map

| File | Purpose |
| --- | --- |
| **[GTM.md](./GTM.md)** | This go-to-market plan (detailed) |
| [OUTLINE.md](./OUTLINE.md) | Product overview |
| [ROADMAP.md](./ROADMAP.md) | Build phases — 5.1 + Terms and Conditions shipped; rest of Phase 5 or Phase 4 next |
| [README.md](./README.md) | Setup and current app flow |
| [TERMS.md](./TERMS.md) | Product Terms and Conditions draft |

**Related build:** Phase 2.7 product counters and Phase 5.1 Procedure + Terms and Conditions are shipped. Publish Firestore rules, run `/admin` backfill once. Next product work: rest of Phase 5 or Phase 4.
