import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ArtistStats, ArtistModelStat } from '../../types'
import { Badge, Button, Icon } from '../../components/ui'

const STATUS_LABEL: Record<string, string> = {
  ONLINE: 'En ligne', PENDING: 'En attente', REJECTED: 'Refusé', OFFLINE: 'Hors ligne',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ONLINE: 'success', PENDING: 'warning', REJECTED: 'danger', OFFLINE: 'neutral',
}

const COL = {
  model:    { flex: '1 1 auto', minWidth: 0 },
  status:   { width: 110, flexShrink: 0 },
  price:    { width: 80,  flexShrink: 0, textAlign: 'right' as const },
  dl:       { width: 60,  flexShrink: 0, textAlign: 'right' as const },
  sales:    { width: 60,  flexShrink: 0, textAlign: 'right' as const },
  revenue:  { width: 90,  flexShrink: 0, textAlign: 'right' as const },
  action:   { width: 40,  flexShrink: 0 },
}

function ModelRow({ model }: { model: ArtistModelStat }) {
  return (
    <div className="vk-table__row">
      <div style={COL.model}>
        <div className="vk-table__model">
          <div className="vk-table__thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="box" size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span className="vk-table__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {model.title}
            </span>
            <span className="vk-table__sub">
              {parseFloat(model.currentPrice) === 0 ? 'Gratuit' : `${parseFloat(model.currentPrice).toFixed(2)} €`}
            </span>
          </div>
        </div>
      </div>

      <div style={COL.status}>
        <Badge tone={STATUS_TONE[model.status] ?? 'neutral'}>
          {STATUS_LABEL[model.status] ?? model.status}
        </Badge>
      </div>

      <span className="vk-table__cell vk-col-hide-mobile" style={COL.dl}>{model.downloadCount}</span>
      <span className="vk-table__cell vk-col-hide-mobile" style={COL.sales}>{model.salesCount}</span>
      <span className="vk-table__cell vk-table__cell--strong vk-col-hide-mobile" style={COL.revenue}>
        {model.revenue > 0 ? `${model.revenue.toFixed(2)} €` : '—'}
      </span>

      <div style={COL.action}>
        <Link
          to={`/studio/models/${model.id}/edit`}
          className="vk-iconbtn vk-iconbtn--outline"
          style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          aria-label="Modifier"
          title="Modifier"
        >
          <Icon name="pencil" size={15} />
        </Link>
      </div>
    </div>
  )
}

export default function StudioModels() {
  const [stats, setStats] = useState<ArtistStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ArtistStats>('/artists/me/stats')
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', padding: '40px 0' }}>
        Chargement…
      </div>
    )
  }

  const models = stats?.models ?? []

  return (
    <>
      {/* Header */}
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Studio
          </p>
          <h1 className="vk-studio__title">Mes modèles</h1>
        </div>
        <Button variant="solid" iconStart={<Icon name="plus" size={16} />} as={Link} to="/studio/models/upload">
          Publier un modèle
        </Button>
      </div>

      {/* Table */}
      {models.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '64px 20px', textAlign: 'center' }}>
          <Icon name="box" size={40} style={{ color: 'var(--text-tertiary)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
              Aucun modèle publié
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)' }}>
              Publiez votre premier modèle 3D pour commencer à vendre.
            </span>
          </div>
          <Button variant="solid" as={Link} to="/studio/models/upload">Publier maintenant</Button>
        </div>
      ) : (
        <div className="vk-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table head */}
          <div className="vk-table__head" style={{ padding: '14px 14px 12px' }}>
            <div style={COL.model}>Modèle</div>
            <div style={COL.status}>Statut</div>
            <div className="vk-col-hide-mobile" style={COL.dl}>DL</div>
            <div className="vk-col-hide-mobile" style={COL.sales}>Ventes</div>
            <div className="vk-col-hide-mobile" style={COL.revenue}>Revenus</div>
            <div style={COL.action} />
          </div>

          <div className="vk-table">
            {models.map(m => <ModelRow key={m.id} model={m} />)}
          </div>
        </div>
      )}
    </>
  )
}