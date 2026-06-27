import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 미인증 사용자는 /login으로
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증된 사용자가 /login 접근 시 홈으로
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user) {
    const role = (user.user_metadata?.role as string) ?? 'field'

    // /admin/* 은 admin만 접근
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/field/scan', request.url))
    }

    // /field/* 은 field 또는 admin 접근 가능 — 추가 제한 없음
  }

  // pathname을 서버 컴포넌트에서 읽을 수 있도록 헤더에 주입
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
