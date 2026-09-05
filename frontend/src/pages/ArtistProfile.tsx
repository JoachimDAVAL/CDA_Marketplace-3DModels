import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { ArtistPublicProfile } from '../types'
import { Avatar, Button, Rating } from '../components/ui'
import { ModelCard } from '../components/models/ModelCard'
import { usePageTitle } from '../hooks/usePageTitle'

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [artist, setArtist] = useState<ArtistPublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const artistName = artist ? (artist.user?.username ?? `${artist.firstname} ${artist.lastname}`.trim()) : 'Artiste'
  usePageTitle(artistName)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<ArtistPublicProfile>(`/artists/${id}`)
      .then(setArtist)
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

  if (notFound || !artist) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 'calc(100vh - 80px)' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Artiste introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Retour au catalogue</Button>
      </div>
    )
  }

  const displayName = `${artist.firstname} ${artist.lastname}`.trim() || artist.user.username

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* Header artiste */}
      <div className="vk-artist">
        <Avatar src={artist.user.avatar ?? undefined} name={displayName} size={96} />

        <div className="vk-artist__id">
          <h1 className="vk-artist__name">{displayName}</h1>
          <span className="vk-artist__handle">@{artist.user.username}</span>
          {artist.bio && <p className="vk-artist__bio">{artist.bio}</p>}
          {artist.portfolioUrl && (
            <a
              href={artist.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vk-link"
              style={{ fontSize: 'var(--fs-label)', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', marginTop: 6, display: 'inline-block' }}
            >
              {artist.portfolioUrl}
            </a>
          )}
        </div>

        <div className="vk-artist__stats">
          <div className="vk-stat">
            <span className="vk-stat__num">{artist.stats.modelCount}</span>
            <span className="vk-stat__lbl">Modèles</span>
          </div>
          <div className="vk-stat">
            <span className="vk-stat__num">{artist.stats.totalSales}</span>
            <span className="vk-stat__lbl">Ventes</span>
          </div>
          <div className="vk-stat">
            <span className="vk-stat__num vk-stat__num--rate">
              {artist.stats.avgRating > 0
                ? <Rating value={artist.stats.avgRating} size={16} showValue={false} />
                : '—'
              }
            </span>
            <span className="vk-stat__lbl">Note</span>
          </div>
        </div>
      </div>

      {/* Grille modèles */}
      {artist.models.length === 0 ? (
        <div className="vk-empty" style={{ marginTop: 40 }}>
          Cet artiste n'a pas encore publié de modèles.
        </div>
      ) : (
        <div style={{ marginTop: 32 }}>
          <p className="vk-prod__heading" style={{ marginBottom: 16 }}>
            {artist.stats.modelCount} modèle{artist.stats.modelCount > 1 ? 's' : ''}
          </p>
          <div className="vk-grid">
            {artist.models.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
