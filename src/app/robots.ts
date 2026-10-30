import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/util'

export default function robots(): MetadataRoute.Robots {
  // На тестовом домене (не getgeobit.ru) запрещаем индексацию целиком
  const isProd = /getgeobit\.ru$/.test(new URL(SITE_URL).hostname)
  if (!isProd) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/ajax/', '/*?s=', '/*?cat=', '/*?paged='] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
