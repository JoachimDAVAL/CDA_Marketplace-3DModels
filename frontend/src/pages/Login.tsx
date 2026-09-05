import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { AuthResponse } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input, Logo } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'

export default function Login() {
  usePageTitle('Connexion')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { access_token } = await api.post<AuthResponse>('/auth/login', { username, password })
      await login(access_token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'Identifiants incorrects.'
        : 'Une erreur est survenue.')
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
          <h1 className="vk-auth__title">Connexion</h1>
          <p className="vk-auth__sub">Bienvenue sur Abstract</p>
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
            label="Mot de passe"
            type="password"
            shape="pill"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div className="vk-auth__row">
            <label className="vk-auth__check">
              <input type="checkbox" />
              Se souvenir de moi
            </label>
            <span className="vk-auth__link">Mot de passe oublié ?</span>
          </div>

          {error && (
            <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <Button type="submit" variant="solid" size="lg" block caps disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        <p className="vk-auth__foot">
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <b>Créer un compte</b>
          </Link>
        </p>
      </div>
    </div>
  )
}