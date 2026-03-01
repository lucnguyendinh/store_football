'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/AdminHeader'
import Pagination from '@/components/Pagination'
import { IOrder, IProduct, OrderStatus } from '@/types'
import toast from 'react-hot-toast'

interface PopulatedOrder extends Omit<IOrder, 'productId'> {
  productId: Pick<IProduct, '_id' | 'name' | 'imageUrl' | 'price'>
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  Processing: 'Đang xử lý',
  Confirmed: 'Đã xác nhận',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  Processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Confirmed: 'bg-green-100 text-green-700 border-green-200',
}

const LIMIT = 10

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PopulatedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [selectedOrder, setSelectedOrder] = useState<PopulatedOrder | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalProcessing, setTotalProcessing] = useState(0)
  const [totalConfirmed, setTotalConfirmed] = useState(0)

  const fetchOrders = async (filter: OrderStatus | '' = statusFilter, p: number = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      params.set('page', String(p))
      params.set('limit', String(LIMIT))
      const res = await fetch(`/api/orders?${params.toString()}`)
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setTotalProcessing(data.totalProcessing ?? 0)
      setTotalConfirmed(data.totalConfirmed ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStatusFilterChange = (filter: OrderStatus | '') => {
    setStatusFilter(filter)
    setPage(1)
    fetchOrders(filter, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchOrders(statusFilter, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
      if (selectedOrder?._id === orderId) setSelectedOrder(updated)
      toast.success('Cập nhật trạng thái thành công')
      // Refresh counts
      fetchOrders(statusFilter, page)
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalProcessing + totalConfirmed} đơn hàng</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{totalProcessing + totalConfirmed}</div>
            <div className="text-sm text-gray-500">Tổng đơn hàng</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="text-2xl font-bold text-yellow-700">{totalProcessing}</div>
            <div className="text-sm text-yellow-600">Đang xử lý</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-700">{totalConfirmed}</div>
            <div className="text-sm text-green-600">Đã xác nhận</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {(['', 'Processing', 'Confirmed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilterChange(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
            >
              {s === '' ? 'Tất cả' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500">Không có đơn hàng nào</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        👕
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {(order.productId as Pick<IProduct, '_id' | 'name' | 'imageUrl' | 'price'>)?.name ||
                            'Sản phẩm'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.customerName} · {order.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Size: {order.size} · SL: {order.quantity} · {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.status === 'Processing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(order._id, 'Confirmed')
                          }}
                          disabled={updatingStatus}
                          className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          Xác nhận
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Khách hàng</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Điện thoại</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.phoneNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs mb-0.5">Địa chỉ</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.address}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Sản phẩm</p>
                  <p className="font-semibold text-gray-900">
                    {(selectedOrder.productId as Pick<IProduct, '_id' | 'name' | 'imageUrl' | 'price'>)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Giá</p>
                  <p className="font-semibold text-blue-600">
                    {(selectedOrder.productId as Pick<IProduct, '_id' | 'name' | 'imageUrl' | 'price'>)?.price?.toLocaleString('vi-VN')}₫
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Size</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.size}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Số lượng</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Ngày đặt</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Trạng thái</p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${STATUS_COLORS[selectedOrder.status]}`}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                </div>
              </div>

              {/* Update status button */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Cập nhật trạng thái:</p>
                <div className="flex gap-2">
                  {(['Processing', 'Confirmed'] as OrderStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(selectedOrder._id, s)}
                      disabled={updatingStatus || selectedOrder.status === s}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-default ${selectedOrder.status === s
                        ? STATUS_COLORS[s] + ' cursor-default'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
