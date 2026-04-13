'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState, type MouseEvent } from 'react'
import toast from 'react-hot-toast'
import { CUSTOMER_SIZE_OPTIONS, IProduct, SIZE_OPTIONS, TEAM_LABELS, TYPE_LABELS } from '@/types'

function resolveImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return new URL(url, window.location.href).href
}

async function fetchImageBlobViaSameOriginProxy(absoluteUrl: string): Promise<Blob> {
  const proxyUrl = `/api/clipboard-image?url=${encodeURIComponent(absoluteUrl)}`
  const res = await fetch(proxyUrl)
  if (!res.ok) {
    const errJson = (await res.json().catch(() => null)) as { error?: string } | null
    const msg = errJson?.error?.trim()
    throw new Error(msg || `Không tải được ảnh (${res.status})`)
  }
  const blob = await res.blob()
  const mime = blob.type || res.headers.get('content-type') || ''
  if (!mime.startsWith('image/')) {
    throw new Error('Phản hồi không phải ảnh')
  }
  return blob
}

/** Browsers often reject clipboard writes for image/webp; PNG is widely accepted. */
async function blobToPngForClipboard(imageBlob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(imageBlob)
  try {
    const { width, height } = bitmap
    if (width === 0 || height === 0) throw new Error('Ảnh không hợp lệ')
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas')
    ctx.drawImage(bitmap, 0, 0)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Không chuyển được ảnh sang PNG'))
        },
        'image/png',
        1,
      )
    })
  } finally {
    bitmap.close()
  }
}

/** Copies only the primary product image (one network fetch + one clipboard write). */
async function copyPrimaryImageToClipboard(imageUrl: string): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error('Trình duyệt không hỗ trợ sao chép ảnh (clipboard.write)')
  }

  const absolute = resolveImageUrl(imageUrl)
  const blob = await fetchImageBlobViaSameOriginProxy(absolute)
  const png = await blobToPngForClipboard(blob)
  const item = new ClipboardItem({ 'image/png': png })

  try {
    await navigator.clipboard.write([item])
  } catch {
    throw new Error('Không ghi được vào clipboard (thử HTTPS hoặc cấp quyền cho trang)')
  }
}

function sanitizeDownloadBasename(name: string): string {
  const s = name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim()
  return s.length > 0 ? s : 'product'
}

function extFromImageMime(mime: string): string {
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'jpg'
}

