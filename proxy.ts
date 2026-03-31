import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/']
const authRoutes = ['/login', '/register']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token')

  const isLoggedIn = !!sessionToken
  const isProtected = protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const isAuthRoute = authRoutes.includes(pathname)

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*'],
}
