import Link from 'next/link'
import { OviqMark, OviqWordmark } from '@/components/ui/OviqMark'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  footerText: string
  footerLink: string
  footerHref: string
  proofPoints?: string[]
  signupMode?: boolean
}

export function AuthLayout({
  children, title, subtitle, footerText, footerLink, footerHref,
  proofPoints, signupMode = false
}: AuthLayoutProps) {
  const defaultProof = signupMode ? [
    'Live on top of your TMS in days',
    'No rip-and-replace — keep your stack',
    'Every action logged for audit',
  ] : [
    '142 exceptions resolved today',
    'Only 3 items needed a person',
    '~6.5 hours saved across the team',
  ]
  const proof = proofPoints || defaultProof
  const headline = signupMode
    ? <>'Handle the first 80% <em>automatically.</em></>
    : <>'Exception operations,<br /><em>on autopilot.</em></>
  const subtext = signupMode
    ? 'Create your workspace and connect a TMS export. Oviq starts detecting and resolving exceptions in minutes.'
    : "Sign in to see what Oviq has handled while you were away — and the few things that need your judgment."

  return (
    <div className="auth">
      <div className="auth-brand">
        <div className="glow" />
        <Link href="https://oviq.io" className="logo">
          <OviqMark size={28} className="on-dark" />
          <OviqWordmark size={23} dark />
        </Link>
        <div className="mid">
          <h2>{headline}</h2>
          <p>{subtext}</p>
          <div className="auth-proof">
            {proof.map(p => (
              <div className="row" key={p}>
                <span className="d">
                  <svg viewBox="0 0 12 12" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.3l2.4 2.4L9.6 3.4" stroke="white" />
                  </svg>
                </span>
                <span className="t">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="foot">OVIQ — AI EXCEPTION OPERATIONS</div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          {children}
          <p className="auth-foot">
            {footerText} <Link href={footerHref}>{footerLink}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
