import type { Field } from 'payload'

export const faqField = (name = 'faq', label = 'Вопросы и ответы (FAQ)'): Field => ({
  name,
  label,
  type: 'array',
  labels: { singular: 'Вопрос', plural: 'Вопросы' },
  admin: { description: 'Выводится аккордеоном и размечается FAQPage для поисковиков.' },
  fields: [
    { name: 'q', label: 'Вопрос', type: 'text', required: true },
    { name: 'a', label: 'Ответ', type: 'textarea', required: true },
  ],
})
