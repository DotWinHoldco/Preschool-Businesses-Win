# Wix Studio Analytics Install

First-party analytics pipeline: snippet on the Wix site → `/api/collect` on the PBW app → Supabase (`analytics_events`) → realtime dashboard at `/portal/admin/analytics/traffic` → CAPI forwarder to Meta/GA4/TikTok.

## 1. Paste the snippet in Wix Studio

Wix Studio → **Settings → Custom Code → Add Custom Code**.

- **Name:** PBW Analytics
- **Paste to:** All pages
- **Placement:** Body - end
- **Load code on:** All pages (front-end only)

```html
<script
  src="https://preschool.businesses.win/pbw-analytics.js"
  data-site-key="pk_cca_bf6ede46e2be9d0510496fa2e287fd123a95"
  async
></script>
<script
  src="https://preschool.businesses.win/pbw-consent.js"
  data-privacy-url="/privacy"
  data-accent="#1d4ed8"
  async
></script>
```

The `site-key` above is CCA's. New tenants get one when their row is seeded into `analytics_sites` — grab it from the traffic dashboard header or from `SELECT site_key FROM analytics_sites WHERE tenant_id=...`.

Reload the marketing site. You should see the consent banner on first visit. Accept it, navigate a page, then check `/portal/admin/analytics/traffic` — a visitor and page view should appear.

## 2. Tag enrollment CTAs (automatic + manual)

**Automatic (default).** The snippet auto-fires `enrollment_click` on any `<a>`/`<button>` whose URL contains `/enroll`, `/apply`, `/application`, `/tour`, `schedule-a-tour`, OR whose text starts with "Enroll", "Apply", "Start Application", "Schedule a Tour". No tagging required.

**Manual (preferred for precision).** Use Wix Studio's HTML Element or a link's **Advanced Settings → Attributes** panel to add a data attribute:

```html
<a href="/enrollment" data-track="enrollment_click">Enroll Now</a>
```

Any attribute starting with `data-track-` is captured as a property:

```html
<a href="/enrollment" data-track="enrollment_click" data-track-source="hero">Enroll Now</a>
```

Pattern matched (hero/mid/footer etc.) shows up in the dashboard's event properties.

## 3. Cross-domain stitching

The snippet auto-rewrites outbound links pointing at the PBW enrollment domain (`preschool.businesses.win`, `*.preschool.businesses.win`, or the tenant's enrollment subpath) to append `?_av={visitor_id}`. When the enrollment wizard loads on the PBW side it:

1. Reads `?_av`, replaces its visitor cookie with the Wix-side value
2. Fires `enrollment_started` (conversion)
3. On submit, `submitSystemEnrollment` fires `enrollment_completed` and links `analytics_visitors.application_id` → `enrollment_applications.id`

Full funnel: **Wix page view → Wix enrollment_click → PBW enrollment_started → PBW enrollment_completed**, with UTM first/last touch preserved.

## 4. Consent (Texas TDPSA)

The consent banner satisfies TDPSA notice + opt-out. Rules enforced by the snippet:

- If `navigator.doNotTrack === '1'` OR `navigator.globalPrivacyControl === true` → snippet silently sets consent to `denied` and sends no events.
- Otherwise the banner shows until a visitor clicks **Accept** or **Opt out**.
- The `_pbwa_consent` cookie stores the choice for 365 days.
- Calling `window.pbwaManageConsent()` from the site's Privacy page resets the cookie and reloads (re-shows the banner).

**Required on your privacy policy page:**

1. A list of the analytics categories you collect (first-party analytics, advertising measurement).
2. A clear opt-out link. Add this HTML to the policy page:

   ```html
   <a href="#" onclick="window.pbwaManageConsent(); return false;"> Manage tracking preferences </a>
   ```

3. A reference to the data controller (tenant name) and contact email.

## 5. CAPI / GA4 / TikTok configuration

Credentials live on the `analytics_sites` row. Update via SQL when you have them:

```sql
UPDATE analytics_sites SET
  meta_pixel_id      = '…',
  meta_capi_token    = '…',
  meta_test_event_code = 'TEST12345',  -- drop once live
  ga4_measurement_id = 'G-XXXXXXX',
  ga4_api_secret     = '…',
  tiktok_pixel_id    = 'CXXXXXXXXXXXXXXXXXXX',
  tiktok_access_token = '…'
WHERE tenant_id = 'a0a0a0a0-cca0-4000-8000-000000000001';
```

The cron at `/api/cron/analytics-forward` runs every minute. It only forwards `event_type='conversion'` rows and marks `forwarded_to.{meta,ga4,tiktok}` with a timestamp so events aren't double-sent. Conversion events: `enrollment_click`, `enrollment_started`, `enrollment_completed`, plus anything with `event_type='conversion'`.

Meta mapping: `enrollment_click → AddToCart`, `enrollment_started → InitiateCheckout`, `enrollment_completed → Lead`.
TikTok mapping: `enrollment_click → ClickButton`, `enrollment_started → InitiateCheckout`, `enrollment_completed → CompleteRegistration`.
GA4 uses the original event name (truncated to 40 chars).

## 6. Operator cheatsheet

- **Add a new tenant's site:** `INSERT INTO analytics_sites (tenant_id, site_key, name, origins) VALUES (…, 'pk_tenant_' || encode(gen_random_bytes(18), 'hex'), 'Tenant Marketing', ARRAY['https://their-domain.com']);`
- **Add another allowed origin (staging):** `UPDATE analytics_sites SET origins = array_append(origins, 'https://staging.their-domain.com') WHERE id = …;`
- **Purge a single visitor's data (TDPSA opt-out request):** `DELETE FROM analytics_events WHERE tenant_id=… AND visitor_id=…; DELETE FROM analytics_sessions WHERE tenant_id=… AND visitor_id=…; DELETE FROM analytics_visitors WHERE tenant_id=… AND visitor_id=…;`
- **Rotate IP salt (also runs nightly via data-retention cron):** `SELECT rotate_analytics_ip_salt();`
- **Custom events from any page:** `window.pbwa.track('video_played', { video: 'tour' })` or `window.pbwa.conversion('tour_booked', { program: 'prek' })`.

## 7. What's captured (schema)

- Page views, session start/end, clicks with `[data-track]`, outbound link clicks, auto-detected enrollment CTA clicks, conversion events, UTM + fbclid/gclid/ttclid, referrer, device type, browser, OS, screen/viewport, language, IP (hashed, salt-rotated), geo (country/region/city from Vercel/Cloudflare edge headers).
- **Not** captured: raw IP, email, names, or any data from form fields (those live in `enrollment_applications`, not `analytics_events`).

## 8. Verify it's working

1. Load the Wix site in an incognito window with the snippet live.
2. Accept consent. Click around 2–3 pages.
3. Open DevTools → Network → filter `collect`. You should see `POST /api/collect` returning `200 {ok: true, accepted: N}`.
4. In the portal, go to `/portal/admin/analytics/traffic`. The "live on site now" pill should tick to at least 1.
5. Click your Enrollment CTA. Back on the dashboard, refresh — `Enrollment clicks` should increment.
6. Complete an enrollment (test account OK — delete after). Funnel should show all four stages populated.

If the live counter stays at 0, check: (a) origin matches `analytics_sites.origins` exactly (scheme + host); (b) consent was granted; (c) no ad-blocker blocking `preschool.businesses.win` (the collector is on the PBW domain, not a tracking-vendor domain, so most blockers leave it alone).
