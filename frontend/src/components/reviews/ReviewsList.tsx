import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type { Review } from '../../types'
import { Avatar, Button, Rating } from '../ui'

const DIAMOND =
  'M 15.784 2.866 C 16.561 1.569 18.439 1.569 19.216 2.866 L 23.926 10.732 C 24.086 11 24.307 11.227 24.571 11.394 L 32.333 16.31 C 33.572 17.096 33.572 18.904 32.333 19.69 L 24.571 24.606 C 24.307 24.773 24.086 25 23.926 25.268 L 19.216 33.134 C 18.439 34.431 16.561 34.431 15.784 33.134 L 11.074 25.268 C 10.914 25 10.693 24.773 10.429 24.606 L 2.667 19.69 C 1.428 18.904 1.428 17.096 2.667 16.31 L 10.429 11.394 C 10.693 11.227 10.914 11 11.074 10.732 L 15.784 2.866 Z'

function ReviewForm({ modelId, onSubmit }: { modelId: string; onSubmit: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/reviews', { modelId, rating, comment: comment.trim() || null })
      onSubmit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication.')
    } finally {
      setLoading(false)
    }
  }

  const active = hover || rating

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: 20, borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-card)',
        boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
      }}
    >
      <p className="vk-prod__heading" style={{ margin: 0 }}>Laisser un avis</p>

      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const val = i + 1
          return (
            <button
              key={i} type="button"
              onClick={() => setRating(val)}
              onMouseEnter={() => setHover(val)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${val} sur 5`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <svg width={24} height={24} viewBox="0 0 35 36" fill="none">
                <path
                  d={DIAMOND}
                  fill={val <= active ? 'var(--rating)' : 'var(--rating-empty)'}
                  style={{ transition: 'fill 100ms' }}
                />
              </svg>
            </button>
          )
        })}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Décrivez votre expérience (optionnel)"
        rows={3}
        className="vk-input"
        style={{ resize: 'vertical', minHeight: 72, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)' }}
      />

      {error && (
        <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-caption)', fontFamily: 'var(--font-sans)' }}>
          {error}
        </p>
      )}

      <Button type="submit" variant="solid" disabled={rating === 0 || loading} caps>
        {loading ? 'Envoi…' : 'Publier'}
      </Button>
    </form>
  )
}

interface ReviewsListProps {
  modelId: string
  canReview?: boolean
}

export function ReviewsList({ modelId, canReview = false }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    try {
      const data = await api.get<Review[]>(`/reviews/model/${modelId}`)
      setReviews(data)
    } finally {
      setLoading(false)
    }
  }, [modelId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  if (loading) {
    return (
      <div className="vk-empty">Chargement des avis…</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {canReview && (
        <ReviewForm
          modelId={modelId}
          onSubmit={() => {
            setLoading(true)
            fetchReviews()
          }}
        />
      )}

      {reviews.length === 0 ? (
        <div className="vk-empty">
          Aucun avis pour ce modèle.{' '}
          {!canReview && (
            <span style={{ display: 'block', marginTop: 6, fontSize: 'var(--fs-caption)' }}>
              Achetez ce modèle pour laisser un avis.
            </span>
          )}
        </div>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="vk-review">
            <Avatar
              name={review.user?.username ?? '?'}
              src={review.user?.avatar ?? undefined}
              size={40}
            />
            <div className="vk-review__main">
              <div className="vk-review__head">
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-label)', color: 'var(--text-primary)' }}>
                  {review.user?.username ?? 'Utilisateur'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
                  {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <Rating value={review.rating} size={14} showValue={false} />
              {review.comment && (
                <p className="vk-review__text">{review.comment}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}