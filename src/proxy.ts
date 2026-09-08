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

  let devAuthCookie = request.cookies.get('jobmaster_dev_auth')?.value || request.headers.get('x-dev-auth');
  const sessionCookieHeader = request.headers.get('x-session-cookie');
  if (!devAuthCookie && sessionCookieHeader && sessionCookieHeader.includes('jobmaster_dev_auth=')) {
    const match = sessionCookieHeader.match(/jobmaster_dev_auth=([^;]+)/);
    if (match && match[1]) {
      devAuthCookie = match[1];
    }
  }

  // Check Bearer token from header
  const authHeader = request.headers.get('authorization');
  let tokenUser: any = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      try {
        const { data } = await supabase.auth.getUser(token);
        if (data?.user) tokenUser = data.user;
      } catch { }
    }
  }

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const user = supabaseUser || tokenUser || (devAuthCookie ? { id: devAuthCookie, email: 'dev@jobmaster.local' } : null);

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

  const reqOrigin = request.headers.get('origin') || '';
  const isExtensionOrAllowedOrigin =
    reqOrigin.startsWith('chrome-extension://') ||
    reqOrigin.includes('localhost') ||
    reqOrigin.includes('127.0.0.1');

  // Handle CORS Preflight for API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const preflightHeaders = new Headers();
    if (isExtensionOrAllowedOrigin) {
      preflightHeaders.set('Access-Control-Allow-Origin', reqOrigin);
      preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
    }
    preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // Protect all non-public routes -> redirect to landing page
  if (!user && !isPublicRoute) {
    if (pathname.startsWith('/api/')) {
      const errRes = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (isExtensionOrAllowedOrigin) {
        errRes.headers.set('Access-Control-Allow-Origin', reqOrigin);
        errRes.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      return errRes;
    }
    return NextResponse.redirect(new URL('/', origin));
  }

  // Redirect authenticated users away from public-only pages (landing + login)
  if (user && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', origin));
  }

  // Set CORS headers on valid API responses
  if (pathname.startsWith('/api/') && isExtensionOrAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', reqOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
