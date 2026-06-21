-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

-- 1. Admins
CREATE POLICY "Admins can view own record" ON public.admins FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can insert own record" ON public.admins FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update own record" ON public.admins FOR UPDATE USING (auth.uid() = id);

-- 2. Tournaments
CREATE POLICY "Admins can manage their tournaments" ON public.tournaments FOR ALL USING (auth.uid() = admin_id);
CREATE POLICY "Public can view active tournaments" ON public.tournaments FOR SELECT USING (status = 'active' OR status = 'completed');

-- 3. Rings
CREATE POLICY "Admins can manage rings" ON public.rings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = rings.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view rings" ON public.rings FOR SELECT USING (true);

-- 4. Categories
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = categories.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

-- 5. Category Assignments
CREATE POLICY "Admins can manage assignments" ON public.category_assignments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rings r
        JOIN public.tournaments t ON t.id = r.tournament_id
        WHERE r.id = category_assignments.ring_id AND t.admin_id = auth.uid()
    )
);
CREATE POLICY "Public can view assignments" ON public.category_assignments FOR SELECT USING (true);

-- 6. Athletes
CREATE POLICY "Admins can manage athletes" ON public.athletes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = athletes.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view athletes" ON public.athletes FOR SELECT USING (true);

-- 7. Moderator Requests
CREATE POLICY "Admins can manage mod requests" ON public.moderator_requests FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rings r
        JOIN public.tournaments t ON t.id = r.tournament_id
        WHERE r.id = moderator_requests.ring_id AND t.admin_id = auth.uid()
    )
);

-- 8. Event Log
CREATE POLICY "Admins can manage event log" ON public.event_log FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = event_log.tournament_id AND t.admin_id = auth.uid())
);
CREATE POLICY "Public can view event log" ON public.event_log FOR SELECT USING (true);
