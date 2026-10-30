import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { faqField } from '../fields/faq'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Услуга', plural: 'Услуги' },
  admin: { useAsTitle: 'title', group: 'Контент', defaultColumns: ['title', 'price', 'order', 'updatedAt'] },
  defaultSort: 'order',
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Карточка',
          fields: [
            { name: 'excerpt', label: 'Короткое описание (карточка на главной)', type: 'textarea' },
            { name: 'shortDesc', label: 'Подзаголовок на странице услуги', type: 'textarea' },
            {
              type: 'row',
              fields: [
                { name: 'price', label: 'Цена', type: 'text', admin: { description: 'Например: 29 900 ₽' } },
                { name: 'duration', label: 'Срок', type: 'text', admin: { description: 'Например: 7 дней' } },
                { name: 'number', label: 'Номер', type: 'text' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'icon', label: 'Иконка (класс Font Awesome)', type: 'text', defaultValue: 'fas fa-code' },
                { name: 'anchor', label: 'Якорь', type: 'text' },
                { name: 'featured', label: 'Выделенная карточка', type: 'checkbox' },
              ],
            },
            { name: 'image', label: 'Изображение', type: 'upload', relationTo: 'media' },
            { name: 'features', label: 'Что входит (список)', type: 'array', fields: [{ name: 'text', label: 'Пункт', type: 'text', required: true }] },
          ],
        },
        {
          label: 'Страница',
          fields: [
            {
              name: 'explainer',
              label: 'Блок «Что такое …?»',
              type: 'group',
              fields: [
                { name: 'title', label: 'Заголовок', type: 'text' },
                { name: 'text', label: 'Текст', type: 'textarea' },
                { name: 'points', label: 'Пункты', type: 'array', fields: [{ name: 'text', label: 'Пункт', type: 'text', required: true }] },
              ],
            },
            { name: 'problem', label: 'Проблема', type: 'textarea' },
            { name: 'solution', label: 'Решение', type: 'textarea' },
            {
              name: 'contentHtml',
              label: 'Подробное описание (HTML)',
              type: 'code',
              admin: { language: 'html', description: 'Дополнительный HTML-блок (иллюстрации-макеты). Можно оставить пустым.' },
            },
            {
              name: 'steps',
              label: 'Этапы работы',
              type: 'array',
              fields: [
                { name: 'title', label: 'Этап', type: 'text', required: true },
                { name: 'text', label: 'Описание', type: 'textarea' },
              ],
            },
            {
              name: 'plans',
              label: 'Тарифы',
              type: 'array',
              fields: [
                { type: 'row', fields: [
                  { name: 'name', label: 'Название', type: 'text', required: true },
                  { name: 'price', label: 'Цена', type: 'text', required: true },
                  { name: 'featured', label: 'Популярный', type: 'checkbox' },
                ] },
                { name: 'features', label: 'Состав (каждый пункт с новой строки)', type: 'textarea' },
              ],
            },
            faqField(),
            {
              type: 'row',
              fields: [
                { name: 'casesEnable', label: 'Показывать кейсы', type: 'checkbox', defaultValue: true },
                { name: 'casesTitle', label: 'Заголовок блока кейсов', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    slugField(),
    { name: 'category', label: 'Категория', type: 'relationship', relationTo: 'service-categories', admin: { position: 'sidebar' } },
    { name: 'order', label: 'Порядок', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
