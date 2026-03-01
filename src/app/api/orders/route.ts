import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { isAdminAuthenticated } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated()

  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const uuid = searchParams.get('uuid') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}

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

      const [orders, total, totalProcessing, totalConfirmed] = await Promise.all([
        Order.find(query)
          .populate('productId', 'name imageUrl price')
          .sort({ quantity: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
        Order.countDocuments({ status: 'Processing' }),
        Order.countDocuments({ status: 'Confirmed' }),
      ])

      return NextResponse.json({
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        totalProcessing,
        totalConfirmed,
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
    const body = await req.json()

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
