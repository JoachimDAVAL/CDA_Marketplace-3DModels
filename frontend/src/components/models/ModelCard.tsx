export function ModelCardSkeleton() {
  const pulse = { animation: 'vk-skeleton-pulse 1.5s ease-in-out infinite', background: 'var(--ink-3)', borderRadius: 6 }
  return (
    <div className="vk-model">
      <div className="vk-model__media" style={{ background: 'var(--ink-3)', animation: 'vk-skeleton-pulse 1.5s ease-in-out infinite' }} />
      <div className="vk-model__body">
        <div style={{ ...pulse, height: 16, width: '70%' }} />
        <div style={{ ...pulse, height: 12, width: '40%' }} />
      </div>
    </div>
  )
}

import { useNavigate, Link } from 'react-router-dom'
import type { Model3D, ModelFile, ArtistPublic, Category } from '../../types'
import { Button, Icon, Rating } from '../ui'
import { formatPrice } from '../../lib/format'

interface ModelCardProps {
  model: Model3D & {
    files?: ModelFile[]
    artist?: ArtistPublic & { user?: { username: string; avatar: string | null } }
    category?: Category
  }
  avgRating?: number
  onAddToCart?: (modelId: string) => void
}

export function ModelCard({ model, avgRating, onAddToCart }: ModelCardProps) {
  const navigate = useNavigate()

  const thumb = model.files?.find(f => f.fileType === 'RENDER_IMAGE')
  const creatorName = model.artist?.user?.username ?? model.artist?.firstname ?? null
  const isFree = parseFloat(model.price) === 0

  const handleCardClick = () => navigate(`/models/${model.id}`)

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart?.(model.id)
  }

  return (
    <article className="vk-model vk-model--clickable" onClick={handleCardClick}>
      {/* Media */}
      <div className="vk-model__media">
        {thumb ? (
          <img src={thumb.url} alt={model.title} className="vk-model__img" loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)' }}>
            Aperçu indisponible
          </div>
        )}

        {/* Badge downloads */}
        <span className="vk-model__views">
          <Icon name="download" size={11} />
          {model.downloadCount}
        </span>
      </div>

      {/* Body */}
      <div className="vk-model__body">
        <p className="vk-model__title">{model.title}</p>
        <div className="vk-model__divider" />

        <div className="vk-model__meta">
          <span className="vk-model__creator">
            {creatorName ? <>par <b>{creatorName}</b></> : (model.category?.name ?? '')}
          </span>
          <span className="vk-model__price">{formatPrice(model.price)}</span>
        </div>

        {avgRating !== undefined && avgRating > 0 && (
          <Rating value={avgRating} size={13} />
        )}

        <div className="vk-model__actions">
          <Button
            as={Link}
            to={`/models/${model.id}`}
            variant="outline"
            size="sm"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            Voir
          </Button>
          {model.owned ? (
            <Button variant="outline" size="sm" caps disabled
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              Possédé
            </Button>
          ) : (
            <Button variant="solid" size="sm" caps onClick={handleBuy}>
              {isFree ? 'Obtenir' : 'Acheter'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}