'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import ProductFilter from '@/components/ProductFilter'
import Pagination from '@/components/Pagination'
import { GridSkeleton } from '@/components/ProductSkeleton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import { useApp } from '@/context/AppContext'
import { ProductFilters } from '@/types'

const LIMIT = 20

function HomeContent() {
  const { products, totalProducts, totalPages, loadingProducts, filters, setFilters, fetchProducts } = useApp()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)

  // Initial fetch based on URL params
  useEffect(() => {
    const initialFilters: ProductFilters = {
      search: searchParams.get('search') || '',
      type: (searchParams.get('type') as ProductFilters['type']) || '',
      team: (searchParams.get('team') as ProductFilters['team']) || '',
    }
    setFilters(initialFilters)
    setPage(1)
    fetchProducts(initialFilters, 1, LIMIT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchProducts(filters, page, LIMIT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page])

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showSkeleton = loadingProducts && products.length === 0

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Đồ Bóng Đá Like Auth Cao Cấp Nhất - Có Nhận In Tên Số Theo Yêu Cầu
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">
            {totalProducts > 0
              ? `${totalProducts} sản phẩm`
              : 'Khám phá bộ sưu tập áo bóng đá'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <ProductFilter filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Grid */}
        {showSkeleton ? (
          <GridSkeleton count={8} />
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  href={`/product/${product._id}`}
                />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalProducts}
              limit={LIMIT}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc tìm kiếm</p>
          </div>
        )}

        {loadingProducts && <LoadingOverlay />}
      </main>
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<GridSkeleton count={8} />}>
      <HomeContent />
    </Suspense>
  )
}
