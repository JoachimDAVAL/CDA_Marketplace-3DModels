import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Model3D, PaginatedResponse } from '../types'
import { Avatar, Button, Icon, Rating } from '../components/ui'
import { ModelCard, ModelCardSkeleton } from '../components/models/ModelCard'
import { useCart } from '../contexts/CartContext'
import { usePageTitle } from '../hooks/usePageTitle'

interface FeaturedArtist {
  id: string
  firstname: string
  lastname: string
  user: { username: string; avatar: string | null }
  modelCount: number
  avgRating: number
}

export default function Home() {
  usePageTitle('Accueil')
  const navigate = useNavigate()
  const { addItem, openCart } = useCart()
  const [recentModels, setRecentModels] = useState<Model3D[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState(false)
  const [artistsError, setArtistsError] = useState(false)

  useEffect(() => {
    api.get<PaginatedResponse<Model3D>>('/models?limit=6&sortBy=newest')
      .then(res => setRecentModels(res.data))
      .catch(() => setModelsError(true))
      .finally(() => setModelsLoading(false))
    api.get<FeaturedArtist[]>('/artists/featured')
      .then(setFeaturedArtists)
      .catch(() => setArtistsError(true))
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="vk-hero">
        <div className="vk-hero__bg" style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)' }} />
        <div className="vk-hero__scrim" />
        <div className="vk-hero__inner">
          <span className="vk-hero__eyebrow">Marketplace de modèles 3D</span>
          <h1 className="vk-hero__title">Des actifs 3D<br />prêts à l'emploi</h1>
          <p className="vk-hero__sub">
            Explorez des milliers de modèles 3D créés par des artistes indépendants.
            Téléchargez, créez, publiez.
          </p>
          <div className="vk-hero__actions">
            <Button variant="solid" size="lg" caps as={Link} to="/catalogue">
              Explorer le catalogue
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/become-artist')}>
              Devenir créateur
            </Button>
          </div>
        </div>
      </div>

      <div className="vk-container">

        {/* Artistes en vedette */}
        {(featuredArtists.length > 0 || artistsError) && (
          <section className="vk-section vk-section--tight">
            <div className="vk-section__head">
              <h2 className="vk-section__title">Artistes en vedette</h2>
            </div>
            {artistsError ? (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
                Impossible de charger les artistes.
              </p>
            ) : (
            <div className="vk-creators">
              {featuredArtists.map(artist => {
                const name = artist.user.username ?? `${artist.firstname} ${artist.lastname}`.trim()
                return (
                  <div key={artist.id} className="vk-creator" onClick={() => navigate(`/artists/${artist.id}`)}>
                    <Avatar src={artist.user.avatar ?? undefined} name={name} size={44} />
                    <div className="vk-creator__info">
                      <span className="vk-creator__name">{name}</span>
                      <span className="vk-creator__meta">{artist.modelCount} modèle{artist.modelCount !== 1 ? 's' : ''}</span>
                    </div>
                    {artist.avgRating > 0 && (
                      <Rating value={artist.avgRating} size={13} showValue />
                    )}
                    <Icon name="chevron-right" size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
            )}
          </section>
        )}

        {/* Derniers modèles */}
        {(modelsLoading || recentModels.length > 0 || modelsError) && (
          <section className="vk-section">
            <div className="vk-section__head">
              <h2 className="vk-section__title">Derniers modèles</h2>
              <Link
                to="/catalogue"
                className="vk-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)' }}
              >
                Voir tout <Icon name="chevron-right" size={16} />
              </Link>
            </div>
            {modelsError ? (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
                Impossible de charger les modèles.
              </p>
            ) : modelsLoading ? (
              <div className="vk-grid">
                {Array.from({ length: 6 }).map((_, i) => <ModelCardSkeleton key={i} />)}
              </div>
            ) : (
            <div className="vk-grid">
              {recentModels.map(model => (
                <ModelCard key={model.id} model={model} onAddToCart={id => addItem(id).then(openCart)} />
              ))}
            </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Button variant="outline" size="lg" as={Link} to="/catalogue" iconEnd={<Icon name="arrow-right" size={16} />}>
                Voir tout le catalogue
              </Button>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
