# Preschool Businesses Win — Multi-Tenant Platform Architecture
**Last updated: 2026-04-10**
**Status:** v1.0 — Defines multi-tenancy, app shell, theming, and domain resolution for the white-label platform.

> This document supplements `CCA_BUILD_BRIEF.md`. The build brief defines WHAT features exist. This document defines HOW they work across tenants. Read both before writing code.

---

## 1. Platform identity

| | Value |
|---|---|
| **Product name** | Preschool Businesses Win |
| **Platform domain** | `preschool.businesses.win` |
| **Platform branding** | DotWin `.win` logos (see `public/dotwin-logos/`) |
| **First tenant** | Crandall Christian Academy |
| **First tenant domains** | `crandallchristianacademy.com` (marketing) + `portal.crandallchristianacademy.com` (portal) |
| **Fallback subdomain pattern** | `{slug}.preschool.businesses.win` (marketing) + `portal.{slug}.preschool.businesses.win` (portal) |

---

## 2. Multi-tenancy model

### Architecture: shared database + tenant_id RLS

This is the standard enterprise SaaS pattern used by Slack, Linear, Gusto, and every modern B2B platform at this data scale. One Supabase project serves all tenants.

**Every table that stores tenant-specific data has a `tenant_id uuid NOT NULL REFERENCES tenants(id)` column.** RLS policies include `tenant_id = current_setting('app.tenant_id')::uuid` in every SELECT, INSERT, UPDATE, and DELETE policy. No exceptions.

**Tables that are NOT tenant-scoped** (shared platform tables):
- `tenants` — the tenant registry itself
- `tenant_domains` — domain-to-tenant mapping
- `platform_admins` — DotWin staff who can manage all tenants
- `learning_domains` — shared learning frameworks (Texas Pre-K Guidelines, NAEYC, Head Start ELOF)
- `dfps_ratio_requirements` — Texas DFPS ratio tables (state-level, not tenant-specific)

**Everything else is tenant-scoped.** Users, students, families, classrooms, staff, attendance, billing, messaging, documents — all scoped by `tenant_id`.

### Tenant context injection

```
Request arrives at Vercel Edge
  ↓
proxy.ts resolves hostname → tenant_id
  ↓ (sets x-tenant-id header)
Server Component / Server Action reads tenant_id from headers
  ↓
Supabase client initialized with: SET app.tenant_id = '{tenant_id}'
  ↓
RLS policies enforce isolation automatically
```

### Why not separate databases?
- Data volumes are modest (hundreds of students per tenant, not millions of rows)
- One migration runs everywhere — no per-tenant migration orchestration
- One deployment serves all tenants — Vercel handles routing
- One monitoring stack — Sentry, Supabase dashboard
- RLS provides strong isolation that passes SOC 2 and COPPA requirements
- Storage buckets ARE separated per tenant for file isolation (photos, documents)

---

## 3. Core data model — tenant infrastructure

