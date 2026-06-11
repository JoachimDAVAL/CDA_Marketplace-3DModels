import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Avatar, Icon, Logo } from '../components/ui'

const NAV_ITEMS = [
  { to: '/studio',               end: true,  icon: 'bar-chart', label: 'Dashboard'    },
  { to: '/studio/models',        end: false, icon: 'box',       label: 'Mes modèles'  },
  { to: '/studio/models/upload', end: true,  icon: 'upload',    label: 'Publier'       },
  { to: '/studio/stats',         end: true,  icon: 'grid',      label: 'Statistiques' },
]

export default function StudioLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const artistName = user?.artist
    ? `${user.artist.firstname} ${user.artist.lastname}`.trim()
    : (user?.username ?? '')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="vk-studio">
      {/* Sidebar */}
      <aside className="vk-studio__side">
        <div className="vk-studio__brand">
          <Logo />
        </div>

        {/* Artist identity card */}
        <div className="vk-studio__studioname">
          <Avatar src={user?.avatar} name={artistName} size={36} />
          <div className="vk-studio__studioname-txt">
            <span className="vk-studio__studioname-lbl">Studio</span>
            <span className="vk-studio__studioname-val">{artistName}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="vk-studio__nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
            Retour au catalogue
          </NavLink>
          <button className="vk-studio__navitem vk-studio__exit" onClick={handleLogout}>
            <Icon name="log-out" size={18} />
            Se déconnecter
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