import { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'

export interface SortOption {
  id: string
  label: string
}

interface SortMenuProps {
  options: SortOption[]
  value: string
  onChange: (id: string) => void
}

export function SortMenu({ options, value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.id === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="vk-sort" ref={ref}>
      <button className="vk-sort__btn" onClick={() => setOpen((o) => !o)}>
        <span className="vk-sort__label">Trier&nbsp;:</span>
        {current?.label}
        <Icon
          name="chevron-down"
          size={15}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--dur-base) var(--ease-standard)',
          }}
        />
      </button>
      {open && (
        <div className="vk-sort__menu">
          {options.map((o) => (
            <button
              key={o.id}
              className={['vk-sort__item', o.id === value ? 'vk-sort__item--active' : ''].filter(Boolean).join(' ')}
              onClick={() => { onChange(o.id); setOpen(false) }}
            >
              {o.label}
              {o.id === value && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}