```sql
-- 0001_tenants.sql

-- @anchor: platform.tenants
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- "Crandall Christian Academy"
  slug text NOT NULL UNIQUE,                   -- "cca" — used for fallback subdomains
  status text NOT NULL DEFAULT 'active'        -- active | suspended | trial | onboarding
    CHECK (status IN ('active', 'suspended', 'trial', 'onboarding')),
  plan text NOT NULL DEFAULT 'standard'        -- free | standard | premium | enterprise
    CHECK (plan IN ('free', 'standard', 'premium', 'enterprise')),
  owner_user_id uuid,                          -- the admin who created the tenant
  stripe_customer_id text,                     -- platform-level Stripe customer (for SaaS billing)
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,  -- feature flags, limits, preferences
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- @anchor: platform.tenant-domains
CREATE TABLE tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,                 -- "crandallchristianacademy.com"
  domain_type text NOT NULL                    -- marketing | portal
    CHECK (domain_type IN ('marketing', 'portal')),
  is_primary boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- @anchor: platform.tenant-branding
CREATE TABLE tenant_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identity
  school_name text NOT NULL,                   -- displayed name
  tagline text,                                -- "A Place To Shine Bright"
  logo_path text,                              -- primary logo (Supabase Storage)
  logo_icon_path text,                         -- icon/favicon version
  favicon_path text,

  -- Colors (CSS custom properties, overridden per tenant)
  color_primary text NOT NULL DEFAULT '#5CB961',       -- CCA: green
  color_primary_foreground text NOT NULL DEFAULT '#FFFFFF',
  color_secondary text NOT NULL DEFAULT '#3B70B0',     -- CCA: blue
  color_secondary_foreground text NOT NULL DEFAULT '#FFFFFF',
  color_accent text NOT NULL DEFAULT '#F15A50',        -- CCA: coral/red
  color_accent_foreground text NOT NULL DEFAULT '#FFFFFF',
  color_warning text NOT NULL DEFAULT '#F59E0B',
  color_destructive text NOT NULL DEFAULT '#EF4444',
  color_background text NOT NULL DEFAULT '#FFFFFF',
  color_foreground text NOT NULL DEFAULT '#1A1A1A',
  color_muted text NOT NULL DEFAULT '#F5F5F5',
  color_muted_foreground text NOT NULL DEFAULT '#737373',
  color_card text NOT NULL DEFAULT '#FFFFFF',
  color_border text NOT NULL DEFAULT '#E5E5E5',

  -- Typography
  font_heading text NOT NULL DEFAULT 'var(--font-heading)',    -- tenant can override
  font_body text NOT NULL DEFAULT 'var(--font-body)',
  font_mono text NOT NULL DEFAULT 'var(--font-mono)',

  -- Motion / style
  border_radius text NOT NULL DEFAULT '0.75rem',       -- global border radius
  shadow_style text NOT NULL DEFAULT 'subtle',         -- none | subtle | medium | dramatic
    CHECK (shadow_style IN ('none', 'subtle', 'medium', 'dramatic')),

  -- Content
  support_email text,
  support_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  timezone text NOT NULL DEFAULT 'America/Chicago',

  -- Faith-based options (not all tenants are faith-based)
  is_faith_based boolean NOT NULL DEFAULT false,
  faith_denomination text,                             -- "Christian", "Catholic", etc.

  updated_at timestamptz NOT NULL DEFAULT now()
);

-- @anchor: platform.tenant-features
CREATE TABLE tenant_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL,                   -- e.g., 'door_control', 'camera_feeds', 'cacfp', 'lms'
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,    -- feature-specific config
  UNIQUE (tenant_id, feature_key)
);
```

### Feature flags (tenant_features keys)

Every feature area from `CCA_BUILD_BRIEF.md` is toggle-able per tenant:

| Feature key | Default | Description |
|---|---|---|
| `check_in` | true | QR/PIN check-in system |
| `daily_reports` | true | Staff daily report entry + parent view |
| `billing` | true | Stripe billing + invoicing |
| `messaging` | true | In-app messaging + broadcast |
| `curriculum` | true | Lesson planning + activity library |
| `portfolios` | false | Child development portfolios + assessments |
| `door_control` | false | Smart lock integration |
| `camera_feeds` | false | IP camera viewer |
| `cacfp` | false | CACFP food program tracking |
| `expense_tracking` | false | Expense entry + accounting export |
| `enrollment_crm` | false | Lead management pipeline |
| `surveys` | false | Parent satisfaction surveys |
| `carline` | false | Digital pickup queue |
| `drop_in` | false | Flex scheduling + drop-in booking |
| `subsidy_tracking` | false | State subsidy management |
| `emergency_system` | false | Lockdown + reunification |
| `dfps_compliance` | false | Texas-specific compliance module |
| `lms` | false | Learning management system |
| `newsfeed` | true | Activity stream / announcements |
| `checklists` | true | Onboarding + operational checklists |
| `document_vault` | true | Document storage + expiry tracking |
| `calendar_events` | true | School calendar + events |
| `analytics` | true | Reporting + dashboards |
| `training_tracker` | false | Staff PD hour tracking |
| `faith_integration` | false | Faith domains in curriculum, chapel events |

CCA's initial config enables ALL features (they're the flagship).

---

## 4. Domain resolution — proxy.ts

