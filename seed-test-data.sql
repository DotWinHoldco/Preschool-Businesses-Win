-- =============================================================================
-- PBW Test Data Seed Script
-- Single transaction: inserts exactly ONE test row per table
-- Tenant: a0a0a0a0-cca0-4000-8000-000000000001
-- Admin:  785eca72-a9ff-485a-9749-7bbfd1f3d412 (Skylar Webber — already exists)
-- Staff:  a1a1a1a1-5aff-4000-8000-000000000001 (Test Staff User — created here)
-- =============================================================================

BEGIN;

-- ─── Constants ───────────────────────────────────────────────────────────────
-- Tenant ID:       a0a0a0a0-cca0-4000-8000-000000000001
-- Admin user ID:   785eca72-a9ff-485a-9749-7bbfd1f3d412
-- Staff user ID:   a1a1a1a1-5aff-4000-8000-000000000001

-- ─── 0. Test Staff User (user_profiles + user_tenant_memberships) ────────────
INSERT INTO user_profiles (id, tenant_id, first_name, last_name, phone, default_role, locale, timezone)
VALUES (
  'a1a1a1a1-5aff-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test', 'Staff',
  '555-000-0001',
  'lead_teacher',
  'en', 'America/Chicago'
);

INSERT INTO user_tenant_memberships (id, user_id, tenant_id, role, status, joined_at)
VALUES (
  'a1a1a1a1-0001-4000-8000-000000000001',
  'a1a1a1a1-5aff-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'lead_teacher', 'active', '2026-04-20T08:00:00Z'
);

-- ─── 1. staff_profiles ───────────────────────────────────────────────────────
INSERT INTO staff_profiles (
  id, tenant_id, user_id, employee_id, hire_date, employment_type,
  hourly_rate, salary, pay_frequency, tax_filing_status,
  emergency_contact_name, emergency_contact_phone,
  notes_internal, is_active, sort_order, bio
)
VALUES (
  'a1a1a1a1-0002-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-5aff-4000-8000-000000000001',
  'EMP-001', '2026-01-15', 'full_time',
  25.00, 52000.00, 'biweekly', 'single',
  'Jane Emergency', '555-000-9999',
  'Test staff profile for seed data', true, 1,
  'Test staff bio for seeding purposes'
);

-- ─── 2. classrooms ──────────────────────────────────────────────────────────
INSERT INTO classrooms (
  id, tenant_id, name, slug,
  age_range_min_months, age_range_max_months,
  capacity, ratio_required,
  room_number, description,
  daily_schedule_template, status,
  created_by
)
VALUES (
  'a1a1a1a1-0003-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Classroom', 'test-classroom',
  24, 48,
  20, 10,
  '101', 'Test classroom for seed data',
  '[{"time":"08:00","activity":"Circle Time"},{"time":"09:00","activity":"Free Play"}]'::jsonb,
  'active',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412'
);

-- ─── 3. families ────────────────────────────────────────────────────────────
INSERT INTO families (
  id, tenant_id, family_name,
  mailing_address_line1, mailing_city, mailing_state, mailing_zip,
  billing_email, billing_phone,
  auto_pay_enabled, notes_internal, created_by
)
VALUES (
  'a1a1a1a1-0004-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Family',
  '123 Test Street', 'Austin', 'TX', '78701',
  'testfamily@example.com', '555-000-1234',
  false, 'Test family for seed data',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412'
);

-- ─── 4. students ────────────────────────────────────────────────────────────
INSERT INTO students (
  id, tenant_id, first_name, last_name, preferred_name,
  date_of_birth, gender,
  enrollment_status, enrollment_date,
  photo_path, notes_internal,
  created_by, updated_by
)
VALUES (
  'a1a1a1a1-0005-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test', 'Student', 'Testy',
  '2023-06-15', 'male',
  'active', '2026-01-10',
  NULL, 'Test student for seed data',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412'
);

-- ─── 5. student_family_links ────────────────────────────────────────────────
INSERT INTO student_family_links (
  id, tenant_id, student_id, family_id,
  custody_schedule, billing_split_pct,
  is_primary_family, notes
)
VALUES (
  'a1a1a1a1-0006-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-0005-4000-8000-000000000001',
  'a1a1a1a1-0004-4000-8000-000000000001',
  '{"type": "full"}'::jsonb, 100,
  true, 'Primary family link for test student'
);

