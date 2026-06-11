import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ArtistStats } from '../../types'
import { Badge, Button, Icon } from '../../components/ui'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="vk-statcard">
      <span className="vk-statcard__lbl">{label}</span>
      <span className="vk-statcard__num">{value}</span>
      {sub && <span className="vk-statcard__sub">{sub}</span>}
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  ONLINE: 'En ligne', PENDING: 'En attente', REJECTED: 'Refusé', OFFLINE: 'Hors ligne',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ONLINE: 'success', PENDING: 'warning', REJECTED: 'danger', OFFLINE: 'neutral',
}

export default function StudioDashboard() {
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

  if (!stats) return null

  const topModels = [...stats.models]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const chartModels = [...stats.models]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7)
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
          <h1 className="vk-studio__title">Dashboard</h1>
        </div>
        <Button variant="solid" iconStart={<Icon name="plus" size={16} />} as={Link} to="/studio/models/upload">
          Publier un modèle
        </Button>
      </div>

      {/* Stat cards */}
      <div className="vk-studio__stats">
        <StatCard
          label="Revenus"
          value={`${stats.totalRevenue.toFixed(2)} €`}
          sub={`${stats.totalSales} vente${stats.totalSales !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Ventes"
          value={String(stats.totalSales)}
          sub="commandes payées"
        />
        <StatCard
          label="Téléchargements"
          value={String(stats.totalDownloads)}
        />
        <StatCard
          label="Modèles publiés"
          value={String(onlineCount)}
          sub={`${stats.models.length} au total`}
        />
      </div>

      {/* Split: chart + top list */}
      <div className="vk-studio__split">

        {/* Bar chart — revenus par modèle */}
        <div className="vk-panel">
          <div className="vk-panel__head">
            <p className="vk-panel__title">Revenus par modèle</p>
            <span className="vk-panel__meta">{chartModels.length} modèles</span>
          </div>
          {chartModels.length === 0 ? (
            <div className="vk-empty">Aucune donnée pour l'instant.</div>
          ) : (
            <div className="vk-chart">
              {chartModels.map(m => (
                <div key={m.id} className="vk-chart__col" title={m.title}>
                  <span className="vk-chart__val">
                    {m.revenue > 0 ? `${m.revenue.toFixed(0)} €` : ''}
                  </span>
                  <div
                    className="vk-chart__bar"
                    style={{ height: `${Math.max((m.revenue / maxRev) * 100, 4)}%` }}
                  />
                  <span className="vk-chart__lbl">
                    {m.title.slice(0, 6)}{m.title.length > 6 ? '…' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top models list */}
        <div className="vk-panel">
          <div className="vk-panel__head">
            <p className="vk-panel__title">Top modèles</p>
            <Link to="/studio/models" style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
              Voir tout
            </Link>
          </div>
          {topModels.length === 0 ? (
            <div className="vk-empty">Aucun modèle publié.</div>
          ) : (
            <div className="vk-toplist">
              {topModels.map(m => (
                <Link key={m.id} to={`/studio/models/${m.id}/edit`} style={{ textDecoration: 'none' }}>
                  <div className="vk-toprow">
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-xs)', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="box" size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div className="vk-toprow__info">
                      <span className="vk-toprow__name">{m.title}</span>
                      <span className="vk-toprow__meta">
                        {m.salesCount} vente{m.salesCount !== 1 ? 's' : ''} · {m.downloadCount} dl
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span className="vk-toprow__rev">
                        {m.revenue > 0 ? `${m.revenue.toFixed(2)} €` : 'Gratuit'}
                      </span>
                      <Badge tone={STATUS_TONE[m.status] ?? 'neutral'} style={{ fontSize: 10 }}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}