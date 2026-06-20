-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Admins Table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tournaments Table
CREATE TYPE tournament_status AS ENUM ('draft', 'active', 'completed');

CREATE TABLE public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    event_date DATE,
    venue TEXT,
    city TEXT,
    status tournament_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Rings Table
CREATE TABLE public.rings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ring_order INTEGER NOT NULL,
    access_code TEXT NOT NULL, -- Short code for moderator access
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, name)
);

-- 5. Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_bracket TEXT,
    weight_class TEXT,
    athletes_count INTEGER NOT NULL DEFAULT 0,
    expected_matches INTEGER NOT NULL DEFAULT 0, -- Calculated as 2n-1, but overridable
    has_full_roster BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Athletes Table (For Mode B - Full Roster)
CREATE TABLE public.athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    chest_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Category Assignments Table (Mapping Categories to Rings)
CREATE TYPE assignment_status AS ENUM ('pending', 'running', 'paused', 'completed');

CREATE TABLE public.category_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES public.rings(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    queue_order INTEGER NOT NULL,
    status assignment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ring_id, queue_order),
    UNIQUE (category_id) -- A category can only be assigned to one ring at a time
);

-- 8. Moderator Requests Table
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'revoked');

CREATE TABLE public.moderator_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES public.rings(id) ON DELETE CASCADE,
    access_code_used TEXT NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    session_token UUID UNIQUE, -- Generated upon approval
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 9. Event Log Table (Core Event-Sourced Architecture)
CREATE TYPE event_action AS ENUM (
    'START_CATEGORY',
    'PAUSE_RING',
    'RESUME_RING',
    'MATCH_COMPLETED_INCREMENT',
    'MATCH_COMPLETED_DECREMENT',
    'FINISH_CATEGORY',
    'EMERGENCY_ALERT'
);

CREATE TABLE public.event_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    ring_id UUID NOT NULL REFERENCES public.rings(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    moderator_session_id UUID REFERENCES public.moderator_requests(session_token) ON DELETE SET NULL,
    action event_action NOT NULL,
    metadata JSONB, -- Optional extra data (e.g., {"increment": 1}, {"reason": "injury"})
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Indexes for Performance
CREATE INDEX idx_tournaments_admin ON public.tournaments(admin_id);
CREATE INDEX idx_rings_tournament ON public.rings(tournament_id);
CREATE INDEX idx_categories_tournament ON public.categories(tournament_id);
CREATE INDEX idx_athletes_category ON public.athletes(category_id);
CREATE INDEX idx_assignments_ring ON public.category_assignments(ring_id);
CREATE INDEX idx_event_log_ring ON public.event_log(ring_id);
CREATE INDEX idx_event_log_tournament ON public.event_log(tournament_id);
CREATE INDEX idx_moderator_requests_session ON public.moderator_requests(session_token);

-- Row Level Security (RLS) definitions to be added later as needed, but for MVP
-- assuming API layer enforcement using Admin UUID.
