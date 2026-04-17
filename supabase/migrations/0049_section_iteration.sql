-- 0049_section_iteration.sql
-- @anchor: platform.form-wizard.iteration
-- Adds section-level "iterate over" support so a section's fields can repeat
-- once per item in a named repeater_group field. Used by the enrollment form
-- to render per-child program selection and per-child medical info.

ALTER TABLE form_sections
  ADD COLUMN IF NOT EXISTS iterate_over_field_key text;

COMMENT ON COLUMN form_sections.iterate_over_field_key IS
  'When set, the section renders its fields once per item in the named repeater_group field. Values are stored merged into each item in the target repeater''s array.';
