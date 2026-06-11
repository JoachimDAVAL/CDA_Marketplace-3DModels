import type { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  items: TabItem[]
  value?: string
  onChange?: (id: string) => void
  variant?: 'pill' | 'line'
  className?: string
}

export function Tabs({ items, value, onChange, variant = 'pill', className = '' }: TabsProps) {
  const active = value ?? items[0]?.id
  return (
    <div
      className={['vk-tabs', `vk-tabs--${variant}`, className].filter(Boolean).join(' ')}
      role="tablist"
    >
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={active === it.id}
          className="vk-tab"
          onClick={() => onChange?.(it.id)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  )
}