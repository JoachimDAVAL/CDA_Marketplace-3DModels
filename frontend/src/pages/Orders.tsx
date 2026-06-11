import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Order } from '../types'
import { Badge, Button, Icon } from '../components/ui'
import type { BadgeTone } from '../components/ui/Badge'

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

function shortId(id: string) {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Order[]>('/orders')
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
        Chargement…
      </div>
    )
  }

  return (
    <div className="vk-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

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