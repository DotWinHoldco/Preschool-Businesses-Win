CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  body_html text,
  cover_path text,
  author text DEFAULT 'Crandall Christian Academy',
  published_at timestamptz NOT NULL DEFAULT now(),
  read_time_minutes integer DEFAULT 3,
  is_published boolean NOT NULL DEFAULT false,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_posts"
  ON public.blog_posts
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "tenant_manage_posts"
  ON public.blog_posts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT utm.tenant_id FROM public.user_tenant_memberships utm
      WHERE utm.user_id = auth.uid() AND utm.status = 'active'
    )
  );

CREATE POLICY "service_all_posts"
  ON public.blog_posts
  FOR ALL
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_blog_tenant_published ON public.blog_posts(tenant_id, is_published, published_at DESC);
CREATE INDEX idx_blog_slug ON public.blog_posts(tenant_id, slug);
