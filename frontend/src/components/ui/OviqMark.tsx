interface OviqMarkProps {
  size?: number
  color?: string
  className?: string
}

export function OviqMark({ size = 32, color = '#27C9B6', className }: OviqMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-8 -8 116 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M 50 8 A 42 42 0 0 1 92 50 A 42 42 0 0 1 50 92 A 42 42 0 0 1 8 50 A 42 42 0 0 1 22.5 19.5"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="17.5" cy="26"   r="4.8" fill={color} opacity="0.55" />
      <circle cx="13.5" cy="33.5" r="3.2" fill={color} opacity="0.30" />
      <circle cx="11"   cy="41.5" r="1.9" fill={color} opacity="0.13" />
    </svg>
  )
}
