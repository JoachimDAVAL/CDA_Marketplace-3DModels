import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { Cart, CartItem } from '../types'
import { useAuth } from './AuthContext'

interface CartContextValue {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (modelId: string) => Promise<void>
  removeItem: (modelId: string) => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      const cart = await api.get<Cart>('/cart')
      setItems(cart.items)
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) fetchCart()
    else setItems([])
  }, [isAuthenticated, fetchCart])

  const addItem = useCallback(async (modelId: string) => {
    await api.post('/cart/items', { modelId })
    await fetchCart()
  }, [fetchCart])

  const removeItem = useCallback(async (modelId: string) => {
    await api.del(`/cart/items/${modelId}`)
    await fetchCart()
  }, [fetchCart])

  const clearCart = useCallback(() => setItems([]), [])
  const openCart  = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  return (
    <CartContext.Provider value={{
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}