import { Outlet } from 'react-router-dom'

// Sidebar + role guard implemented in F7
export default function StudioLayout() {
  return (
    <div className="vk-studio">
      <main className="vk-studio__main">
        <div className="vk-studio__view">
          <Outlet />
        </div>
      </main>
    </div>
  )
}