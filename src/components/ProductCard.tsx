'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IProduct, SIZE_OPTIONS, TEAM_LABELS, TYPE_LABELS } from '@/types'

interface ProductCardProps {
  product: IProduct
  href: string
  actions?: React.ReactNode
}

export default function ProductCard({ product, href, actions }: ProductCardProps) {
  const primaryImage = product.imageUrl?.[0] || '/placeholder.jpg'
  const quantityMap = new Map(product.sizes.map((item) => [item.size, item.quantity]))

  return (
    <div className="card group cursor-pointer hover:shadow-md transition-shadow duration-200">
      <Link href={href}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
          />
          {/* Type badge */}
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {TYPE_LABELS[product.type]}
          </span>
        </div>
      </Link>

      <div className="p-3">
        <Link href={href}>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-blue-600 font-bold text-base">
              {product.price.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {TEAM_LABELS[product.team]}
            </span>
          </div>
          {product.tag.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tag.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SIZE_OPTIONS.map((size) => {
              const quantity = quantityMap.get(size) ?? 0
              const isOutOfStock = quantity <= 0

              return (
                <span
                  key={size}
                  className="relative group/size"
                  title={`Size ${size}: ${quantity}`}
                  aria-disabled={isOutOfStock}
                >
                  <span
                    className={`inline-flex items-center justify-center min-w-7 h-6 px-1.5 rounded border text-xs font-medium transition-colors ${isOutOfStock
                      ? 'border-gray-200 bg-gray-50 text-gray-400 line-through cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-700 group-hover:border-blue-400'
                      }`}
                  >
                    {size}
                  </span>
                  <span className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded bg-gray-900 text-white text-[10px] px-1.5 py-0.5 opacity-0 group-hover/size:opacity-100 transition-opacity pointer-events-none">
                    {quantity}
                  </span>
                </span>
              )
            })}
          </div>
        </Link>

        {actions && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
