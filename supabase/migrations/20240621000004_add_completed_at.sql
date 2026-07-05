BEGIN;

ALTER TABLE public.category_assignments 
ADD COLUMN completed_at TIMESTAMPTZ;

COMMIT;
