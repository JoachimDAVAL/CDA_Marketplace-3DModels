interface LogoProps {
  size?: number
}

export function Logo({ size = 22 }: LogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <span
        style={{
          width: size,
          height: size,
          border: '1.5px solid var(--border-contrast)',
          borderRadius: 5,
          transform: 'rotate(45deg)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: size * 0.86,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
        }}
      >
        Abstract
      </span>
    </span>
  )
}