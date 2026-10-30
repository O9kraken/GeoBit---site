/** 301 со старых адресов картинок WordPress (/wp-content/uploads/2026/07/file-800x600.jpg) на новые /media/… */
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const rel = path.map(decodeURIComponent).join('/')
  // WP-миниатюры: file-300x200.jpg, file-scaled.jpg, file-optimized.jpg → оригинал
  const candidates = [rel, rel.replace(/-\d+x\d+(?=\.\w+$)/, ''), rel.replace(/-(scaled|optimized)(?=\.\w+$)/, ''), rel.replace(/\.webp$/, '.png'), rel.replace(/\.webp$/, '.jpg')]
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'media', where: { wpPath: { in: [...new Set(candidates)] } }, limit: 1, depth: 0 })
  const m: any = r.docs[0]
  if (!m?.filename) return new Response('Not found', { status: 404 })
  return new Response(null, { status: 301, headers: { Location: `/media/${encodeURIComponent(m.filename)}`, 'Cache-Control': 'public, max-age=86400' } })
}
