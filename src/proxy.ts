import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const devAuthCookie = request.cookies.get('jobmaster_dev_auth')?.value;

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const user = supabaseUser || (devAuthCookie ? { id: devAuthCookie, email: 'dev@jobmaster.local' } : null);

  const { pathname } = request.nextUrl;

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('192.168.') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  // Protect all non-public routes -> redirect to landing page
  if (!user && !isPublicRoute) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', origin));
  }

  // Redirect authenticated users away from public-only pages (landing + login)
  if (user && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', origin));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
