export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  createdAt: string
}

export interface Store {
  id: string
  userId: string
  slug: string
  businessName: string
  description: string
  logo: string | null
  bannerImage: string | null
  whatsappNumber: string
  socialMedia: {
    instagram: string | null
    facebook: string | null
    tiktok: string | null
  }
  location: {
    city: string
    state: string
    country: string
  }
  theme: StoreTheme
  createdAt: string
  updatedAt: string
}

export type StoreTheme = 'default' | 'warm' | 'cool' | 'fiesta'

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  sizes: ProductSize[]
  images: string[]
  available: boolean
  productionTime: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface ProductSize {
  name: string
  price: number
}

export const PRODUCT_CATEGORIES = [
  'Piñatas tradicionales',
  'Piñatas personalizadas',
  'Piñatas de número',
  'Piñatas temáticas',
  'Mini piñatas',
  'Piñatas gigantes',
  'Accesorios',
  'Otro',
] as const

export const STORE_THEMES: { value: StoreTheme; label: string; colors: string }[] = [
  { value: 'default', label: 'Clásico', colors: 'from-purple-600 to-pink-500' },
  { value: 'warm', label: 'Cálido', colors: 'from-orange-500 to-rose-500' },
  { value: 'cool', label: 'Fresco', colors: 'from-cyan-500 to-blue-500' },
  { value: 'fiesta', label: 'Fiesta', colors: 'from-yellow-400 to-pink-500' },
]

export const MAX_PRODUCT_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 2
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
