# Contributing to RingFlow

Thank you for your interest in contributing to RingFlow! This guide outlines our development workflow, coding standards, and architectural patterns to help you get started quickly.

---

## Code of Conduct

* Be respectful, inclusive, and collaborative.
* Report bugs, request features, or ask questions by opening an issue.
* Keep pull requests focused and document any changes you make.

---

## Development Workflow

We follow a typical Git branching and Pull Request workflow:

### 1. Branch Naming Conventions
Create a new branch from `main` using the appropriate prefix:
* `feature/` for new features (e.g., `feature/analytics-export`)
* `bugfix/` for bug fixes (e.g., `bugfix/moderator-redirect-loop`)
* `docs/` for documentation updates (e.g., `docs/contributing-guide`)
* `chore/` for maintenance, upgrades, or refactoring (e.g., `chore/dependency-bump`)

### 2. Pull Request Guidelines
* Keep PRs small and atomic where possible.
* Ensure all code compiles cleanly without TypeScript errors.
* Run ESLint before committing: `npm run lint`.
* Provide a clear description of the problem solved and the implementation details in your PR.

---

## Coding Standards

### TypeScript & Next.js
* Use TypeScript for all source code. Avoid using `any` type overrides.
* We use **Next.js App Router** conventions. Place pages and layout configurations under `src/app`.
* Server-side operations should be encapsulated in **Server Actions** placed within `src/actions/`.

### UI & Styling
* Use **Tailwind CSS** for layout and component styling.
* Use CSS custom properties defined in `src/app/globals.css` for design system tokens (colors, padding, fonts) to maintain visual consistency.
* Prioritize mobile-first design, especially for the **Moderator Portal** and **Public Event Dashboard**.

---

## Architectural Principles

Before writing any database or state modifications, make sure you understand the core design principles of RingFlow:

### 1. Coarse-Grained Tracking
RingFlow is designed to be a lightweight, operationally-focused floor management control center.
* **Do NOT** implement complex scoring mechanisms, referee controls, or bracket trees.
* Track coarse-grained progress (e.g., match count completions, ring status, and active pauses).

### 2. Event-Sourced State
All core progress events (starting a category, incrementing matches completed, pausing/resuming, finishing a category) are modeled as immutable, timestamped events:
* **Rule**: Write actions should append events to the `public.event_log` table.
* **Rule**: Read actions and dashboard metrics (completion percentages, ETAs, active status) should be calculated dynamically by parsing/summarizing the event logs rather than mutating a single static state field.
* This keeps the history and the current state mathematically synchronized.

### 3. Database Migrations
We use Supabase for database management and real-time subscription infrastructure. All schema modifications must be scripted as SQL files.
* **Location**: Place all new SQL migration scripts inside [supabase/migrations/](file:///d:/Programming/RingFlowDevelopment/docs/RingFlow/supabase/migrations).
* **Format**: Name migration files using a timestamped prefix followed by a snake_case description: `YYYYMMDDHHMMSS_description.sql`.
* **Idempotency**: Ensure migration scripts are repeatable (e.g., use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, etc.).
* **Realtime Enablement**: If you add new tables that require real-time updates on dashboards, explicitly add them to the `supabase_realtime` publication in a migration script:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.your_table_name;
  ```
