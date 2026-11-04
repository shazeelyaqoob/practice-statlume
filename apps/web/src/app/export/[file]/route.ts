import { EXPORT_REPORTS } from '@statlume/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * /export/orders.csv and friends.
 *
 * This route is a page path, not /api, so the proxy refreshes an expired
 * access token first (a download link can be clicked long after the page
 * loaded). It then passes the API's streamed CSV straight through: the body
 * is never buffered here.
 */
export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const report = file.replace(/\.csv$/, '');
  if (!file.endsWith('.csv') || !(EXPORT_REPORTS as readonly string[]).includes(report)) {
    return new Response('Unknown export', { status: 404 });
  }
  const search = new URL(req.url).search;
  const upstream = await fetch(`${API_URL}/api/export/${report}.csv${search}`, {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    cache: 'no-store',
  });
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    let message = 'Export failed. Go back and try again.';
    try {
      message = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? message;
    } catch {
      // not JSON
    }
    return new Response(message, {
      status: upstream.status === 200 ? 502 : upstream.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const headers = new Headers();
  for (const h of ['content-type', 'content-disposition', 'cache-control']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: 200, headers });
}
