import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Logo, Input, Icon, IconButton, Button, Avatar } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

export function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { items, openCart } = useCart()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate('/search?q=' + encodeURIComponent(q))
  }

  return (
    <header className="vk-nav">
      <div className="vk-nav__left">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={22} />
        </Link>
        <nav className="vk-nav__links">
          <NavLink
            to="/"
            end
            className="vk-nav__link"
            style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : undefined })}
          >
            Catalogue
          </NavLink>
        </nav>
      </div>

      <div className="vk-nav__right">
        <form className="vk-nav__search" onSubmit={handleSearch}>
          <Input
            icon={<Icon name="search" size={18} />}
            placeholder="Chercher un modèle…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>

        <IconButton variant="outline" label="Panier" onClick={openCart} style={{ position: 'relative' }}>
          <Icon name="cart" size={18} />
          {items.length > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent)', pointerEvents: 'none',
            }} />
          )}
        </IconButton>

        {isAuthenticated && user ? (
          <>
            {user.role === 'ARTIST' && (
              <NavLink to="/studio" className="vk-nav__studio">
                <Icon name="box" size={15} />
                Studio
              </NavLink>
            )}
            {user.role === 'ADMIN' && (
              <NavLink to="/admin/users" className="vk-nav__studio">
                <Icon name="shield" size={15} />
                Admin
              </NavLink>
            )}
            <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Avatar src={user.avatar} name={user.username} size={34} />
            </Link>
            <IconButton variant="outline" label="Se déconnecter" onClick={logout}>
              <Icon name="log-out" size={18} />
            </IconButton>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" as={Link} to="/login">Connexion</Button>
            <Button variant="solid" size="sm" caps as={Link} to="/register">S'inscrire</Button>
          </>
        )}
      </div>
    </header>
  )
}
