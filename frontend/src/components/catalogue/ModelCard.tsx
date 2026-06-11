import { Link } from 'react-router-dom'
import type { Model3D, ModelFile } from '../../types'

interface ModelCardProps {
  model: Model3D & { files?: ModelFile[] }
}

function formatPrice(price: string): string {
  const n = parseFloat(price)
  return n === 0 ? 'Gratuit' : `${n.toFixed(2)} €`
}

export function ModelCard({ model }: ModelCardProps) {
  const thumb = model.files?.find(f => f.fileType === 'RENDER_IMAGE')

  return (
    <Link to={`/models/${model.id}`} style={{ textDecoration: 'none' }}>
      <article className="vk-model vk-model--clickable">
        <div className="vk-model__media">
          {thumb ? (
            <img src={thumb.url} alt={model.title} className="vk-model__img" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)' }}>
              Aperçu indisponible
            </div>
          )}
          <span className="vk-model__views">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {model.downloadCount}
          </span>
        </div>
        <div className="vk-model__body">
          <p className="vk-model__title">{model.title}</p>
          <div className="vk-model__divider" />
          <div className="vk-model__meta">
            <span className="vk-model__creator">
              {model.category?.name ?? ''}
            </span>
            <span className="vk-model__price">{formatPrice(model.price)}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}