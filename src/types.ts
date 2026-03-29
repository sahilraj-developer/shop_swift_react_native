export type Product = {
  _id: string
  name: string
  description: string
  price: number
  inventory: number
  vendorId: string
  status: 'pending' | 'approved' | 'rejected'
  images: string[]
  category?: string
  approvalNote?: string
}

export type Review = {
  _id: string
  productId: string
  customerId: string
  rating: number
  comment: string
  images?: string[]
  videos?: string[]
  createdAt: string
}

export type NotificationItem = {
  _id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
}

export type Order = {
  _id: string
  items: OrderItem[]
  total: number
  status: string
  deliveryStatus?: string
  refundStatus?: string
  refundReason?: string
  paymentMethod?: string
  paymentProvider?: string
  paymentStatus?: string
  deliveryEta?: string
  deliveryAddress?: {
    label?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  createdAt: string
}

export type Category = {
  _id: string
  name: string
  description?: string
  active: boolean
}

export type SupportTicket = {
  _id: string
  subject: string
  message: string
  role: 'customer' | 'vendor'
  status: 'open' | 'in_progress' | 'resolved'
  replies: Array<{ message: string; byRole: 'admin' | 'vendor' | 'customer'; createdAt: string }>
  createdAt: string
}

export type Address = {
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault?: boolean
}
