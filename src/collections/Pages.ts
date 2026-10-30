import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

/** Текстовые страницы: юридические документы и прочие простые страницы */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Документ', plural: 'Документы' },
  // политика конфиденциальности, согласия, оферта и другие простые текстовые страницы
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true },
    { name: 'content', label: 'Текст', type: 'richText' },
    slugField(),
    { name: 'noindex', label: 'Закрыть от индексации', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
}
