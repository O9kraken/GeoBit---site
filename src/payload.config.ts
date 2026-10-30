import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import { migrations } from './migrations'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Leads, Subscribers } from './collections/Leads'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Team, Testimonials } from './collections/People'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Services } from './collections/Services'
import { Categories, PortfolioCategories, ServiceCategories, Tags } from './collections/Taxonomies'
import { Users } from './collections/Users'
import { Calculator } from './globals/Calculator'
import { Navigation } from './globals/Navigation'
import { AboutPage, BlogPage, ContactsPage, FaqPage, HomePage, PortfolioPage, ServicesPage } from './globals/PageGlobals'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — GeoBit' },
    dateFormat: 'dd.MM.yyyy HH:mm',
    // без Gravatar: админка не ходит на внешние сервисы
    avatar: 'default',
  },
  i18n: { supportedLanguages: { ru }, fallbackLanguage: 'ru' },
  collections: [
    Services, Projects, Posts, Pages, Team, Testimonials,
    ServiceCategories, PortfolioCategories, Categories, Tags,
    Leads, Subscribers, Media, Users,
  ],
  globals: [HomePage, ServicesPage, AboutPage, ContactsPage, PortfolioPage, BlogPage, FaqPage, SiteSettings, Navigation, Calculator],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '', max: 5 },
    // В разработке схема синхронизируется сама; в продакшене — миграции (npm run migrate)
    push: process.env.NODE_ENV !== 'production',
    // В продакшене схема создаётся/обновляется миграциями автоматически при старте
    prodMigrations: migrations,
  }),
  email: smtpReady
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER || '',
        defaultFromName: 'GeoBit',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    seoPlugin({
      collections: ['services', 'projects', 'posts', 'pages', 'categories', 'service-categories', 'portfolio-categories'],
      uploadsCollection: 'media',
      tabbedUI: false,
      generateTitle: ({ doc }) => `${(doc as { title?: string; name?: string })?.title || (doc as { name?: string })?.name || ''} | GeoBit`,
    }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'services', 'projects'],
      overrides: {
        labels: { singular: 'Редирект', plural: 'Редиректы' },
        admin: { group: 'Настройки' },
      },
    }),
  ],
})