```ts
// src/proxy.ts — runs at Vercel Edge
// @anchor: platform.proxy

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Edge-cached tenant lookup (60-second TTL)
const tenantCache = new Map<string, { tenantId: string; tenantSlug: string; expiresAt: number }>()

export default async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { tenantId, tenantSlug } = await resolveTenant(hostname)

  if (!tenantId) {
    // Unknown domain — show platform landing or 404
    if (hostname === 'preschool.businesses.win') {
      // Platform marketing site
      return NextResponse.next()
    }
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  // Inject tenant context into request headers
  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', tenantId)
  headers.set('x-tenant-slug', tenantSlug)

  // Determine if this is a portal or marketing domain
  const isPortal = hostname.startsWith('portal.')
  headers.set('x-tenant-surface', isPortal ? 'portal' : 'marketing')

  return NextResponse.next({ request: { headers } })
}

async function resolveTenant(hostname: string): Promise<{ tenantId: string; tenantSlug: string }> {
  // Check cache first
  const cached = tenantCache.get(hostname)
  if (cached && cached.expiresAt > Date.now()) {
    return { tenantId: cached.tenantId, tenantSlug: cached.tenantSlug }
  }

  // Check for fallback subdomain pattern: {slug}.preschool.businesses.win
  const fallbackMatch = hostname.match(/^(?:portal\.)?([^.]+)\.preschool\.businesses\.win$/)
  if (fallbackMatch) {
    const slug = fallbackMatch[1]
    // Look up by slug
    // ... (Supabase query)
  }

  // Look up by custom domain
  // ... (Supabase query against tenant_domains)

  // Cache result
  // ...

  return { tenantId: '', tenantSlug: '' }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 5. App shell — global layout with tenant theming

### Layout hierarchy

```
RootLayout (src/app/layout.tsx)
  ├── Injects tenant CSS variables from tenant_branding
  ├── Loads tenant fonts
  ├── Sets metadata (title, favicon) from tenant config
  │
  ├── (marketing)/layout.tsx
  │   ├── MarketingHeader — tenant logo, nav, CTA
  │   ├── MarketingFooter — tenant contact info, links
  │   └── Pages use tenant colors via CSS variables
  │
  ├── (portal)/layout.tsx
  │   ├── PortalShell — sidebar nav, top bar, user menu
  │   ├── Sidebar items filtered by: user role + tenant feature flags
  │   ├── Platform badge: "Powered by .win" in footer (standard plan)
  │   │   └── Removable on premium/enterprise plan
  │   └── Tenant logo in sidebar header
  │
  └── (platform)/layout.tsx (preschool.businesses.win only)
      ├── PlatformHeader — DotWin branding
      └── Platform marketing, pricing, sign-up, admin
```

### CSS variable injection

```tsx
// src/lib/theme/inject-tenant-theme.tsx
// @anchor: platform.theme

export function TenantThemeProvider({ branding, children }: {
  branding: TenantBranding
  children: React.ReactNode
}) {
  const style = {
    '--color-primary': branding.color_primary,
    '--color-primary-foreground': branding.color_primary_foreground,
    '--color-secondary': branding.color_secondary,
    '--color-secondary-foreground': branding.color_secondary_foreground,
    '--color-accent': branding.color_accent,
    '--color-accent-foreground': branding.color_accent_foreground,
    '--color-warning': branding.color_warning,
    '--color-destructive': branding.color_destructive,
    '--color-background': branding.color_background,
    '--color-foreground': branding.color_foreground,
    '--color-muted': branding.color_muted,
    '--color-muted-foreground': branding.color_muted_foreground,
    '--color-card': branding.color_card,
    '--color-border': branding.color_border,
    '--font-heading': branding.font_heading,
    '--font-body': branding.font_body,
    '--radius': branding.border_radius,
  } as React.CSSProperties

  return <div style={style}>{children}</div>
}
```

### globals.css — uses CSS variables everywhere

```css
/* All components reference variables, never hardcoded colors */
:root {
  /* Defaults (overridden by TenantThemeProvider) */
  --color-primary: #5CB961;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #3B70B0;
  /* ... etc */
  --radius: 0.75rem;
}

/* Every component uses: */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-radius: var(--radius);
}
```

This means changing a tenant's entire visual identity is a single row update in `tenant_branding`. No redeployment. No CSS rebuild. Instant.

---

## 6. Supabase client — tenant-aware

```ts
// src/lib/supabase/server.ts
// @anchor: platform.supabase-server

import { createServerClient } from '@supabase/ssr'
import { headers } from 'next/headers'

export async function createTenantClient() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')

  if (!tenantId) throw new Error('No tenant context')

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { /* cookie config */ }
  )

  // Set tenant context for RLS
  await client.rpc('set_tenant_context', { p_tenant_id: tenantId })

  return client
}
```

```sql
-- Supabase function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS policy pattern (every tenant-scoped table)

