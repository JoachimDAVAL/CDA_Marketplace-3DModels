import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Model3D, Category, PaginatedResponse } from '../types'
import { Pagination } from '../components/ui'
import { ModelCard } from '../components/models/ModelCard'
import { FiltersPanel } from '../components/catalogue/FiltersPanel'
import { useCart } from '../contexts/CartContext'

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { addItem, openCart } = useCart()

  const categoryId = searchParams.get('categoryId')
  const sortBy     = searchParams.get('sortBy') ?? 'newest'
  const page       = Number(searchParams.get('page') ?? '1')

  const [models,     setModels]     = useState<Model3D[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '12', sortBy })
    if (categoryId) params.set('categoryId', categoryId)
    const res = await api.get<PaginatedResponse<Model3D>>(`/models?${params}`)
    setModels(res.data)
    setTotal(res.meta.total)
    setTotalPages(res.meta.totalPages)
    setLoading(false)
  }, [page, sortBy, categoryId])

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {})
  }, [])

  useEffect(() => { fetchModels() }, [fetchModels])

  const handlePage = (p: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="vk-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <section className="vk-section">
        <div className="vk-section__head">
          <h2 className="vk-section__title">Catalogue</h2>
          <span className="vk-section__meta">{total} modèle{total !== 1 ? 's' : ''}</span>
        </div>

        <FiltersPanel categories={categories} />

        {loading ? (
          <div className="vk-empty">Chargement…</div>
        ) : models.length === 0 ? (
          <div className="vk-empty">Aucun modèle dans cette catégorie.</div>
        ) : (
          <>
            <div className="vk-grid">
              {models.map(model => (
                <ModelCard key={model.id} model={model} onAddToCart={id => addItem(id).then(openCart)} />
              ))}
            </div>
            <Pagination page={page} pageCount={totalPages} onChange={handlePage} />
          </>
        )}
      </section>
    </div>
  )
}
