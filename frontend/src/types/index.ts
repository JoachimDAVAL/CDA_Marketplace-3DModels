// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ARTIST' | 'ADMIN'
export type ArtistStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ModelStatus = 'PENDING' | 'ONLINE' | 'REJECTED' | 'OFFLINE'
export type FileType = 'SOURCE_3D' | 'PREVIEW_3D' | 'RENDER_IMAGE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  username: string
  avatar: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  artist?: Artist | null
}

export interface Artist {
  id: string
  firstname: string
  lastname: string
  bio: string | null
  siret: string | null
  portfolioUrl: string | null
  status: ArtistStatus
  createdAt: string
  updatedAt: string
  userId: string
  user?: { id: string; username: string; avatar: string | null }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface ModelFile {
  id: string
  url: string
  filename: string
  fileType: FileType
  size: number
  createdAt: string
  modelId: string
}

export interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  userId: string
  modelId: string
  user?: { username: string; avatar: string | null }
}

export interface Model3D {
  id: string
  title: string
  description: string
  price: string
  status: ModelStatus
  downloadCount: number
  createdAt: string
  updatedAt: string
  artistId: string
  categoryId: string
  artist?: Artist & { user?: { username: string; avatar: string | null } }
  category?: Category
  files?: ModelFile[]
  reviews?: Review[]
}

export interface CartItem {
  id: string
  addedAt: string
  cartId: string
  modelId: string
  model?: Model3D & { files: ModelFile[] }
}

export interface Cart {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  items: CartItem[]
}

export interface OrderItem {
  id: string
  priceAtPurchase: string
  orderId: string
  modelId: string | null
  model?: Pick<Model3D, 'id' | 'title'> | null
}

export interface Order {
  id: string
  totalAmount: string
  status: PaymentStatus
  createdAt: string
  updatedAt: string
  userId: string | null
  items: OrderItem[]
}

export interface Download {
  id: string
  downloadedAt: string
  userId: string
  fileId: string
  orderId: string
}

// ─── API response shapes ───────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
}

export interface PaginatedMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

export interface CheckoutResponse {
  orderId: string
  clientSecret: string | null
}

export interface DownloadResponse {
  url: string
  filename: string
  downloadsRemaining: number
}

export interface ArtistPublicProfile extends Artist {
  user: { id: string; username: string; avatar: string | null }
  models: (Model3D & { files: ModelFile[]; category: Category | null })[]
  stats: {
    modelCount: number
    totalDownloads: number
    avgRating: number
  }
}

export interface ArtistModelStat {
  id: string
  title: string
  status: ModelStatus
  currentPrice: string
  downloadCount: number
  salesCount: number
  revenue: number
}

export interface ArtistStats {
  totalRevenue: number
  totalSales: number
  totalDownloads: number
  models: ArtistModelStat[]
}