import { NextRequest, NextResponse } from 'next/server'

const MAX_BYTES = 12 * 1024 * 1024

const IMAGE_PATH = /\.(jpe?g|png|gif|webp|svg)$/i

function isAllowedTarget(url: URL, requestOrigin: string): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false

  if (url.hostname === 'res.cloudinary.com' && url.protocol === 'https:') {
    return true
  }

  if (url.origin === requestOrigin) {
    const p = url.pathname
    if (p.startsWith('/api/')) return false
    return IMAGE_PATH.test(p)
  }

  return false
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(urlParam)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!isAllowedTarget(target, req.nextUrl.origin)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }

  const upstream = await fetch(target.href, {
    headers: { Accept: 'image/*' },
    redirect: 'follow',
  })

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Upstream failed' }, { status: 502 })
  }

  const len = upstream.headers.get('content-length')
  if (len && Number(len) > MAX_BYTES) {
    return NextResponse.json({ error: 'Too large' }, { status: 413 })
  }

  const buffer = await upstream.arrayBuffer()
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Too large' }, { status: 413 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Not an image' }, { status: 422 })
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=120',
    },
  })
}
