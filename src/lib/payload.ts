import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const payload = cache(async () => getPayload({ config: configPromise }))

export const getGlobal = cache(async <T = any>(slug: string): Promise<T> => {
  const p = await payload()
  return (await p.findGlobal({ slug: slug as any, depth: 1 })) as T
})

export const getServices = cache(async () => {
  const p = await payload()
  const r = await p.find({ collection: 'services', sort: 'order', limit: 100, depth: 1 })
  return r.docs
})

export const getProjects = cache(async () => {
  const p = await payload()
  const r = await p.find({ collection: 'projects', sort: 'order', limit: 100, depth: 1 })
  return r.docs
})

export const getPosts = cache(async (limit = 100) => {
  const p = await payload()
  const r = await p.find({ collection: 'posts', sort: '-publishedAt', limit, depth: 1, where: { _status: { equals: 'published' } } })
  return r.docs
})

export const getTeam = cache(async () => {
  const p = await payload()
  return (await p.find({ collection: 'team', sort: 'order', limit: 50, depth: 1, where: { published: { equals: true } } })).docs
})

export const getTestimonials = cache(async () => {
  const p = await payload()
  return (await p.find({ collection: 'testimonials', sort: 'order', limit: 50, depth: 1, where: { published: { equals: true } } })).docs
})

export const findBySlug = cache(async (collection: string, slug: string, depth = 2) => {
  const p = await payload()
  const r = await p.find({ collection: collection as any, where: { slug: { equals: slug } }, limit: 1, depth })
  return (r.docs[0] as any) || null
})

export const getTerms = cache(async (collection: 'portfolio-categories' | 'service-categories' | 'categories' | 'tags') => {
  const p = await payload()
  return (await p.find({ collection, limit: 100, sort: 'name' })).docs as any[]
})

/** Рубрики портфолио, в которых есть проекты (hide_empty) */
export const usedPortfolioCats = async (projects: any[]) =>
  (await getTerms('portfolio-categories')).filter((c: any) => projects.some((pr: any) => pr.categories?.some((x: any) => (x?.id ?? x) === c.id)))

/** Редиректы из админки (плагин redirects): проверяем перед тем, как отдать 404 */
export async function cmsRedirect(path: string): Promise<string | null> {
  const p = await payload()
  const variants = [path, path.replace(/\/$/, ''), path.endsWith('/') ? path : path + '/']
  const r = await p.find({ collection: 'redirects' as any, where: { from: { in: variants } }, limit: 1, depth: 1 })
  const doc: any = r.docs[0]
  if (!doc) return null
  const to = doc.to || {}
  if (to.type === 'custom' && to.url) return to.url
  const ref = to.reference
  if (ref?.value?.slug) {
    const base: Record<string, string> = { services: '/services/', projects: '/project/', posts: '/', pages: '/' }
    return `${base[ref.relationTo] ?? '/'}${ref.value.slug}/`
  }
  return null
}
