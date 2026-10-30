import type { GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'

const priced = (extra: any[] = []) => [
  { type: 'row' as const, fields: [
    { name: 'key', label: 'Ключ', type: 'text' as const, required: true },
    { name: 'name', label: 'Название', type: 'text' as const, required: true },
    { name: 'price', label: 'Цена, ₽', type: 'number' as const, defaultValue: 0 },
    ...extra,
  ] },
]

export const Calculator: GlobalConfig = {
  slug: 'calculator',
  label: 'Калькулятор',
  admin: { group: 'Настройки', description: 'Цены калькулятора «Соберите свой сайт» на главной.' },
  access: { read: anyone, update: authenticated },
  fields: [
    { name: 'types', label: 'Тип сайта', type: 'array', fields: priced() },
    {
      name: 'speeds',
      label: 'Сроки',
      type: 'array',
      fields: [
        { type: 'row', fields: [
          { name: 'key', label: 'Ключ', type: 'text', required: true },
          { name: 'name', label: 'Название', type: 'text', required: true },
          { name: 'hint', label: 'Подпись', type: 'text' },
          { name: 'mult', label: 'Множитель', type: 'number', defaultValue: 1 },
        ] },
      ],
    },
    { name: 'designs', label: 'Дизайн', type: 'array', fields: priced([{ name: 'hint', label: 'Подпись', type: 'text' as const }]) },
    { name: 'addons', label: 'Дополнительно', type: 'array', fields: priced() },
    {
      name: 'blocks',
      label: 'Блоки сайта',
      type: 'array',
      fields: priced([{ name: 'icon', label: 'Иконка FA', type: 'text' as const }]),
    },
  ],
}
