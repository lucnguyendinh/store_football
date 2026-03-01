import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { isAdminAuthenticated } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB()
    const order = await Order.findById(params.id)
      .populate('productId', 'name imageUrl price')
      .lean()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const { status } = await req.json()

    const order = await Order.findByIdAndUpdate(
      params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('productId', 'name imageUrl price')
      .lean()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
