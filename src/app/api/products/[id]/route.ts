import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { isAdminAuthenticated } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()
    const product = await Product.findById(params.id).lean()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const body = await req.json()
    const product = await Product.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).lean()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const product = await Product.findByIdAndDelete(params.id)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
