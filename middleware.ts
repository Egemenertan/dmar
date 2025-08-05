import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Protect admin routes - require approved admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/?auth=required', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is approved admin
    try {
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_approved_admin', { user_id: user.id })

      if (adminError || !isAdmin) {
        const redirectUrl = new URL('/?auth=admin_required', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      const redirectUrl = new URL('/?auth=error', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect API routes
  if (req.nextUrl.pathname.startsWith('/api/protected')) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Auth callback handling
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    // Callback sayfası sadece şifre sıfırlama için kullanılıyor
    // Email doğrulama artık sistem tarafından kullanılmıyor
    return response
  }

  // Auth routes handling
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    // If user is already logged in, redirect to dashboard
    if (user && req.nextUrl.pathname !== '/auth/callback') {
      const redirectUrl = new URL('/', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Performance optimization: Skip middleware for static files
  if (
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname.includes('/api/') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}