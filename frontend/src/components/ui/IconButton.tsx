import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  size?: number
  variant?: 'ghost' | 'outline'
  label: string
  children: ReactNode
}

export function IconButton({
  children,
  size = 40,
  variant = 'ghost',
  label,
  className = '',
  ...rest
}: IconButtonProps) {
  const cls = [
    'vk-iconbtn',
    variant === 'outline' ? 'vk-iconbtn--outline' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={cls}
      style={{ width: size, height: size }}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  )
}