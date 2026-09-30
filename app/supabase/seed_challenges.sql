-- PractMD Challenges — seed. Run after seed.sql.
-- Spec: docs/product-roadmap-and-challenges-spec.md (Part 2, §3c).

insert into public.challenge_categories (code, name, color, sort_order) values
  ('product_platform','Product and platform','#1D4E9E',1),
  ('penfield_office_ally','Penfield systems and Office Ally','#02979D',2),
  ('operations_process','Operations and process','#D97706',3),
  ('people_team','People and team','#7C3AED',4),
  ('ai','AI and Cortex','#001A57',5);

insert into public.challenges (title, description, category, ask) values
  ('One person owns all of product', 'End-user conversations, requirements, Jira, prioritization, roadmap, PostHog analytics and case studies, user research, UI/UX, prototyping, presenting to engineering, rework and leading testing all sit with one person.', 'product_platform', 'How should the product function be structured, and what should be hired or delegated first?'),
  ('No time estimates on milestones', 'Without estimates, milestones drift and there is no reliable answer to "when".', 'product_platform', 'What estimation practice works for a team this size?'),
  ('No test environment', 'Testing runs on one of the live tenants, which puts real data and releases at risk.', 'product_platform', null),
  ('Prioritization is not yet effective', 'The backlog mixes features and ad hoc requests rather than dependency-ordered user stories.', 'product_platform', 'How would you run prioritization with this team?'),
  ('Outcomes are not measured yet', 'Form completion averaged 70 to 85 minutes before the mobile redesign; the after number and intake-to-appointment time are not yet tracked.', 'product_platform', null),
  ('Every module needs a transition plan', 'Shipping a feature is not enough: staff have to move off Office Ally for that stage without disrupting operations.', 'product_platform', null),
  ('Providers will work in two systems for a while', 'Until e-prescribing and claims run in PractMD, providers still open Office Ally to prescribe, and billing re-keys charges.', 'product_platform', 'How would you drive provider adoption through a two-system period?'),
  ('AI has no architecture yet', 'Agents need a working product underneath them, and where to deploy AI first is still open.', 'product_platform', 'Where should AI enter the priority list?'),
  ('Thirteen disconnected tools', 'Staff work across PractMD, Office Ally, phone vendors, email, fax and payment tools for one patient journey.', 'penfield_office_ally', null),
  ('Notes retyped from Doxy.me', 'The visit conversation stays in Doxy.me and the provider rewrites it into Office Ally.', 'penfield_office_ally', null),
  ('Prior authorization by hand', 'Worked in each payer''s portal, outside any system.', 'penfield_office_ally', null),
  ('No single record of patient contact', 'Calls, voicemail and after-hours sit with three different vendors.', 'penfield_office_ally', null),
  ('Manual reporting', 'Operational reports are built in Excel and PowerPoint each time.', 'penfield_office_ally', null),
  ('Clearinghouse connection not yet confirmed', 'PractMD needs to connect to Office Ally as a submitter for eligibility, claims and remittance. Method, enrollment steps and cost are to be confirmed.', 'penfield_office_ally', null),
  ('e-Prescribing is the last tie to Office Ally', 'Psychiatry prescribes controlled substances, so e-prescribing inside PractMD needs an EPCS-certified partner.', 'penfield_office_ally', null),
  ('Biju''s list', 'Process and people challenges, added live during Biju''s session.', 'operations_process', null);
