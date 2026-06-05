'use client'
import { useEffect, useState } from 'react'
import { Shipment } from '@/types'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Truck } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.shipments.list().then(setShipments).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Shipments</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          {loading ? '—' : shipments.length} shipments imported
        </p>
      </div>
      <Card>
        {shipments.length === 0 && !loading ? (
          <EmptyState icon={Truck} title="No shipments yet" description="Import a CSV to get started" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                {['Load ID', 'Customer', 'Carrier', 'Origin → Destination', 'Pickup', 'Delivery', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id} className="border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{s.load_id}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{s.customer_name}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{s.carrier_name}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-3)' }}>{s.origin} → {s.destination}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-3)' }}>{formatDateShort(s.pickup_scheduled)}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-3)' }}>{formatDateShort(s.delivery_scheduled)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs capitalize px-2 py-0.5 rounded"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
