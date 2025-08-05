// Supabase Storage URLs
export const STORAGE_BASE_URL = 'https://fbqwaloizdxlxwcddykz.supabase.co/storage/v1/object/public'

// Logo ve Brand Assets
export const BRAND_ASSETS = {
  logo: `${STORAGE_BASE_URL}/dmar/dmar.webp`,
  favicon: `${STORAGE_BASE_URL}/dmar/dmar.webp`,
} as const

// App Configuration
export const APP_CONFIG = {
  name: 'DMAR Panel',
  description: 'Profesyonel admin panel ve dashboard yönetim sistemi',
  version: '1.0.0',
} as const

// Store Configuration
export const STORE_CONFIG = {
  courtyard: {
    id: 'courtyard',
    name: 'DMAR Courtyard',
    fullName: 'DMAR Market Courtyard AVM',
    location: 'Courtyard AVM'
  },
  laisla: {
    id: 'laisla',
    name: 'DMAR La Isla',
    fullName: 'DMAR Market La Isla AVM',
    location: 'La Isla AVM'
  },
  erenkoy: {
    id: 'erenkoy',
    name: 'DMAR Erenköy',
    fullName: 'DMAR Market Erenköy Şubesi',
    location: 'Erenköy'
  }
} as const

export type StoreId = keyof typeof STORE_CONFIG

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
} as const