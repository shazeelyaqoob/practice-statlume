import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const ACCESS = 'sl_access';
const REFRESH = 'sl_refresh';

/** Seconds of life an access token must have left to be used as is. */
const MIN_TTL = 30;

function accessTokenIsFresh(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const part = token.split('.')[1] ?? '';
    const { exp } = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { exp?: number };
    return typeof exp === 'number' && exp - MIN_TTL > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * Runs before every page render.
 *
 * Server Components cannot set cookies, so the access token refresh happens
 * here: if the 15 minute token is missing or about to expire and there is a
 * refresh cookie, call the API's refresh route, pass the new cookies to the
 * browser, AND rewrite this request's Cookie header so the page being rendered
 * already sees the new access token.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isLogin = pathname === '/login';
  const access = req.cookies.get(ACCESS)?.value;
  const refresh = req.cookies.get(REFRESH)?.value;

  if (accessTokenIsFresh(access)) {
    return isLogin ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  }

  if (refresh) {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH}=${refresh}` },
      cache: 'no-store',
    }).catch(() => null);

    if (res?.ok) {
      const setCookies = res.headers.getSetCookie();
      const fresh = new Map<string, string>();
      for (const c of setCookies) {
        const [pair] = c.split(';');
        const eq = pair?.indexOf('=') ?? -1;
        if (pair && eq > 0) fresh.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
      const cookieHeader = req.cookies
        .getAll()
        .filter((c) => !fresh.has(c.name))
        .map((c) => `${c.name}=${c.value}`)
        .concat([...fresh].map(([k, v]) => `${k}=${v}`))
        .join('; ');

      const headers = new Headers(req.headers);
      headers.set('cookie', cookieHeader);
      const out = isLogin
        ? NextResponse.redirect(new URL('/', req.url))
        : NextResponse.next({ request: { headers } });
      for (const c of setCookies) out.headers.append('set-cookie', c);
      return out;
    }

    // The API is unreachable (for example asleep on a free host). Let the
    // page render; its own requests will show the error and retry states.
    if (!res) return NextResponse.next();

    // Refresh token rejected: clear cookies and fall through to the login.
    if (isLogin) {
      const out = NextResponse.next();
      out.cookies.delete(ACCESS);
      out.cookies.delete(REFRESH);
      return out;
    }
    const reason = res.status === 401 ? 'expired' : 'error';
    const out = NextResponse.redirect(
      new URL(`/login?reason=${reason}&next=${encodeURIComponent(pathname + search)}`, req.url),
    );
    out.cookies.delete(ACCESS);
    out.cookies.delete(REFRESH);
    return out;
  }

  if (isLogin) return NextResponse.next();
  const next = pathname === '/' && !search ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(new URL(`/login${next}`, req.url));
}

export const config = {
  // Every page except API calls, Next internals and static files.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:png|svg|jpg|webp|avif|woff2)$).*)',
  ],
};
