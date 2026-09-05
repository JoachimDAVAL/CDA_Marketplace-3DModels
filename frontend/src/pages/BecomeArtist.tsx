import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Artist } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { Badge, Button, Icon, Input } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'

export default function BecomeArtist() {
  usePageTitle('Devenir artiste')
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const artist = user?.artist ?? null

  const [form, setForm] = useState({ firstname: '', lastname: '', bio: '', portfolioUrl: '', siret: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post<Artist>('/artists', {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        ...(form.bio.trim() && { bio: form.bio.trim() }),
        ...(form.portfolioUrl.trim() && { portfolioUrl: form.portfolioUrl.trim() }),
        ...(form.siret.trim() && { siret: form.siret.trim() }),
      })
      await refreshUser()
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Already approved → redirect to studio
  if (artist?.status === 'APPROVED') {
    navigate('/studio', { replace: true })
    return null
  }

  return (
    <div className="vk-container" style={{ paddingTop: 64, paddingBottom: 80 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        <div>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-caption)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Artiste
          </p>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-h2)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)' }}>
            Devenir artiste
          </h1>
          <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Rejoignez Abstract pour publier et vendre vos modèles 3D. Votre candidature sera examinée par notre équipe.
          </p>
        </div>

        {/* Pending / rejected state */}
        {artist && !done && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 22px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
            <Icon name="shield" size={20} style={{ color: 'var(--text-tertiary)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-label)', color: 'var(--text-primary)' }}>
                  Candidature {artist.status === 'PENDING' ? 'en cours' : 'refusée'}
                </span>
                <Badge tone={artist.status === 'PENDING' ? 'warning' : 'danger'}>
                  {artist.status === 'PENDING' ? 'En attente' : 'Refusée'}
                </Badge>
              </div>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {artist.status === 'PENDING'
                  ? 'Votre candidature est en cours d\'examen. Vous serez notifié dès qu\'elle sera traitée.'
                  : 'Votre candidature a été refusée. Contactez le support pour plus d\'informations.'}
              </p>
            </div>
          </div>
        )}

        {/* Success state */}
        {done && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 24px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', textAlign: 'center' }}>
            <Icon name="check-circle" size={40} style={{ color: '#7aa2f7' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                Candidature envoyée
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)' }}>
                Votre candidature est en cours d'examen. Revenez dans quelques jours.
              </span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>Retour au catalogue</Button>
          </div>
        )}

        {/* Application form */}
        {!artist && !done && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="Prénom"
                shape="soft"
                required
                value={form.firstname}
                onChange={set('firstname')}
                placeholder="Votre prénom"
              />
              <Input
                label="Nom"
                shape="soft"
                required
                value={form.lastname}
                onChange={set('lastname')}
                placeholder="Votre nom"
              />
            </div>

            <div className="vk-field">
              <label className="vk-field__label">Présentation</label>
              <textarea
                className="vk-input vk-input--soft"
                style={{ height: 96, resize: 'vertical', paddingTop: 12, paddingBottom: 12 }}
                placeholder="Décrivez votre activité, votre style, vos spécialités…"
                value={form.bio}
                onChange={set('bio')}
              />
            </div>

            <Input
              label="URL portfolio"
              shape="soft"
              type="url"
              value={form.portfolioUrl}
              onChange={set('portfolioUrl')}
              placeholder="https://monportfolio.fr"
            />

            <Input
              label="N° SIRET (optionnel)"
              shape="soft"
              value={form.siret}
              onChange={set('siret')}
              placeholder="Ex : 123 456 789 00012"
            />

            {error && (
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <Button type="submit" variant="solid" block caps disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Envoi…' : 'Envoyer ma candidature'}
            </Button>
          </form>
        )}

      </div>
    </div>
  )
}