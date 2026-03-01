import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'admin_token'

export async function generateToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifyToken(token)
}

export async function isAdminAuthenticatedFromRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifyToken(token)
}

export { COOKIE_NAME }
