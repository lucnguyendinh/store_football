import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { isAdminAuthenticated } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { Size } from '@/types'

interface CreateOrderBody {
  customerName: string
  phoneNumber: string
  address: string
  note?: string
  productId: string
  size: Size
  quantity: number
}

interface OrderListQuery {
  status?: string
  uuid?: string
}

export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated()

  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const uuid = searchParams.get('uuid') || ''

    const query: OrderListQuery = {}

    if (isAuth) {
      if (status) query.status = status
    } else {
      if (!uuid) {
        return NextResponse.json({ error: 'UUID required' }, { status: 400 })
      }
      query.uuid = uuid
    }

    if (isAuth) {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const skip = (page - 1) * limit

      const [orders, total, totalProcessing, totalConfirmed, totalCanceled] = await Promise.all([
        Order.find(query)
          .populate('productId', 'name imageUrl price')
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
        Order.countDocuments({ status: 'Processing' }),
        Order.countDocuments({ status: 'Confirmed' }),
        Order.countDocuments({ status: 'Canceled' }),
      ])

      return NextResponse.json({
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        totalProcessing,
        totalConfirmed,
        totalCanceled,
      })
    }

    // Guest: trả về tất cả đơn của uuid (không phân trang)
    const orders = await Order.find(query)
      .populate('productId', 'name imageUrl price')
      .sort({ quantity: -1, createdAt: -1 })
      .lean()

    return NextResponse.json(orders)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = (await req.json()) as CreateOrderBody

    if (!body.productId || !body.size) {
      return NextResponse.json({ error: 'Thiếu thông tin sản phẩm hoặc size' }, { status: 400 })
    }

    if (body.size === 'XXXL') {
      return NextResponse.json({ error: 'Size XXXL đang tạm ẩn' }, { status: 400 })
    }

    const hasInStockSize = await Product.exists({
      _id: body.productId,
      sizes: {
        $elemMatch: {
          size: body.size,
          quantity: { $gt: 0 },
        },
      },
    })

    if (!hasInStockSize) {
      return NextResponse.json(
        { error: 'Size đã hết hàng, vui lòng chọn size khác' },
        { status: 400 }
      )
    }

    let uuid = req.cookies.get('user_uuid')?.value
    if (!uuid) {
      uuid = uuidv4()
    }

    const order = await Order.create({ ...body, uuid })
    const response = NextResponse.json(order, { status: 201 })

    if (!req.cookies.get('user_uuid')?.value) {
      response.cookies.set('user_uuid', uuid, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }

    return response
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
