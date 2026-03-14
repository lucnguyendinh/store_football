'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import ImageGallery from '@/components/ImageGallery'
import { useApp } from '@/context/AppContext'
import { CUSTOMER_SIZE_OPTIONS, IProduct, Size, TEAM_LABELS, TYPE_LABELS } from '@/types'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { addToCart } = useApp()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<Size | ''>('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setProduct(data)
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
          <Link href="/" className="text-blue-600 hover:underline">
            Quay về trang chủ
          </Link>
        </main>
      </>
    )
  }

  const visibleSizes = product.sizes.filter((s) => CUSTOMER_SIZE_OPTIONS.includes(s.size))
  const totalStock = visibleSizes.reduce((sum, s) => sum + s.quantity, 0)
  const selectedSizeStock = selectedSize
    ? visibleSizes.find((s) => s.size === selectedSize)?.quantity ?? 0
    : 0

  const handleSelectSize = (size: Size) => {
    setSelectedSize(size)
    setQuantity((prev) => Math.max(1, prev))
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Vui lòng chọn size trước khi thêm vào giỏ')
      return
    }

    if (selectedSizeStock <= 0) {
      toast.error('Size đã hết hàng')
      return
    }

    if (quantity < 1) {
      toast.error('Số lượng không hợp lệ')
      return
    }

    try {
      addToCart(product, selectedSize, quantity)
      toast.success('Đã thêm vào giỏ hàng')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thêm vào giỏ hàng')
    }
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <ImageGallery images={product.imageUrl} alt={product.name} />

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {TYPE_LABELS[product.type]}
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {TEAM_LABELS[product.team]}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

            <div className="text-3xl font-bold text-blue-600 mb-4">
              {product.price.toLocaleString('vi-VN')}₫
            </div>

            {/* Sizes */}
            <div className="mb-5">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Chọn size:</h3>
              <div className="flex flex-wrap gap-2">
                {visibleSizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={s.quantity <= 0}
                    onClick={() => handleSelectSize(s.size)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${s.quantity > 0
                      ? selectedSize === s.size
                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:border-blue-400'
                      : 'border-gray-200 text-gray-300 line-through'
                      }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
              {visibleSizes.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">Hiện chưa có size khả dụng.</p>
              )}
            </div>

            <div className="mb-5">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Số lượng:</h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input-field max-w-28"
                />
                {selectedSize ? (
                  <span className={`text-xs ${selectedSizeStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {selectedSizeStock > 0 ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Chọn size để xem trạng thái hàng</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {product.tag.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-1.5">
                {product.tag.map((t) => (
                  <span
                    key={t}
                    className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Mô tả:</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* CTA */}
            <p className="text-xs text-gray-500 mb-3">
              Thêm vào giỏ trước để mua nhiều sản phẩm trong một lần đặt hàng.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={totalStock === 0}
                className={`py-3 px-6 rounded-xl font-bold text-base transition-colors ${totalStock > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {totalStock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
              </button>
              <Link href="/cart" className="btn-secondary text-center py-3">
                Xem giỏ hàng
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
