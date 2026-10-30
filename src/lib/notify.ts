/**
 * Уведомления о новой заявке.
 *
 * Персональные данные (имя, телефон, email, текст) уходят ТОЛЬКО письмом на почту
 * в российском почтовом сервисе (SMTP_* в .env). В Telegram и MAX — только номер заявки,
 * услуга и ссылка в админку: так переписка в мессенджерах не становится
 * «передачей ПДн третьим лицам», а Telegram из РФ может быть недоступен.
 */
import type { Payload } from 'payload'

const SITE = (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

type Lead = { id: number | string; name?: string; phone?: string; email?: string; method?: string; service?: string; budget?: string; message?: string; page?: string }
type Result = Record<string, 'ok' | 'skip' | string>

async function withTimeout(p: Promise<Response>, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await p
  } finally {
    clearTimeout(t)
  }
}

async function telegram(text: string): Promise<string> {
  const token = process.env.TG_BOT_TOKEN
  const chat = process.env.TG_CHAT_ID
  if (!token || !chat) return 'skip'
  // TG_API_BASE — если api.telegram.org недоступен с сервера, можно указать свой Bot API-сервер/прокси
  const base = (process.env.TG_API_BASE || 'https://api.telegram.org').replace(/\/$/, '')
  try {
    const r = await withTimeout(
      fetch(`${base}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      }),
    )
    return r.ok ? 'ok' : `http ${r.status}`
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

async function max(text: string): Promise<string> {
  const token = process.env.MAX_BOT_TOKEN
  const chat = process.env.MAX_CHAT_ID
  if (!token || !chat) return 'skip'
  const base = (process.env.MAX_API_BASE || 'https://platform-api.max.ru').replace(/\/$/, '')
  try {
    const r = await withTimeout(
      fetch(`${base}/messages?chat_id=${encodeURIComponent(chat)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: token },
        body: JSON.stringify({ text }),
      }),
    )
    return r.ok ? 'ok' : `http ${r.status}`
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

async function email(payload: Payload, to: string | undefined, lead: Lead): Promise<string> {
  if (!to || !process.env.SMTP_HOST) return 'skip'
  const rows: [string, string | undefined][] = [
    ['Имя', lead.name],
    ['Телефон', lead.phone],
    ['Email', lead.email],
    ['Как связаться', { telegram: 'Telegram', max: 'MAX', call: 'Звонок' }[lead.method || ''] || lead.method],
    ['Услуга', lead.service],
    ['Бюджет', lead.budget],
    ['Сообщение', lead.message],
    ['Страница', lead.page],
  ]
  const html =
    `<h2>Заявка №${lead.id}</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="color:#666;vertical-align:top">${k}</td><td>${esc(String(v)).replace(/\n/g, '<br>')}</td></tr>`)
      .join('') +
    `</table><p><a href="${SITE}/admin/collections/leads/${lead.id}">Открыть в админке</a></p>`
  try {
    await payload.sendEmail({ to, subject: `Заявка №${lead.id} с сайта GeoBit${lead.service ? ' — ' + lead.service : ''}`, html })
    return 'ok'
  } catch (e: any) {
    return `error: ${e?.message || e}`
  }
}

export async function notifyLead(payload: Payload, lead: Lead, leadEmail?: string): Promise<Result> {
  const short = `🔔 Новая заявка №${lead.id}${lead.service ? ` — ${lead.service}` : ''}\n${SITE}/admin/collections/leads/${lead.id}`
  const [e, t, m] = await Promise.all([email(payload, leadEmail, lead), telegram(esc(short)), max(short)])
  return { email: e, telegram: t, max: m }
}
