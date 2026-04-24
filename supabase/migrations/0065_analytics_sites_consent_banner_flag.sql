-- 0065_analytics_sites_consent_banner_flag.sql
-- Adds a per-site toggle for the TDPSA consent banner. When false, the
-- pbw-consent.js script is omitted from the generated install snippet and
-- pbw-analytics.js is tagged with data-consent="off" so the snippet relies
-- on DNT/GPC for opt-out instead of the banner.

ALTER TABLE analytics_sites
  ADD COLUMN IF NOT EXISTS consent_banner_enabled boolean NOT NULL DEFAULT true;
