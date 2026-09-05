import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Order, ModelFile } from '../types'
import { Badge, Button, Icon } from '../components/ui'
import type { BadgeTone } from '../components/ui/Badge'
import { shortId } from '../lib/format'
import { usePageTitle } from '../hooks/usePageTitle'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
}
const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  REFUNDED: 'neutral',
}

interface DownloadResponse {
  url: string
  filename: string
  downloadsRemaining: number
}

interface OrderDetailItem {
  id: string
  priceAtPurchase: string
  modelId: string | null
  model: {
    id: string
    title: string
    files: ModelFile[]
  } | null
}

interface OrderDetail extends Omit<Order, 'items'> {
  items: OrderDetailItem[]
}


function DownloadButton({ file }: { file: ModelFile }) {
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    api.get<{ downloadsRemaining: number }>(`/downloads/${file.id}/remaining`)
      .then(res => setRemaining(res.downloadsRemaining))
      .catch(() => setRemaining(0))
  }, [file.id])

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await api.get<DownloadResponse>(`/downloads/${file.id}`)
      setRemaining(res.downloadsRemaining)
      const a = document.createElement('a')
      a.href = res.url
      a.download = res.filename
      a.click()
    } finally {
      setLoading(false)
    }
  }

  const exhausted = remaining !== null && remaining <= 0

  return (
    <div className="vk-dl">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-label)', color: 'var(--text-primary)' }}>
          {file.filename}
        </span>
        {remaining !== null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: exhausted ? 'var(--color-danger, #e05252)' : 'var(--text-tertiary)' }}>
            {exhausted
              ? 'Limite atteinte — 5 téléchargements sur 5 utilisés'
              : `${remaining} téléchargement${remaining !== 1 ? 's' : ''} restant${remaining !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        iconStart={<Icon name="download" size={14} />}
        disabled={loading || exhausted}
        onClick={handleDownload}
      >
        {loading ? 'Préparation…' : 'Télécharger'}
      </Button>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  usePageTitle(order ? shortId(order.id) : 'Commande')

  const fetchOrder = useCallback(() => {
    if (!id) return
    api.get<OrderDetail>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => navigate('/orders', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
        Chargement…
      </div>
    )
  }

  if (!order) return null

  const isPaid = order.status === 'PAID'

  return (
    <div className="vk-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="vk-order-detail">

          {/* Back link */}
          <Link to="/orders" className="vk-prod__back" style={{ width: 'fit-content' }}>
            <Icon name="chevron-left" size={16} />
            Mes commandes
          </Link>

          {/* Header */}
          <div className="vk-order-detail__head">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
                Commande {shortId(order.id)}
              </h1>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
                {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="vk-order-detail__head-right">
              <Badge tone={STATUS_TONE[order.status] ?? 'neutral'}>
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-title)', color: 'var(--text-primary)' }}>
                {parseFloat(order.totalAmount).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="vk-order-detail__items">
            {order.items.map(item => {
              const thumb = item.model?.files.find(f => f.fileType === 'RENDER_IMAGE')
              const sourceFiles = item.model?.files.filter(f => f.fileType === 'SOURCE_3D') ?? []

              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', overflow: 'hidden' }}>
                  {/* Model row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px' }}>
                    {thumb
                      ? <img src={thumb.url} alt={item.model?.title ?? ''} style={{ width: 56, height: 56, borderRadius: 'var(--radius-xs)', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xs)', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name="box" size={20} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                    }
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-label)', color: 'var(--text-primary)' }}>
                        {item.model?.title ?? 'Modèle supprimé'}
                      </span>
                      {item.model && (
                        <Link to={`/models/${item.model.id}`} className="vk-link" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)' }}>
                          Voir le modèle
                        </Link>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-label)', color: 'var(--text-primary)', flexShrink: 0 }}>
                      {parseFloat(item.priceAtPurchase) === 0 ? 'Gratuit' : `${parseFloat(item.priceAtPurchase).toFixed(2)} €`}
                    </span>
                  </div>

                  {/* Download files — only if PAID and has source files */}
                  {isPaid && sourceFiles.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0 18px', display: 'flex', flexDirection: 'column' }}>
                      {sourceFiles.map(f => <DownloadButton key={f.id} file={f} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Total summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 24px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
            <div className="vk-sum vk-sum--muted">
              <span>{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
              <span>{parseFloat(order.totalAmount).toFixed(2)} €</span>
            </div>
            <div className="vk-sum vk-sum--muted">
              <span>Frais de service</span>
              <span>Inclus</span>
            </div>
            <div className="vk-sum vk-sum--total">
              <span>Total payé</span>
              <span>{parseFloat(order.totalAmount).toFixed(2)} €</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}