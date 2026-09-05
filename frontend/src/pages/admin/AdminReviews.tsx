import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { PaginatedResponse } from '../../types'
import { Avatar, Icon, Pagination } from '../../components/ui'

interface AdminReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { id: string; username: string; avatar: string | null }
  model: { id: string; title: string }
}

const LIMIT = 20

const COL = {
  user:    { width: 160, flexShrink: 0 },
  model:   { flex: '1 1 auto', minWidth: 0 },
  rating:  { width: 70, flexShrink: 0 },
  comment: { flex: '2 1 auto', minWidth: 0 },
  date:    { width: 110, flexShrink: 0 },
  actions: { width: 100, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' as const },
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function ReviewRow({ review, onDelete }: { review: AdminReview; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  const handleDelete = () => {
    setLeaving(true)
    setTimeout(() => onDelete(review.id), 250)
  }

  const deleteSection = confirm ? (
    <div style={{ display: 'flex', gap: 4 }}>
      <button className="vk-confirm__btn vk-confirm__btn--yes" onClick={(e) => { stopProp(e); handleDelete() }}>Oui</button>
      <button className="vk-confirm__btn vk-confirm__btn--no" onClick={(e) => { stopProp(e); setConfirm(false) }}>Non</button>
    </div>
  ) : (
    <button className="vk-confirm__btn vk-confirm__btn--no" onClick={(e) => { stopProp(e); setConfirm(true) }}>
      <Icon name="x" size={14} />
    </button>
  )

  return (
    <div
      className={['vk-table__row vk-review__row', leaving ? 'vk-table__row--leaving' : ''].filter(Boolean).join(' ')}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Colonnes desktop */}
      <div className="vk-col-desktop-only" style={COL.user}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Avatar src={review.user.avatar} name={review.user.username} size={30} />
          <span className="vk-table__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {review.user.username}
          </span>
        </div>
      </div>

      <div className="vk-col-desktop-only" style={COL.model}>
        <Link
          to={`/models/${review.model.id}`}
          target="_blank"
          className="vk-table__name"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', display: 'block' }}
          onClick={stopProp}
        >
          {review.model.title}
        </Link>
      </div>

      <div className="vk-col-desktop-only" style={COL.rating}>
        <Stars rating={review.rating} />
      </div>

      <div className="vk-col-desktop-only" style={COL.comment}>
        <span className="vk-table__sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {review.comment ?? <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sans commentaire</span>}
        </span>
      </div>

      <span className="vk-table__cell vk-col-desktop-only" style={COL.date}>
        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
      </span>

      <div style={COL.actions} className="vk-table__actions vk-col-desktop-only" onClick={stopProp}>
        {deleteSection}
      </div>

      {/* Carte mobile */}
      <div className="vk-review__mobile-card">
        <div className="vk-review__mobile-top">
          <div className="vk-review__mobile-info">
            <Avatar src={review.user.avatar} name={review.user.username} size={28} />
            <span className="vk-table__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {review.user.username}
            </span>
          </div>
          <Stars rating={review.rating} />
          <div onClick={stopProp}>{deleteSection}</div>
        </div>
        {expanded && (
          <div className="vk-review__mobile-comment">
            {review.comment
              ? review.comment
              : <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Sans commentaire</span>
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(() => {
    setLoading(true)
    api.get<PaginatedResponse<AdminReview>>(`/admin/reviews?page=${page}&limit=${LIMIT}`)
      .then(res => {
        setReviews(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleDelete = async (id: string) => {
    await api.del(`/admin/reviews/${id}`)
    fetchReviews()
  }

  return (
    <>
      <div className="vk-studio__head">
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Admin
          </p>
          <h1 className="vk-studio__title">Avis</h1>
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)' }}>
          {total} au total
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', padding: '40px 0' }}>
          Chargement...
        </div>
      ) : reviews.length === 0 ? (
        <div className="vk-admin__empty">
          <div className="vk-admin__empty-icon"><Icon name="star" size={28} /></div>
          <p className="vk-admin__empty-title">Aucun avis</p>
          <p className="vk-admin__empty-sub">Aucun avis pour le moment.</p>
        </div>
      ) : (
        <div className="vk-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vk-table__head vk-col-desktop-only" style={{ padding: '14px 14px 12px' }}>
            <div style={COL.user}>Utilisateur</div>
            <div style={COL.model}>Modele</div>
            <div style={COL.rating}>Note</div>
            <div style={COL.comment}>Commentaire</div>
            <div style={COL.date}>Date</div>
            <div style={COL.actions} />
          </div>
          <div className="vk-table">
            {reviews.map(r => (
              <ReviewRow key={r.id} review={r} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <Pagination page={page} pageCount={totalPages} onChange={setPage} />
        </div>
      )}
    </>
  )
}