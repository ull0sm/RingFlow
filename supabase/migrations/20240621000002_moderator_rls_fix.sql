BEGIN;

-- Allow public to insert moderator requests so they can login
CREATE POLICY "Public can insert mod requests" ON public.moderator_requests FOR INSERT WITH CHECK (true);

-- Allow public to read moderator requests (for checkModeratorStatus)
CREATE POLICY "Public can read mod requests" ON public.moderator_requests FOR SELECT USING (true);

-- Allow public to update assignments (Server Actions enforce session validation)
CREATE POLICY "Public can update assignments" ON public.category_assignments FOR UPDATE USING (true);

-- Allow public to insert event logs (Server Actions enforce session validation)
CREATE POLICY "Public can insert event logs" ON public.event_log FOR INSERT WITH CHECK (true);

COMMIT;
