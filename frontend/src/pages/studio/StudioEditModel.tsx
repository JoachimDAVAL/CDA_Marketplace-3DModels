import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import type { Model3D, Category } from '../../types'
import { Badge, Button, Icon, Input } from '../../components/ui'

const STATUS_LABEL: Record<string, string> = {
  ONLINE: 'En ligne', PENDING: 'En attente', REJECTED: 'Refusé', OFFLINE: 'Hors ligne',
}
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ONLINE: 'success', PENDING: 'warning', REJECTED: 'danger', OFFLINE: 'neutral',
}

export default function StudioEditModel() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [model, setModel] = useState<Model3D | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ title: '', description: '', price: '0', categoryId: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Model3D>(`/models/${id}`),
      api.get<Category[]>('/categories'),
    ]).then(([m, cats]) => {
      setModel(m)
      setCategories(cats)
      setForm({
        title: m.title,
        description: m.description,
        price: parseFloat(m.price).toString(),
        categoryId: m.categoryId,
      })
    }).catch(() => navigate('/studio/models', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSaving(true)
    try {
      await api.patch<Model3D>(`/models/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        categoryId: form.categoryId,
      })
      navigate('/studio/models')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', padding: '40px 0' }}>
        Chargement…
      </div>
    )
  }

  if (!model) return null

  return (
    <>
      {/* Header */}
      <div className="vk-studio__head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/studio/models" className="vk-prod__back">
            <Icon name="chevron-left" size={16} />
            Mes modèles
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="vk-studio__title" style={{ margin: 0 }}>{model.title}</h1>
            <Badge tone={STATUS_TONE[model.status] ?? 'neutral'}>
              {STATUS_LABEL[model.status] ?? model.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Moderation warning */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(224,177,90,0.08)', boxShadow: 'inset 0 0 0 1px rgba(224,177,90,0.2)' }}>
        <Icon name="alert-circle" size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Toute modification repasse le modèle en <strong style={{ color: 'var(--text-primary)' }}>attente de validation</strong> par l'équipe Abstract.
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="vk-uploadform" style={{ maxWidth: 680 }}>

        <div className="vk-upload-grid">
          <Input
            label="Titre"
            shape="soft"
            required
            minLength={3}
            value={form.title}
            onChange={set('title')}
          />
          <div className="vk-field">
            <label className="vk-field__label">Catégorie</label>
            <select
              required
              value={form.categoryId}
              onChange={set('categoryId')}
              className="vk-input vk-input--soft"
              style={{ cursor: 'pointer' }}
            >
              <option value="">Choisir une catégorie</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="vk-field">
          <label className="vk-field__label">Description</label>
          <textarea
            required
            minLength={10}
            className="vk-input vk-input--soft"
            style={{ height: 96, resize: 'vertical', paddingTop: 12, paddingBottom: 12 }}
            value={form.description}
            onChange={set('description')}
          />
        </div>

        <Input
          label="Prix (€)"
          shape="soft"
          type="number"
          min="0"
          step="0.01"
          hint="Entrez 0 pour un modèle gratuit"
          value={form.price}
          onChange={set('price')}
          style={{ maxWidth: 200 }}
        />

        {error && (
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <div className="vk-uploadform__actions">
          <Button type="submit" variant="solid" caps disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
          <Button variant="ghost" as={Link} to="/studio/models" disabled={saving}>
            Annuler
          </Button>
        </div>

      </form>
    </>
  )
}