-- ─── 6. student_classroom_assignments ───────────────────────────────────────
INSERT INTO student_classroom_assignments (
  id, tenant_id, student_id, classroom_id,
  assigned_from, assigned_to, program_type
)
VALUES (
  'a1a1a1a1-0007-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-0005-4000-8000-000000000001',
  'a1a1a1a1-0003-4000-8000-000000000001',
  '2026-01-10', NULL, 'full_day'
);

-- ─── 7. expense_categories ──────────────────────────────────────────────────
INSERT INTO expense_categories (
  id, tenant_id, name,
  gl_code, description, is_active
)
VALUES (
  'a1a1a1a1-0008-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Expense Category',
  'GL-1000', 'Test expense category for seed data', true
);

-- ─── 8. invoices ────────────────────────────────────────────────────────────
INSERT INTO invoices (
  id, tenant_id, family_id,
  period_start, period_end,
  subtotal_cents, discounts_cents, tax_cents, total_cents,
  status, due_date, invoice_number
)
VALUES (
  'a1a1a1a1-0009-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-0004-4000-8000-000000000001',
  '2026-04-01', '2026-04-30',
  120000, 0, 0, 120000,
  'draft', '2026-04-30', 'INV-TEST-001'
);

-- ─── 9. attendance_records ──────────────────────────────────────────────────
INSERT INTO attendance_records (
  id, tenant_id, student_id, classroom_id,
  date, status,
  hours_present, notes
)
VALUES (
  'a1a1a1a1-000a-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-0005-4000-8000-000000000001',
  'a1a1a1a1-0003-4000-8000-000000000001',
  '2026-04-20', 'present',
  8.0, 'Test attendance record'
);

-- ─── 10. newsfeed_posts ─────────────────────────────────────────────────────
INSERT INTO newsfeed_posts (
  id, tenant_id, scope, classroom_id, author_id,
  content, media_paths, post_type, pinned
)
VALUES (
  'a1a1a1a1-000b-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'school_wide', NULL,
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  'Test Newsfeed Post — welcome to our test data!',
  '[]'::jsonb, 'announcement', false
);

-- ─── 11. calendar_events ────────────────────────────────────────────────────
INSERT INTO calendar_events (
  id, tenant_id, title, description, event_type,
  start_at, end_at, all_day,
  location, scope, classroom_id,
  created_by, requires_rsvp, requires_permission_slip,
  max_participants, cost_per_child_cents, notes
)
VALUES (
  'a1a1a1a1-000c-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Calendar Event', 'A test field trip event', 'field_trip',
  '2026-04-25T09:00:00Z', '2026-04-25T14:00:00Z', false,
  'Austin Zoo', 'school_wide', NULL,
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  true, true,
  30, 1500, 'Test calendar event notes'
);

-- ─── 12. conversations ──────────────────────────────────────────────────────
INSERT INTO conversations (
  id, tenant_id, type, classroom_id, title, created_by
)
VALUES (
  'a1a1a1a1-000d-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'direct', NULL,
  'Test Conversation',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412'
);

-- ─── 13. messages ───────────────────────────────────────────────────────────
INSERT INTO messages (
  id, tenant_id, conversation_id, sender_id,
  body, message_type, urgent
)
VALUES (
  'a1a1a1a1-000e-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-000d-4000-8000-000000000001',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  'Test message body — hello from seed data!',
  'text', false
);

-- ─── 14. payroll_runs ───────────────────────────────────────────────────────
INSERT INTO payroll_runs (
  id, tenant_id,
  period_start, period_end,
  status, total_gross, total_net,
  run_by
)
VALUES (
  'a1a1a1a1-000f-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  '2026-04-01', '2026-04-15',
  'draft', 5200.00, 4160.00,
  '785eca72-a9ff-485a-9749-7bbfd1f3d412'
);

