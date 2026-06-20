# Ring Flow – Product Definition & Requirements

## Product Vision

Ring Flow is a real-time tournament floor management platform designed specifically for martial arts competitions. Its purpose is to solve one of the biggest operational challenges faced by tournament organizers: efficiently distributing competitors across multiple rings while maintaining visibility into event progress throughout the day.

Traditional tournament management systems focus on registrations, brackets, and results. However, during large events with hundreds or thousands of competitors, organizers often struggle with ring balancing, category allocation, progress tracking, and communication between officials, athletes, and spectators.

Ring Flow addresses this problem by becoming the operational control center of the tournament floor.

The platform allows organizers to distribute categories across rings, monitor progress in real time, coordinate ring operators, and provide live visibility to athletes and spectators regarding what is currently running and what will happen next.

The system is intentionally designed to remain lightweight and operationally focused rather than becoming a complete tournament scoring system.

---

# Core Problem

Large martial arts tournaments frequently face the following issues:

* Uneven distribution of competitors across rings.
* Rings finishing too early while others remain overloaded.
* Organizers lacking visibility into ring progress.
* Athletes unsure where or when their category will run.
* Spectators constantly asking officials for updates.
* No historical data to estimate event duration accurately.

These challenges create delays, confusion, and inefficient use of resources.

Ring Flow centralizes tournament floor operations and provides real-time visibility to everyone involved.

---

# Product Objectives

The primary objectives of Ring Flow are:

1. Balance competitor workload across available rings.
2. Monitor ring progress in real time.
3. Improve communication between organizers and ring operators.
4. Provide public visibility into current and upcoming categories.
5. Collect operational data for future predictive scheduling.
6. Reduce tournament delays and uncertainty.

---

# User Roles

The system contains three primary user roles.

## 1. Admin (Tournament Organizer)

The Admin controls the entire event.

Responsibilities include:

* Creating tournaments.
* Importing categories.
* Managing rings.
* Assigning categories to rings.
* Monitoring progress.
* Approving moderator access requests.
* Managing event flow.
* Viewing operational analytics.

The Admin acts as the command center for the tournament.

---

## 2. Moderator (Ring Operator)

Moderators are stationed at individual rings.

Responsibilities include:

* Managing progress for assigned categories.
* Starting categories.
* Recording match completion progress.
* Pausing ring activity when required.
* Reporting real-time status updates.

Moderators only have access to their assigned ring.

---

## 3. Public Users

Public users include:

* Athletes
* Coaches
* Spectators
* Parents

Public users have read-only access.

They can view:

* Current categories running.
* Upcoming categories.
* Ring status.
* Event progress.

No login is required.

---

# Tournament Setup Workflow

## Step 1 – Create Tournament

The Admin creates a new tournament.

Examples:

* ABC Open Championship
* National Karate Championship
* State Kumite League

The event becomes the primary container for all tournament operations.

---

## Step 2 – Configure Rings

The Admin defines available rings.

Example:

* Ring 1
* Ring 2
* Ring 3
* Ring 4
* Ring 5

Each ring functions as an independent operational unit.

---

## Step 3 – Import Categories

Categories may be imported using:

* Excel files
* CSV files
* Manual entry

Example:

Senior Male Kumite – 28 Athletes

Senior Female Kumite – 16 Athletes

Cadet Kata – 22 Athletes

Junior Kata – 18 Athletes

---

## Step 4 – Match Calculation

The system automatically calculates expected match counts.

### Kata

Each athlete represents a progression unit.

Example:

20 Athletes

20 Progress Units

### Kumite

Bracket calculations are generated automatically.

Example:

20 Athletes

Round 1 → 10 Matches

Round 2 → 5 Matches

Round 3 → 2 Matches

Final → 1 Match

Total calculated workload becomes the category's operational weight.

---

although kata kumite wont be seprated , just an overall match count for that ring that will be the formula 2n-1 , here n is the total no.of athletes

# Ring Balancing

Ring balancing is the core feature of Ring Flow.

The Admin is presented with all available categories and all available rings.

Using a drag-and-drop interface, categories can be assigned to rings.

The system displays:

* Athlete count
* Estimated workload
* Match count
* Total ring load

This allows organizers to distribute work evenly.

Example:

Ring 1 → 120 athletes

Ring 2 → 118 athletes

Ring 3 → 124 athletes

Ring 4 → 115 athletes

