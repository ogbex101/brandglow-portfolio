
-- ============ NICHES (admin-managed taxonomy for work samples) ============
CREATE TABLE public.niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.niches TO anon, authenticated;
GRANT ALL ON public.niches TO authenticated;
GRANT ALL ON public.niches TO service_role;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read niches" ON public.niches FOR SELECT USING (true);
CREATE POLICY "Admins write niches" ON public.niches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER niches_touch BEFORE UPDATE ON public.niches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.niches (name, sort_order) VALUES
  ('Email Marketing', 0),
  ('Video Editing', 1),
  ('Social Media', 2),
  ('Web Design', 3),
  ('Branding', 4),
  ('Copywriting', 5);

-- ============ PROJECTS: niche, likes, source url ============
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS niche_id UUID REFERENCES public.niches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- ============ METRICS: split into open/response rate ============
ALTER TABLE public.metrics
  ADD COLUMN IF NOT EXISTS open_rate TEXT,
  ADD COLUMN IF NOT EXISTS response_rate TEXT;

-- ============ PAGE VIEWS (analytics) ============
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a view" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read views" ON public.page_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ PUBLIC LIKE RPC ============
-- Lets an anonymous visitor increment a project's like count without granting
-- public UPDATE on the projects table itself (which stays admin-write only).
CREATE OR REPLACE FUNCTION public.increment_project_likes(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.projects SET likes_count = likes_count + 1 WHERE id = p_project_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_project_likes(UUID) TO anon, authenticated;
