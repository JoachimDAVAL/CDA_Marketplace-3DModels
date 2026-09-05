import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type Variant = 'solid' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonBaseProps = {
  variant?: Variant
  size?: Size
  caps?: boolean
  block?: boolean
  iconStart?: ReactNode
  iconEnd?: ReactNode
  className?: string
  children?: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export type ButtonProps<T extends ElementType = 'button'> = {
  as?: T
} & ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonBaseProps | 'as'>

export function Button<T extends ElementType = 'button'>({
  children,
  variant = 'solid',
  size = 'md',
  caps = false,
  block = false,
  iconStart,
  iconEnd,
  as,
  className = '',
  ...rest
}: ButtonProps<T>) {
  const Tag = (as ?? 'button') as any
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