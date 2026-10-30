/**
 * Хранение загруженных файлов прямо в PostgreSQL (таблица media_blobs).
 *
 * Нужно на время разработки на Render: диск там временный и стирается при каждом деплое,
 * а база Neon постоянная. Включается переменной MEDIA_STORAGE=db.
 * На своём VPS файлы снова лежат на диске (MEDIA_STORAGE не задан).
 */
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'
import type { Payload } from 'payload'

const pool = (payload: Payload) => (payload.db as any).pool as import('pg').Pool

const CREATE = `CREATE TABLE IF NOT EXISTS media_blobs (
  filename text PRIMARY KEY,
  mime_type text NOT NULL,
  data bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`

/** Запрос к media_blobs; если таблицы ещё нет (база разработки без миграций) — создаём и повторяем */
async function q(payload: Payload, sql: string, params: unknown[]) {
  try {
    return await pool(payload).query(sql, params)
  } catch (e: any) {
    if (e?.code !== '42P01') throw e
    await pool(payload).query(CREATE)
    return pool(payload).query(sql, params)
  }
}

export const dbStorageAdapter: Adapter = () => ({
  name: 'postgres-blobs',
  async handleUpload({ file, req }) {
    await q(
      req.payload,
      `INSERT INTO media_blobs (filename, mime_type, data) VALUES ($1, $2, $3)
       ON CONFLICT (filename) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data, updated_at = now()`,
      [file.filename, file.mimeType, file.buffer],
    )
  },
  async handleDelete({ filename, req }) {
    await q(req.payload, 'DELETE FROM media_blobs WHERE filename = $1', [filename])
  },
  async staticHandler(req, { params }) {
    const r = await q(req.payload, 'SELECT mime_type, data, updated_at FROM media_blobs WHERE filename = $1', [params.filename])
    const row = r.rows[0]
    if (!row) return new Response('Not found', { status: 404 })
    const etag = `"${new Date(row.updated_at).getTime().toString(36)}"`
    if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304 })
    return new Response(new Uint8Array(row.data), {
      headers: {
        'Content-Type': row.mime_type,
        'Content-Length': String(row.data.length),
        'Cache-Control': 'public, max-age=604800',
        ETag: etag,
      },
    })
  },
})
