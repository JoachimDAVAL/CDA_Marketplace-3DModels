import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '../../lib/api'
import type { Category } from '../../types'
import { Icon, IconButton } from '../../components/ui'
import { usePageTitle } from '../../hooks/usePageTitle'

function CategoryRow({ cat, onUpdate, onDelete }: {
  cat: Category
  onUpdate: (id: string, name: string, description: string) => Promise<void>
  onDelete: (id: string) => Promise<string | null>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(cat.name)
  const [desc, setDesc]       = useState(cat.description ?? '')
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  const save = async () => {
    if (!name.trim()) return
    setBusy(true)
    await onUpdate(cat.id, name.trim(), desc.trim())
    setBusy(false)
    setEditing(false)
  }

  const cancel = () => {
    setName(cat.name)
    setDesc(cat.description ?? '')
    setErr(null)
    setEditing(false)
  }

  const del = async () => {
    setBusy(true)
    const error = await onDelete(cat.id)
    setBusy(false)
    if (error) setErr(error)
  }

  return (
    <div className="vk-table__row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      {editing ? (
        <div className="vk-cat-edit">
          <input
            className="vk-cat-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom"
            autoFocus
          />
          <input
            className="vk-cat-input"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description (optionnel)"
            style={{ flex: 2 }}
          />
          <button className="vk-confirm__btn vk-confirm__btn--ok" disabled={busy || !name.trim()} onClick={save}>
            <Icon name="check" size={14} />
          </button>
          <button className="vk-confirm__btn vk-confirm__btn--no" disabled={busy} onClick={cancel}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
          <div className="vk-catname" style={{ flex: 1, minWidth: 0 }}>
            <div className="vk-catname__icon">
              <Icon name="tag" size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span className="vk-table__name">{cat.name}</span>
              {cat.description && (
                <span className="vk-table__sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.description}
                </span>
              )}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
            {cat.slug}
          </span>
          <div className="vk-table__actions">
            <IconButton variant="outline" label="Modifier" onClick={() => { setErr(null); setEditing(true) }}>
              <Icon name="pencil" size={15} />
            </IconButton>
            <button
              className="vk-confirm__btn vk-confirm__btn--yes"
              disabled={busy}
              onClick={del}
              title="Supprimer"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>
      )}
      {err && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--danger)', paddingLeft: 4 }}>
          {err}
        </span>
      )}
    </div>
  )
}

export default function AdminCategories() {
  usePageTitle('Catégories — Admin')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [adding, setAdding]         = useState(false)
  const [addErr, setAddErr]         = useState<string | null>(null)

  const fetchCategories = useCallback(() => {
    setLoading(true)
    api.get<Category[]>('/categories')
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setAddErr(null)
    try {
      await api.post('/categories', { name: newName.trim(), ...(newDesc.trim() && { description: newDesc.trim() }) })
      setNewName('')
      setNewDesc('')
      fetchCategories()
    } catch (err) {
      setAddErr(err instanceof ApiError ? err.message : 'Erreur lors de la creation.')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (id: string, name: string, description: string) => {
    await api.patch(`/categories/${id}`, { name, ...(description && { description }) })
    fetchCategories()
  }

  const handleDelete = async (id: string): Promise<string | null> => {
    try {
      await api.del(`/categories/${id}`)
      fetchCategories()
      return null
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        return 'Cette categorie est utilisee par des modeles.'
      }
      return err instanceof ApiError ? err.message : 'Erreur lors de la suppression.'
    }
  }

  return (
    <>
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Admin
          </p>
          <h1 className="vk-studio__title">Categories</h1>
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
          {categories.length} categorie{categories.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add form */}
      <form className="vk-cat-add" onSubmit={handleAdd}>
        <div className="vk-cat-add__field">
          <input
            className="vk-cat-input"
            style={{ width: '100%' }}
            placeholder="Nouvelle categorie..."
            value={newName}
            onChange={e => { setNewName(e.target.value); setAddErr(null) }}
            required
            minLength={2}
          />
        </div>
        <input
          className="vk-cat-input"
          style={{ flex: 2 }}
          placeholder="Description (optionnel)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
        />
        <button
          type="submit"
          className="vk-confirm__btn vk-confirm__btn--ok"
          disabled={adding || !newName.trim()}
        >
          <Icon name="plus" size={14} />
          Ajouter
        </button>
        {addErr && (
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--danger)' }}>
            {addErr}
          </span>
        )}
      </form>

      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', padding: '40px 0' }}>
          Chargement...
        </div>
      ) : categories.length === 0 ? (
        <div className="vk-admin__empty">
          <div className="vk-admin__empty-icon"><Icon name="tag" size={28} /></div>
          <p className="vk-admin__empty-title">Aucune categorie</p>
          <p className="vk-admin__empty-sub">Commencez par en creer une ci-dessus.</p>
        </div>
      ) : (
        <div className="vk-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vk-table__head" style={{ padding: '14px 14px 12px' }}>
            <div style={{ flex: 1 }}>Categorie</div>
            <div style={{ width: 140, flexShrink: 0 }}>Slug</div>
            <div style={{ width: 80, flexShrink: 0 }} />
          </div>
          <div className="vk-table">
            {categories.map(cat => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}