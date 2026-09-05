import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { AuthResponse } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Logo } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'

export default function Register() {
  usePageTitle('Inscription')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [cgu, setCgu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (!cgu) { setError('Vous devez accepter les conditions d\'utilisation.'); return }

    setLoading(true)
    try {
      await api.post('/auth/register', { username, email, password })
      const { access_token } = await api.post<AuthResponse>('/auth/login', { username, password })
      await login(access_token)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 409
          ? 'Ce nom d\'utilisateur ou cet email est déjà utilisé.'
          : err.message)
      } else {
        setError('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vk-auth">
      <div className="vk-auth__glow" />
      <div className="vk-auth__card">
        <div className="vk-auth__brand">
          <Logo />
        </div>

        <div className="vk-auth__head">
          <h1 className="vk-auth__title">Créer un compte</h1>
          <p className="vk-auth__sub">Rejoignez la communauté Abstract</p>
        </div>

        <form className="vk-auth__fields" onSubmit={handleSubmit}>
          <Input
            label="Nom d'utilisateur"
            shape="pill"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Adresse e-mail"
            type="email"
            shape="pill"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            shape="pill"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            hint="8 caractères minimum"
            required
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            shape="pill"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />

          <label className="vk-auth__check">
            <input type="checkbox" checked={cgu} onChange={e => setCgu(e.target.checked)} />
            J'accepte les{' '}
            <span className="vk-auth__link">conditions d'utilisation</span>
          </label>

          {error && (
            <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <Button type="submit" variant="solid" size="lg" block caps disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="vk-auth__foot">
          Déjà un compte ?{' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <b>Se connecter</b>
          </Link>
        </p>
      </div>
    </div>
  )
}