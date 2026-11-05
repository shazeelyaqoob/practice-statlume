import type { MetadataRoute } from 'next';

/** The landing and login pages are public. The dashboard pages need an account. */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login'],
        disallow: ['/overview', '/products', '/customers', '/orders', '/users', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
