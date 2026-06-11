import type { ComponentPropsWithoutRef } from 'react'

type BadgeTone = 'neutral' | 'solid' | 'success' | 'warning' | 'danger'

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--surface-chip)',       fg: 'var(--text-secondary)' },
  solid:   { bg: 'var(--white)',               fg: 'var(--text-inverse)'   },
  success: { bg: 'rgba(95,191,143,0.16)',      fg: 'var(--success)'        },
  warning: { bg: 'rgba(224,177,90,0.16)',      fg: 'var(--warning)'        },
  danger:  { bg: 'rgba(226,103,95,0.16)',      fg: 'var(--danger)'         },
}

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone
  dot?: boolean
}

export function Badge({ children, tone = 'neutral', dot = false, className = '', style, ...rest }: BadgeProps) {
  const t = TONES[tone]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: dot ? 'transparent' : t.bg,
        color: t.fg,
        fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--fs-caption)', lineHeight: 1,
        padding: dot ? '0' : '4px 9px',
        borderRadius: 'var(--radius-pill)',
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.fg, flexShrink: 0 }} />
      )}
      {children}
    </span>
  )
}