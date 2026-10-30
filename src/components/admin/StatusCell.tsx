'use client'

const MAP: Record<string, [string, string]> = {
  new: ['Новая', 'new'],
  progress: ['В работе', 'progress'],
  won: ['Договор', 'won'],
  lost: ['Отказ', 'lost'],
  spam: ['Спам', 'spam'],
  active: ['Подписан', 'won'],
  unsubscribed: ['Отписан', 'lost'],
}

/** Цветной статус в списке заявок */
export function StatusCell({ cellData }: { cellData?: string }) {
  const [label, mod] = MAP[cellData || ''] || [cellData || '—', 'lost']
  return <span className={`gb-dash__st gb-dash__st--${mod}`}>{label}</span>
}
