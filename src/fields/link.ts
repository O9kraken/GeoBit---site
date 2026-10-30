import type { Field } from 'payload'

/** Действие кнопки, как в старой теме: попап заявки / портфолио / контакты / своя ссылка */
export const ctaAction = (name: string, label: string, def = 'popup'): Field[] => [
  {
    name,
    label,
    type: 'select',
    defaultValue: def,
    options: [
      { label: 'Открыть форму заявки', value: 'popup' },
      { label: 'Портфолио', value: 'portfolio' },
      { label: 'Контакты', value: 'contacts' },
      { label: 'Калькулятор', value: 'calculator' },
      { label: 'Своя ссылка', value: 'custom' },
    ],
  },
  {
    name: `${name}Custom`,
    label: `${label}: своя ссылка`,
    type: 'text',
    admin: { condition: (_, s) => s?.[name] === 'custom' },
  },
]