-- ─── 15. enrollment_leads (needed for tours FK) ─────────────────────────────
INSERT INTO enrollment_leads (
  id, tenant_id, source, source_detail,
  parent_first_name, parent_last_name,
  parent_email, parent_phone,
  child_name, child_age_months, program_interest,
  status, assigned_to, priority, notes
)
VALUES (
  'a1a1a1a1-0010-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'website', 'Contact form',
  'Test', 'Lead',
  'testlead@example.com', '555-000-5678',
  'Test Lead Child', 30, 'full_day',
  'new', '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  'warm', 'Test lead for seed data'
);

-- ─── 16. tours ──────────────────────────────────────────────────────────────
INSERT INTO tours (
  id, tenant_id, lead_id,
  scheduled_at, conducted_by,
  parent_attended, notes, follow_up_sent
)
VALUES (
  'a1a1a1a1-0011-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-0010-4000-8000-000000000001',
  '2026-04-22T10:00:00Z',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  true, 'Test tour — family seemed very interested', false
);

-- ─── 17. enrollment_applications ────────────────────────────────────────────
INSERT INTO enrollment_applications (
  id, tenant_id,
  parent_first_name, parent_last_name, parent_email, parent_phone,
  student_first_name, student_last_name, student_dob,
  desired_start_date, program_type, schedule_preference,
  allergies_or_medical, special_needs,
  how_heard, faith_community,
  sibling_enrolled, notes,
  relationship_to_child, agree_to_contact,
  triage_status, triage_score, triage_notes,
  pipeline_stage, application_metadata,
  student_gender, child_index
)
VALUES (
  'a1a1a1a1-0012-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test', 'Applicant', 'testapplicant@example.com', '555-000-3456',
  'Test', 'ApplicantChild', '2023-09-01',
  '2026-08-01', 'full_day', 'Monday through Friday',
  'No known allergies', 'None',
  'Website', 'First Baptist Church',
  false, 'Test enrollment application',
  'parent', true,
  'new', 75, 'Auto-scored from seed data',
  'form_submitted', '{}'::jsonb,
  'female', 0
);

-- ─── 18. documents ──────────────────────────────────────────────────────────
INSERT INTO documents (
  id, tenant_id, entity_type, entity_id,
  document_type, title, description,
  file_path, file_size_bytes, mime_type,
  version, uploaded_by,
  expiry_date, status, tags
)
VALUES (
  'a1a1a1a1-0013-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'student', 'a1a1a1a1-0005-4000-8000-000000000001',
  'immunization', 'Test Immunization Record', 'Uploaded test immunization doc',
  'documents/test/immunization-test.pdf', 102400, 'application/pdf',
  1, '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  '2027-04-20', 'active', '["immunization","test"]'::jsonb
);

-- ─── 19. compliance_standards (needed for compliance_checks FK) ─────────────
INSERT INTO compliance_standards (
  id, tenant_id, standard_number, category,
  title, description, evidence_type, is_critical
)
VALUES (
  'a1a1a1a1-0014-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'STD-001', 'health_safety',
  'Test Compliance Standard', 'A test standard for seed data',
  'document', true
);

-- ─── 20. compliance_checks ──────────────────────────────────────────────────
INSERT INTO compliance_checks (
  id, tenant_id, standard_id,
  checked_by, status,
  evidence_notes, corrective_action
)
VALUES (
  'a1a1a1a1-0015-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-0014-4000-8000-000000000001',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  'compliant',
  'All documentation verified', NULL
);

-- ─── 21. inspection_records ─────────────────────────────────────────────────
INSERT INTO inspection_records (
  id, tenant_id, inspection_date,
  inspector_name, inspection_type,
  findings, corrective_actions_required,
  overall_result, document_path, notes
)
VALUES (
  'a1a1a1a1-0016-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  '2026-04-15',
  'Inspector Test', 'annual',
  '[{"area":"kitchen","status":"pass"}]'::jsonb,
  '[]'::jsonb,
  'compliant', 'inspections/test/annual-2026.pdf',
  'Test inspection — all areas passed'
);

-- ─── 22. checklist_templates ────────────────────────────────────────────────
INSERT INTO checklist_templates (
  id, tenant_id, name, target_type,
  description, created_by, is_active, sort_order
)
VALUES (
  'a1a1a1a1-0017-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Checklist Template', 'parent',
  'Test onboarding checklist for new parents',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  true, 1
);

