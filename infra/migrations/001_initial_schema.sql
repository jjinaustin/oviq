-- ExceptionOS V1 Schema
-- Run in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Users
create table users (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  email text unique not null,
  full_name text,
  role text default 'operator',
  created_at timestamptz default now()
);

-- Shipments
create table shipments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  load_id text not null,
  customer_name text,
  customer_email text,
  carrier_name text,
  carrier_email text,
  carrier_phone text,
  origin text,
  destination text,
  pickup_scheduled timestamptz,
  delivery_scheduled timestamptz,
  pickup_actual timestamptz,
  delivery_actual timestamptz,
  status text default 'pending',
  raw_data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, load_id)
);

-- Cases (primary operational object)
create table cases (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  shipment_id uuid references shipments(id),
  playbook_id uuid,
  title text not null,
  status text default 'open',
  priority text default 'medium',
  assigned_to text,
  opened_at timestamptz default now(),
  resolved_at timestamptz,
  resolution_notes text,
  sla_deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exceptions (attached to cases)
create table exceptions (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  shipment_id uuid references shipments(id),
  exception_type text not null,
  detected_at timestamptz default now(),
  detected_by text default 'system',
  notes text,
  resolved boolean default false,
  resolved_at timestamptz
);

-- Tasks (owner: ai | human)
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  owner text not null, -- 'ai' | 'human'
  assigned_to text,
  title text not null,
  description text,
  status text default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Communications
create table communications (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  direction text not null, -- 'outbound' | 'inbound'
  participant_type text not null, -- 'carrier' | 'customer' | 'internal' | 'vendor'
  channel text default 'email',
  recipient_email text,
  recipient_name text,
  sender_email text,
  subject text,
  body text,
  sent_at timestamptz,
  status text default 'pending',
  external_message_id text,
  created_at timestamptz default now()
);

-- AI Actions (append-only audit trail)
create table ai_actions (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  action_type text not null,
  status text default 'pending',
  executed_at timestamptz,
  input_data jsonb default '{}',
  output_data jsonb default '{}',
  confidence_score float,
  model_used text,
  error_message text,
  created_at timestamptz default now()
);

-- Events (append-only timeline — NEVER DELETE, NEVER MUTATE)
create table events (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  shipment_id uuid references shipments(id),
  event_type text not null,
  actor text not null, -- 'system' | 'ai' | 'human'
  actor_id text,
  payload jsonb default '{}',
  summary text not null,
  created_at timestamptz default now()
);

-- Playbooks
create table playbooks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  name text not null,
  exception_type text not null,
  description text,
  steps jsonb default '[]',
  escalation_rules jsonb default '{}',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index idx_cases_status on cases(status);
create index idx_cases_priority on cases(priority);
create index idx_cases_shipment on cases(shipment_id);
create index idx_exceptions_case on exceptions(case_id);
create index idx_events_case on events(case_id);
create index idx_events_created on events(created_at);
create index idx_shipments_load_id on shipments(load_id);
create index idx_communications_case on communications(case_id);
create index idx_ai_actions_case on ai_actions(case_id);

-- Seed default playbooks
insert into playbooks (name, exception_type, description, steps, escalation_rules) values
(
  'Missed Pickup',
  'missed_pickup',
  'Automated response to missed pickup exceptions',
  '[
    {"order": 1, "action": "send_email", "owner": "ai", "config": {"template": "carrier_missed_pickup"}, "delay_minutes": 0},
    {"order": 2, "action": "create_task", "owner": "ai", "config": {"title": "Await carrier response"}, "delay_minutes": 60},
    {"order": 3, "action": "send_email", "owner": "ai", "config": {"template": "customer_delay_notification"}, "delay_minutes": 90},
    {"order": 4, "action": "escalate", "owner": "human", "config": {"reason": "No carrier response after 2 hours"}, "delay_minutes": 120}
  ]',
  '{"no_carrier_response_minutes": 120, "financial_threshold": 5000}'
),
(
  'Delayed Transit',
  'delayed_transit',
  'Automated response to in-transit delays',
  '[
    {"order": 1, "action": "send_email", "owner": "ai", "config": {"template": "carrier_eta_request"}, "delay_minutes": 0},
    {"order": 2, "action": "send_email", "owner": "ai", "config": {"template": "customer_delay_notification"}, "delay_minutes": 30},
    {"order": 3, "action": "create_task", "owner": "ai", "config": {"title": "Monitor ETA update"}, "delay_minutes": 60}
  ]',
  '{"escalate_if_no_eta_minutes": 180}'
),
(
  'Late Delivery',
  'late_delivery',
  'Automated response to missed delivery windows',
  '[
    {"order": 1, "action": "send_email", "owner": "ai", "config": {"template": "carrier_delivery_status"}, "delay_minutes": 0},
    {"order": 2, "action": "send_email", "owner": "ai", "config": {"template": "customer_delay_apology"}, "delay_minutes": 15},
    {"order": 3, "action": "escalate", "owner": "human", "config": {"reason": "Delivery missed SLA"}, "delay_minutes": 60}
  ]',
  '{"auto_escalate": true}'
),
(
  'Missing POD',
  'missing_pod',
  'Automated follow-up for missing proof of delivery',
  '[
    {"order": 1, "action": "send_email", "owner": "ai", "config": {"template": "carrier_pod_request"}, "delay_minutes": 0},
    {"order": 2, "action": "create_task", "owner": "ai", "config": {"title": "Follow up on POD"}, "delay_minutes": 1440},
    {"order": 3, "action": "escalate", "owner": "human", "config": {"reason": "POD not received after 48 hours"}, "delay_minutes": 2880}
  ]',
  '{"escalate_after_hours": 48}'
),
(
  'Carrier Unresponsive',
  'carrier_unresponsive',
  'Escalation workflow for unresponsive carriers',
  '[
    {"order": 1, "action": "send_email", "owner": "ai", "config": {"template": "carrier_urgent_contact"}, "delay_minutes": 0},
    {"order": 2, "action": "create_task", "owner": "human", "config": {"title": "Call carrier directly"}, "delay_minutes": 30},
    {"order": 3, "action": "escalate", "owner": "human", "config": {"reason": "Carrier unresponsive — manual intervention required"}, "delay_minutes": 60}
  ]',
  '{"immediate_human_escalation": true}'
),
(
  'Customer Complaint',
  'customer_complaint',
  'Response workflow for customer complaints',
  '[
    {"order": 1, "action": "send_email", "owner": "ai", "config": {"template": "customer_acknowledgement"}, "delay_minutes": 0},
    {"order": 2, "action": "create_task", "owner": "human", "config": {"title": "Review complaint and respond personally"}, "delay_minutes": 0},
    {"order": 3, "action": "escalate", "owner": "human", "config": {"reason": "Customer complaint requires personal response"}, "delay_minutes": 15}
  ]',
  '{"always_escalate": true}'
);
