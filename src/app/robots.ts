import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kessai-link.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/create',
          '/guide',
          '/api-docs',
          '/help',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/dashboard/',
          '/settings/',
          '/p/',
          '/api/',
          '/admin/',
          '/_next/',
          '/images/',
          '/*.json',
          '/*.xml',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/create',
          '/guide',
          '/api-docs',
          '/help',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/dashboard/',
          '/settings/',
          '/p/',
          '/api/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}