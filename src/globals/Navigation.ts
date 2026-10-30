import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'

const linkFields = [
  { name: 'label', label: 'Текст', type: 'text' as const, required: true },
  { name: 'url', label: 'Ссылка', type: 'text' as const, required: true },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Меню',
  admin: { group: 'Настройки' },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      name: 'header',
      label: 'Главное меню',
      type: 'array',
      fields: [
        ...linkFields,
        {
          name: 'dropdown',
          label: 'Выпадающий список',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'Нет', value: 'none' },
            { label: 'Все услуги', value: 'services' },
            { label: 'FAQ + Контакты', value: 'contacts' },
          ],
        },
      ],
    },
    { name: 'footerNav', label: 'Подвал: навигация', type: 'array', fields: linkFields },
    { name: 'footerServices', label: 'Подвал: услуги', type: 'array', fields: linkFields },
    { name: 'footerLegal', label: 'Подвал: документы', type: 'array', fields: linkFields },
  ],
}
