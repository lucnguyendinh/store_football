'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import ProductFilter from '@/components/ProductFilter'
import Pagination from '@/components/Pagination'
import { GridSkeleton } from '@/components/ProductSkeleton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import { useApp } from '@/context/AppContext'
import { ProductFilters } from '@/types'

const LIMIT = 20

function resolveImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return new URL(url, window.location.href).href
}

function sanitizeDownloadBasename(name: string): string {
  const safe = name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim()
  return safe.length > 0 ? safe : 'product'
}

function extFromImageMime(mime: string): string {
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'jpg'
}

async function saveVisibleImagesToFolder(
  imageEntries: Array<{ name: string; primaryImage: string }>,
): Promise<void> {
  const showPicker = window.showDirectoryPicker?.bind(window)
  if (!showPicker) {
    throw new Error('NO_FOLDER_PICKER')
  }

  const parentDir = await showPicker({ mode: 'readwrite' })
  const subDir = await parentDir.getDirectoryHandle('visible-products-first-images', { create: true })

  for (let index = 0; index < imageEntries.length; index += 1) {
    const entry = imageEntries[index]
    const absoluteUrl = resolveImageUrl(entry.primaryImage)
    const res = await fetch(`/api/clipboard-image?url=${encodeURIComponent(absoluteUrl)}`)
    if (!res.ok) {
      throw new Error(`Không tải được ảnh thứ ${index + 1}`)
    }
    const blob = await res.blob()
    const ext = extFromImageMime(blob.type || '')
    const base = sanitizeDownloadBasename(entry.name)
    const filename = `${String(index + 1).padStart(2, '0')}-${base}.${ext}`
    const fileHandle = await subDir.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  }
}

function HomeContent() {
  const { products, totalProducts, totalPages, loadingProducts, filters, setFilters, fetchProducts } = useApp()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [downloadAllLoading, setDownloadAllLoading] = useState(false)

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

  const handleDownloadVisiblePrimaryImages = async () => {
    const imageEntries = products
      .map((product) => ({
        name: product.name,
        primaryImage: product.imageUrl?.find((url) => url?.trim()) || '',
      }))
      .filter((entry) => entry.primaryImage.length > 0)

    if (imageEntries.length === 0) {
      toast.error('Không có ảnh để tải')
      return
    }

    setDownloadAllLoading(true)
    try {
      try {
        await saveVisibleImagesToFolder(imageEntries)
        toast.success(`Saved ${imageEntries.length} images to selected folder`)
      } catch (folderErr) {
        if (folderErr instanceof DOMException && folderErr.name === 'AbortError') {
          return
        }
        if (!(folderErr instanceof Error) || folderErr.message !== 'NO_FOLDER_PICKER') {
          throw folderErr
        }

        // Fallback for browsers without File System Access API.
        for (let index = 0; index < imageEntries.length; index += 1) {
          const entry = imageEntries[index]
          const absoluteUrl = resolveImageUrl(entry.primaryImage)
          const res = await fetch(`/api/clipboard-image?url=${encodeURIComponent(absoluteUrl)}`)
          if (!res.ok) {
            throw new Error(`Không tải được ảnh thứ ${index + 1}`)
          }
          const blob = await res.blob()
          const ext = extFromImageMime(blob.type || '')
          const base = sanitizeDownloadBasename(entry.name)
          const objectUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = objectUrl
          a.download = `${String(index + 1).padStart(2, '0')}-${base}.${ext}`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(objectUrl)
          await new Promise((resolve) => window.setTimeout(resolve, 120))
        }
        toast.success(`Downloaded ${imageEntries.length} images`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải ảnh thất bại')
    } finally {
      setDownloadAllLoading(false)
    }
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
      <button
        type="button"
        onClick={handleDownloadVisiblePrimaryImages}
        disabled={downloadAllLoading || products.length === 0}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        aria-label="Tải ảnh đầu tiên của sản phẩm đang hiển thị"
        title="Tải ảnh đầu tiên của sản phẩm đang hiển thị"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        {downloadAllLoading ? 'Đang tải...' : 'Tải ảnh'}
      </button>
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
