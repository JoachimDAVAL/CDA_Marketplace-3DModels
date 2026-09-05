const DIAMOND =
  'M 15.784 2.866 C 16.561 1.569 18.439 1.569 19.216 2.866 L 23.926 10.732 C 24.086 11 24.307 11.227 24.571 11.394 L 32.333 16.31 C 33.572 17.096 33.572 18.904 32.333 19.69 L 24.571 24.606 C 24.307 24.773 24.086 25 23.926 25.268 L 19.216 33.134 C 18.439 34.431 16.561 34.431 15.784 33.134 L 11.074 25.268 C 10.914 25 10.693 24.773 10.429 24.606 L 2.667 19.69 C 1.428 18.904 1.428 17.096 2.667 16.31 L 10.429 11.394 C 10.693 11.227 10.914 11 11.074 10.732 L 15.784 2.866 Z'

interface RatingProps {
  value?: number
  max?: number
  size?: number
  showValue?: boolean
  className?: string
}

export function Rating({ value = 0, max = 5, size = 20, showValue = true, className = '' }: RatingProps) {
  const v = Math.max(0, Math.min(max, Math.round(value)))
  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}
      role="img"
      aria-label={`${v} sur ${max}`}
    >
      <div style={{ display: 'inline-flex', gap: size * 0.28 }}>
        {Array.from({ length: max }).map((_, i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 35 36" fill="none" style={{ display: 'block' }}>
            <path d={DIAMOND} fill={i < v ? 'var(--rating)' : 'var(--rating-empty)'} />
          </svg>
        ))}
      </div>
      {showValue && (
        <span style={{
          marginLeft: size * 0.4,
          fontFamily: 'var(--font-sans)',
          fontSize: size * 0.95,
          color: 'var(--text-secondary)',
          lineHeight: 1,
        }}>
          <b style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-medium)' }}>{v}</b>
          {' / '}{max}
        </span>
      )}
    </div>
  )
}