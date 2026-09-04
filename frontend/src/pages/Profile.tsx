import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Avatar, Badge, Button, Icon } from '../components/ui'
import type { BadgeTone } from '../components/ui/Badge'

const ROLE_LABEL: Record<string, string> = { USER: 'Utilisateur', ARTIST: 'Artiste', ADMIN: 'Administrateur' }
const ROLE_TONE: Record<string, BadgeTone> = { USER: 'neutral', ARTIST: 'success', ADMIN: 'warning' }
const ARTIST_STATUS_LABEL: Record<string, string> = { PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Refusé' }
const ARTIST_STATUS_TONE: Record<string, BadgeTone> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!user) return null

  const roleLabel = ROLE_LABEL[user.role] ?? user.role
  const roleTone = ROLE_TONE[user.role] ?? 'neutral'
  const artist = user.artist ?? null

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      await api.postForm('/users/me/avatar', form)
      await refreshUser()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="vk-container" style={{ paddingTop: 64, paddingBottom: 80 }}>
      <div className="vk-profile">

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="vk-avatar-upload" onClick={() => !uploading && fileInputRef.current?.click()}>
            <Avatar src={user.avatar} name={user.username} size={80} />
            <div className="vk-avatar-upload__overlay">
              <Icon name={uploading ? 'loader' : 'camera'} size={20} />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div className="vk-profile__name">
            <h2>{user.username}</h2>
            <Badge tone={roleTone}>{roleLabel}</Badge>
          </div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
            {user.email}
          </p>
        </div>

        {/* Fields */}
        <div className="vk-profile__fields">
          <div className="vk-pf">
            <span className="vk-pf__label">Email</span>
            <span className="vk-pf__value">{user.email}</span>
          </div>
          <div className="vk-pf">
            <span className="vk-pf__label">Membre depuis</span>
            <span className="vk-pf__value">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="vk-pf">
            <span className="vk-pf__label">Rôle</span>
            <span className="vk-pf__value">
              <Badge tone={roleTone}>{roleLabel}</Badge>
            </span>
          </div>
        </div>

        {/* Artist section */}
        {artist && (
          <div className="vk-profile__section">
            <p className="vk-profile__section-title">Profil artiste</p>
            <div className="vk-profile__fields" style={{ marginTop: 0 }}>
              <div className="vk-pf">
                <span className="vk-pf__label">Nom</span>
                <span className="vk-pf__value">{`${artist.firstname} ${artist.lastname}`.trim() || '—'}</span>
              </div>
              <div className="vk-pf">
                <span className="vk-pf__label">Statut</span>
                <span className="vk-pf__value">
                  <Badge tone={ARTIST_STATUS_TONE[artist.status] ?? 'neutral'}>
                    {ARTIST_STATUS_LABEL[artist.status] ?? artist.status}
                  </Badge>
                </span>
              </div>
              {artist.portfolioUrl && (
                <div className="vk-pf">
                  <span className="vk-pf__label">Portfolio</span>
                  <span className="vk-pf__value">
                    <a
                      href={artist.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vk-link"
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)' }}
                    >
                      Voir <Icon name="arrow-right" size={14} />
                    </a>
                  </span>
                </div>
              )}
            </div>
            {artist.bio && (
              <p style={{ margin: '16px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600 }}>
                {artist.bio}
              </p>
            )}
          </div>
        )}

        {/* Become artist CTA */}
        {!artist && (
          <div className="vk-profile__cta">
            <div className="vk-profile__cta-text">
              <span className="vk-profile__cta-title">Devenir artiste</span>
              <span className="vk-profile__cta-sub">Publiez et vendez vos modèles 3D sur Abstract.</span>
            </div>
            <Button variant="solid" as={Link} to="/become-artist">Postuler</Button>
          </div>
        )}

        {/* My orders shortcut */}
        <div className="vk-profile__section" style={{ marginTop: 24 }}>
          <p className="vk-profile__section-title">Mes achats</p>
          <Button variant="outline" iconStart={<Icon name="box" size={16} />} as={Link} to="/orders">
            Voir mes commandes
          </Button>
        </div>

      </div>
    </div>
  )
}