import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  const isAdminRoute = pathname.startsWith('/admin')
  const isAccountRoute = pathname.startsWith('/conta')
  const isCheckoutRoute = pathname.startsWith('/checkout')

  // Public auth routes
  const isAuthRoute = pathname.startsWith('/auth')

  // Get token from cookies
  const token = request.cookies.get('token')?.value

  // If no token and trying to access protected route
  if (!token && (isAdminRoute || isAccountRoute || isCheckoutRoute)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If has token, verify it
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const isAdmin = payload.isAdmin as boolean

      // If trying to access admin route but not admin
      if (isAdminRoute && !isAdmin) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // If logged in and trying to access auth routes, redirect to account
      if (isAuthRoute) {
        return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/conta', request.url))
      }
    } catch {
      // Invalid token, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/conta/:path*',
    '/checkout/:path*',
    '/auth/:path*',
  ],
}
