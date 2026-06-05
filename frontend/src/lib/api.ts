const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  cases: {
    list: (params?: { status?: string; priority?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString()
      return request<any[]>(`/api/v1/cases${q ? `?${q}` : ''}`)
    },
    get: (id: string) => request<any>(`/api/v1/cases/${id}`),
    resolve: (id: string, notes?: string) =>
      request(`/api/v1/cases/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      }),
  },
  shipments: {
    list: () => request<any[]>('/api/v1/shipments'),
    get: (id: string) => request<any>(`/api/v1/shipments/${id}`),
  },
  events: {
    list: (caseId: string) => request<any[]>(`/api/v1/events/${caseId}`),
  },
  ingest: {
    csv: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE}/api/v1/ingest/csv`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
      return res.json()
    },
  },
}
