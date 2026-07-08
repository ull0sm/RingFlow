-- RingFlow Database Schema (Consolidated Master SQL)
-- This file contains the complete, up-to-date database schema, security policies, and replication configurations.
-- =========================================================================
-- 1. EXTENSIONS & ENUMS
-- =========================================================================
-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Tournament Status Enum
CREATE TYPE tournament_status AS ENUM ('draft', 'active', 'completed');
-- Category Assignment Status Enum
CREATE TYPE assignment_status AS ENUM ('pending', 'running', 'paused', 'completed');
-- Moderator Request Status Enum
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'revoked');
-- Event Log Actions Enum
CREATE TYPE event_action AS ENUM (
    'START_CATEGORY',
    'PAUSE_RING',
    'RESUME_RING',
    'MATCH_COMPLETED_INCREMENT',
    'MATCH_COMPLETED_DECREMENT',
    'FINISH_CATEGORY',
    'EMERGENCY_ALERT',
    'REQUEST_ASSISTANCE',
    'RETURNED_TO_QUEUE'
);
-- =========================================================================
-- 2. TABLES
-- =========================================================================
-- Admins Table (Linked to Supabase Auth)
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Tournaments Table
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
-- Rings Table
CREATE TABLE public.rings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ring_order INTEGER NOT NULL,
    access_code TEXT NOT NULL, -- Short code for moderator access
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, name)
);
-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_bracket TEXT,
    weight_class TEXT,
    athletes_count INTEGER NOT NULL DEFAULT 0,
    expected_matches INTEGER NOT NULL DEFAULT 0, -- Calculated as 2n-1, but overridable
    has_full_roster BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    belt TEXT,
    age_min INT,
    age_max INT,
    sex TEXT,
    day TEXT
);
-- Athletes Table
CREATE TABLE public.athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- Nullable (Mode B support)
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    chest_number TEXT,
    belt TEXT,
    age TEXT,
    sex TEXT,
    day TEXT,
    dojo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Category Assignments Table (Mapping Categories to Rings)
CREATE TABLE public.category_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES public.rings(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    queue_order INTEGER NOT NULL,
    status assignment_status NOT NULL DEFAULT 'pending',
    matches_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ring_id, queue_order),
    UNIQUE (category_id) -- A category can only be assigned to one ring at a time
);
-- Moderator Requests Table
CREATE TABLE public.moderator_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES public.rings(id) ON DELETE CASCADE,
    access_code_used TEXT NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    session_token UUID UNIQUE, -- Generated upon approval
    device_info JSONB DEFAULT '{}'::jsonb,
    moderator_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
-- Event Log Table (Core Event-Sourced Architecture)
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
-- =========================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =========================================================================
CREATE INDEX idx_tournaments_admin ON public.tournaments(admin_id);
CREATE INDEX idx_rings_tournament ON public.rings(tournament_id);
CREATE INDEX idx_categories_tournament ON public.categories(tournament_id);
CREATE INDEX idx_athletes_category ON public.athletes(category_id);
CREATE INDEX idx_assignments_ring ON public.category_assignments(ring_id);
CREATE INDEX idx_event_log_ring ON public.event_log(ring_id);
CREATE INDEX idx_event_log_tournament ON public.event_log(tournament_id);
CREATE INDEX idx_moderator_requests_session ON public.moderator_requests(session_token);
-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;
-- Admins Table Policies
CREATE POLICY "Admins can view own record" ON public.admins FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can insert own record" ON public.admins FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update own record" ON public.admins FOR UPDATE USING (auth.uid() = id);
-- Tournaments Table Policies
CREATE POLICY "Admins can manage their tournaments" ON public.tournaments FOR ALL USING (auth.uid() = admin_id);
CREATE POLICY "Public can view active tournaments" ON public.tournaments FOR SELECT USING (status = 'active' OR status = 'completed');
-- Rings Table Policies
CREATE POLICY "Admins can manage rings" ON public.rings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = rings.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view rings" ON public.rings FOR SELECT USING (true);
-- Categories Table Policies
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = categories.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
-- Category Assignments Table Policies
CREATE POLICY "Admins can manage assignments" ON public.category_assignments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rings r
        JOIN public.tournaments t ON t.id = r.tournament_id
        WHERE r.id = category_assignments.ring_id AND t.admin_id = auth.uid()
    )
);
CREATE POLICY "Public can view assignments" ON public.category_assignments FOR SELECT USING (true);
CREATE POLICY "Public can update assignments" ON public.category_assignments FOR UPDATE USING (true);
-- Athletes Table Policies
CREATE POLICY "Admins can manage athletes" ON public.athletes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = athletes.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view athletes" ON public.athletes FOR SELECT USING (true);
-- Moderator Requests Table Policies
CREATE POLICY "Admins can manage mod requests" ON public.moderator_requests FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rings r
        JOIN public.tournaments t ON t.id = r.tournament_id
        WHERE r.id = moderator_requests.ring_id AND t.admin_id = auth.uid()
    )
);
CREATE POLICY "Public can insert mod requests" ON public.moderator_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read mod requests" ON public.moderator_requests FOR SELECT USING (true);
-- Event Log Table Policies
CREATE POLICY "Admins can manage event log" ON public.event_log FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = event_log.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view event log" ON public.event_log FOR SELECT USING (true);
CREATE POLICY "Public can insert event logs" ON public.event_log FOR INSERT WITH CHECK (true);
-- =========================================================================
-- 5. REALTIME REPLICATION
-- =========================================================================
-- Recreate Supabase Realtime publication to sync live screens
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.rings, 
    public.category_assignments, 
    public.event_log, 
    public.moderator_requests;
