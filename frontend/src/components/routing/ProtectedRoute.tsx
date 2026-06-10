import { Outlet } from 'react-router-dom'

// Auth check implemented in F2 (AuthContext)
export default function ProtectedRoute() {
  return <Outlet />
}