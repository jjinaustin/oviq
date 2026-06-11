'use client'
import { useEffect, useState } from 'react'
import { Shipment } from '@/types'
import { api } from '@/lib/api'
import { DashboardShell } from '@/components/layout/DashboardShell'
import Link from 'next/link'

function statusBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'delivered') return <span className="badge teal"><span className="dot"/>Delivered</span>
  if (s === 'delayed') return <span className="badge amber"><span className="dot"/>Delayed</span>
  if (s === 'in_transit' || s === 'in transit') return <span className="badge teal"><span className="dot"/>In transit</span>
  if (s === 'pending') return <span className="badge gray"><span className="dot"/>Pending</span>
  return <span className="badge gray"><span className="dot"/>{status}</span>
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.shipments.list().then(setShipments).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardShell>
      <header className="topbar">
        <div>
          <h1>Shipments</h1>
          <div className="sub">{loading ? '—' : shipments.length} shipments imported</div>
        </div>
        <div className="topbar-right">
          <Link href="/ingest" className="btn btn-primary btn-sm">Import CSV</Link>
        </div>
      </header>

      <div className="content">
        <div className="panel">
          {shipments.length === 0 && !loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--body)', fontSize: 14 }}>No shipments yet.</p>
              <p style={{ color: 'var(--faint)', fontSize: 13, marginTop: 6 }}>Import a CSV export from your TMS to get started.</p>
              <Link href="/ingest" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>Import now</Link>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Load ID</th>
                  <th>Customer</th>
                  <th>Carrier</th>
                  <th>Route</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><span className="id">{s.load_id}</span></td>
                    <td className="strong">{s.customer_name}</td>
                    <td>{s.carrier_name}</td>
                    <td className="dim" style={{ whiteSpace: 'nowrap' }}>{s.origin} → {s.destination}</td>
                    <td className="dim" style={{ whiteSpace: 'nowrap' }}>{s.pickup_scheduled ? new Date(s.pickup_scheduled).toLocaleDateString() : '—'}</td>
                    <td className="dim" style={{ whiteSpace: 'nowrap' }}>{s.delivery_scheduled ? new Date(s.delivery_scheduled).toLocaleDateString() : '—'}</td>
                    <td>{statusBadge(s.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
