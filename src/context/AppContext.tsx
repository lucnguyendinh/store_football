'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import {
  CartItem,
  CUSTOMER_SIZE_OPTIONS,
  IOrder,
  IProduct,
  ProductFilters,
  Size,
} from '@/types'

const CART_STORAGE_KEY = 'football_store_cart_v1'

const getCartItemKey = (productId: string, size: Size) => `${productId}_${size}`

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

  // Cart
  cartItems: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (
    product: IProduct,
    size: Size,
    quantity: number
  ) => { addedQuantity: number; finalQuantity: number }
  updateCartQuantity: (productId: string, size: Size, quantity: number) => void
  removeFromCart: (productId: string, size: Size) => void
  clearCart: () => void

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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartInitialized, setCartInitialized] = useState(false)

  // Read uuid from cookie on mount
  useEffect(() => {
    const cookieUuid = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user_uuid='))
      ?.split('=')[1]
    if (cookieUuid) setUserUuid(cookieUuid)
  }, [])

  // Restore cart from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return

      const restored: CartItem[] = parsed
        .map((item) => {
          const maybeItem = item as Partial<CartItem>
          if (
            typeof maybeItem?.productId !== 'string' ||
            typeof maybeItem?.productName !== 'string' ||
            typeof maybeItem?.productImage !== 'string' ||
            typeof maybeItem?.productPrice !== 'number' ||
            typeof maybeItem?.quantity !== 'number' ||
            typeof maybeItem?.size !== 'string' ||
            !CUSTOMER_SIZE_OPTIONS.includes(maybeItem.size as Size)
          ) {
            return null
          }

          return {
            productId: maybeItem.productId,
            productName: maybeItem.productName,
            productImage: maybeItem.productImage,
            productPrice: maybeItem.productPrice,
            size: maybeItem.size as Size,
            quantity: Math.max(1, Math.floor(maybeItem.quantity)),
          }
        })
        .filter((item): item is CartItem => item !== null)

      setCartItems(restored)
    } catch {
      setCartItems([])
    } finally {
      setCartInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (!cartInitialized) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems, cartInitialized])

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

  const addToCart = useCallback((product: IProduct, size: Size, quantity: number) => {
    if (size === 'XXXL') {
      throw new Error('Size XXXL đang tạm ẩn')
    }

    const sizeStock = product.sizes.find((item) => item.size === size)?.quantity ?? 0
    if (sizeStock <= 0) {
      throw new Error('Size đã hết hàng')
    }

    const normalizedQuantity = Math.max(1, Math.floor(quantity))
    const itemKey = getCartItemKey(product._id, size)
    const primaryImage = product.imageUrl[0] || '/placeholder.jpg'

    let result = { addedQuantity: 0, finalQuantity: 0 }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => getCartItemKey(item.productId, item.size) === itemKey
      )

      if (existingIndex < 0) {
        const finalQuantity = normalizedQuantity
        result = {
          addedQuantity: finalQuantity,
          finalQuantity,
        }

        return [
          ...prev,
          {
            productId: product._id,
            productName: product.name,
            productImage: primaryImage,
            productPrice: product.price,
            size,
            quantity: finalQuantity,
          },
        ]
      }

      const existing = prev[existingIndex]
      const finalQuantity = existing.quantity + normalizedQuantity
      result = {
        addedQuantity: finalQuantity - existing.quantity,
        finalQuantity,
      }

      const next = [...prev]
      next[existingIndex] = {
        ...existing,
        productName: product.name,
        productImage: primaryImage,
        productPrice: product.price,
        quantity: finalQuantity,
      }

      return next
    })

    return result
  }, [])

  const updateCartQuantity = useCallback((productId: string, size: Size, quantity: number) => {
    const itemKey = getCartItemKey(productId, size)
    const normalizedQuantity = Math.floor(quantity)

    setCartItems((prev) => {
      if (normalizedQuantity <= 0) {
        return prev.filter((item) => getCartItemKey(item.productId, item.size) !== itemKey)
      }

      return prev.map((item) => {
        if (getCartItemKey(item.productId, item.size) !== itemKey) {
          return item
        }

        return {
          ...item,
          quantity: Math.max(1, normalizedQuantity),
        }
      })
    })
  }, [])

  const removeFromCart = useCallback((productId: string, size: Size) => {
    const itemKey = getCartItemKey(productId, size)
    setCartItems((prev) => prev.filter((item) => getCartItemKey(item.productId, item.size) !== itemKey))
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.productPrice * item.quantity, 0)

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
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
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
