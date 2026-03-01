'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
        <Image
          src={images[selectedIndex]}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedIndex ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <Image
                src={img}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
