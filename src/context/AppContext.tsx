'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { IProduct, IOrder, ProductFilters } from '@/types'

interface AppContextType {
  // Products
  products: IProduct[]
  totalProducts: number
  totalPages: number
  loadingProducts: boolean
  filters: ProductFilters
  setFilters: (filters: ProductFilters) => void
  fetchProducts: (filters?: ProductFilters, page?: number, limit?: number) => Promise<void>

  // Orders
  myOrders: IOrder[]
  loadingOrders: boolean
  fetchMyOrders: () => Promise<void>
  createOrder: (data: Omit<IOrder, '_id' | 'uuid' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<IOrder>

  // UUID
  userUuid: string | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<IProduct[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [filters, setFiltersState] = useState<ProductFilters>({})
  const [myOrders, setMyOrders] = useState<IOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [userUuid, setUserUuid] = useState<string | null>(null)

  // Read uuid from cookie on mount
  useEffect(() => {
    const cookieUuid = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user_uuid='))
      ?.split('=')[1]
    if (cookieUuid) setUserUuid(cookieUuid)
  }, [])

  const fetchProducts = useCallback(async (overrideFilters?: ProductFilters, page = 1, limit = 20) => {
    setLoadingProducts(true)
    try {
      const f = overrideFilters ?? filters
      const params = new URLSearchParams()
      if (f.search) params.set('search', f.search)
      if (f.type) params.set('type', f.type)
      if (f.team) params.set('team', f.team)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setTotalProducts(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoadingProducts(false)
    }
  }, [filters])

  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters)
  }, [])

  const fetchMyOrders = useCallback(async () => {
    const uuid = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user_uuid='))
      ?.split('=')[1]
    if (!uuid) return

    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/orders?uuid=${uuid}`)
      const data = await res.json()
      setMyOrders(Array.isArray(data) ? data : [])
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const createOrder = useCallback(
    async (data: Omit<IOrder, '_id' | 'uuid' | 'status' | 'createdAt' | 'updatedAt'>) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create order')
      }

      const order = await res.json()

      // Refresh uuid from cookie after order creation
      const cookieUuid = document.cookie
        .split('; ')
        .find((row) => row.startsWith('user_uuid='))
        ?.split('=')[1]
      if (cookieUuid) setUserUuid(cookieUuid)

      return order
    },
    []
  )

  return (
    <AppContext.Provider
      value={{
        products,
        totalProducts,
        totalPages,
        loadingProducts,
        filters,
        setFilters,
        fetchProducts,
        myOrders,
        loadingOrders,
        fetchMyOrders,
        createOrder,
        userUuid,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
