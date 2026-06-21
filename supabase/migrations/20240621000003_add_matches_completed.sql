BEGIN;

ALTER TABLE public.category_assignments 
ADD COLUMN matches_completed INTEGER NOT NULL DEFAULT 0;

-- Ensure realtime replication works properly by explicitly dropping and recreating
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_assignments;

COMMIT;
