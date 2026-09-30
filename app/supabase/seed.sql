-- PractMD Roadmap and Priorities — seed.
-- Spec: docs/product-roadmap-and-challenges-spec.md (Part 1, §5).

insert into public.app_users (email, display_name, role) values
  ('madan@accessionhealthtech.com','Madan','admin');
-- add the rest of the team and Prasanna before the workshop, for example:
-- ('<prasanna-email>','Prasanna Gopalakrishnan','editor')

insert into public.workstreams (code, name, color, description, sort_order) values
  ('foundations','Foundations','#475569','Platform, environments, queues, notifications',1),
  ('patient_intake','Patient and intake','#02979D','Portal, onboarding, forms, returning patients',2),
  ('providers','Providers','#7C3AED','Provider records, availability, credentialing, assignment',3),
  ('scheduling','Scheduling','#D97706','Appointment engine and the move off Office Ally scheduling',4),
  ('care_delivery','Care delivery','#2563EB','Telehealth, encounter, note, e-prescribing',5),
  ('revenue_cycle','Revenue cycle','#059669','Verification, clearinghouse, claims, remittance',6),
  ('cortex_ai','Cortex AI','#001A57','Iris, Luna, Quill, Mira, Cleo, Nova',7),
  ('adoption','Adoption and outcomes','#DB2777','Baselines, pilots, moving providers off Office Ally',8);

insert into public.scoring_weights (id) values (1);
insert into public.settings (key, value) values ('mvp_line', '{"label":"MVP: a provider signs a note","date":null}');

