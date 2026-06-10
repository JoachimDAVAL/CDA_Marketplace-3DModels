import { Outlet } from 'react-router-dom'

// Sidebar + role guard implemented in F8
export default function AdminLayout() {
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