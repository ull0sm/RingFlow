-- Add additional tables to realtime replication
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'rings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'category_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.category_assignments;
  END IF;
END
$$;

COMMIT;
