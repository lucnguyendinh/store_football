'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
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
        </div>
      </div>
    </header>
  )
}
