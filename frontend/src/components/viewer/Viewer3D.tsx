import { Suspense, Component, type ErrorInfo, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, useGLTF } from '@react-three/drei'
import { Badge, Icon } from '../ui'

// ─── Error boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState { error: boolean }

class ViewerErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state = { error: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { error: true }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[Viewer3D]', err, info)
  }

  render() {
    if (this.state.error) {
      return (
        <ViewerPlaceholder
          icon="alert-circle"
          label="Impossible de charger ce modèle."
        />
      )
    }
    return this.props.children
  }
}

// ─── Placeholder (no-url / error) ────────────────────────────────────────────

function ViewerPlaceholder({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 14, color: 'var(--text-tertiary)',
      fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)',
      background: '#0d0d0d',
    }}>
      <Icon name={icon} size={32} style={{ color: 'var(--border-default)' }} />
      {label}
    </div>
  )
}

// ─── Spinner overlay ─────────────────────────────────────────────────────────

function ViewerSpinner() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0d0d',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '2px solid var(--border-default)',
        borderTopColor: 'var(--text-primary)',
        borderRadius: '50%',
        animation: 'vk-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes vk-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── GLB model (suspends while loading) ──────────────────────────────────────

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} dispose={null} />
}

// ─── Public component ─────────────────────────────────────────────────────────

interface Viewer3DProps {
  url?: string | null
}

export function Viewer3D({ url }: Viewer3DProps) {
  if (!url) {
    return (
      <div className="vk-product__viewer">
        <ViewerPlaceholder icon="box" label="Aucun aperçu 3D disponible." />
      </div>
    )
  }

  return (
    <div className="vk-product__viewer">
      <ViewerErrorBoundary>
        <Canvas gl={{ antialias: true }} camera={{ fov: 50 }}>
          <color attach="background" args={['#0d0d0d']} />
          <Suspense fallback={null}>
            <Stage
              preset="rembrandt"
              intensity={0.5}
              shadows="contact"
              environment="city"
            >
              <GLBModel url={url} />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault enablePan={false} />
        </Canvas>
        <Suspense fallback={<ViewerSpinner />}>
          {/* Mirror Suspense to drive the overlay spinner */}
          <GLBModelSentinel url={url} />
        </Suspense>
      </ViewerErrorBoundary>

      <span className="vk-viewer__badge">
        <Badge tone="solid">Aperçu 3D</Badge>
      </span>
    </div>
  )
}

// Silent sentinel outside Canvas — suspends until GLTF is cached, then renders nothing.
// Drives the overlay spinner without needing to be inside the WebGL context.
function GLBModelSentinel({ url }: { url: string }) {
  useGLTF(url) // suspends until loaded (cache hit after Canvas loads it)
  return null
}