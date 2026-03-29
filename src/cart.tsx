import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from './types'

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

type CartContextValue = {
  items: CartItem[]
  total: number
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images?.[0],
        },
      ]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const nextQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
    )
  }

  const clearCart = () => setItems([])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const value = useMemo(
    () => ({ items, total, addToCart, removeFromCart, updateQuantity, clearCart }),
    [items, total]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
