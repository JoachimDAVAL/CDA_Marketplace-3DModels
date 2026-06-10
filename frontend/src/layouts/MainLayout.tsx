import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="vk-app">
      <main className="vk-main">
        <Outlet />
      </main>
    </div>
  )
}