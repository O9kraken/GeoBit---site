import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

const taxonomy = (slug: string, singular: string, plural: string, withDesc = false): CollectionConfig => ({
  slug,
  labels: { singular, plural },
  admin: { useAsTitle: 'name', group: 'Рубрики' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    slugField('name'),
    ...(withDesc
      ? [
          { name: 'description', label: 'Описание', type: 'textarea' as const },
        ]
      : []),
  ],
})

export const Categories = taxonomy('categories', 'Рубрика блога', 'Рубрики блога', true)
export const Tags = taxonomy('tags', 'Тег', 'Теги')
export const ServiceCategories = taxonomy('service-categories', 'Категория услуг', 'Категории услуг', true)
export const PortfolioCategories = taxonomy('portfolio-categories', 'Категория портфолио', 'Категории портфолио', true)
