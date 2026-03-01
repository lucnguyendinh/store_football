'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  IProduct,
  ProductType,
  Team,
  Size,
  SIZE_OPTIONS,
  TEAM_OPTIONS,
  TEAM_LABELS,
  TYPE_LABELS,
} from '@/types'
import toast from 'react-hot-toast'

interface ProductModalProps {
  product?: IProduct | null
  onClose: () => void
  onSave: () => void
}

interface SizeEntry {
  size: Size
  quantity: number
}

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const isEdit = !!product
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    tag: product?.tag.join(', ') || '',
    type: product?.type || 'PLAYER' as ProductType,
    team: product?.team || 'OTHER' as Team,
    description: product?.description || '',
    imageUrl: product?.imageUrl || [] as string[],
  })

  const [sizes, setSizes] = useState<SizeEntry[]>(
    product?.sizes || SIZE_OPTIONS.map((s) => ({ size: s, quantity: 0 }))
  )

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((f) => formData.append('images', f))

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setForm((prev) => ({ ...prev, imageUrl: [...prev.imageUrl, ...data.urls] }))
    } catch {
      toast.error('Upload ảnh thất bại')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrl: prev.imageUrl.filter((_, i) => i !== index),
    }))
  }

  const updateSize = (size: Size, quantity: number) => {
    setSizes((prev) =>
      prev.map((s) => (s.size === size ? { ...s, quantity: Math.max(0, quantity) } : s))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Tên sản phẩm không được để trống')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        tag: form.tag
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        price: Number(form.price),
        sizes,
      }

      const url = isEdit ? `/api/products/${product._id}` : '/api/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Lỗi lưu sản phẩm')
      }

      toast.success(isEdit ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công')
      onSave()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.imageUrl.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={url} alt={`img-${i}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingImages ? (
                  <span className="text-xs text-gray-500">Đang tải...</span>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-gray-400 mt-1">Thêm ảnh</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          {/* Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(phân cách bởi dấu phẩy)</span>
            </label>
            <input
              type="text"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="input-field"
              placeholder="home, away, 2024"
            />
          </div>

          {/* Type & Team */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })}
                className="input-field"
              >
                {(['PLAYER', 'FAN', 'RETRO'] as ProductType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đội <span className="text-red-500">*</span>
              </label>
              <select
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value as Team })}
                className="input-field"
              >
                {TEAM_OPTIONS.map((t) => (
                  <option key={t} value={t}>{TEAM_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng theo size</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SIZE_OPTIONS.map((size) => {
                const entry = sizes.find((s) => s.size === size)
                return (
                  <div key={size} className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-1">{size}</div>
                    <input
                      type="number"
                      min={0}
                      value={entry?.quantity ?? 0}
                      onChange={(e) => updateSize(size, parseInt(e.target.value) || 0)}
                      className="input-field text-center px-1"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Mô tả sản phẩm..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Hủy
            </button>
            <button type="submit" disabled={loading || uploadingImages} className="btn-primary flex-1">
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
