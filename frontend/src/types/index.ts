export type CaseStatus = 'open' | 'ai_resolving' | 'pending_human' | 'escalated' | 'resolved' | 'closed'
export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type ExceptionType =
  | 'missed_pickup' | 'delayed_transit' | 'late_delivery'
  | 'missing_pod' | 'carrier_unresponsive' | 'customer_complaint'

export interface Shipment {
  id: string
  load_id: string
  customer_name: string
  customer_email?: string
  carrier_name: string
  carrier_email?: string
  origin: string
  destination: string
  pickup_scheduled?: string
  delivery_scheduled?: string
  status: string
  created_at: string
}

export interface Exception {
  id: string
  case_id: string
  exception_type: ExceptionType
  detected_at: string
  detected_by: string
  resolved: boolean
}

export interface Event {
  id: string
  case_id: string
  event_type: string
  actor: 'system' | 'ai' | 'human'
  actor_id?: string
  summary: string
  payload?: Record<string, unknown>
  created_at: string
}

export interface Task {
  id: string
  case_id: string
  owner: 'ai' | 'human'
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed'
  due_at?: string
  created_at: string
}

export interface Communication {
  id: string
  case_id: string
  direction: 'outbound' | 'inbound'
  participant_type: 'carrier' | 'customer' | 'internal' | 'vendor'
  subject?: string
  body: string
  recipient_name?: string
  sent_at?: string
  status: string
  created_at: string
}

export interface AIAction {
  id: string
  case_id: string
  action_type: string
  status: string
  executed_at?: string
  confidence_score?: number
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  created_at: string
}

export interface Case {
  id: string
  shipment_id: string
  title: string
  status: CaseStatus
  priority: CasePriority
  assigned_to?: string
  opened_at: string
  resolved_at?: string
  resolution_notes?: string
  created_at: string
  shipments?: Shipment
  exceptions?: Exception[]
  events?: Event[]
  tasks?: Task[]
  communications?: Communication[]
  ai_actions?: AIAction[]
}
