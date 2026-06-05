-- Row Level Security
-- Run after 001_initial_schema.sql
-- These policies ensure each organization only sees its own data.
-- The backend uses the service role key (bypasses RLS).
-- The frontend will use the anon/user key (subject to RLS).

-- Enable RLS on all tables
alter table organizations   enable row level security;
alter table users           enable row level security;
alter table shipments       enable row level security;
alter table cases           enable row level security;
alter table exceptions      enable row level security;
alter table tasks           enable row level security;
alter table communications  enable row level security;
alter table ai_actions      enable row level security;
alter table events          enable row level security;
alter table playbooks       enable row level security;

-- Helper: get the org_id from the current user's JWT
create or replace function current_org_id()
returns uuid language sql stable as $$
  select (auth.jwt() ->> 'org_id')::uuid
$$;

-- Shipments: org-scoped
create policy "org_shipments" on shipments
  for all using (organization_id = current_org_id());

-- Cases: org-scoped
create policy "org_cases" on cases
  for all using (organization_id = current_org_id());

-- Child tables: inherit via case or shipment
create policy "org_exceptions" on exceptions
  for all using (
    exists (select 1 from cases c where c.id = exceptions.case_id and c.organization_id = current_org_id())
  );

create policy "org_events" on events
  for all using (
    exists (select 1 from cases c where c.id = events.case_id and c.organization_id = current_org_id())
  );

create policy "org_tasks" on tasks
  for all using (
    exists (select 1 from cases c where c.id = tasks.case_id and c.organization_id = current_org_id())
  );

create policy "org_communications" on communications
  for all using (
    exists (select 1 from cases c where c.id = communications.case_id and c.organization_id = current_org_id())
  );

create policy "org_ai_actions" on ai_actions
  for all using (
    exists (select 1 from cases c where c.id = ai_actions.case_id and c.organization_id = current_org_id())
  );

-- Playbooks: org-scoped OR system defaults (organization_id is null)
create policy "org_playbooks" on playbooks
  for all using (organization_id = current_org_id() or organization_id is null);

-- Users: can only see users in their own org
create policy "org_users" on users
  for all using (organization_id = current_org_id());
