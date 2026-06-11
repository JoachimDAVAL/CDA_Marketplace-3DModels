import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import StudioLayout from './layouts/StudioLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/routing/ProtectedRoute'
import RoleRoute from './components/routing/RoleRoute'

import Catalogue from './pages/Catalogue'
import Search from './pages/Search'
import ModelDetail from './pages/ModelDetail'
import ArtistProfile from './pages/ArtistProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Checkout from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutCancel from './pages/CheckoutCancel'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import BecomeArtist from './pages/BecomeArtist'
import NotFound from './pages/NotFound'

import StudioDashboard from './pages/studio/StudioDashboard'
import StudioModels from './pages/studio/StudioModels'
import StudioUpload from './pages/studio/StudioUpload'
import StudioEditModel from './pages/studio/StudioEditModel'
import StudioStats from './pages/studio/StudioStats'

import AdminUsers from './pages/admin/AdminUsers'
import AdminModels from './pages/admin/AdminModels'
import AdminCategories from './pages/admin/AdminCategories'

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <Catalogue /> },
      { path: '/search', element: <Search /> },
      { path: '/models/:id', element: <ModelDetail /> },
      { path: '/artists/:id', element: <ArtistProfile /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/profile', element: <Profile /> },
          { path: '/checkout', element: <Checkout /> },
          { path: '/checkout/success', element: <CheckoutSuccess /> },
          { path: '/checkout/cancel', element: <CheckoutCancel /> },
          { path: '/orders', element: <Orders /> },
          { path: '/orders/:id', element: <OrderDetail /> },
          { path: '/become-artist', element: <BecomeArtist /> },
        ],
      },
    ],
  },
  {
    path: '/studio',
    element: <RoleRoute role="ARTIST" />,
    children: [
      {
        element: <StudioLayout />,
        children: [
          { index: true, element: <StudioDashboard /> },
          { path: 'models', element: <StudioModels /> },
          { path: 'models/upload', element: <StudioUpload /> },
          { path: 'models/:id/edit', element: <StudioEditModel /> },
          { path: 'stats', element: <StudioStats /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <RoleRoute role="ADMIN" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: 'users', element: <AdminUsers /> },
          { path: 'models', element: <AdminModels /> },
          { path: 'categories', element: <AdminCategories /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export default router