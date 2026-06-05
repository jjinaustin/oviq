'use client'
import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Import Shipments</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Upload a CSV export from your TMS to detect exceptions automatically
        </p>
      </div>

      {!result ? (
        <>
          {/* Drop zone */}
          <Card
            className="border-dashed cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center py-16 px-8 text-center"
              style={{ background: dragging ? 'var(--surface-2)' : 'transparent' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--surface-2)' }}>
                <Upload size={20} style={{ color: 'var(--text-3)' }} />
              </div>
              {file ? (
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{file.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Drop your CSV here or click to browse
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                    Supports exports from McLeod, Aljex, Ascend, and most TMS formats
                  </p>
                </>
              )}
            </div>
          </Card>
          <input ref={inputRef} type="file" accept=".csv" className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)} />

          {/* Expected columns */}
          <div className="mt-5 p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-2)' }}>Expected CSV columns</p>
            <div className="flex flex-wrap gap-2">
              {['Load ID', 'Customer', 'Carrier', 'Origin', 'Destination', 'Pickup Date', 'Delivery Date', 'Status'].map(col => (
                <span key={col} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
              Column names are flexible — common aliases are mapped automatically.
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md border flex items-center gap-2"
              style={{ background: 'rgb(239 68 68 / 0.1)', borderColor: 'rgb(239 68 68 / 0.3)' }}>
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <Button variant="primary" disabled={!file || uploading} onClick={handleUpload}>
              {uploading ? 'Processing...' : 'Import Shipments'}
            </Button>
            {file && <Button variant="ghost" onClick={() => setFile(null)}>Clear</Button>}
          </div>
        </>
      ) : (
        /* Result */
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-400/10">
              <CheckCircle size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Import complete</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Shipments processed and exceptions detected</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Shipments Created', value: result.shipments_created },
              { label: 'Skipped (duplicate)', value: result.shipments_skipped },
              { label: 'Cases Opened', value: result.cases_opened },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-4 text-center"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => router.push('/cases')}>View Cases</Button>
            <Button variant="ghost" onClick={() => { setResult(null); setFile(null) }}>Import More</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
