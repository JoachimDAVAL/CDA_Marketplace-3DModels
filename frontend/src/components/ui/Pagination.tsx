import { Icon } from './Icon'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null
  return (
    <div className="vk-pager">
      <button
        className="vk-pager__arrow"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Précédent"
      >
        <Icon name="chevron-left" size={16} />
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={['vk-pager__num', p === page ? 'vk-pager__num--active' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="vk-pager__arrow"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Suivant"
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </div>
  )
}