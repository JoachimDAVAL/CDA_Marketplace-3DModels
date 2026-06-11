import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Model3D } from '../types'
import { ModelCard } from '../components/models/ModelCard'

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [models,  setModels]  = useState<Model3D[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) { setModels([]); return }
    setLoading(true)
    api.get<Model3D[]>(`/models/search?q=${encodeURIComponent(q)}`)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="vk-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="vk-section__head" style={{ marginBottom: 28 }}>
        <h1 className="vk-section__title">
          {loading
            ? 'Recherche…'
            : q
              ? `${models.length} modèle${models.length !== 1 ? 's' : ''} · « ${q} »`
              : 'Recherche'}
        </h1>
      </div>

      {!q.trim() ? (
        <div className="vk-empty">Saisissez un terme dans la barre de recherche.</div>
      ) : loading ? (
        <div className="vk-empty">Chargement…</div>
      ) : models.length === 0 ? (
        <div className="vk-empty">
          Aucun résultat pour « {q} ».
        </div>
      ) : (
        <div className="vk-grid">
          {models.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  )
}