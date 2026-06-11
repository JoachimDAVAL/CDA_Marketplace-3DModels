import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Logo, Input, Icon, IconButton, Button } from '../ui'

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
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
          <Link
            to="/"
            className="vk-nav__link"
            data-active={isActive('/') ? 'true' : 'false'}
          >
            Catalogue
          </Link>
          <span className="vk-nav__link">Créateurs</span>
          <span className="vk-nav__link">Catégories</span>
        </nav>
      </div>

      <div className="vk-nav__right">
        <form className="vk-nav__search" onSubmit={handleSearch}>
          <Input
            icon={<Icon name="search" size={18} />}
            placeholder="Chercher un modèle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <IconButton variant="outline" label="Favoris">
          <Icon name="heart" size={18} />
        </IconButton>

        <div className="vk-cart">
          <IconButton variant="outline" label="Panier">
            <Icon name="cart" size={18} />
          </IconButton>
        </div>

        <Button variant="outline" size="sm" as={Link} to="/login">
          Connexion
        </Button>
        <Button variant="solid" size="sm" caps as={Link} to="/register">
          S'inscrire
        </Button>
      </div>
    </header>
  )
}