Ring 5 → 122 athletes

The goal is operational balance.

---

# Moderator Access System

Ring Flow uses temporary event-based access.

Moderators do not require permanent accounts.

Each ring receives a unique access code.

Example:

Ring 1 → 847261

Ring 2 → 492183

Ring 3 → 731645

When a moderator enters the code:

1. A login request is created.
2. The Admin receives a real-time notification.
3. The Admin may approve or reject the request.
4. Approved users receive a temporary session.
5. Rejected users are denied access.
6. Requests expire automatically after a timeout period.

This ensures security while remaining practical for tournament volunteers.

---

# Ring Operation Workflow

Once approved, moderators access their assigned ring dashboard.

---

## Start Category

When a category begins:

Moderator selects:

START CATEGORY

The system records:

* Category start time
* Ring
* Moderator
* Timestamp

---

## Match Progress Tracking

Moderators track progress using simple controls.

Example:

Total Matches: 19

Completed: 8

Remaining: 11

Controls:

+1 Match

-1 Match

+5 Matches

This allows quick correction of mistakes.

The system continuously updates:

* Remaining matches
* Completion percentage
* Estimated completion time

---

## Pause Functionality

A ring may be paused due to:

* Injury
* Technical issues
* Administrative delays
* Equipment problems

Moderator selects:

PAUSE RING

The ring immediately appears as paused across:

* Admin dashboard
* Public dashboard

When resumed, the pause duration is recorded automatically.

---

## Category Completion

When all matches are completed:

The category is marked complete.

The moderator may then begin the next assigned category.

The next category automatically moves into active status.

---

# Admin Command Center

The Admin dashboard serves as the operational control center.

The Admin can view:

* Every ring simultaneously.
* Current category.
* Progress percentage.
* Remaining workload.
* Ring status.
* Active pauses.
* Estimated completion times.

The Admin always maintains a live overview of the entire tournament floor.

---

# Public Live View

The public interface provides real-time tournament visibility.

Users can view:

Current Ring Status

Ring 1
Senior Male Kumite

8 / 19 Matches

Running

Next:
Senior Female Kumite

Ring 2
Cadet Kata

15 / 20 Progress Units

Running

This eliminates confusion and reduces inquiries directed at officials.

The public view must be mobile-first and easily accessible through a simple URL or QR code.

---

# Real-Time Synchronization

All updates occur instantly.

When moderators:

* Start categories
* Complete matches
* Pause rings
* Resume rings
* Finish categories

Changes appear immediately on:

* Admin Dashboard
* Public Dashboard

No page refresh is required.

---

# Operational Analytics

Ring Flow continuously collects event data.

The system records:

* Category assignments.
* Category start times.
* Match completion timestamps.
* Pause durations.
* Category completion times.
* Ring utilization metrics.

This data forms the foundation for future intelligence and optimization.

---

# Estimation Engine (Version 1)

The initial estimation system is rule-based.

Calculations include:

Average Match Duration × Remaining Matches

This produces:

* Estimated category finish time.
* Estimated ring completion time.
* Estimated queue completion time.

These estimates improve continuously as more tournament data is collected.

---

# Future Intelligence Layer

Future versions of Ring Flow will introduce predictive analytics.

Using historical tournament data, the system will learn:

* Average duration by category type.
* Average duration by athlete count.
* Typical delay patterns.
* Ring utilization trends.

This enables:

* More accurate finish-time predictions.
* Smarter category distribution.
* Improved tournament planning.

The long-term vision is for Ring Flow to become an intelligent tournament operations platform capable of predicting and optimizing tournament flow in real time.

---

# MVP Scope

Version 1 includes:

* Tournament creation.
* Ring setup.
* Category import.
* Match workload calculation.
* Drag-and-drop ring balancing.
* Moderator access approval.
* Ring progress tracking.
* Pause management.
* Public live view.
* Real-time synchronization.
* Event timestamp collection.
* Basic ETA calculations.

Version 1 intentionally excludes:

* Registration management.
* Athlete profiles.
* Scoring systems.
* Referee judging.
* Bracket editing.
* Medal management.
* Result publishing.

Ring Flow's initial focus is tournament floor operations, visibility, and workload management.


Ring Flow is a high-performance, real-time tournament management platform designed specifically for martial arts competitions. It bridges the gap between chaotic arena floors and organized, data-driven event execution.