```sql
-- Example: students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON students
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Then add role-based policies ON TOP of tenant isolation
CREATE POLICY "parents_see_own_family_students" ON students
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    AND id IN (
      SELECT student_id FROM student_family_links
      WHERE family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

---

## 7. Storage — tenant-isolated buckets

```
Supabase Storage:
  tenant-{tenant_id}-photos/     ← child photos, daily report media
  tenant-{tenant_id}-documents/  ← uploaded documents, certificates
  tenant-{tenant_id}-receipts/   ← expense receipts
  tenant-{tenant_id}-portfolio/  ← portfolio media (observations, work samples)
  platform-assets/               ← DotWin logos, shared assets
```

Storage policies enforce: `bucket_id LIKE 'tenant-' || current_setting('app.tenant_id') || '-%'`.

---

## 8. File tree — multi-tenant structure

```
src/
  app/
    layout.tsx                      ← Root: font loading, TenantThemeProvider, metadata
    (platform)/                     ← preschool.businesses.win only
      page.tsx                      ← Platform landing page
      pricing/page.tsx
      sign-up/page.tsx              ← New tenant onboarding
      admin/                        ← DotWin platform admin
        tenants/page.tsx
        [tenantId]/page.tsx
    (marketing)/                    ← Tenant marketing site
      layout.tsx                    ← MarketingHeader + Footer with tenant branding
      page.tsx                      ← Homepage (tenant-specific content)
      programs/page.tsx
      about/page.tsx
      contact/page.tsx
      enroll/page.tsx
    (portal)/                       ← Tenant portal (same as CCA_BUILD_BRIEF.md §6)
      layout.tsx                    ← PortalShell: sidebar filtered by role + feature flags
      admin/...                     ← All admin routes per CCA_BUILD_BRIEF.md
      staff/...
      parent/...
    api/
      webhooks/stripe/route.ts
      cron/...                      ← All cron routes
  components/
    ui/                             ← Shared primitives (use CSS variables, never hardcoded colors)
    platform/                       ← Platform-level components (DotWin admin)
    portal/                         ← Portal components (per CCA_BUILD_BRIEF.md)
    marketing/                      ← Marketing site components
  lib/
    tenant/
      resolve.ts                    ← Hostname → tenant_id resolution
      context.ts                    ← React context for tenant config
      branding.ts                   ← Fetch + cache tenant_branding
      features.ts                   ← Feature flag checks: hasTenantFeature('cacfp')
    supabase/
      server.ts                     ← Tenant-aware Supabase client
      browser.ts
      admin.ts                      ← Service role client (migrations, platform admin)
    auth/
      permissions.ts                ← Role + tenant + feature-aware permission checks
    theme/
      inject-tenant-theme.tsx
      tokens.ts                     ← Type-safe theme token accessors
    ...                             ← All other lib/ directories per CCA_BUILD_BRIEF.md
  proxy.ts                          ← Edge: domain → tenant resolution
supabase/
  migrations/
    0001_tenants.sql                ← Tenant infrastructure tables
    0002_tenant_branding.sql
    0003_tenant_features.sql
    0004_users_with_tenant.sql      ← Users table with tenant_id
    0005_extensions.sql
    0006_users_and_roles.sql
    ...                             ← All feature migrations from CCA_BUILD_BRIEF.md §6 (0005–0043), now with tenant_id
```

---

## 9. User model — cross-tenant awareness

A user (email) can belong to multiple tenants (a teacher at two schools, a DotWin platform admin who manages all tenants). The `users` table is auth-level (Supabase Auth). Tenant membership is via:

```sql
-- @anchor: platform.user-tenants
CREATE TABLE user_tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'owner', 'admin', 'director', 'lead_teacher', 'assistant_teacher', 'aide', 'front_desk', 'parent'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);
```

When a user logs in, if they belong to only one tenant, they're routed directly. If multiple, they see a tenant chooser.

---

## 10. Platform-level SaaS billing (separate from tenant child billing)

The platform charges tenants (the schools). This is separate from the tenant's Stripe account that charges parents.

- **Platform Stripe account:** charges schools for the SaaS subscription
- **Tenant Stripe Connect account:** each tenant connects their own Stripe account for parent billing

```sql
-- @anchor: platform.saas-billing
CREATE TABLE platform_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id),
  stripe_subscription_id text NOT NULL,
  plan text NOT NULL,                          -- standard | premium | enterprise
  status text NOT NULL,                        -- active | past_due | canceled | trialing
  current_period_start timestamptz,
  current_period_end timestamptz,
  student_count_limit int,                     -- plan-based limit
  staff_count_limit int,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 11. CCA as first tenant — seed data

