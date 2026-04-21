-- Add name and contact columns to family_members so members can exist
-- without a user account (e.g., admin adds a step-parent before they sign up).
ALTER TABLE family_members
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN email text,
  ADD COLUMN phone text;

-- Backfill names from user_profiles for existing rows
UPDATE family_members fm
SET
  first_name = up.first_name,
  last_name = up.last_name,
  phone = up.phone
FROM user_profiles up
WHERE fm.user_id = up.id
  AND fm.first_name IS NULL;

-- Backfill email from auth.users for existing rows
UPDATE family_members fm
SET email = au.email
FROM auth.users au
WHERE fm.user_id = au.id
  AND fm.email IS NULL;
