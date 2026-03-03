import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { isAdminAuthenticated } from '@/lib/auth'
import { OrderStatus, Size } from '@/types'

interface RouteParams {
  params: { id: string }
}

interface ExistingOrderLean {
  status: OrderStatus
  productId: string
  size: Size
  quantity: number
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
    const { status } = (await req.json()) as { status: OrderStatus }

    if (!['Processing', 'Confirmed', 'Canceled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existingOrder = await Order.findById(params.id).lean<ExistingOrderLean | null>()
    if (!existingOrder || Array.isArray(existingOrder)) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (existingOrder.status === status) {
      const order = await Order.findById(params.id)
        .populate('productId', 'name imageUrl price')
        .lean()
      return NextResponse.json(order)
    }

    if (status === 'Confirmed') {
      if (existingOrder.status !== 'Processing') {
        return NextResponse.json(
          { error: 'Only processing orders can be confirmed' },
          { status: 400 }
        )
      }

      const stockUpdated = await Product.updateOne(
        {
          _id: existingOrder.productId,
          sizes: {
            $elemMatch: {
              size: existingOrder.size,
              quantity: { $gte: existingOrder.quantity },
            },
          },
        },
        {
          $inc: {
            'sizes.$.quantity': -existingOrder.quantity,
          },
        }
      )

      if (stockUpdated.modifiedCount === 0) {
        return NextResponse.json(
          { error: 'Không đủ tồn kho để xác nhận đơn hàng' },
          { status: 400 }
        )
      }
    }

    if (status === 'Canceled' && existingOrder.status === 'Confirmed') {
      return NextResponse.json(
        { error: 'Không thể hủy đơn đã xác nhận' },
        { status: 400 }
      )
    }

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
