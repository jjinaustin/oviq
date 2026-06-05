'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { OviqMark } from '@/components/ui/OviqMark'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <OviqMark size={36} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
