BEGIN;

ALTER TABLE public.moderator_requests
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS moderator_name TEXT;

-- Realtime for event_log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'event_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_log;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'moderator_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.moderator_requests;
  END IF;
END
$$;

COMMIT;
