interface OviqMarkProps { size?: number; className?: string }

export function OviqMark({ size = 26, className = '' }: OviqMarkProps) {
  return (
    <svg className={`glyph ${className}`} width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="8" strokeLinecap="round" />
      <circle cx="88.6" cy="15.2" r="7.6" />
    </svg>
  )
}

export function OviqWordmark({ size = 21, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span className={`wm ${dark ? 'on-dark' : ''}`} style={{ fontSize: size }}>
      ov<span className="i">ı<b></b></span>q
    </span>
  )
}
