import type { CollectionConfig } from 'payload'
import { authenticated } from '../access'

const nobody = () => false

/** Заявки с сайта. Хранятся в PostgreSQL на сервере в РФ (152-ФЗ). Создаются только сервером. */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    group: 'Заявки',
    defaultColumns: ['name', 'phone', 'method', 'service', 'status', 'createdAt'],
    listSearchableFields: ['name', 'phone', 'email', 'service'],
  },
  defaultSort: '-createdAt',
  access: { read: authenticated, create: nobody, update: authenticated, delete: authenticated },
  fields: [
    { name: 'contactActions', type: 'ui', admin: { components: { Field: '/components/admin/LeadContact#LeadContact' } } },
    { type: 'row', fields: [
      { name: 'name', label: 'Имя', type: 'text', required: true },
      { name: 'phone', label: 'Телефон', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ] },
    { type: 'row', fields: [
      { name: 'method', label: 'Как связаться', type: 'select', options: [
        { label: 'Telegram', value: 'telegram' }, { label: 'MAX', value: 'max' }, { label: 'Звонок', value: 'call' },
      ] },
      { name: 'service', label: 'Услуга', type: 'text' },
      { name: 'budget', label: 'Бюджет', type: 'text', admin: { condition: (data) => Boolean(data?.budget) } },
    ] },
    { name: 'message', label: 'Сообщение', type: 'textarea' },
    { name: 'calc', label: 'Расчёт калькулятора', type: 'textarea', admin: { condition: (data) => Boolean(data?.calc) } },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' }, { label: 'В работе', value: 'progress' },
        { label: 'Закрыта: договор', value: 'won' }, { label: 'Закрыта: отказ', value: 'lost' }, { label: 'Спам', value: 'spam' },
      ],
      admin: { position: 'sidebar', components: { Cell: '/components/admin/StatusCell#StatusCell' } },
    },
    { name: 'note', label: 'Заметка менеджера', type: 'textarea', admin: { position: 'sidebar' } },
    {
      type: 'collapsible',
      label: 'Служебное',
      admin: { initCollapsed: true },
      fields: [
        { name: 'page', label: 'Страница отправки', type: 'text', admin: { readOnly: true } },
        { name: 'utm', label: 'UTM / источник', type: 'text', admin: { readOnly: true } },
        { name: 'ip', label: 'IP', type: 'text', admin: { readOnly: true } },
        { name: 'consentAt', label: 'Согласие на ПД получено', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'consentDoc', label: 'Редакция согласия', type: 'text', admin: { readOnly: true } },
        { name: 'notify', label: 'Доставка уведомлений', type: 'json', admin: { readOnly: true } },
      ],
    },
  ],
}

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Подписчик', plural: 'Подписчики' },
  admin: { useAsTitle: 'email', group: 'Заявки', defaultColumns: ['email', 'status', 'createdAt'] },
  access: { read: authenticated, create: nobody, update: authenticated, delete: authenticated },
  fields: [
    { name: 'email', label: 'Email', type: 'email', required: true, unique: true },
    { name: 'status', label: 'Статус', type: 'select', defaultValue: 'active', options: [
      { label: 'Подписан', value: 'active' }, { label: 'Отписался', value: 'unsubscribed' },
    ] },
    { name: 'token', type: 'text', admin: { hidden: true } },
    { name: 'ip', label: 'IP', type: 'text', admin: { readOnly: true } },
    { name: 'consentAt', label: 'Согласие получено', type: 'date', admin: { readOnly: true } },
  ],
}
