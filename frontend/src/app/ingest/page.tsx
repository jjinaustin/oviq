'use client'
import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

type Result = { shipments_created: number; shipments_skipped: number; cases_opened: number }

export default function IngestPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await api.ingest.csv(file)
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Import Shipments</h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Upload a CSV export from your TMS to detect exceptions automatically
            </p>
          </div>

          {!result ? (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className="rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center py-14 px-8 text-center mb-4"
                style={{
                  borderColor: dragging ? 'var(--aqua)' : 'var(--border-2)',
                  background: dragging ? 'var(--aqua-dim)' : 'var(--surface)',
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--surface-2)' }}>
                  <Upload size={20} style={{ color: file ? 'var(--aqua)' : 'var(--text-3)' }} />
                </div>
                {file ? (
                  <div className="flex items-center gap-2">
                    <FileText size={16} style={{ color: 'var(--aqua)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{file.name}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Drop your CSV here or click to browse
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      Supports McLeod, Aljex, Ascend, and most TMS formats
                    </p>
                  </>
                )}
              </div>
              <input ref={inputRef} type="file" accept=".csv" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />

              <div className="rounded-lg border p-4 mb-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Expected columns</p>
                <div className="flex flex-wrap gap-2">
                  {['Load ID', 'Customer', 'Carrier', 'Origin', 'Destination', 'Pickup Date', 'Delivery Date', 'Status'].map(col => (
                    <span key={col} className="text-xs px-2 py-1 rounded"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Column names are flexible — common aliases mapped automatically.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-md border flex items-center gap-2"
                  style={{ background: 'rgba(224,80,80,0.1)', borderColor: 'rgba(224,80,80,0.3)' }}>
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="primary" disabled={!file || uploading} onClick={handleUpload}>
                  {uploading ? 'Processing...' : 'Import Shipments'}
                </Button>
                {file && <Button variant="ghost" onClick={() => setFile(null)}>Clear</Button>}
              </div>
            </>
          ) : (
            <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(39,201,182,0.1)', border: '1px solid rgba(39,201,182,0.25)' }}>
                <CheckCircle size={20} style={{ color: 'var(--aqua)' }} />
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>Import complete</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Shipments processed and exceptions detected</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Shipments Created', value: result.shipments_created },
                  { label: 'Skipped', value: result.shipments_skipped },
                  { label: 'Cases Opened', value: result.cases_opened },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-4"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <p className="text-xl font-bold" style={{ color: value > 0 ? 'var(--aqua)' : 'var(--text)', letterSpacing: '-0.02em' }}>{value}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={() => router.push('/cases')}>View Cases</Button>
                <Button variant="ghost" onClick={() => { setResult(null); setFile(null) }}>Import More</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
