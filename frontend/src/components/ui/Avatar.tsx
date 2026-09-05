import type { ComponentPropsWithoutRef } from 'react'

interface AvatarProps extends ComponentPropsWithoutRef<'span'> {
  src?: string | null
  name?: string
  size?: number
}

export function Avatar({ src, name = '', size = 44, className = '', style, ...rest }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size,
        borderRadius: 'var(--radius-pill)',
        background: src ? 'transparent' : 'var(--surface-chip)',
        boxShadow: 'inset 0 0 0 1px var(--border-default)',
        overflow: 'hidden', flexShrink: 0,
        fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)',
        fontSize: size * 0.36, color: 'var(--text-secondary)',
        userSelect: 'none',
        ...style,
      }}
      {...rest}
    >
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (initials || null)}
    </span>
  )
}