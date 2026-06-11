import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { Button, Icon } from '../components/ui'

export default function CheckoutCancel() {
  const { openCart } = useCart()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 'calc(100vh - 80px)', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'color-mix(in srgb, var(--text-tertiary) 10%, transparent)' }}>
        <Icon name="x" size={36} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
          Paiement annulé
        </h1>
        <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', maxWidth: 400 }}>
          Votre panier est conservé. Vous pouvez reprendre votre achat quand vous le souhaitez.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="solid" onClick={openCart}>Voir mon panier</Button>
        <Button variant="outline" as={Link} to="/">Retour au catalogue</Button>
      </div>
    </div>
  )
}