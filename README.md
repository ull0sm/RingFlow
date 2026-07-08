# RingFlow

**Real-Time Tournament Floor Management Platform**

RingFlow is a real-time event floor operations platform designed specifically for multi-ring martial arts competitions (Karate, Taekwondo, etc.). It acts as the command center for tournament directors, provides a zero-training mobile interface for ring operators, and offers live status updates to athletes and spectators via shareable links.

---

## The Problem

Traditional tournament software manages registrations, brackets, and static schedules. However, during large events, organizers struggle to:
1. **Balance Workloads**: Distribute categories evenly across rings to avoid bottlenecks.
2. **Monitor Progress**: Keep track of which rings are running, paused, or finished.
3. **Coordinate Officials**: Keep track of volunteer staff without requiring complex training or accounts.
4. **Communicate Live**: Inform athletes and parents when their division will start, preventing ring crowding and missed slots.

RingFlow solves these challenges by centralizing live mat operations on a single unified platform.

---

## Core Principles

* **Coarse Progress Tracking**: We track completed-match counts per division, not individual match scores, points, or winners.
* **Zero Training for Ring Staff**: The operator's layout is mobile-first and optimized for high-stress environments.
* **No Apps/Logins for the Public**: Spectators can view live status and search for athletes simply by scanning a QR code.
* **Event-Sourced Architecture**: Every state change (start, increment progress, pause, resume, complete) is recorded as an immutable event. Dashboards compile these events dynamically so data never drifts.

---

## User Roles & Access

| Role | Access Model | Primary Capabilities |
| :--- | :--- | :--- |
| **Admin** | Google OAuth + Email Allow-List | Create/manage tournaments, assign categories to rings, live-monitor all mats, approve moderator access requests. |
| **Moderator** | EPHEMERAL Session (Code-based) | Enter ring-side access code, request admin approval, track match progress (`+1`/`-1`/`+5`), pause/resume ring. |
| **Public** | Public Read-Only URL / QR Code | Scan to view live mat updates, check estimated category start times, search athletes by name or chest number. |

---

## Tech Stack

* **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
* **Backend**: Supabase (PostgreSQL database, authentication, and Realtime replication)
* **Security**: Cloudflare Turnstile (spam/bot protection for login flows)

---

## Quick Navigation

* **Local Installation & Setup**: Follow the [QUICKSTART.md](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/QUICKSTART.md) guide to configure environment variables, databases, and OAuth.
* **Contribution & Coding Guidelines**: Review [CONTRIBUTING.md](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/CONTRIBUTING.md) to understand project conventions, branching strategies, and architecture guidelines.
