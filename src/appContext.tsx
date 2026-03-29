import { createContext, useContext } from 'react'
import type { AuthUser } from './api'
import type { Order } from './types'

type AppContextValue = {
  token: string | null
  user: AuthUser | null
  orders: Order[]
  ordersLoading: boolean
  ordersError: string | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  refreshOrders: () => Promise<void>
  completeOnboarding: () => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const useAppContext = () => {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContext.Provider')
  }
  return ctx
}

export type { AppContextValue }
export { AppContext, useAppContext }
