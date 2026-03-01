import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { isAdminAuthenticated } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`
      const url = await uploadImage(base64)
      uploadedUrls.push(url)
    }

    return NextResponse.json({ urls: uploadedUrls })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
