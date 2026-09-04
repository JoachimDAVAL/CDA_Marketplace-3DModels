import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import type { Category, Model3D } from '../../types'
import { Button, Icon, Input } from '../../components/ui'

function DropZone({
  label, hint, accept, multiple, files, onChange,
}: {
  label: string; hint: string; accept: string; multiple?: boolean
  files: File[]; onChange: (files: File[]) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handle = (incoming: FileList | null) => {
    if (!incoming) return
    onChange(multiple ? Array.from(incoming) : [incoming[0]])
  }

  return (
    <div className="vk-field">
      <label className="vk-field__label">{label}</label>
      <div
        className="vk-upload-drop"
        style={dragging ? { borderColor: 'var(--border-strong)', background: 'var(--surface-input-hover)' } : undefined}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
      >
        <Icon name="upload" size={22} style={{ color: 'var(--text-tertiary)' }} />
        {files.length === 0 ? (
          <>
            <span className="vk-upload-drop__t">Glissez ou cliquez pour choisir</span>
            <span className="vk-upload-drop__s">{hint}</span>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {files.map((f, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={e => handle(e.target.files)}
      />
    </div>
  )
}

export default function StudioUpload() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ title: '', description: '', price: '0', categoryId: '' })
  const [sourceFile, setSourceFile] = useState<File[]>([])
  const [renderFiles, setRenderFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories)
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceFile[0]) { setError('Le fichier source GLB est requis.'); return }
    if (renderFiles.length === 0) { setError('Au moins une image de rendu est requise.'); return }
    if (!form.categoryId) { setError('Veuillez choisir une catégorie.'); return }

    setError(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', form.description.trim())
      fd.append('price', form.price)
      fd.append('categoryId', form.categoryId)
      fd.append('source', sourceFile[0])
      renderFiles.forEach(f => fd.append('renders', f))

      await api.postForm<Model3D>('/models', fd)
      navigate('/studio/models')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Studio
          </p>
          <h1 className="vk-studio__title">Publier un modèle</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="vk-uploadform" style={{ maxWidth: 680 }}>

        <div className="vk-upload-grid">
          <Input
            label="Titre"
            shape="soft"
            required
            minLength={3}
            value={form.title}
            onChange={set('title')}
            placeholder="Nom du modèle"
          />
          <div className="vk-field">
            <label className="vk-field__label">Catégorie</label>
            <div style={{ position: 'relative' }}>
              <select
                required
                value={form.categoryId}
                onChange={set('categoryId')}
                className="vk-input vk-input--soft"
                style={{ cursor: 'pointer', appearance: 'none', paddingRight: 40 }}
              >
                <option value="">Choisir une catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)', display: 'flex' }}>
                <Icon name="chevron-down" size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="vk-field">
          <label className="vk-field__label">Description</label>
          <textarea
            required
            minLength={10}
            className="vk-input vk-input--soft"
            style={{ height: 96, resize: 'vertical', paddingTop: 12, paddingBottom: 12 }}
            placeholder="Décrivez votre modèle, ses usages, ses caractéristiques…"
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

        <DropZone
          label="Fichier source GLB"
          hint="Fichier .glb uniquement — le PREVIEW_3D sera généré automatiquement"
          accept=".glb"
          files={sourceFile}
          onChange={setSourceFile}
        />

        <DropZone
          label="Images de rendu"
          hint="JPG, PNG, WEBP — jusqu'à 10 images"
          accept="image/jpeg,image/png,image/webp"
          multiple
          files={renderFiles}
          onChange={setRenderFiles}
        />

        {error && (
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <div className="vk-uploadform__actions">
          <Button type="submit" variant="solid" caps disabled={loading}>
            {loading ? 'Publication en cours…' : 'Publier le modèle'}
          </Button>
          <Button variant="ghost" as={Link} to="/studio/models" disabled={loading}>
            Annuler
          </Button>
        </div>

      </form>
    </>
  )
}