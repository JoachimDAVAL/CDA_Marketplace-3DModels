import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page introuvable')
  return (
    <div style={{
      minHeight: 'calc(100vh - var(--topbar-h))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-semibold)',
        fontSize: 96,
        lineHeight: 1,
        letterSpacing: 'var(--tracking-tight)',
        color: 'var(--border-default)',
      }}>
        404
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-h3)',
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Page introuvable
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-label)',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
      </div>
      <Button as={Link} to="/" variant="outline">
        Retour au catalogue
      </Button>
    </div>
  )
}