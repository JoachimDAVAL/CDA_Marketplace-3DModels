import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api, ApiError } from '../lib/api'
import type { CheckoutResponse } from '../types'
import { useCart } from '../contexts/CartContext'
import { Button } from '../components/ui'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#7aa2f7',
    colorBackground: '#141414',
    colorText: '#e8e8e8',
    colorDanger: '#e2675f',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
}

function CheckoutForm({ total, onCancel }: { total: number; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Une erreur de paiement est survenue.')
      setLoading(false)
    }
    // En cas de succès Stripe redirige vers return_url automatiquement
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PaymentElement />
      {error && (
        <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)' }}>
          {error}
        </p>
      )}
      <Button type="submit" variant="solid" block caps disabled={!stripe || loading}>
        {loading ? 'Traitement…' : `Payer ${total.toFixed(2)} €`}
      </Button>
      <span
        className="vk-drawer__cancel"
        style={{ textAlign: 'center' }}
        onClick={onCancel}
      >
        Annuler et retourner au panier
      </span>
    </form>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items } = useCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce((s, i) => s + parseFloat(i.model?.price ?? '0'), 0)
  const initiated = useRef(false)

  useEffect(() => {
    if (initiated.current) return
    initiated.current = true

    api.post<CheckoutResponse>('/orders')
      .then(res => {
        if (res.clientSecret === null) {
          navigate('/checkout/success', { replace: true })
        } else {
          setClientSecret(res.clientSecret)
        }
      })
      .catch(err => {
        if (err instanceof ApiError && err.status === 400) {
          navigate('/', { replace: true })
        } else {
          setError(err instanceof Error ? err.message : 'Erreur lors de la création de la commande.')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
        Chargement…
      </div>
    )
  }

  if (error || !clientSecret) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 'calc(100vh - 80px)' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {error ?? 'Panier vide.'}
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Retour au catalogue
        </Button>
      </div>
    )
  }

  return (
    <div className="vk-container" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, maxWidth: 920, margin: '0 auto' }}>

        {/* Formulaire Stripe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)', margin: 0 }}>
            Paiement
          </h1>
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
            <CheckoutForm total={total} onCancel={() => navigate(-1)} />
          </Elements>
        </div>

        {/* Récapitulatif */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-caption)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: 0 }}>
            Récapitulatif
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20, borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
            {items.map(item => {
              const thumb = item.model?.files?.find(f => f.fileType === 'RENDER_IMAGE')
              const price = parseFloat(item.model?.price ?? '0')
              return (
                <div key={item.id} className="vk-line">
                  {thumb
                    ? <img src={thumb.url} alt={item.model?.title} className="vk-line__thumb" />
                    : <div className="vk-line__thumb" />
                  }
                  <div className="vk-line__info">
                    <span className="vk-line__name">{item.model?.title ?? '—'}</span>
                    <span className="vk-line__meta">{item.model?.category?.name ?? 'Modèle 3D'}</span>
                  </div>
                  <span className="vk-line__price">
                    {price === 0 ? 'Gratuit' : `${price.toFixed(2)} €`}
                  </span>
                </div>
              )
            })}

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

            <div className="vk-sum vk-sum--muted">
              <span>Sous-total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="vk-sum vk-sum--muted">
              <span>Frais de service</span>
              <span>Inclus</span>
            </div>
            <div className="vk-sum vk-sum--total">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', margin: 0 }}>
            Paiement sécurisé par Stripe.
          </p>
        </div>

      </div>
    </div>
  )
}