import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type { User, PaginatedResponse } from '../../types'
import { Avatar, Badge, Icon, Input, Pagination } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

type AdminUser = User & {
  artist: { id: string; status: string; firstname: string; lastname: string } | null
}

const ROLE_LABEL: Record<string, string> = { USER: 'Utilisateur', ARTIST: 'Artiste', ADMIN: 'Admin' }
const ROLE_TONE: Record<string, 'neutral' | 'success' | 'warning'> = {
  USER: 'neutral', ARTIST: 'success', ADMIN: 'warning',
}
const ARTIST_TONE: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger',
}
const ARTIST_LABEL: Record<string, string> = {
  PENDING: 'En attente', APPROVED: 'Approuve', REJECTED: 'Refuse',
}

const LIMIT = 20
const COL = {
  user:    { flex: '1 1 auto', minWidth: 0 },
  role:    { width: 100, flexShrink: 0 },
  artist:  { width: 110, flexShrink: 0 },
  since:   { width: 110, flexShrink: 0 },
  actions: { width: 160, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' as const },
}

function UserRow({
  user, isSelf, onDelete,
}: {
  user: AdminUser; isSelf: boolean; onDelete: (id: string) => void
}) {
  const [confirm, setConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const handleDelete = () => {
    setLeaving(true)
    setTimeout(() => onDelete(user.id), 250)
  }

  return (
    <div
      className={['vk-table__row', leaving ? 'vk-table__row--leaving' : ''].filter(Boolean).join(' ')}
    >
      <div style={COL.user}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar src={user.avatar} name={user.username} size={36} />
          <div style={{ minWidth: 0 }}>
            <span className="vk-table__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
              {isSelf && <span style={{ marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>(vous)</span>}
            </span>
            <span className="vk-table__sub">{user.email}</span>
          </div>
        </div>
      </div>

      <div style={COL.role}>
        <Badge tone={ROLE_TONE[user.role] ?? 'neutral'}>{ROLE_LABEL[user.role] ?? user.role}</Badge>
      </div>

      <div className="vk-col-hide-mobile" style={COL.artist}>
        {user.artist ? (
          <Badge tone={ARTIST_TONE[user.artist.status] ?? 'neutral'}>
            {ARTIST_LABEL[user.artist.status] ?? user.artist.status}
          </Badge>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>—</span>
        )}
      </div>

      <span className="vk-table__cell vk-col-hide-mobile" style={COL.since}>
        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
      </span>

      <div style={COL.actions}>
        {confirm ? (
          <div className="vk-confirm">
            <span className="vk-confirm__txt">Supprimer ?</span>
            <button className="vk-confirm__btn vk-confirm__btn--yes" onClick={handleDelete}>Oui</button>
            <button className="vk-confirm__btn vk-confirm__btn--no" onClick={() => setConfirm(false)}>Non</button>
          </div>
        ) : (
          <button
            className="vk-confirm__btn vk-confirm__btn--no"
            disabled={isSelf}
            style={{ opacity: isSelf ? 0.3 : 1 }}
            onClick={() => setConfirm(true)}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const { user: self } = useAuth()
  const [users, setUsers]   = useState<AdminUser[]>([])
  const [total, setTotal]   = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    api.get<PaginatedResponse<AdminUser>>(`/admin/users?page=${page}&limit=${LIMIT}`)
      .then(res => {
        setUsers(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDelete = async (id: string) => {
    await api.del(`/admin/users/${id}`)
    fetchUsers()
  }

  const filtered = search.trim()
    ? users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <>
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Admin
          </p>
          <h1 className="vk-studio__title">Utilisateurs</h1>
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
          {total} au total
        </span>
      </div>

      <div className="vk-admin__toolbar">
        <div className="vk-admin__search">
          <Input
            icon={<Icon name="search" size={16} />}
            placeholder="Filtrer par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', padding: '40px 0' }}>
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="vk-admin__empty">
          <div className="vk-admin__empty-icon"><Icon name="users" size={28} /></div>
          <p className="vk-admin__empty-title">Aucun utilisateur</p>
          <p className="vk-admin__empty-sub">Aucun resultat pour cette recherche.</p>
        </div>
      ) : (
        <div className="vk-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vk-table__head" style={{ padding: '14px 14px 12px' }}>
            <div style={COL.user}>Utilisateur</div>
            <div style={COL.role}>Role</div>
            <div className="vk-col-hide-mobile" style={COL.artist}>Artiste</div>
            <div className="vk-col-hide-mobile" style={COL.since}>Inscription</div>
            <div style={COL.actions} />
          </div>
          <div className="vk-table">
            {filtered.map(u => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === self?.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && !search && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <Pagination page={page} pageCount={totalPages} onChange={setPage} />
        </div>
      )}
    </>
  )
}