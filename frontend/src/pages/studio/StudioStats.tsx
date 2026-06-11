import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ArtistStats, ArtistModelStat } from '../../types'
import { Badge, Icon, IconButton } from '../../components/ui'

const STATUS_LABEL: Record<string, string> = {
  ONLINE: 'En ligne', PENDING: 'En attente', REJECTED: 'Refusé', OFFLINE: 'Hors ligne',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ONLINE: 'success', PENDING: 'warning', REJECTED: 'danger', OFFLINE: 'neutral',
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="vk-statcard">
      <span className="vk-statcard__lbl">{label}</span>
      <span className="vk-statcard__num">{value}</span>
      {sub && <span className="vk-statcard__sub">{sub}</span>}
    </div>
  )
}

type SortKey = 'revenue' | 'salesCount' | 'downloadCount'

const COL = {
  model:   { flex: '1 1 auto', minWidth: 0 },
  status:  { width: 110, flexShrink: 0 },
  price:   { width: 90,  flexShrink: 0, textAlign: 'right' as const },
  dl:      { width: 72,  flexShrink: 0, textAlign: 'right' as const },
  sales:   { width: 72,  flexShrink: 0, textAlign: 'right' as const },
  revenue: { width: 100, flexShrink: 0, textAlign: 'right' as const },
  action:  { width: 40,  flexShrink: 0 },
}

function SortHeader({ label, sortKey, active, onClick, style }: {
  label: string; sortKey: SortKey; active: boolean
  onClick: () => void; style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...style,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)',
        textTransform: 'uppercase', letterSpacing: '.06em',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {label}
      {active && <Icon name="chevron-down" size={12} />}
    </button>
  )
}

export default function StudioStats() {
  const [stats, setStats] = useState<ArtistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>('revenue')

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

  if (!stats) return null

  const sorted = [...stats.models].sort((a, b) => b[sortBy] - a[sortBy])
  const chartModels = [...stats.models].sort((a, b) => b.revenue - a.revenue)
  const maxRev = Math.max(...chartModels.map(m => m.revenue), 1)
  const onlineCount = stats.models.filter(m => m.status === 'ONLINE').length

  return (
    <>
      {/* Header */}
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Studio
          </p>
          <h1 className="vk-studio__title">Statistiques</h1>
        </div>
      </div>

      {/* Stat cards */}
      <div className="vk-studio__stats">
        <StatCard
          label="Revenus totaux"
          value={`${stats.totalRevenue.toFixed(2)} €`}
          sub={`${stats.totalSales} vente${stats.totalSales !== 1 ? 's' : ''}`}
        />
        <StatCard label="Ventes" value={String(stats.totalSales)} sub="commandes payées" />
        <StatCard label="Téléchargements" value={String(stats.totalDownloads)} />
        <StatCard
          label="Modèles"
          value={String(onlineCount)}
          sub={`${stats.models.length} au total`}
        />
      </div>

      {/* Revenue chart */}
      {chartModels.length > 0 && (
        <div className="vk-panel">
          <div className="vk-panel__head">
            <p className="vk-panel__title">Revenus par modèle</p>
            <span className="vk-panel__meta">{chartModels.length} modèle{chartModels.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="vk-chart vk-chart--tall">
            {chartModels.map(m => (
              <div key={m.id} className="vk-chart__col" title={`${m.title} — ${m.revenue.toFixed(2)} €`}>
                <span className="vk-chart__val">
                  {m.revenue > 0 ? `${m.revenue.toFixed(0)} €` : ''}
                </span>
                <div
                  className="vk-chart__bar"
                  style={{ height: `${Math.max((m.revenue / maxRev) * 100, 4)}%` }}
                />
                <span className="vk-chart__lbl">
                  {m.title.slice(0, 7)}{m.title.length > 7 ? '…' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed table */}
      {stats.models.length > 0 && (
        <div className="vk-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vk-table__head" style={{ padding: '14px 14px 12px' }}>
            <div style={COL.model}>Modèle</div>
            <div style={COL.status}>Statut</div>
            <div style={COL.price}>Prix</div>
            <SortHeader label="DL" sortKey="downloadCount" active={sortBy === 'downloadCount'} onClick={() => setSortBy('downloadCount')} style={COL.dl} />
            <SortHeader label="Ventes" sortKey="salesCount" active={sortBy === 'salesCount'} onClick={() => setSortBy('salesCount')} style={COL.sales} />
            <SortHeader label="Revenus" sortKey="revenue" active={sortBy === 'revenue'} onClick={() => setSortBy('revenue')} style={COL.revenue} />
            <div style={COL.action} />
          </div>

          <div className="vk-table">
            {sorted.map(m => (
              <div key={m.id} className="vk-table__row">
                <div style={COL.model}>
                  <div className="vk-table__model">
                    <div className="vk-table__thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="box" size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span className="vk-table__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.title}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={COL.status}>
                  <Badge tone={STATUS_TONE[m.status] ?? 'neutral'}>
                    {STATUS_LABEL[m.status] ?? m.status}
                  </Badge>
                </div>

                <span className="vk-table__cell" style={COL.price}>
                  {parseFloat(m.currentPrice) === 0 ? 'Gratuit' : `${parseFloat(m.currentPrice).toFixed(2)} €`}
                </span>
                <span className="vk-table__cell" style={COL.dl}>{m.downloadCount}</span>
                <span className="vk-table__cell" style={COL.sales}>{m.salesCount}</span>
                <span className="vk-table__cell vk-table__cell--strong" style={COL.revenue}>
                  {m.revenue > 0 ? `${m.revenue.toFixed(2)} €` : '—'}
                </span>

                <div style={COL.action}>
                  <IconButton as={Link} to={`/studio/models/${m.id}/edit`} variant="outline" title="Modifier">
                    <Icon name="pencil" size={15} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.models.length === 0 && (
        <div className="vk-empty">
          <Icon name="bar-chart" size={36} style={{ marginBottom: 12, color: 'var(--text-tertiary)' }} />
          <p style={{ margin: 0 }}>Publiez votre premier modèle pour voir vos statistiques.</p>
        </div>
      )}
    </>
  )
}