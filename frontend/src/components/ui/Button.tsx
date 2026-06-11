import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type Variant = 'solid' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  size?: Size
  caps?: boolean
  block?: boolean
  iconStart?: ReactNode
  iconEnd?: ReactNode
  as?: ElementType
}

export function Button({
  children,
  variant = 'solid',
  size = 'md',
  caps = false,
  block = false,
  iconStart,
  iconEnd,
  as: Tag = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    'vk-btn',
    `vk-btn--${variant}`,
    `vk-btn--${size}`,
    caps ? 'vk-btn--caps' : '',
    block ? 'vk-btn--block' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Tag className={cls} {...rest}>
      {iconStart}
      {children != null && <span>{children}</span>}
      {iconEnd}
    </Tag>
  )
}