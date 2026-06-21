BEGIN;

-- 1. Alter Categories Table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS belt TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS age_min INT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS age_max INT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS day TEXT;

-- 2. Alter Athletes Table
ALTER TABLE public.athletes ALTER COLUMN category_id DROP NOT NULL;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS belt TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS age TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS day TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS dojo TEXT;

COMMIT;
