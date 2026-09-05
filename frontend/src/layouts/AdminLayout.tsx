import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon, Logo } from '../components/ui'

const NAV_ITEMS = [
  { to: '/admin/users',      label: 'Utilisateurs', icon: 'users'   },
  { to: '/admin/models',     label: 'Modeles',      icon: 'box'     },
  { to: '/admin/categories', label: 'Categories',   icon: 'tag'     },
  { to: '/admin/reviews',    label: 'Avis',         icon: 'star'    },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="vk-studio">
      {/* Sidebar */}
      <aside className="vk-studio__side">
        <div className="vk-studio__brand">
          <Logo />
        </div>

        {/* Admin identity */}
        <div className="vk-admin__sidehead">
          <div className="vk-admin__shield">
            <Icon name="shield" size={18} />
          </div>
          <div className="vk-admin__sidehead-txt">
            <span className="vk-admin__sidehead-lbl">Administration</span>
            <span className="vk-admin__sidehead-val">{user?.username ?? 'Admin'}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="vk-studio__nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                ['vk-studio__navitem', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="vk-studio__side-foot">
          <NavLink to="/" className="vk-studio__navitem vk-studio__exit">
            <Icon name="arrow-right" size={18} style={{ transform: 'rotate(180deg)' }} />
            Retour au site
          </NavLink>
          <button className="vk-studio__navitem vk-studio__exit" onClick={handleLogout}>
            <Icon name="log-out" size={18} />
            Se deconnecter
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="vk-studio__main">
        <div className="vk-studio__view">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
