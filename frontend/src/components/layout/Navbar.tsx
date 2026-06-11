import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Logo, Input, Icon, IconButton, Button, Avatar } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const { items, openCart } = useCart()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="vk-nav">
      <div className="vk-nav__left">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={22} />
        </Link>
        <nav className="vk-nav__links">
          <Link to="/" className="vk-nav__link" data-active={isActive('/') ? 'true' : 'false'}>
            Catalogue
          </Link>
          <span className="vk-nav__link">CrÃ©ateurs</span>
          <span className="vk-nav__link">CatÃ©gories</span>
        </nav>
      </div>

      <div className="vk-nav__right">
        <form className="vk-nav__search" onSubmit={handleSearch}>
          <Input
            icon={<Icon name="search" size={18} />}
            placeholder="Chercher un modÃ¨leâ€¦"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <IconButton variant="outline" label="Panier" onClick={openCart} style={{ position: 'relative' }}>
          <Icon name="cart" size={18} />
          {items.length > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          )}
        </IconButton>

        {isAuthenticated && user ? (
          <>
            <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Avatar src={user.avatar ?? undefined} name={user.username} size={34} />
            </Link>
            <IconButton variant="outline" label="Se dÃ©connecter" onClick={logout}>
              <Icon name="log-out" size={18} />
            </IconButton>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" as={Link} to="/login">
              Connexion
            </Button>
            <Button variant="solid" size="sm" caps as={Link} to="/register">
              S'inscrire
            </Button>
          </>
        )}
      </div>
    </header>
  )
}