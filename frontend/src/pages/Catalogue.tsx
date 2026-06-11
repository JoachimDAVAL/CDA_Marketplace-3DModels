import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Model3D, Category, PaginatedResponse } from '../types'
import { Button, Icon, Avatar, Pagination } from '../components/ui'
import { ModelCard } from '../components/models/ModelCard'
import { FiltersPanel } from '../components/catalogue/FiltersPanel'
import { useCart } from '../contexts/CartContext'

function formatPrice(price: string): string {
  const n = parseFloat(price)
  return n === 0 ? 'Gratuit' : `${n.toFixed(2)} €`
}

export default function Catalogue() {
  const navigate = useNavigate()
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

  // Spotlight = premier modèle
  const spotlight = models[0] ?? null
  const spotlightThumb = spotlight?.files?.find(f => f.fileType === 'RENDER_IMAGE')

  // Créateurs — 3 premiers artistes uniques
  const creatorsMap = new Map<string, Model3D['artist']>()
  for (const m of models) {
    if (m.artist && !creatorsMap.has(m.artistId)) creatorsMap.set(m.artistId, m.artist)
    if (creatorsMap.size >= 3) break
  }
  const creators = Array.from(creatorsMap.entries())

  const heroBg = spotlightThumb?.url

  return (
    <div>
      {/* ── Hero ── */}
      <div className="vk-hero">
        <div
          className="vk-hero__bg"
          style={heroBg
            ? { backgroundImage: `url(${heroBg})` }
            : { background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)' }}
        />
        <div className="vk-hero__scrim" />
        <div className="vk-hero__inner">
          <span className="vk-hero__eyebrow">Marketplace de modèles 3D</span>
          <h1 className="vk-hero__title">Des actifs 3D<br />prêts à l'emploi</h1>
          <p className="vk-hero__sub">
            Explorez des milliers de modèles 3D créés par des artistes indépendants.
            Téléchargez, créez, publiez.
          </p>
          <div className="vk-hero__actions">
            <Button variant="solid" size="lg" caps onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>
              Explorer
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/become-artist')}>
              Devenir créateur
            </Button>
          </div>
        </div>
      </div>

      <div className="vk-container">

        {/* ── Spotlight ── */}
        {spotlight && (
          <section className="vk-section vk-section--spotlight">
            <div className="vk-section__head">
              <h2 className="vk-section__title">En vedette</h2>
            </div>
            <div className="vk-spotlight" onClick={() => navigate(`/models/${spotlight.id}`)}>
              <div
                className="vk-spotlight__media"
                style={spotlightThumb
                  ? { backgroundImage: `url(${spotlightThumb.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : {}}
              >
                <span className="vk-spotlight__tag">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Nouveau
                  </span>
                </span>
                <span className="vk-spotlight__views">
                  <Icon name="download" size={12} />
                  {spotlight.downloadCount}
                </span>
              </div>
              <div className="vk-spotlight__body">
                <span className="vk-spotlight__eyebrow">
                  {spotlight.category?.name ?? 'Modèle 3D'}
                </span>
                <h3 className="vk-spotlight__title">{spotlight.title}</h3>
                <p className="vk-spotlight__desc">
                  {spotlight.description.length > 200
                    ? spotlight.description.slice(0, 200) + '…'
                    : spotlight.description}
                </p>
                <div className="vk-spotlight__foot">
                  <span className="vk-spotlight__price">{formatPrice(spotlight.price)}</span>
                  <Button variant="solid" caps onClick={e => { e.stopPropagation(); navigate(`/models/${spotlight.id}`) }}>
                    Voir le modèle
                  </Button>
                  <Button variant="outline" onClick={e => { e.stopPropagation(); navigate(`/artists/${spotlight.artistId}`) }}>
                    {spotlight.artist?.user?.username ?? 'Artiste'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Créateurs ── */}
        {creators.length > 0 && (
          <section className="vk-section vk-section--tight">
            <div className="vk-section__head">
              <h2 className="vk-section__title">Créateurs</h2>
            </div>
            <div className="vk-creators">
              {creators.map(([artistId, artist]) => {
                if (!artist) return null
                const name = artist.user?.username ?? `${artist.firstname} ${artist.lastname}`.trim()
                return (
                  <div key={artistId} className="vk-creator" onClick={() => navigate(`/artists/${artistId}`)}>
                    <Avatar src={artist.user?.avatar ?? undefined} name={name} size={44} />
                    <div className="vk-creator__info">
                      <span className="vk-creator__name">{name}</span>
                      <span className="vk-creator__meta">Artiste</span>
                    </div>
                    <Icon name="chevron-right" size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Catalogue ── */}
        <section className="vk-section" id="catalogue">
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
    </div>
  )
}