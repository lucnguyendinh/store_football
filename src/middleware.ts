import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedFromRequest } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect all /admin/* routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const isAuthenticated = await isAdminAuthenticatedFromRequest(req)

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