```sql
-- 0099_seed_cca_tenant.sql (dev + production)
-- @anchor: platform.seed-cca

INSERT INTO tenants (id, name, slug, status, plan) VALUES
  ('CCA_TENANT_UUID', 'Crandall Christian Academy', 'cca', 'active', 'premium');

INSERT INTO tenant_domains (tenant_id, domain, domain_type, is_primary, verified) VALUES
  ('CCA_TENANT_UUID', 'crandallchristianacademy.com', 'marketing', true, true),
  ('CCA_TENANT_UUID', 'portal.crandallchristianacademy.com', 'portal', true, true);

INSERT INTO tenant_branding (tenant_id, school_name, tagline, color_primary, color_secondary, color_accent, is_faith_based, faith_denomination, timezone, ...) VALUES
  ('CCA_TENANT_UUID', 'Crandall Christian Academy', 'A Place To Shine Bright',
   '#5CB961', '#3B70B0', '#F15A50', true, 'Christian', 'America/Chicago', ...);

-- Enable ALL features for CCA (flagship tenant)
INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES
  ('CCA_TENANT_UUID', 'check_in', true),
  ('CCA_TENANT_UUID', 'daily_reports', true),
  ('CCA_TENANT_UUID', 'billing', true),
  ('CCA_TENANT_UUID', 'messaging', true),
  ('CCA_TENANT_UUID', 'curriculum', true),
  ('CCA_TENANT_UUID', 'portfolios', true),
  ('CCA_TENANT_UUID', 'door_control', true),
  ('CCA_TENANT_UUID', 'camera_feeds', true),
  ('CCA_TENANT_UUID', 'cacfp', true),
  ('CCA_TENANT_UUID', 'expense_tracking', true),
  ('CCA_TENANT_UUID', 'enrollment_crm', true),
  ('CCA_TENANT_UUID', 'surveys', true),
  ('CCA_TENANT_UUID', 'carline', true),
  ('CCA_TENANT_UUID', 'drop_in', true),
  ('CCA_TENANT_UUID', 'subsidy_tracking', true),
  ('CCA_TENANT_UUID', 'emergency_system', true),
  ('CCA_TENANT_UUID', 'dfps_compliance', true),
  ('CCA_TENANT_UUID', 'newsfeed', true),
  ('CCA_TENANT_UUID', 'checklists', true),
  ('CCA_TENANT_UUID', 'document_vault', true),
  ('CCA_TENANT_UUID', 'calendar_events', true),
  ('CCA_TENANT_UUID', 'analytics', true),
  ('CCA_TENANT_UUID', 'training_tracker', true),
  ('CCA_TENANT_UUID', 'faith_integration', true);
```

---

## 12. Logo usage rules

| Context | Logo | Source |
|---|---|---|
| Platform landing page (preschool.businesses.win) | DotWin `.win` horizontal | `public/dotwin-logos/win-black-logo-horizontal-nobg.png` |
| Platform admin panel | DotWin `.win` circular | `public/dotwin-logos/dot-win-circular-logo-icon.png` |
| Portal sidebar footer ("Powered by") | DotWin `.win` small | `public/dotwin-logos/dot-win-circular-logo-icon-white.png` |
| Tenant marketing site header | Tenant logo | `tenant_branding.logo_path` (Supabase Storage) |
| Tenant portal sidebar header | Tenant logo | `tenant_branding.logo_path` |
| Tenant favicon | Tenant favicon | `tenant_branding.favicon_path` |
| CCA marketing site | CCA full logo | `CCA/public/CCA ASSETS/CCA Logo Full.png` |
| CCA portal | CCA full logo | `CCA/public/CCA ASSETS/cca-full-with-tagline.png` |
| CCA favicon | CCA sun icon | `CCA/public/CCA ASSETS/crandall-sun-favicon-whitebg.png` |

---

## 13. When in doubt

- **Every component uses CSS variables, never hardcoded colors.** If you type `#5CB961` in a component, you're doing it wrong. Use `var(--color-primary)`.
- **Every query includes tenant_id.** If you write a query without tenant isolation, you've created a data leak.
- **Every sidebar item checks feature flags.** `if (!hasTenantFeature('cacfp')) return null`.
- **The platform is the product. CCA is the first customer.** Build for scale, configure for CCA.