insert into public.roadmap_items (code, name, description, outcome, workstream, horizon, revenue_impact, operational_efficiency, unlocks, ease, depends_on_codes, is_mvp, sort_order) values
  ('f1', 'Multi-tenant platform and custom domains', 'Each practice isolated, on its own portal address.', null, 'foundations', 'done', null, null, null, null, '{}', false, 1),
  ('f2', 'Access control, audit and security', 'Role-based access, audit logging, link protection, login and logout controls.', null, 'foundations', 'done', null, null, null, null, '{}', false, 2),
  ('f3', 'Location data model and clinic masters', 'Clinic locations become standard masters, with existing records moved over.', 'Clean location data for providers and scheduling.', 'foundations', 'now', null, null, null, null, '{}', false, 3),
  ('f4', 'Test environment', 'A separate environment, so testing stops running on a live tenant.', 'Safer releases.', 'foundations', 'next', 1, 3, 5, 4, '{}', false, 4),
  ('f5', 'Worklist queues', 'Role-based queues with self-pick or round robin.', 'Team work (like insurance verification) has an owner.', 'foundations', 'next', 2, 4, 4, 4, '{}', false, 5),
  ('f6', 'Notifications engine', 'Email and SMS for reminders and status updates.', 'Patients kept informed automatically.', 'foundations', 'next', null, null, null, null, '{}', false, 6),
  ('p1', 'Patient Portal, forms and document review', 'Accounts, configurable forms, PHQ-9, document review.', null, 'patient_intake', 'done', null, null, null, null, '{}', false, 7),
  ('p2', 'Tasks, 360 record, timeline and messaging', 'Task engine with escalation, full patient view, care team messaging.', null, 'patient_intake', 'done', null, null, null, null, '{}', false, 8),
  ('p3', 'Intake optimization from analytics', 'Measure the mobile form redesign against the 70 to 85 minute baseline, then fix the next pain points.', 'Faster, easier intake.', 'patient_intake', 'now', 2, 3, 1, 4, '{t1}', false, 9),
  ('p4', 'Six-step onboarding (self and guardian)', 'Guided onboarding with branches for patients and caregivers.', 'Fewer abandoned sign-ups.', 'patient_intake', 'next', null, null, null, null, '{}', false, 10),
  ('p5', 'Crisis routing', 'Risk answers on screenings route to crisis handling.', 'Patient safety.', 'patient_intake', 'next', null, null, null, null, '{}', false, 11),
  ('p6', 'Returning-patient journey', 'Confirm what changed instead of collecting everything again.', 'Fewer patients lost between visits.', 'patient_intake', 'later', 4, 3, 2, 3, '{s2,c3}', false, 12),
  ('p7', 'Existing-patient migration', 'Bring existing patients into PractMD.', 'One record for every patient.', 'patient_intake', 'later', null, null, null, null, '{s5}', false, 13),
  ('v1', 'Provider records and login', 'Adding providers to the organization.', 'Providers exist in PractMD.', 'providers', 'now', 3, 2, 5, 3, '{f3}', false, 14),
  ('v2', 'Working hours and availability', 'Provider schedules that drive slot generation.', 'Bookable providers.', 'providers', 'next', null, null, null, null, '{v1}', false, 15),
  ('v3', 'Credentialing and payer enrollment', 'Track which payers each provider is enrolled with, and where.', 'Only payable visits get booked.', 'providers', 'next', null, null, null, null, '{v1}', false, 16),
  ('v4', 'Provider assignment', 'Match patients to providers, checking enrollment.', 'Right provider, paid visit.', 'providers', 'next', 4, 3, 3, 3, '{v3,r1}', false, 17),
  ('s1', 'Appointment requirements', 'Slot generation, visit types and fixed appointments.', 'Ready for build.', 'scheduling', 'now', null, null, null, null, '{}', false, 18),
  ('s2', 'Fixed appointments', 'Book, reschedule and cancel in PractMD.', 'Scheduling in PractMD.', 'scheduling', 'next', null, null, null, null, '{s1,v2}', false, 19),
  ('s3', 'Run in parallel with Office Ally', 'Staff enter appointments in both systems, notifications off.', 'Proof before switching.', 'scheduling', 'next', 4, 4, 5, 2, '{s2}', false, 20),
  ('s4', 'Reminders and pre-visit forms', 'Automated reminders and form assignment.', 'Fewer no-shows.', 'scheduling', 'next', null, null, null, null, '{s2,f6}', false, 21),
  ('s5', 'Switch scheduling from Office Ally', 'PractMD becomes the only scheduler.', 'One schedule.', 'scheduling', 'later', 4, 5, 2, 2, '{s3}', false, 22),
  ('s6', 'Reserved, self-scheduling and waitlist', 'Patients choose slots; open slots get filled.', 'Less phone tag.', 'scheduling', 'later', null, null, null, null, '{s5}', false, 23),
  ('c1', 'PractMD Telehealth (LiveKit)', 'Video visits inside PractMD, replacing Doxy.me.', 'Visit and record in one place.', 'care_delivery', 'next', 3, 4, 4, 1, '{s2}', false, 24),
  ('c2', 'Encounter and clinical note', 'The provider runs the visit and writes the note.', 'Care documented in PractMD.', 'care_delivery', 'next', 4, 4, 5, 2, '{s2}', true, 25),
  ('c3', 'Sign, co-sign and return plan', 'Signing closes the encounter; a return plan is set.', 'MVP: a provider signs a note.', 'care_delivery', 'next', null, null, null, null, '{c2}', true, 26),
  ('c4', 'Past notes in PractMD', 'Bring older Office Ally notes into PractMD.', 'Providers stop opening Office Ally for history.', 'care_delivery', 'later', 2, 4, 2, 3, '{c2}', false, 27),
  ('c5', 'e-Prescribing inside PractMD', 'Through an embedded partner; controlled substances need EPCS.', 'Providers stop opening Office Ally to prescribe.', 'care_delivery', 'later', 3, 4, 2, 2, '{c3}', false, 28),
  ('r1', 'Insurance verification (manual)', 'Structured verification workflow with patient updates.', 'Coverage known before booking.', 'revenue_cycle', 'next', 5, 4, 4, 3, '{f5}', false, 29),
  ('r2', 'Office Ally clearinghouse connection', 'PractMD sends eligibility checks and claims, and receives remittances and claim status.', 'The connection everything else rides on.', 'revenue_cycle', 'later', 5, 4, 4, 3, '{}', false, 30),
  ('r3', 'Claims from signed notes', 'Charges captured from the note; claims built in PractMD.', 'No charge re-entry.', 'revenue_cycle', 'later', 5, 4, 3, 2, '{c3,r2}', false, 31),
  ('r4', 'Remittance, denials and statements', 'Payments post back; denials worked; patients billed (Authorize.net connected).', 'Full revenue cycle in PractMD.', 'revenue_cycle', 'later', null, null, null, null, '{r3}', false, 32),
  ('r5', 'Automated eligibility', 'Eligibility checked through the clearinghouse.', 'Verification in minutes, not days.', 'revenue_cycle', 'later', null, null, null, null, '{r1,r2}', false, 33),
  ('r6', 'Prior authorization', 'Tracked in PractMD, sent through the clearinghouse where payers support it.', 'Less portal work.', 'revenue_cycle', 'later', 4, 4, 2, 3, '{r2}', false, 34),
  ('a1', 'Quill: scribe and coding', 'Live transcription, draft note, code suggestions.', 'Provider time back; better coding.', 'cortex_ai', 'next', 5, 5, 3, 2, '{c1,c2}', false, 35),
  ('a2', 'Mira: CRM team assistant', 'Follow-ups, drafts and next steps for the CRM team.', 'Faster intake to appointment.', 'cortex_ai', 'later', 2, 3, 1, 3, '{f5}', false, 36),
  ('a3', 'Nova: admin setup', 'Guided configuration for administrators.', 'Faster practice setup.', 'cortex_ai', 'later', 1, 2, 1, 3, '{f3}', false, 37),
  ('a4', 'Iris: call handling', 'Answers calls, books and routes.', 'Fewer missed calls.', 'cortex_ai', 'later', 3, 4, 1, 2, '{s2}', false, 38),
  ('a5', 'Luna: patient guidance', 'Guides patients through the portal.', 'Easier self-service.', 'cortex_ai', 'later', 2, 3, 1, 3, '{p4,p5}', false, 39),
  ('a6', 'Cleo: revenue cycle assistant', 'Claim checks and denial work.', 'Fewer denials.', 'cortex_ai', 'later', 4, 3, 1, 2, '{r3}', false, 40),
  ('t1', 'Outcome baselines', 'Form completion time, intake-to-appointment time, monthly SLA samples.', 'Proof the system is working.', 'adoption', 'now', 2, 4, 5, 5, '{}', false, 41),
  ('t2', 'Provider pilot: telehealth in PractMD', 'Volunteer providers run telehealth visits end to end in PractMD.', 'Adoption proven with real providers.', 'adoption', 'next', 4, 4, 3, 3, '{c1,c3,a1}', false, 42),
  ('t3', 'All visits in PractMD', 'Every visit type documented in PractMD.', 'One chart going forward.', 'adoption', 'later', null, null, null, null, '{t2,c4}', false, 43),
  ('t4', 'Providers fully off Office Ally', 'Office Ally remains only as the clearinghouse.', 'One system for everyone.', 'adoption', 'later', null, null, null, null, '{t3,c5,r3}', false, 44);
-- Items with null scores are deliberately unscored: score them live in the workshop.
