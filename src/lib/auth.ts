import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Get the authenticated user's ID from the Supabase session or extension auth headers.
 * Returns the user ID string, or a NextResponse error if not authenticated.
 */
export async function getAuthUserId(): Promise<{ userId: string } | { error: NextResponse }> {
  const cookieStore = await cookies();
  const headersList = await headers();

  // 1. Check dev auth cookie or extension dev-auth header
  const devCookie = cookieStore.get('jobmaster_dev_auth')?.value || headersList.get('x-dev-auth');
  if (devCookie) {
    return { userId: devCookie };
  }

  // 2. Check x-session-cookie header forwarded by Chrome Extension
  const xSessionCookie = headersList.get('x-session-cookie');
  if (xSessionCookie && xSessionCookie.includes('jobmaster_dev_auth=')) {
    const match = xSessionCookie.match(/jobmaster_dev_auth=([^;]+)/);
    if (match && match[1]) {
      return { userId: match[1] };
    }
  }

  // 3. Check Bearer token from header
  const authHeader = headersList.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll: () => [],
              setAll: () => {}
            }
          }
        );
        const { data: { user: tokenUser }, error: tokenErr } = await supabase.auth.getUser(token);
        if (!tokenErr && tokenUser) {
          return { userId: tokenUser.id };
        }
      } catch (err) {
        console.warn('[auth] Bearer token check error:', err);
      }
    }
  }

  // 4. Supabase cookie client with fallback to forwarded x-session-cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll();
          if (allCookies.length === 0 && xSessionCookie) {
            return xSessionCookie.split(';').map(pair => {
              const [name, ...rest] = pair.trim().split('=');
              return { name, value: rest.join('=') };
            });
          }
          return allCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored from Server Component
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    };
  }

  return { userId: user.id };
}
