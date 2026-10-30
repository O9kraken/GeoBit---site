'use client'

import { isDocumentEvent, ready } from '@payloadcms/live-preview'
import { useEffect } from 'react'

const KEY = 'gb-preview-scroll'

/**
 * Предпросмотр в админке: когда сайт открыт во фрейме «Предпросмотр»,
 * после каждого «Сохранить» страница перезагружается и остаётся на том же месте.
 */
export default function PreviewRefresh() {
  useEffect(() => {
    if (window.parent === window && !window.opener) return
    document.documentElement.classList.add('gb-in-preview')
    const origin = window.location.origin
    try {
      const y = Number(sessionStorage.getItem(KEY))
      if (y) setTimeout(() => window.scrollTo(0, y), 300)
      sessionStorage.removeItem(KEY)
    } catch {}
    ready({ serverURL: origin })
    const onMessage = (e: MessageEvent) => {
      if (!isDocumentEvent(e, origin)) return
      try {
        sessionStorage.setItem(KEY, String(window.scrollY))
      } catch {}
      window.location.reload()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  return null
}
