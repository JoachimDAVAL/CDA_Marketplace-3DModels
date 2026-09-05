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
  const [menuOpen, setMenuOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      navigate('/search?q=' + encodeURIComponent(q))
      setMenuOpen(false)
    }
  }

  function closeMenu() { setMenuOpen(false) }
  function handleLogout() { logout(); closeMenu() }

  return (
    <>
      <header className="vk-nav">
        <div className="vk-nav__left">
          <nav className="vk-nav__links">
            <NavLink
              to="/catalogue"
              className={({ isActive }) => 'vk-nav__link' + (isActive ? ' vk-nav__link--active' : '')}
            >
              Catalogue
            </NavLink>
          </nav>
          <form className="vk-nav__search" onSubmit={handleSearch}>
            <Input
              icon={<Icon name="search" size={18} />}
              placeholder="Chercher un modèle…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="vk-nav__center">
          <Link to="/" style={{ textDecoration: 'none' }} onClick={closeMenu}>
            <Logo size={22} />
          </Link>
        </div>

        <div className="vk-nav__right">
          <div className="vk-cart">
            <IconButton variant="outline" label="Panier" onClick={openCart}>
              <Icon name="cart" size={18} />
            </IconButton>
            {items.length > 0 && (
              <span className="vk-cart__count">{items.length}</span>
            )}
          </div>

          <div className="vk-nav__auth">
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

          <div className="vk-nav__burger">
            <IconButton
              variant="outline"
              label={menuOpen ? 'Fermer' : 'Menu'}
              onClick={() => setMenuOpen(v => !v)}
            >
              <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
            </IconButton>
          </div>
        </div>
      </header>

      <div className={'vk-nav__mobile' + (menuOpen ? ' vk-nav__mobile--open' : '')}>
        <form className="vk-nav__mobile-search" onSubmit={handleSearch}>
          <Input
            icon={<Icon name="search" size={18} />}
            placeholder="Chercher un modèle…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>

        <nav className="vk-nav__mobile-links">
          <NavLink
            to="/catalogue"
            className={({ isActive }) => 'vk-nav__mobile-link' + (isActive ? ' vk-nav__mobile-link--active' : '')}
            onClick={closeMenu}
          >
            Catalogue
          </NavLink>

          {isAuthenticated && user?.role === 'ARTIST' && (
            <NavLink
              to="/studio"
              className={({ isActive }) => 'vk-nav__mobile-link' + (isActive ? ' vk-nav__mobile-link--active' : '')}
              onClick={closeMenu}
            >
              Studio
            </NavLink>
          )}

          {isAuthenticated && user?.role === 'ADMIN' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => 'vk-nav__mobile-link' + (isActive ? ' vk-nav__mobile-link--active' : '')}
              onClick={closeMenu}
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="vk-nav__mobile-foot">
          {isAuthenticated && user ? (
            <>
              <Link to="/profile" className="vk-nav__mobile-profile" onClick={closeMenu}>
                <Avatar src={user.avatar} name={user.username} size={38} />
                <span>{user.username}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <Icon name="log-out" size={16} />
                Se déconnecter
              </Button>
            </>
          ) : (
            <div className="vk-nav__mobile-auth">
              <Button variant="outline" size="sm" as={Link} to="/login" onClick={closeMenu}>Connexion</Button>
              <Button variant="solid" size="sm" caps as={Link} to="/register" onClick={closeMenu}>S'inscrire</Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}