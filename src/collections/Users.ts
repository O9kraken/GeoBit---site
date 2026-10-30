import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: { useAsTitle: 'email', group: 'Система' },
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  fields: [{ name: 'name', label: 'Имя', type: 'text' }],
}
