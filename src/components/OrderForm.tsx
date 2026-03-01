'use client'

import { useState } from 'react'
import { IProduct, Size, SIZE_OPTIONS } from '@/types'
import { useApp } from '@/context/AppContext'
import toast from 'react-hot-toast'

interface OrderFormProps {
  product: IProduct
  onClose: () => void
  onSuccess: () => void
}

export default function OrderForm({ product, onClose, onSuccess }: OrderFormProps) {
  const { createOrder } = useApp()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    size: '' as Size | '',
    quantity: 1,
  })

  const availableSizes = product.sizes.filter((s) => s.quantity > 0)

  const selectedSizeStock =
    product.sizes.find((s) => s.size === form.size)?.quantity ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.size) {
      toast.error('Vui lòng chọn size')
      return
    }
    if (form.quantity < 1 || form.quantity > selectedSizeStock) {
      toast.error(`Số lượng không hợp lệ (tối đa ${selectedSizeStock})`)
      return
    }

    setLoading(true)
    try {
      await createOrder({
        customerName: form.customerName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        productId: product._id,
        size: form.size as Size,
        quantity: form.quantity,
      })
      toast.success('Đặt hàng thành công!')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Đặt hàng</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="input-field"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              pattern="[0-9]{10,11}"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="input-field"
              placeholder="0901234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ giao hàng <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => {
                  const stockItem = product.sizes.find((s) => s.size === size)
                  const inStock = stockItem && stockItem.quantity > 0
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!inStock}
                      onClick={() => setForm({ ...form, size })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.size === size
                          ? 'bg-blue-600 text-white border-blue-600'
                          : inStock
                            ? 'border-gray-300 hover:border-blue-400 text-gray-700'
                            : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                        }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
              {availableSizes.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Hết hàng</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng
              </label>
              <input
                type="number"
                min={1}
                max={selectedSizeStock || 1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="input-field"
              />
              {form.size && (
                <p className="text-xs text-gray-500 mt-1">Còn {selectedSizeStock} sản phẩm</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || availableSizes.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
