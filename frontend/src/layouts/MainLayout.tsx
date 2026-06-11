import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CartDrawer } from '../components/cart/CartDrawer'

export default function MainLayout() {
  return (
    <div className="vk-app">
      <Navbar />
      <main className="vk-main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}