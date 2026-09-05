import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { PaginatedResponse, ModelStatus } from '../../types'
import { Badge, Icon, Pagination } from '../../components/ui'

interface AdminModel {
  id: string
  title: string
  status: ModelStatus
  price: string
  createdAt: string
  category: { name: string } | null
  artist: { firstname: string; lastname: string; user: { username: string } } | null
  files: { url: string }[]
}

const STATUS_OPTS = [
  { value: '',         label: 'Tous'        },
  { value: 'PENDING',  label: 'En attente'  },
  { value: 'ONLINE',   label: 'En ligne'    },
  { value: 'REJECTED', label: 'Refuses'     },
  { value: 'OFFLINE',  label: 'Hors ligne'  },
]
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', ONLINE: 'En ligne', REJECTED: 'Refuse', OFFLINE: 'Hors ligne',
}
const STATUS_TONE: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning', ONLINE: 'success', REJECTED: 'danger', OFFLINE: 'neutral',
}

const LIMIT = 20
const COL = {
  model:   { flex: '1 1 auto', minWidth: 0 },
  artist:  { width: 130, flexShrink: 0 },
  price:   { width: 80,  flexShrink: 0, textAlign: 'right' as const },
  actions: { width: 190, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' as const, alignItems: 'center' as const, gap: 8 },
}

const BADGE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
}

function ModelRow({ model, onStatusChange }: {
  model: AdminModel
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const thumb = model.files[0]
  const artistName = (model.artist?.user?.username ?? `${model.artist?.firstname ?? ''} ${model.artist?.lastname ?? ''}`.trim()) || '—'

  const update = async (status: string) => {
    setBusy(true)
    await onStatusChange(model.id, status)
    setBusy(false)
  }

  return (
    <div className="vk-table__row">
      <div style={COL.model}>
        <div className="vk-table__model">
          {thumb
            ? <img src={thumb.url} alt={model.title} className="vk-table__thumb" />
            : <div className="vk-table__thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="box" size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
          }
          <div style={{ minWidth: 0 }}>
            <Link to={`/models/${model.id}`} target="_blank" className="vk-table__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
              {model.title}
            </Link>
            <span className="vk-table__sub">{model.category?.name ?? '—'}</span>
          </div>
        </div>
      </div>

      <span className="vk-table__cell vk-col-hide-mobile" style={COL.artist}>{artistName}</span>

      <span className="vk-table__cell vk-col-hide-mobile" style={COL.price}>
        {parseFloat(model.price) === 0 ? 'Gratuit' : `${parseFloat(model.price).toFixed(2)} EUR`}
      </span>

      <div style={COL.actions} className="vk-table__actions">
        {model.status === 'PENDING' && (
          <>
            <Badge tone="warning">En attente</Badge>
            <button
              className="vk-confirm__btn vk-confirm__btn--ok"
              disabled={busy}
              onClick={() => update('ONLINE')}
              title="Approuver"
            >
              <Icon name="check" size={14} />
            </button>
            <button
              className="vk-confirm__btn vk-confirm__btn--yes"
              disabled={busy}
              onClick={() => update('REJECTED')}
              title="Rejeter"
            >
              <Icon name="x" size={14} />
            </button>
          </>
        )}
        {model.status === 'ONLINE' && (
          <button style={BADGE_BTN} disabled={busy} onClick={() => update('OFFLINE')} title="Mettre hors ligne">
            <Badge tone="success">{STATUS_LABEL.ONLINE}</Badge>
          </button>
        )}
        {model.status === 'OFFLINE' && (
          <button style={BADGE_BTN} disabled={busy} onClick={() => update('ONLINE')} title="Remettre en ligne">
            <Badge tone="neutral">{STATUS_LABEL.OFFLINE}</Badge>
          </button>
        )}
        {model.status === 'REJECTED' && (
          <Badge tone="danger">{STATUS_LABEL.REJECTED}</Badge>
        )}
      </div>
    </div>
  )
}

export default function AdminModels() {
  const [models, setModels] = useState<AdminModel[]>([])
  const [total, setTotal]   = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]     = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchModels = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (statusFilter) params.set('status', statusFilter)
    api.get<PaginatedResponse<AdminModel>>(`/admin/models?${params}`)
      .then(res => {
        setModels(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { fetchModels() }, [fetchModels])

  const handleStatusChange = async (id: string, status: string) => {
    await api.patch(`/models/${id}/status`, { status })
    fetchModels()
  }

  const pendingCount = models.filter(m => m.status === 'PENDING').length

  return (
    <>
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Admin
          </p>
          <h1 className="vk-studio__title">Modeles 3D</h1>
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
          {total} au total
        </span>
      </div>

      {pendingCount > 0 && (
        <div className="vk-mod__note">
          <Icon name="alert-circle" size={14} />
          {pendingCount} modele{pendingCount > 1 ? 's' : ''} en attente de validation
        </div>
      )}

      <div className="vk-admin__toolbar">
        {STATUS_OPTS.map(opt => (
          <button
            key={opt.value}
            className={['vk-confirm__btn', statusFilter === opt.value ? 'vk-confirm__btn--ok' : 'vk-confirm__btn--no'].join(' ')}
            onClick={() => { setStatusFilter(opt.value); setPage(1) }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', padding: '40px 0' }}>
          Chargement...
        </div>
      ) : models.length === 0 ? (
        <div className="vk-admin__empty">
          <div className="vk-admin__empty-icon"><Icon name="box" size={28} /></div>
          <p className="vk-admin__empty-title">Aucun modele</p>
          <p className="vk-admin__empty-sub">Aucun modele pour ce filtre.</p>
        </div>
      ) : (
        <div className="vk-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vk-table__head" style={{ padding: '14px 14px 12px' }}>
            <div style={COL.model}>Modele</div>
            <div className="vk-col-hide-mobile" style={COL.artist}>Artiste</div>
            <div className="vk-col-hide-mobile" style={COL.price}>Prix</div>
            <div style={COL.actions} />
          </div>
          <div className="vk-table">
            {models.map(m => (
              <ModelRow key={m.id} model={m} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <Pagination page={page} pageCount={totalPages} onChange={setPage} />
        </div>
      )}
    </>
  )
}