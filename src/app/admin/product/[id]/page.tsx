'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import ImageGallery from '@/components/ImageGallery'
import ProductModal from '@/components/ProductModal'
import ConfirmModal from '@/components/ConfirmModal'
import { IProduct, TEAM_LABELS, TYPE_LABELS } from '@/types'
import toast from 'react-hot-toast'

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<IProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => {
    fetchProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleDelete = async () => {
    if (!product) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${product._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Đã xóa sản phẩm')
      router.push('/admin')
    } catch {
      toast.error('Xóa thất bại')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <AdminHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-gray-500 mb-4">Không tìm thấy sản phẩm</p>
          <Link href="/admin" className="text-blue-600 hover:underline">Quay lại</Link>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-blue-600 transition-colors">Sản phẩm</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
          </nav>
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
              Chỉnh sửa
            </button>
            <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
              Xóa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageGallery images={product.imageUrl} alt={product.name} />

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {TYPE_LABELS[product.type]}
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {TEAM_LABELS[product.team]}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {product.price.toLocaleString('vi-VN')}₫
            </div>

            {/* Sizes table */}
            <div className="mb-5">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Tồn kho theo size:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <div
                    key={s.size}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${s.quantity > 0
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                  >
                    {s.size}: <span className="font-bold">{s.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {product.tag.length > 0 && (
              <div className="mb-5">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Tags:</h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.tag.map((t) => (
                    <span
                      key={t}
                      className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Mô tả:</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-gray-200 text-xs text-gray-400">
              ID: {product._id}
            </div>
          </div>
        </div>
      </main>

      {showEdit && (
        <ProductModal
          product={product}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); fetchProduct() }}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Xóa sản phẩm"
          message={`Bạn có chắc muốn xóa "${product.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
          confirmText="Xóa"
          confirmVariant="danger"
        />
      )}
    </>
  )
}
