import type { Field } from 'payload'

/** Слаг (часть URL). Транслитерация с кириллицы, если поле пустое. */
const map: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
export const slugify = (v: string): string =>
  v
    .toLowerCase()
    .split('')
    .map((c) => (c in map ? map[c] : c))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  label: 'Адрес (slug)',
  type: 'text',
  index: true,
  unique: true,
  required: true,
  admin: { position: 'sidebar', description: 'Часть URL. Латиница, цифры и дефис. Не меняйте у опубликованных страниц без редиректа.' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const src = data?.[from]
        return typeof src === 'string' ? slugify(src) : value
      },
    ],
  },
})
