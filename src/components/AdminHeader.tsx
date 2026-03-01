'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface AdminHeaderProps {
  onAddProduct?: () => void
}

export default function AdminHeader({ onAddProduct }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Đã đăng xuất')
      router.push('/admin/login')
      router.refresh()
    } catch {
      toast.error('Lỗi đăng xuất')
    }
  }

  return (
    <header className="bg-blue-900 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span className="font-bold text-xl">Admin Dashboard</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/admin"
                className="text-blue-200 hover:text-white transition-colors text-sm font-medium"
              >
                Sản phẩm
              </Link>
              <Link
                href="/admin/orders"
                className="text-blue-200 hover:text-white transition-colors text-sm font-medium"
              >
                Đơn hàng
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {onAddProduct && (
              <button
                onClick={onAddProduct}
                className="flex items-center gap-1.5 bg-white text-blue-900 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm sản phẩm
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
