'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import ImageGallery from '@/components/ImageGallery'
import OrderForm from '@/components/OrderForm'
import { IProduct, TEAM_LABELS, TYPE_LABELS } from '@/types'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

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

  const totalStock = product.sizes.reduce((sum, s) => sum + s.quantity, 0)

  if (orderSuccess) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h2>
            <p className="text-gray-500 mb-6">
              Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ sớm nhất có thể.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Tiếp tục mua sắm
            </Link>
          </div>
        </main>
      </>
    )
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
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Kho hàng theo size:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <div
                    key={s.size}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${s.quantity > 0
                        ? 'border-gray-300 text-gray-700 bg-white'
                        : 'border-gray-200 text-gray-300 line-through'
                      }`}
                  >
                    {s.size}
                    {s.quantity > 0 && (
                      <span className="text-xs text-gray-400 ml-1">({s.quantity})</span>
                    )}
                  </div>
                ))}
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
            <button
              onClick={() => setShowOrderForm(true)}
              disabled={totalStock === 0}
              className={`w-full py-3 px-6 rounded-xl font-bold text-base transition-colors ${totalStock > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {totalStock > 0 ? 'Mua ngay' : 'Hết hàng'}
            </button>
          </div>
        </div>
      </main>

      {showOrderForm && (
        <OrderForm
          product={product}
          onClose={() => setShowOrderForm(false)}
          onSuccess={() => {
            setShowOrderForm(false)
            setOrderSuccess(true)
          }}
        />
      )}
    </>
  )
}
