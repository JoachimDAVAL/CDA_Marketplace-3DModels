import { Viewer3D } from '../components/viewer/Viewer3D'

export default function ViewerTest() {
  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <Viewer3D url="/test.glb" />
    </div>
  )
}