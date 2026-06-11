import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Model3D } from '../types'
import { Button, Chip, Icon, Rating, Tabs } from '../components/ui'
import type { TabItem } from '../components/ui'
import { Viewer3D } from '../components/viewer/Viewer3D'
import { ReviewsList } from '../components/reviews/ReviewsList'

const TABS: TabItem[] = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'reviews', label: 'Avis' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatPrice(price: string): string {
  const n = parseFloat(price)
  return n === 0 ? 'Gratuit' : `${n.toFixed(2)} €`
}

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [model, setModel] = useState<Model3D | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<Model3D>(`/models/${id}`)
      .then(setModel)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
        Chargement…
      </div>
    )
  }

  if (notFound || !model) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 'calc(100vh - 80px)' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Modèle introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Retour au catalogue</Button>
      </div>
    )
  }

  const previewFile = model.files?.find(f => f.fileType === 'PREVIEW_3D')
  const sourceFiles = model.files?.filter(f => f.fileType === 'SOURCE_3D') ?? []
  const formats = [
    ...new Set(
      sourceFiles
        .map(f => f.filename.split('.').pop()?.toUpperCase())
        .filter((x): x is string => Boolean(x))
    ),
  ]
  const totalSize = (model.files ?? []).reduce((sum, f) => sum + f.size, 0)
  const artistName =
    model.artist?.user?.username ??
    (`${model.artist?.firstname ?? ''} ${model.artist?.lastname ?? ''}`.trim() || 'Artiste inconnu')
  const avgRating =
    model.reviews && model.reviews.length > 0
      ? model.reviews.reduce((s, r) => s + r.rating, 0) / model.reviews.length
      : 0

  return (
    <div className="vk-product">
      {/* Panel gauche */}
      <div className="vk-product__panel">
        <Link to="/" className="vk-prod__back">
          <Icon name="chevron-left" size={16} />
          Retour au catalogue
        </Link>

        <Tabs items={TABS} value={activeTab} onChange={setActiveTab} variant="pill" />

        {activeTab === 'overview' && (
          <>
            <div>
              <p className="vk-prod__heading">Modèle 3D</p>
              <h1 className="vk-prod__title">{model.title}</h1>
            </div>

            <div className="vk-prod__by">
              <span>par</span>
              <b>
                <Link to={`/artists/${model.artistId}`} className="vk-link">
                  {artistName}
                </Link>
              </b>
              {avgRating > 0 && <Rating value={avgRating} size={14} />}
              {model.reviews && model.reviews.length > 0 && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)' }}>
                  ({model.reviews.length} avis)
                </span>
              )}
            </div>

            <div>
              <p className="vk-prod__heading">Description</p>
              <p className="vk-prod__desc">{model.description}</p>
            </div>

            {formats.length > 0 && (
              <div>
                <p className="vk-prod__heading">Formats inclus</p>
                <div className="vk-formats">
                  {formats.map(fmt => <Chip key={fmt}>{fmt}</Chip>)}
                </div>
              </div>
            )}

            <div>
              <p className="vk-prod__heading">Détails</p>
              <div className="vk-prod__specs">
                {model.category && (
                  <div className="vk-spec-row">
                    <span className="vk-spec-row__k">Catégorie</span>
                    <span className="vk-spec-row__v">{model.category.name}</span>
                  </div>
                )}
                <div className="vk-spec-row">
                  <span className="vk-spec-row__k">Téléchargements</span>
                  <span className="vk-spec-row__v">{model.downloadCount}</span>
                </div>
                {totalSize > 0 && (
                  <div className="vk-spec-row">
                    <span className="vk-spec-row__k">Taille</span>
                    <span className="vk-spec-row__v">{formatBytes(totalSize)}</span>
                  </div>
                )}
                <div className="vk-spec-row">
                  <span className="vk-spec-row__k">Publié le</span>
                  <span className="vk-spec-row__v">
                    {new Date(model.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reviews' && (
          <ReviewsList modelId={model.id} />
        )}

        <div className="vk-prod__buybar">
          <span className="vk-prod__price">{formatPrice(model.price)}</span>
          <Button variant="solid" iconStart={<Icon name="cart" size={16} />} caps>
            Ajouter au panier
          </Button>
        </div>
      </div>

      {/* Viewer droite */}
      <Viewer3D url={previewFile?.url ?? null} />
    </div>
  )
}