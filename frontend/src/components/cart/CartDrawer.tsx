import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { Icon, Button } from '../ui'
import type { CartItem } from '../../types'

function formatPrice(price: string): string {
  const n = parseFloat(price)
  return n === 0 ? 'Gratuit' : `${n.toFixed(2)} €`
}

function CartLine({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const thumb = item.model?.files?.find(f => f.fileType === 'RENDER_IMAGE')
  const price = item.model?.price ?? '0'

  return (
    <div className="vk-line">
      {thumb ? (
        <img src={thumb.url} alt={item.model?.title} className="vk-line__thumb" />
      ) : (
        <div className="vk-line__thumb" />
      )}
      <div className="vk-line__info">
        <span className="vk-line__name">{item.model?.title ?? '—'}</span>
        <span className="vk-line__meta">{item.model?.category?.name ?? 'Modèle 3D'}</span>
        <span className="vk-line__remove" onClick={onRemove}>Retirer</span>
      </div>
      <span className="vk-line__price">{formatPrice(price)}</span>
    </div>
  )
}

export function CartDrawer() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { items, isOpen, closeCart, removeItem } = useCart()

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.model?.price ?? '0'), 0)

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <div className={`vk-drawer${isOpen ? ' vk-drawer--open' : ''}`}>
      <div className="vk-drawer__scrim" onClick={closeCart} />
      <div className="vk-drawer__panel">

        {/* Head */}
        <div className="vk-drawer__head">
          <div className="vk-drawer__title">
            <Icon name="cart" size={20} />
            Panier
            {items.length > 0 && (
              <span className="vk-drawer__count">{items.length}</span>
            )}
          </div>
          <button className="vk-drawer__back" onClick={closeCart} aria-label="Fermer le panier">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="vk-drawer__body">
          {!isAuthenticated ? (
            <div className="vk-drawer__empty">
              <div className="vk-drawer__empty-icon">
                <Icon name="user" size={28} />
              </div>
              <p className="vk-drawer__empty-title">Connectez-vous</p>
              <p className="vk-drawer__empty-sub">Créez un compte pour ajouter des modèles à votre panier.</p>
              <Button variant="solid" caps onClick={() => { closeCart(); navigate('/login') }}>
                Se connecter
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="vk-drawer__empty">
              <div className="vk-drawer__empty-icon">
                <Icon name="cart" size={28} />
              </div>
              <p className="vk-drawer__empty-title">Panier vide</p>
              <p className="vk-drawer__empty-sub">Explorez le catalogue et ajoutez des modèles 3D à votre panier.</p>
              <Button variant="outline" onClick={() => { closeCart(); navigate('/') }}>
                Explorer le catalogue
              </Button>
            </div>
          ) : (
            items.map(item => (
              <CartLine
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.modelId)}
              />
            ))
          )}
        </div>

        {/* Foot — uniquement si items */}
        {isAuthenticated && items.length > 0 && (
          <div className="vk-drawer__foot">
            <div className="vk-sum vk-sum--muted">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="vk-sum vk-sum--muted">
              <span>Frais de service</span>
              <span>Inclus</span>
            </div>
            <div className="vk-sum vk-sum--total">
              <span>Total</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <Button variant="solid" block caps onClick={handleCheckout}>
              Procéder au paiement
            </Button>
            <span className="vk-drawer__cancel" onClick={closeCart}>
              Continuer mes achats
            </span>
          </div>
        )}

      </div>
    </div>
  )
}