import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface ChipProps extends ComponentPropsWithoutRef<'span'> {
  selected?: boolean
  mono?: boolean
  iconStart?: ReactNode
  onClick?: React.MouseEventHandler<HTMLSpanElement>
}

export function Chip({
  children,
  selected = false,
  mono = false,
  onClick,
  iconStart,
  className = '',
  ...rest
}: ChipProps) {
  const interactive = !!onClick
  const cls = [
    'vk-chip',
    selected ? 'vk-chip--selected' : '',
    mono ? 'vk-chip--mono' : '',
    interactive ? 'vk-chip--interactive' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span
      className={cls}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!(e as unknown as React.MouseEvent<HTMLSpanElement>) } }
          : undefined
      }
      {...rest}
    >
      {iconStart}
      {children}
    </span>
  )
}