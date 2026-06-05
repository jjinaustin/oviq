import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CasePriority, CaseStatus, ExceptionType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(date))
}

export function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export const PRIORITY_CONFIG: Record<CasePriority, { label: string; color: string; dot: string }> = {
  low:      { label: 'Low',      color: 'var(--text-3)',   dot: '#3d5068' },
  medium:   { label: 'Medium',   color: '#f0a030',         dot: '#f0a030' },
  high:     { label: 'High',     color: '#e07830',         dot: '#e07830' },
  critical: { label: 'Critical', color: 'var(--danger)',   dot: '#e05050' },
}

export const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string; border: string }> = {
  open:          { label: 'Open',            color: 'var(--text-2)',  bg: 'rgba(122,143,168,0.08)', border: 'rgba(122,143,168,0.2)' },
  ai_resolving:  { label: 'AI Resolving',    color: 'var(--aqua)',    bg: 'var(--aqua-dim)',         border: 'rgba(39,201,182,0.25)' },
  pending_human: { label: 'Needs Attention', color: '#f0a030',        bg: 'rgba(240,160,48,0.1)',    border: 'rgba(240,160,48,0.25)' },
  escalated:     { label: 'Escalated',       color: 'var(--danger)',  bg: 'rgba(224,80,80,0.1)',     border: 'rgba(224,80,80,0.25)' },
  resolved:      { label: 'Resolved',        color: 'var(--aqua)',    bg: 'var(--aqua-dim)',         border: 'rgba(39,201,182,0.25)' },
  closed:        { label: 'Closed',          color: 'var(--text-3)',  bg: 'rgba(61,80,104,0.1)',     border: 'rgba(61,80,104,0.2)' },
}

export const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  missed_pickup:        'Missed Pickup',
  delayed_transit:      'Delayed Transit',
  late_delivery:        'Late Delivery',
  missing_pod:          'Missing POD',
  carrier_unresponsive: 'Carrier Unresponsive',
  customer_complaint:   'Customer Complaint',
}
