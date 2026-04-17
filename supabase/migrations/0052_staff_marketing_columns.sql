ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
