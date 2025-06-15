// Remove import since updateSession is defined locally in this file
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options }),
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options }),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const protectedPath = "/protected";
  const isProtectedPath = request.nextUrl.pathname.startsWith(protectedPath);

  let userType = null;
  if (user) {
    const { data, error } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user type:', error);
      // Handle error, maybe redirect to an error page or login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    } else if (data) {
      userType = data.user_type;
    }

    if (isProtectedPath && userType !== 'seller') {
      // Redirect non-seller users from /protected to /
      return NextResponse.redirect(new URL('/', request.url));
    } else if (!isProtectedPath && userType === 'seller' && request.nextUrl.pathname === '/') {
      // If a seller user lands on the root path, redirect them to /protected
      return NextResponse.redirect(new URL('/protected', request.url));
    }
  } else if (isProtectedPath && request.nextUrl.pathname !== '/') {
     // Redirect unauthenticated users from /protected to /auth/login
     return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
