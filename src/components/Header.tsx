'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { PURCHASE_ENABLED } from '@/lib/features'

export default function Header() {
  const { cartCount } = useApp()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="AOBONGDA.STORE"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="font-bold text-xl text-gray-900">AOBONGDA.STORE</span>
          </Link>

          {PURCHASE_ENABLED && (
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.1 5.4A1 1 0 007 20h12M7 13L5.4 5M16 20a1 1 0 100 2 1 1 0 000-2zm-8 0a1 1 0 100 2 1 1 0 000-2z"
                />
              </svg>
              <span className="hidden sm:inline">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[11px] leading-5 text-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
