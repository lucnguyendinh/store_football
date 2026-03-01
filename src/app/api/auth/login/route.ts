import { NextRequest, NextResponse } from 'next/server'
import { generateToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const token = await generateToken()
    const response = NextResponse.json({ success: true })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