Product Overview
Ring Flow is a dual-sided ecosystem built to handle the high-pressure environment of combat sports tournaments. It focuses on visibility, safety, and throughput, ensuring that organizers can manage multiple "rings" (mats) simultaneously while keeping the public informed.

Core Workflows
1. The Admin Command Center (Tournament Director)
The director starts by selecting an active event or launching the Setup Wizard to define categories (divisions) and assign mats.

Active Floor Management: From the Command Center, the admin monitors every mat's status (Running, Paused, Overloaded).
Intelligent Ring Balancing: A specialized workspace for scaling up to 10+ rings, where admins drag-and-drop categories to mats based on real-time workload estimates to prevent bottlenecks.
2. The Moderator Portal (Ring Officials)
Moderators on the floor use a mobile-first, "one-thumb" interface designed for high-stress environments.

Secure Access: Officials enter an 8-character code and wait for admin approval to gain control of a mat.
Operational Control: Once inside, they can pause the ring for injuries, advance to the "Next Match," or trigger a high-visibility Emergency Alert that instantly notifies medical and security teams.
3. The Public Experience (Spectators & Athletes)
The public enters through a Premium Event Home, which uses high-impact "Arena" photography to set the tone.

Live Kiosk Status: Once an event is selected, spectators see a streamlined "Kiosk View" showing current and upcoming categories for every ring, allowing them to track progress without the clutter of individual brackets.
App Description for Generation
If you ever need to describe this app to another system or person, here is a concise prompt:

"A real-time martial arts tournament management system called 'Ring Flow.' The UI is utility-first, professional, and high-contrast (Slate & Blue). It includes a Desktop Admin Command Center for monitoring 10+ rings with drag-and-drop workload balancing, a Mobile Moderator interface for high-stakes ring control with emergency reporting, and a Public Kiosk display showing live category progress across the arena floor."