-- ─── 23. training_records ───────────────────────────────────────────────────
INSERT INTO training_records (
  id, tenant_id, user_id,
  training_name, provider, training_type, topic_category,
  hours, completed_date,
  certificate_path, verified_by,
  year, notes
)
VALUES (
  'a1a1a1a1-0018-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-5aff-4000-8000-000000000001',
  'Test CPR Training', 'American Red Cross', 'in_person', 'health_safety',
  4.0, '2026-03-15',
  'training/test/cpr-cert.pdf',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  2026, 'Test training record — CPR certified'
);

-- ─── 24. cameras ────────────────────────────────────────────────────────────
INSERT INTO cameras (
  id, tenant_id, name, location,
  hardware_type, stream_url_encrypted, thumbnail_url,
  status, recording_enabled
)
VALUES (
  'a1a1a1a1-0019-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Camera', 'Main Hallway',
  'IP Camera', 'encrypted://test-stream-url', NULL,
  'online', true
);

-- ─── 25. emergency_events ───────────────────────────────────────────────────
INSERT INTO emergency_events (
  id, tenant_id, event_type, severity,
  title, description,
  initiated_by, status,
  all_clear_message, notes
)
VALUES (
  'a1a1a1a1-001a-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'drill', 'drill',
  'Test Fire Drill', 'Monthly fire drill for test data',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  'resolved',
  'All clear — drill completed successfully',
  'Test emergency event — drill only'
);

-- ─── 26. saved_reports ──────────────────────────────────────────────────────
INSERT INTO saved_reports (
  id, tenant_id, name, entity_type,
  columns, filters, sort,
  created_by, is_scheduled,
  schedule_frequency, schedule_recipients
)
VALUES (
  'a1a1a1a1-001b-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'Test Attendance Report', 'attendance_records',
  '["student_name","date","status","hours_present"]'::jsonb,
  '{"status":"present"}'::jsonb,
  '{"column":"date","direction":"desc"}'::jsonb,
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  false, NULL, NULL
);

-- ─── 27. staff_certifications ───────────────────────────────────────────────
INSERT INTO staff_certifications (
  id, tenant_id, user_id,
  cert_type, cert_name, issuing_body,
  issued_date, expiry_date,
  document_path, verified_by
)
VALUES (
  'a1a1a1a1-001c-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-5aff-4000-8000-000000000001',
  'cpr', 'CPR & First Aid Certification', 'American Red Cross',
  '2026-03-15', '2028-03-15',
  'certs/test/cpr-cert.pdf',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412'
);

-- ─── 28. staff_schedules ────────────────────────────────────────────────────
INSERT INTO staff_schedules (
  id, tenant_id, user_id,
  day_of_week, start_time, end_time,
  classroom_id, effective_from, effective_to
)
VALUES (
  'a1a1a1a1-001d-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-5aff-4000-8000-000000000001',
  1, '07:30', '16:00',
  'a1a1a1a1-0003-4000-8000-000000000001',
  '2026-01-15', NULL
);

-- ─── 29. time_entries ───────────────────────────────────────────────────────
INSERT INTO time_entries (
  id, tenant_id, user_id,
  clock_in_at, clock_out_at, clock_in_method,
  break_start_at, break_end_at,
  total_hours, overtime_hours,
  status, approved_by, approved_at, notes
)
VALUES (
  'a1a1a1a1-001e-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-5aff-4000-8000-000000000001',
  '2026-04-20T07:30:00Z', '2026-04-20T16:00:00Z', 'app',
  '2026-04-20T12:00:00Z', '2026-04-20T12:30:00Z',
  8.0, 0,
  'completed',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  '2026-04-20T16:30:00Z',
  'Test time entry — normal workday'
);

-- ─── 30. newsfeed_reactions ─────────────────────────────────────────────────
INSERT INTO newsfeed_reactions (
  id, tenant_id, post_id, user_id, reaction_type
)
VALUES (
  'a1a1a1a1-001f-4000-8000-000000000001',
  'a0a0a0a0-cca0-4000-8000-000000000001',
  'a1a1a1a1-000b-4000-8000-000000000001',
  '785eca72-a9ff-485a-9749-7bbfd1f3d412',
  'heart'
);

COMMIT;
