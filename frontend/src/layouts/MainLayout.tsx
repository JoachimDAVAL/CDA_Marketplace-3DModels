import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CartDrawer } from '../components/cart/CartDrawer'

export default function MainLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

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