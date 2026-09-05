import { useSearchParams } from 'react-router-dom'
import type { Category } from '../../types'
import { Chip, SortMenu } from '../ui'
import type { SortOption } from '../ui'

export const SORT_OPTIONS: SortOption[] = [
  { id: 'newest',     label: 'Plus récents' },
  { id: 'popular',    label: 'Plus populaires' },
  { id: 'price_asc',  label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' },
]

interface FiltersPanelProps {
  categories: Category[]
}

export function FiltersPanel({ categories }: FiltersPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategoryId = searchParams.get('categoryId')
  const sortBy = searchParams.get('sortBy') ?? 'newest'

  const setCategory = (id: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (id) next.set('categoryId', id)
      else next.delete('categoryId')
      next.delete('page')
      return next
    })
  }

  const setSort = (val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('sortBy', val)
      next.delete('page')
      return next
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
      <Chip selected={!activeCategoryId} onClick={() => setCategory(null)}>
        Tous
      </Chip>
      {categories.map(cat => (
        <Chip
          key={cat.id}
          selected={activeCategoryId === cat.id}
          onClick={() => setCategory(cat.id)}
        >
          {cat.name}
        </Chip>
      ))}
      <div style={{ flex: 1 }} />
      <SortMenu options={SORT_OPTIONS} value={sortBy} onChange={setSort} />
    </div>
  )
}