# RingFlow
### Real-Time Tournament Floor Management Platform
**Product Requirements Document** — Version 1.0 — June 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Roles & Access Model](#2-roles--access-model)
3. [Features by Role](#3-features-by-role)
4. [Edge Cases & Failure Behavior](#4-edge-cases--failure-behavior)
5. [Technology Stack](#5-technology-stack)
6. [Success Criteria](#6-success-criteria)

---

## 1. Product Overview

### 1.1 What is RingFlow

RingFlow is a real-time tournament floor management platform built for multi-ring martial arts competitions (karate, taekwondo, and similar formats). On a typical tournament day, a single venue runs several rings in parallel, each working through a queue of categories (e.g. "Men's Kumite Under 18, -68kg"). Today this is coordinated with paper, walkie-talkies, and guesswork. RingFlow replaces that with a live, structured system: organizers plan the day digitally, ring-side staff report progress with a few taps, and athletes/spectators see exactly what's happening on any ring from their phone — without needing an account or app install.

### 1.2 Core Problem

- Tournament organizers don't know, in real time, how far along each ring is — so rings drift out of sync and athletes miss their categories or wait around for hours.
- Ring-side volunteers (moderators) are not technical staff and are often swapped mid-event — any tool for them must require zero training and zero persistent login.
- Athletes and parents have no way to know when their category will actually start, so they either crowd the rings all day or miss their slot.

### 1.3 Product Principles

- **Zero training for ring-side staff** — if a moderator needs more than 30 seconds to understand the controls, the design has failed.
- **Public visibility requires no login, no app** — a browser and a link (or QR code) is the entire barrier to entry.
- **Progress tracking is coarse, not granular** — we track completed-match counts per ring, not live scoring, brackets, or individual match outcomes. That belongs to a different category of product.
- **Every state change is an event, not an edit** — the system is built around an append-only log of what happened, and all displayed numbers (completed count, ETA, status) are derived from that log rather than being separately stored and mutated.
- **V1 scope is deliberately narrow** — resist adding scoring, bracket management, or athlete registration. Those are explicitly out of scope (see §1.5).

### 1.4 Who This Document Is For

This PRD is the single source of truth for what RingFlow's first version must do. It does not include database schema or implementation-level technical design — those are separate engineering artifacts that should be derived from this document, not the other way around.

### 1.5 Out of Scope for V1

These are intentionally excluded. If a feature request resembles any of these, it belongs in a future version, not V1:

- Athlete registration or check-in
- Bracket generation, seeding, or bracket editing
- Live scoring of individual matches (points, penalties, winners)
- Payments or ticketing
- Native mobile apps (V1 is a responsive web app only)
- Multi-tournament / multi-day historical analytics dashboards (basic CSV export of the event log is in scope; dashboards are not)
- Machine-learning-based ETA prediction (V1 ETA is a simple average-pace calculation)

---

## 2. Roles & Access Model

RingFlow has three roles. Each has a distinct access model — this distinction is central to the product and should not be collapsed for convenience during implementation.

### 2.1 Admin

**Who:** Tournament organizers. A small, known set of individuals (e.g. federation/club organizers running the event).

**Access:** Persistent account via Google OAuth sign-in. Being able to sign in with Google is not sufficient — the signed-in user must also be explicitly designated as an admin by an existing admin/owner. Unauthorized Google accounts must be rejected and signed out, not shown a degraded view.

**Login surface:** The admin login page is intentionally unlinked from any public navigation. It is not discoverable through normal browsing — admins are given the URL directly.

**Can do:** Create and configure tournaments; manage rings; upload/manage categories and athlete rosters; balance categories across rings; approve or reject moderator access requests; monitor all rings live; export event data.

**Cannot do:** Score individual matches or manage brackets (out of scope, see §1.5).

### 2.2 Moderator

**Who:** Ring-side volunteers, assigned per ring, often for a single day and frequently swapped between shifts.

**Access:** Deliberately not a persistent account. A moderator requests access to a specific ring using a short access code; an admin approves or rejects the request in real time; on approval, the moderator's browser receives a temporary, ring-scoped session that expires automatically. There is no password to remember and nothing to sign up for.

**Can do:** View their assigned ring's current category and queue; start a category; report match progress (increment/decrement completed-match count); pause and resume the ring (e.g. for a break, an injury, or a delay); see their position in the day's queue.

**Cannot do:** See or affect any ring other than the one they were approved for; edit categories, rosters, or ring assignments; access anything once their session expires or is revoked.

### 2.3 Public

**Who:** Athletes, coaches, and family/spectators.

**Access:** No login, no account, no app install. A shared tournament link or scanned QR code is the entire access path.

**Can do:** View live status of every ring (current category, queue position, estimated time to a given category); search for a specific athlete by name or chest number and see which ring/category they're assigned to and whether that ring has reached them yet.

**Cannot do:** See raw event-level data (timestamps of every single match), see other tournaments, or take any write action.

### 2.4 Role Comparison

| Capability | Admin | Moderator | Public |
|---|---|---|---|
| Account type | Persistent (Google OAuth + allow-list) | Temporary, ring-scoped, code-approved | None |
| Create/edit tournament | Yes | No | No |
| Manage rings & categories | Yes | No | No |
| Report match progress | View only | Yes (own ring only) | No |
| Pause/resume a ring | Yes (any ring) | Yes (own ring only) | No |
| View all rings live | Yes | No (own ring only) | Yes (read-only) |
| Search athlete by name/chest no. | Yes | No | Yes |

---

## 3. Features by Role

### 3.1 Admin Features

#### 3.1.1 Tournament Setup

- Create a new tournament (name, date, venue, status: draft/active/completed).
- View a list of all tournaments the admin has created, with status at a glance.
- A guided creation wizard for first-time setup (matches the existing Figma flow).

#### 3.1.2 Ring Management

- Create, rename, and remove rings within a tournament.
- Each ring operates independently and has its own queue, status, and moderator access code.

#### 3.1.3 Category & Roster Upload

Admins populate categories via spreadsheet upload. Two upload modes are supported, and the admin chooses which one fits their data for that tournament:

- **Mode A — Category summary only:** A single spreadsheet listing each category name and its total athlete count. No individual athlete names are captured. This is the fastest path and is sufficient to run the ring-balancing and progress-tracking features, but athlete-level public search will not be available for these categories (there's nothing to search against).
- **Mode B — Full roster per category:** One spreadsheet per category (e.g. "category1.xlsx"), containing each athlete's name, chest number, and other roster data. This enables the public athlete search feature (§3.3.2) for that category.

These two modes can coexist within the same tournament — an admin may upload full rosters for some categories and summary-only for others. The system should treat "has full roster" as a per-category property, not a tournament-wide setting.

**Edge case:** If a category is uploaded as summary-only, public athlete search simply will not find anyone in that category. This should be treated as expected behavior, not an error state.

#### 3.1.4 Match Count Calculation

RingFlow does not distinguish between match formats (no kata/kumite split, no separate calculation paths). Every category uses a single, uniform formula based on athlete count:

> **Total Matches = n + (n − 1) = 2n − 1**

where n is the number of athletes in the category. This figure is calculated automatically the moment a category is created or its athlete count changes.

**Editable override:** The calculated value is a starting estimate, not a locked figure. Admins can manually override the total-matches number for any category to reflect their own estimate (e.g. accounting for byes, walkovers, or a non-standard format for that specific category). Once manually overridden, the system should not silently recalculate and overwrite the admin's value if the athlete count changes later — surface that the count changed and let the admin decide whether to update the total.

#### 3.1.5 Ring Balancing

- Visual, drag-and-drop assignment of categories to rings.
- Categories can be reordered within a ring's queue and moved between rings.
- The balancing view should make total estimated workload per ring visible, so an admin can visually spot an overloaded ring before the day starts.

#### 3.1.6 Moderator Access Approval

- Each ring has its own access code that the admin can view/regenerate.
- Incoming moderator access requests appear to the admin in real time, with an approve/reject action.
- Admin can revoke an already-approved moderator's session at any time (e.g. shift change, wrong person).

#### 3.1.7 Live Monitoring Dashboard

- At-a-glance view of every ring's current category, progress (completed/total matches), and status (running/paused/idle/finished).
- Drill into any single ring for more detail.

#### 3.1.8 Settings & Data Export

- Tournament-level settings (name, status, etc.).
- Export the underlying event log as CSV for post-event analysis — this is a raw data dump, not a built analytics dashboard (see §1.5).

### 3.2 Moderator Features

#### 3.2.1 Access Flow

1. Moderator opens a join page and enters the ring access code given to them by the admin/organizer on-site.
2. A pending request is created and shown to the admin in real time.
3. Admin approves or rejects. On approval, the moderator's device receives a temporary session scoped to that one ring.
4. If not acted on within a short window, the request expires automatically and the moderator must re-request.

#### 3.2.2 Waiting Room

- While a request is pending, the moderator sees a simple waiting state — no controls are accessible yet.

#### 3.2.3 Ring Controls

- View the current category, its progress, and the next category in the queue.
- Start the current category.
- Report progress with simple increment controls (e.g. +1 / −1 / +5 completed matches) rather than logging individual match results.
- Pause and resume the ring (e.g. break, delay, dispute) — paused time should be tracked separately from active time so ETA calculations stay meaningful.
- When a category's completed count reaches its total, the system marks it finished and automatically advances to the next category in that ring's queue.

#### 3.2.4 Queue View

- Moderator can see the full upcoming queue for their ring, not just the current category, so they can anticipate what's next.

### 3.3 Public Features

#### 3.3.1 Live Event View

- A public hero/landing page introduces the tournament; a per-tournament event view shows live status for every ring.
- Each ring shows its current category, progress, and an estimated time until a selected category will begin.
- Read-only and auto-updating — no manual refresh required.

#### 3.3.2 Athlete Search

Available only for categories uploaded with a full roster (Mode B, §3.1.3). The public user searches by athlete name or chest number. The result shown is intentionally minimal:

- Which ring and category the athlete is assigned to
- Whether that ring/category has been reached yet (deployed) or not

The search result deliberately does not show live match-by-match progress (e.g. "match 3 of 12") for that athlete — it answers "where do I need to be and has it started," not a live scoreboard. If the athlete's category hasn't been reached, the result should clearly say so (e.g. "not yet deployed") rather than showing a blank or ambiguous state.

#### 3.3.3 Shareability

- Each tournament has a shareable public URL.
- A generated QR code for that URL, for printing/display at the venue.

---

## 4. Edge Cases & Failure Behavior

These are scenarios the product must handle explicitly. "Handle" does not always mean "prevent" — in several cases the right behavior is to make the situation visible and let a human (admin or moderator) decide.

### 4.1 Moderator & Access

- Moderator's device disconnects or the tab is closed mid-category — the ring's state must persist server-side; reopening the join flow (or returning with a still-valid session) should restore the moderator to exactly where the ring is, not reset anything.
- Two people try to use the same access code at once — each generates its own pending request; the admin can approve one and reject the other, or approve both if intentional (e.g. a planned handoff).
- Admin revokes a moderator mid-category — that session must lose access immediately, and the ring should clearly show "unmoderated" until a new moderator is approved, rather than silently keeping the old session usable.
- Access code is reused after the admin regenerates it — old code must stop working immediately; any pending requests made on the old code should be invalidated.

### 4.2 Progress Reporting

- Duplicate/accidental double-clicks on a progress button — each click is a discrete event; rapid identical clicks should still be allowed (a fast ring genuinely moves fast) but the UI should give clear feedback per click so the moderator isn't guessing whether it registered.
- Moderator over-corrects with −1 below zero, or pushes completed count above the category's total — the system should not allow completed count to go negative or exceed the total; clamp at the boundary rather than erroring out.
- Moderator tries to report progress on a paused ring — progress controls should be disabled while paused, with a clear resume action, rather than allowing progress to silently continue.
- Moderator pauses while already paused, or resumes while already running — these should be no-ops handled gracefully, not duplicate events that corrupt the pause-duration calculation.

### 4.3 Categories & Rosters

- Admin edits a category's athlete count after a manual total-matches override was already set — do not silently overwrite the admin's override (see §3.1.4); flag the discrepancy instead.
- A category is uploaded twice (duplicate upload) — the system should detect and warn rather than silently duplicating athletes or categories.
- An athlete appears in the roster but their category is never assigned to a ring — public search must clearly show "not yet deployed" for that athlete rather than an error or a blank result.
- Chest numbers collide or are missing for some athletes in an uploaded roster — the admin should see a validation summary at upload time, not discover it later via a confused parent at the search box.

### 4.4 Rings & Queue

- A ring's queue is empty (all categories finished, or none assigned yet) — show an explicit "no categories queued" / "all categories complete" state on both the moderator and public views.
- A category is reassigned from one ring to another while it's actively in progress — this should be strongly discouraged or blocked in the UI; if allowed, in-progress event history must move with it so progress isn't lost.
- All rings finish before the scheduled tournament end, or run long past it — the system should simply reflect actual state (it doesn't need to enforce a schedule), but the public view's ETA should be clearly framed as an estimate, not a guarantee.

### 4.5 Public View

- Public user searches for an athlete in a Mode A (summary-only) category — search should clearly state that individual lookup isn't available for that category, rather than returning "no results", which reads as if the athlete simply wasn't found.
- Multiple athletes share the same name — search results should disambiguate using chest number and category, not silently return only the first match.
- Tournament is in "draft" status (not yet started) — the public link should make clear the event hasn't begun rather than showing an empty/broken-looking dashboard.

---

## 5. Technology Stack

High-level only — no schema or implementation detail here by design.

### 5.1 Frontend

- Next.js (App Router) with TypeScript
- Tailwind CSS
- Responsive, mobile-first — the public view in particular will be used overwhelmingly on phones

### 5.2 Backend / Data

- Supabase: Postgres database, Authentication, and Realtime subscriptions
- Google OAuth as the sole admin sign-in method, gated by an explicit admin allow-list (see §2.1)
- Moderator access uses short-lived, ring-scoped sessions rather than Supabase Auth user accounts

### 5.3 Architecture Approach

- Event-sourced core: every meaningful action (category started, progress reported, paused/resumed, category finished) is recorded as an immutable, timestamped event.
- All displayed state — completed counts, percentages, ring status, ETA — is derived from the event log at read time rather than stored as separately mutable fields. This is a deliberate constraint: it keeps the displayed state and the historical record from ever drifting apart.
- Realtime updates pushed to admin dashboards and public views via Supabase Realtime, so neither role needs to manually refresh.

### 5.4 Hosting

- Vercel for the application
- Supabase-hosted Postgres/Auth/Realtime

---

## 6. Success Criteria

How we'll know V1 actually works, beyond "it runs":

- A moderator with zero prior exposure to RingFlow can request access and start reporting progress within 30 seconds, without instructions.
- A parent can find their athlete's ring/status using only a shared link or QR code — no app install, no account.
- Admin can fully configure a tournament (rings, categories, balancing) from a blank slate in under 30 minutes for a typical multi-ring event.
- Two browser tabs (e.g. moderator and public view) reflect the same ring's state within a couple of seconds of each other, with no manual refresh.
- The event log alone is sufficient to reconstruct exactly what happened on any ring, in order, after the fact.