CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  source_page text DEFAULT 'home',
  ip_address inet,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_insert_newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "tenant_read_newsletter"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT utm.tenant_id FROM public.user_tenant_memberships utm
      WHERE utm.user_id = auth.uid() AND utm.status = 'active'
    )
  );

CREATE POLICY "anon_insert_newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_newsletter_tenant ON public.newsletter_subscribers(tenant_id);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(tenant_id, email);
