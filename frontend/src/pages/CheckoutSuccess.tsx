import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { Button, Icon } from '../components/ui'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const cleared = useRef(false)

  const status = searchParams.get('redirect_status')
  const succeeded = status === 'succeeded'

  useEffect(() => {
    if (succeeded && !cleared.current) {
      cleared.current = true
      clearCart()
    }
  }, [succeeded, clearCart])

  if (!succeeded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 'calc(100vh - 80px)', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'color-mix(in srgb, var(--danger) 12%, transparent)' }}>
          <Icon name="alert-circle" size={36} style={{ color: 'var(--danger)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
            Paiement échoué
          </h1>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
            Une erreur est survenue lors du paiement. Votre panier est conservé.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="solid" as={Link} to="/checkout">Réessayer</Button>
          <Button variant="outline" as={Link} to="/">Retour au catalogue</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 'calc(100vh - 80px)', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'color-mix(in srgb, #7aa2f7 12%, transparent)' }}>
        <Icon name="check-circle" size={36} style={{ color: '#7aa2f7' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
          Paiement confirmé
        </h1>
        <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', maxWidth: 400 }}>
          Merci pour votre achat. Vos fichiers sont disponibles dans vos commandes.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="solid" as={Link} to="/orders">Voir mes commandes</Button>
        <Button variant="outline" as={Link} to="/">Retour au catalogue</Button>
      </div>
    </div>
  )
}