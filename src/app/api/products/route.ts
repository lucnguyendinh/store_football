import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const team = searchParams.get('team') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tag: { $regex: search, $options: 'i' } },
      ]
    }

    if (type) query.type = type
    if (team) query.team = team

    const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      Product.aggregate([
        { $match: query },
        { $addFields: { totalQuantity: { $sum: '$sizes.quantity' } } },
        { $sort: { totalQuantity: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      Product.countDocuments(query),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const body = await req.json()
    const product = await Product.create(body)
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
