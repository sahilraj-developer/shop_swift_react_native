import { Platform } from 'react-native'
import type { Address, Category, NotificationItem, Order, Product, Review, SupportTicket } from './types'

const API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'customer'
  addresses?: Address[]
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export type ApiResult<T> = {
  success: boolean
  message: string
  data?: T
}

export const apiRequest = async <T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
    token?: string | null
  } = {}
) => {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = (await response.json()) as ApiResult<T>
  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed')
  }

  return payload
}

export const loginCustomer = async (email: string, password: string) => {
  const payload = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password, role: 'customer' },
  })

  if (!payload.data) {
    throw new Error('Login failed')
  }

  return payload.data
}

export const fetchApprovedProducts = async (query = '') => {
  const payload = await apiRequest<{ items: Product[] }>(`/products?status=approved${query}`)
  return payload.data?.items ?? []
}

export const fetchCategories = async () => {
  const payload = await apiRequest<Category[]>('/categories')
  return payload.data ?? []
}

export const fetchProductById = async (id: string) => {
  const products = await fetchApprovedProducts()
  return products.find((item) => item._id === id) ?? null
}

export const fetchReviews = async (productId: string) => {
  const payload = await apiRequest<Review[]>(`/products/${productId}/reviews`)
  return payload.data ?? []
}

export const submitReview = async (
  productId: string,
  token: string,
  data: { rating: number; comment: string; images?: string[]; videos?: string[] },
  existingReviewId?: string
) => {
  if (existingReviewId) {
    await apiRequest(`/reviews/${existingReviewId}`, {
      method: 'PATCH',
      token,
      body: data,
    })
    return
  }
  await apiRequest(`/products/${productId}/reviews`, {
    method: 'POST',
    token,
    body: data,
  })
}

export const fetchOrders = async (token: string) => {
  const payload = await apiRequest<Order[]>('/orders', { token })
  return payload.data ?? []
}

export const createCheckoutSession = async (
  token: string,
  items: { productId: string; name: string; price: number; quantity: number }[],
  email?: string,
  deliveryAddress?: Address
) => {
  const payload = await apiRequest<{ url: string }>('/payments/checkout', {
    method: 'POST',
    token,
    body: { items, email, deliveryAddress },
  })
  return payload.data?.url
}

export const createOrder = async (
  token: string,
  items: { productId: string; name: string; price: number; quantity: number }[],
  email?: string,
  paymentMethod?: 'card' | 'upi' | 'cod' | 'wallet',
  deliveryAddress?: Address
) => {
  await apiRequest('/orders', {
    method: 'POST',
    token,
    body: { items, email, paymentMethod, paymentProvider: 'manual', deliveryAddress },
  })
}

export const requestRefund = async (token: string, orderId: string, reason: string) => {
  await apiRequest(`/orders/${orderId}/refund`, {
    method: 'POST',
    token,
    body: { reason },
  })
}

export const fetchNotifications = async (token: string) => {
  const payload = await apiRequest<NotificationItem[]>('/notifications', { token })
  return payload.data ?? []
}

export const markNotificationRead = async (token: string, id: string) => {
  const payload = await apiRequest<NotificationItem>(`/notifications/${id}/read`, {
    method: 'PATCH',
    token,
  })
  return payload.data
}

export const fetchSupportTickets = async (token: string) => {
  const payload = await apiRequest<SupportTicket[]>('/support', { token })
  return payload.data ?? []
}

export const createSupportTicket = async (token: string, subject: string, message: string) => {
  await apiRequest('/support', {
    method: 'POST',
    token,
    body: { subject, message },
  })
}

export const updateAddresses = async (token: string, addresses: Address[]) => {
  const payload = await apiRequest<{ addresses: Address[] }>('/users/addresses', {
    method: 'PATCH',
    token,
    body: { addresses },
  })
  return payload.data?.addresses ?? []
}