/** Chrome / Edge (HTTPS or localhost): user picks a folder; images go into a subfolder as separate files. */
async function saveProductImagesToFolder(urls: string[], productName: string): Promise<void> {
  const showPicker = window.showDirectoryPicker?.bind(window)
  if (!showPicker) {
    throw new Error('NO_FOLDER_PICKER')
  }

  const parentDir = await showPicker({ mode: 'readwrite' })
  const base = sanitizeDownloadBasename(productName).slice(0, 120)
  const subDir = await parentDir.getDirectoryHandle(base, { create: true })
  const resolved = Array.from(new Set(urls.map(resolveImageUrl)))

  let index = 0
  for (const url of resolved) {
    index += 1
    const blob = await fetchImageBlobViaSameOriginProxy(url)
    const ext = extFromImageMime(blob.type || '')
    const fileHandle = await subDir.getFileHandle(`${index}.${ext}`, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  }
}

async function downloadProductImagesZip(urls: string[], productName: string): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const resolved = Array.from(new Set(urls.map(resolveImageUrl)))
  const base = sanitizeDownloadBasename(productName)

  let index = 0
  for (const url of resolved) {
    index += 1
    const blob = await fetchImageBlobViaSameOriginProxy(url)
    const ext = extFromImageMime(blob.type || '')
    zip.file(`${base}-${index}.${ext}`, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const filename = `${base}-images.zip`
  const objectUrl = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

interface ProductCardProps {
  product: IProduct
  href: string
  actions?: React.ReactNode
  showStockQuantity?: boolean
}

export default function ProductCard({
  product,
  href,
  actions,
  showStockQuantity = false,
}: ProductCardProps) {
  const primaryImage = product.imageUrl?.[0] || '/placeholder.jpg'
  const quantityMap = new Map(product.sizes.map((item) => [item.size, item.quantity]))
  const visibleSizes = showStockQuantity ? SIZE_OPTIONS : CUSTOMER_SIZE_OPTIONS
  const [copyState, setCopyState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [downloadLoading, setDownloadLoading] = useState(false)

  const handleCopyImages = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()

      setCopyState('loading')
      try {
        await copyPrimaryImageToClipboard(primaryImage)
        setCopyState('done')
        toast.success('Đã sao chép ảnh đầu tiên — dán bằng Ctrl+V')
      } catch (err) {
        setCopyState('error')
        toast.error(err instanceof Error ? err.message : 'Không sao chép được ảnh')
      }
      window.setTimeout(() => setCopyState('idle'), 2000)
    },
    [primaryImage],
  )

  const handleDownloadImages = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const trimmed = product.imageUrl?.filter((u) => u?.trim()) ?? []
      const list = trimmed.length > 0 ? trimmed : [primaryImage]

      setDownloadLoading(true)
      try {
        try {
          await saveProductImagesToFolder(list, product.name)
          toast.success(`Đã lưu ảnh vào thư mục con "${sanitizeDownloadBasename(product.name)}"`)
        } catch (first: unknown) {
          if (first instanceof DOMException && first.name === 'AbortError') {
            return
          }
          if (first instanceof Error && first.message === 'NO_FOLDER_PICKER') {
            await downloadProductImagesZip(list, product.name)
            toast.success(
              'Trình duyệt không hỗ trợ chọn thư mục (dùng Chrome/Edge + HTTPS) — đã tải file ZIP',
            )
            return
          }
          throw first
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không lưu được ảnh')
      } finally {
        setDownloadLoading(false)
      }
    },
    [product.imageUrl, primaryImage, product.name],
  )

  return (
    <div className="card group cursor-pointer hover:shadow-md transition-shadow duration-200">
      <Link href={href}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
            <button
              type="button"
              onClick={handleCopyImages}
              disabled={copyState === 'loading'}
              className="flex items-center justify-center rounded-full bg-white/90 p-1.5 text-gray-700 shadow-sm ring-1 ring-gray-200/80 transition hover:bg-white hover:text-blue-600 disabled:opacity-60"
              aria-label="Sao chép ảnh đầu tiên của sản phẩm"
              title="Chỉ sao chép ảnh đầu tiên — cả bộ ảnh: nút lưu thư mục bên dưới"
            >
              {copyState === 'done' ? (
                <span className="text-[10px] font-semibold leading-none text-green-600 px-0.5">OK</span>
              ) : copyState === 'error' ? (
                <span className="text-[10px] font-semibold leading-none text-red-600 px-0.5">!</span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadImages}
              disabled={downloadLoading}
              className="flex items-center justify-center rounded-full bg-white/90 p-1.5 text-gray-700 shadow-sm ring-1 ring-gray-200/80 transition hover:bg-white hover:text-blue-600 disabled:opacity-60"
              aria-label="Lưu tất cả ảnh vào thư mục (hoặc ZIP nếu trình duyệt không hỗ trợ)"
              title="Chọn thư mục trên máy — ảnh được ghi vào thư mục con (Chrome/Edge). Safari/Firefox: tự động tải ZIP."
            >
              {downloadLoading ? (
                <span className="text-[10px] font-semibold leading-none text-blue-600 px-0.5">…</span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.89l.812 1.22A2 2 0 0 0 10.07 6H20a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
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
            {visibleSizes.map((size) => {
              const quantity = quantityMap.get(size) ?? 0
              const isOutOfStock = quantity <= 0

              return (
                <span
                  key={size}
                  className="relative group/size"
                  title={showStockQuantity ? `Size ${size}: ${quantity}` : undefined}
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
                  {showStockQuantity && (
                    <span className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded bg-gray-900 text-white text-[10px] px-1.5 py-0.5 opacity-0 group-hover/size:opacity-100 transition-opacity pointer-events-none">
                      {quantity}
                    </span>
                  )}
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
