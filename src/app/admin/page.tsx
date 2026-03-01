'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import ProductCard from '@/components/ProductCard'
import ProductFilter from '@/components/ProductFilter'
import ProductModal from '@/components/ProductModal'
import ConfirmModal from '@/components/ConfirmModal'
import Pagination from '@/components/Pagination'
import { GridSkeleton } from '@/components/ProductSkeleton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import { IProduct, ProductFilters } from '@/types'
import toast from 'react-hot-toast'

const LIMIT = 20

function AdminContent() {
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ProductFilters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<IProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = async (f: ProductFilters = filters, p: number = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.search) params.set('search', f.search)
      if (f.type) params.set('type', f.type)
      if (f.team) params.set('team', f.team)
      params.set('page', String(p))
      params.set('limit', String(LIMIT))

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }

  // Initial load from URL
  useEffect(() => {
    const initialFilters: ProductFilters = {
      search: searchParams.get('search') || '',
      type: (searchParams.get('type') as ProductFilters['type']) || '',
      team: (searchParams.get('team') as ProductFilters['team']) || '',
    }
    setFilters(initialFilters)
    fetchProducts(initialFilters, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    setPage(1)
    fetchProducts(newFilters, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchProducts(filters, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Đã xóa sản phẩm')
      setDeleteTarget(null)
      fetchProducts(filters, page)
    } catch {
      toast.error('Xóa thất bại')
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleOpenEdit = (product: IProduct) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleSaved = () => {
    setShowProductModal(false)
    setEditingProduct(null)
    fetchProducts(filters, page)
  }

  const showSkeleton = loading && products.length === 0

  return (
    <>
      <AdminHeader onAddProduct={handleOpenCreate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} sản phẩm</p>
          </div>
          <button onClick={handleOpenCreate} className="btn-primary hidden sm:flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm sản phẩm
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <ProductFilter filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Grid */}
        {showSkeleton ? (
          <GridSkeleton count={LIMIT} />
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  href={`/admin/product/${product._id}`}
                  actions={
                    <>
                      <Link
                        href={`/admin/product/${product._id}`}
                        className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Chi tiết
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="flex-1 text-center text-xs font-medium text-green-600 hover:text-green-700 py-1 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="flex-1 text-center text-xs font-medium text-red-600 hover:text-red-700 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Xóa
                      </button>
                    </>
                  }
                />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-gray-500 text-lg mb-4">Chưa có sản phẩm nào</p>
            <button onClick={handleOpenCreate} className="btn-primary">
              Thêm sản phẩm đầu tiên
            </button>
          </div>
        )}

        {loading && <LoadingOverlay />}
      </main>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null) }}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Xóa sản phẩm"
          message={`Bạn có chắc muốn xóa "${deleteTarget.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
          confirmText="Xóa"
          confirmVariant="danger"
        />
      )}
    </>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<GridSkeleton count={LIMIT} />}>
      <AdminContent />
    </Suspense>
  )
}
