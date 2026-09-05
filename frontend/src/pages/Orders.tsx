import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Order } from '../types'
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


export default function Orders() {
  usePageTitle('Mes commandes')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Order[]>('/orders')
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="vk-loading-page">Chargement…</div>
    )
  }

  return (
    <div className="vk-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="vk-page-wrap">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
            Mes commandes
          </h1>
          <Button variant="outline" size="sm" as={Link} to="/">
            Catalogue
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="vk-empty">
            <Icon name="box" size={40} style={{ marginBottom: 16, color: 'var(--text-tertiary)' }} />
            <p style={{ margin: 0 }}>Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div className="vk-orders">
            {orders.map(order => {
              const titles = order.items
                .map(i => i.model?.title)
                .filter(Boolean)
              const label = titles.length === 1
                ? titles[0]!
                : `${titles[0] ?? '—'} + ${titles.length - 1} autre${titles.length > 2 ? 's' : ''}`

              return (
                <Link key={order.id} to={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                  <div className="vk-order vk-order--clickable">
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="box" size={20} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div className="vk-order__info">
                      <span className="vk-order__name">{label}</span>
                      <span className="vk-order__meta">
                        {shortId(order.id)} · {order.items.length} article{order.items.length > 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <Badge tone={STATUS_TONE[order.status] ?? 'neutral'}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                    <span className="vk-order__price">
                      {parseFloat(order.totalAmount).toFixed(2)} €
                    </span>
                    <Icon name="chevron-right" size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}