-- Enable Realtime replication for dashboard live feeds
-- We must explicitly add tables to the 'supabase_realtime' publication for the client channels to receive inserts/updates

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'moderator_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.moderator_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'event_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_log;
  END IF;
END
$$;

COMMIT;
