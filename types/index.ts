export interface App {
  id: string
  name: string
  slug: string
  icon_url: string
  version: string
  developer: string
  mod_feature: string
  mod_feature_full: string
  description: string
  package_name: string
  size: string
  upload_date: string
  direct_url: string
  free_url: string
  vip_url: string
  screenshots: string[]
  category_id: string
  rating?: number
  download_count?: number
  is_recommended?: boolean
  created_at?: string
}


export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  created_at?: string
}

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  is_vip: boolean
  vip_plan_id?: string | null
  vip_expires_at?: string
  role: "user" | "admin"
  created_at?: string
}

export interface Download {
  id: string
  user_id: string
  app_id: string
  app_name: string
  download_url: string
  is_vip: boolean
  created_at: string
}

export interface VipUser {
  id: string
  user_id: string
  expires_at: string
  created_at?: string
}

export interface MembershipPlan {
  id: string
  name: string
  price: string
  original_price: string | null
  period: string
  description: string
  features: string[]
  accent: "cyan" | "yellow" | "purple"
  popular: boolean
  is_active: boolean
  sort_order: number
  info_gangguan: string | null
  discount_percent: number | null
  is_free: boolean
  created_at?: string
  updated_at?: string
}

export interface Favorite {
  id: string
  user_id: string
  app_id: string
  created_at: string
  app?: App // joined data
}
