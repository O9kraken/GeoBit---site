/**
 * Перенос контента из экспорта WordPress в Payload.
 *
 *   npm run seed                 — WP_CONTENT=path/to/content.json WP_UPLOADS=path/to/uploads
 *
 * content.json делается из WXR-экспорта скриптом tools/parse_wxr.py.
 * Скрипт идемпотентный: перед загрузкой очищает контентные коллекции
 * (заявки, подписчики и пользователи не трогаются).
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import { EXPERIMENTAL_TableFeature, convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import config from '@payload-config'

const CONTENT = process.env.WP_CONTENT || '/home/claude/src/wp/content.json'
const UPLOADS = process.env.WP_UPLOADS || '/home/claude/src/uploads/c6dc6cec28faf4e2e77b23cb96cf774a/uploads'

type Item = {
  id: number
  type: string
  status: string
  title: string
  slug: string
  date: string
  modified: string
  menu_order: number
  content: string
  excerpt: string
  terms: { domain: string; slug: string; name: string }[]
  meta: Record<string, string>
}

const { items, terms } = JSON.parse(fs.readFileSync(CONTENT, 'utf8')) as { items: Item[]; terms: any[] }
const byId = new Map(items.map((i) => [i.id, i]))
const ofType = (t: string, publishedOnly = true) =>
  items.filter((i) => i.type === t && (!publishedOnly || i.status === 'publish')).sort((a, b) => a.menu_order - b.menu_order || a.id - b.id)

// ---------- Новые цены (приняты 30.10.2026) ----------
const PRICE_FIX: [RegExp, string][] = [
  [/30[\s ]000(\s?₽)/g, '29 900$1'],
  [/90[\s ]000(\s?₽)/g, '79 900$1'],
  [/150[\s ]000(\s?₽)/g, '129 900$1'],
]
/** Цены меняем только в текстах GeoBit (услуги, FAQ), но не в рыночных вилках статей. */
const fixPrice = (s?: string) => PRICE_FIX.reduce((acc, [re, to]) => acc.replace(re, to), s || '')

// ---------- helpers ----------
const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
const m = (it: Item, k: string) => (it.meta[k] ?? '').toString()
const num = (v: string) => (v && /^\d+$/.test(v) ? Number(v) : null)
const yoastTitle = (s: string) =>
  s
    ? s.replace(/%%sep%%/g, '|').replace(/%%sitename%%/g, 'GeoBit').replace(/%%title%%/g, '').replace(/\s+/g, ' ').trim()
    : undefined
const seoOf = (it: Item) => ({
  title: yoastTitle(m(it, '_yoast_wpseo_title')) || undefined,
  description: m(it, '_yoast_wpseo_metadesc') || undefined,
})
const cleanHtml = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/https?:\/\/(www\.)?getgeobit\.ru(?=\/)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
const textOf = (html: string) => cleanHtml(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const autoExcerpt = (html: string, words = 30) => {
  const w = textOf(html).split(' ')
  return w.slice(0, words).join(' ') + (w.length > words ? '…' : '')
}
const group = (it: Item, re: RegExp) => {
  // собирает «repeater» ACF в виде групп по номеру: prefix_N_field
  const out: Record<number, Record<string, string>> = {}
  for (const [k, v] of Object.entries(it.meta)) {
    const mm = k.match(re)
    if (!mm) continue
    const n = Number(mm[1])
    ;(out[n] ||= {})[mm[2] || '_'] = v
  }
  return Object.keys(out)
    .map(Number)
    .sort((a, b) => a - b)
    .map((n) => out[n])
}
const lines = (s: string) => s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)

let payload: Payload
let editorConfig: any
const mediaCache = new Map<number, number>()

async function media(wpId?: string | number | null, alt?: string): Promise<number | undefined> {
  const id = Number(wpId)
  if (!id) return undefined
  if (mediaCache.has(id)) return mediaCache.get(id)
  const att = byId.get(id)
  const rel = att?.meta._wp_attached_file
  if (!att || !rel) {
    console.warn('  ! нет вложения', wpId)
    return undefined
  }
  const file = path.join(UPLOADS, rel)
  if (!fs.existsSync(file)) {
    console.warn('  ! нет файла', rel)
    return undefined
  }
  try {
    const doc = await payload.create({
      collection: 'media',
      data: { alt: att.meta._wp_attachment_image_alt || alt || att.title || '', wpId: id, wpPath: rel },
      filePath: file,
    })
    mediaCache.set(id, doc.id as number)
    return doc.id as number
  } catch (e: any) {
    console.warn('  ! не загрузился', rel, e?.message)
    return undefined
  }
}

const lexical = (html: string) => convertHTMLToLexical({ editorConfig, html: cleanHtml(html), JSDOM })

async function wipe() {
  for (const c of [
    'services',
    'projects',
    'posts',
    'pages',
    'team',
    'testimonials',
    'service-categories',
    'portfolio-categories',
    'categories',
    'tags',
    'media',
    'redirects',
  ] as const) {
    await payload.delete({ collection: c as any, where: { id: { exists: true } }, overrideAccess: true })
  }
}

async function main() {
  payload = await getPayload({ config })
  editorConfig = await editorConfigFactory.fromFeatures({
    config: payload.config,
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  })

  console.log('Очистка…')
  await wipe()

  // ---------- Таксономии ----------
  console.log('Таксономии…')
  const taxMap: Record<string, string> = {
    service_category: 'service-categories',
    portfolio_category: 'portfolio-categories',
    category: 'categories',
    post_tag: 'tags',
  }
  const termIds: Record<string, number> = {}
  // Рубрики и метки блога в экспорте есть только внутри записей — собираем их оттуда
  const allTerms = [...terms]
  for (const it of items)
    for (const t of it.terms)
      if (taxMap[t.domain] && !allTerms.some((x) => x.taxonomy === t.domain && decode(x.slug) === decode(t.slug)))
        allTerms.push({ taxonomy: t.domain, slug: t.slug, name: t.name })
  for (const t of allTerms) {
    const coll = taxMap[t.taxonomy]
    if (!coll) continue
    const doc = await payload.create({
      collection: coll as any,
      data: { name: t.name, slug: decode(t.slug), description: t.description || undefined } as any,
    })
    termIds[`${t.taxonomy}:${decode(t.slug)}`] = doc.id as number
  }
  const termsOf = (it: Item, domain: string) =>
    it.terms.filter((t) => t.domain === domain).map((t) => termIds[`${domain}:${decode(t.slug)}`]).filter(Boolean)

  // ---------- Услуги ----------
  console.log('Услуги…')
  for (const [idx, it] of ofType('service').entries()) {
    const features = group(it, /^service_features_feature_(\d+)$/).map((g) => g._).filter(Boolean)
    const plans = group(it, /^service_plans_plan_(\d+)_(\w+)$/).filter((g) => g.name)
    const faq = group(it, /^service_faq_faq_(\d+)_(q|a)$/).filter((g) => g.q)
    const steps = group(it, /^service_steps_step_(\d+)_(title|text)$/).filter((g) => g.title)
    await payload.create({
      collection: 'services',
      data: {
        title: it.title,
        slug: decode(it.slug),
        excerpt: it.excerpt || undefined,
        shortDesc: fixPrice(m(it, 'service_short_desc')) || undefined,
        price: fixPrice(m(it, 'service_price')) || undefined,
        duration: m(it, 'service_duration') || undefined,
        number: m(it, 'service_number') || String(idx + 1).padStart(2, '0'),
        icon: m(it, 'service_icon') || undefined,
        anchor: m(it, 'service_anchor') || undefined,
        featured: m(it, 'service_featured') === '1',
        image: await media(m(it, '_thumbnail_id'), it.title),
        features: features.map((text) => ({ text: fixPrice(text) })),
        explainer: {
          title: m(it, 'service_explainer_explainer_title') || undefined,
          text: fixPrice(m(it, 'service_explainer_explainer_text')) || undefined,
          points: lines(m(it, 'service_explainer_explainer_points')).map((text) => ({ text: fixPrice(text) })),
        },
        problem: m(it, 'service_problem') || undefined,
        solution: m(it, 'service_solution') || undefined,
        contentHtml: m(it, 'service_content') || m(it, 'mockup_code') || undefined,
        steps: steps.map((s) => ({ title: s.title, text: s.text || undefined })),
        plans: plans.map((p) => ({
          name: p.name,
          price: fixPrice(p.price),
          featured: p.featured === '1',
          features: fixPrice(p.features),
        })),
        faq: faq.map((f) => ({ q: fixPrice(f.q), a: fixPrice(f.a) })),
        casesEnable: m(it, 'service_cases_enable') !== '0',
        category: termsOf(it, 'service_category')[0],
        order: it.menu_order,
        meta: { title: seoOf(it).title, description: fixPrice(seoOf(it).description) || undefined },
      } as any,
    })
  }

  // ---------- Портфолио ----------
  console.log('Портфолио…')
  for (const it of ofType('portfolio')) {
    const gallery = group(it, /^portfolio_gallery_phot_(\d+)()$/).map((g) => g._)
    const mediaBlocks = group(it, /^portfolio_media_(\d+)_(image|desc)$/)
    await payload.create({
      collection: 'projects',
      data: {
        title: it.title,
        slug: decode(it.slug),
        client: m(it, 'portfolio_client') || undefined,
        categoryLabel: m(it, 'portfolio_category_label') || undefined,
        year: m(it, 'portfolio_year') || undefined,
        duration: m(it, 'portfolio_duration') || undefined,
        technologies: m(it, 'portfolio_technologies') || undefined,
        url: m(it, 'portfolio_url') || undefined,
        excerpt: it.excerpt || autoExcerpt(it.content) || undefined,
        cover: await media(m(it, 'portfolio_cover') || m(it, '_thumbnail_id'), it.title),
        gallery: (await Promise.all(gallery.map(async (g) => ({ image: await media(g, it.title) })))).filter((g) => g.image),
        media: (
          await Promise.all(mediaBlocks.map(async (b) => ({ image: await media(b.image, it.title), desc: b.desc || undefined })))
        ).filter((b) => b.image),
        challenge: m(it, 'portfolio_challenge') || undefined,
        solution: m(it, 'portfolio_solution') || undefined,
        categories: termsOf(it, 'portfolio_category'),
        serviceCategories: termsOf(it, 'service_category'),
        isFeatured: m(it, 'portfolio_is_featured') === '1',
        order: num(m(it, 'portfolio_order')) ?? it.menu_order,
        publishedAt: it.date,
        meta: seoOf(it),
      } as any,
    })
  }

  // ---------- Блог ----------
  console.log('Статьи…')
  for (const it of ofType('post')) {
    // цену GeoBit в статье тоже обновляем (только упоминание «лендинг от 30 000 ₽»)
    const html = it.content.replace(/(GeoBit[\s\S]{0,120}?)от 30[\s\u00a0]000(\s?(?:₽|рублей))/g, '$1от 29 900$2')
    await payload.create({
      collection: 'posts',
      data: {
        title: it.title,
        slug: decode(it.slug),
        excerpt: it.excerpt || autoExcerpt(it.content),
        cover: await media(m(it, '_thumbnail_id'), it.title),
        content: lexical(html),
        publishedAt: it.date,
        authorName: 'Георгий',
        categories: termsOf(it, 'category'),
        tags: termsOf(it, 'post_tag'),
        _status: 'published',
        meta: seoOf(it),
      } as any,
    })
  }

  // ---------- Обычные страницы (юридические) ----------
  console.log('Страницы…')
  const special = new Set(['home', 'services', 'portfolio', 'about', 'contacts', 'blog', 'faq'])
  for (const it of ofType('page')) {
    if (special.has(it.slug)) continue
    await payload.create({
      collection: 'pages',
      data: {
        title: it.title,
        slug: decode(it.slug),
        content: lexical(it.content),
        noindex: m(it, '_yoast_wpseo_meta-robots-noindex') === '1',
        meta: seoOf(it),
      } as any,
    })
  }

  // ---------- Команда ----------
  console.log('Команда и отзывы…')
  for (const it of ofType('team_member')) {
    const isEvgeny = /евгени/i.test(it.title)
    await payload.create({
      collection: 'team',
      data: {
        name: it.title,
        position: m(it, 'team_position') || undefined,
        bio: m(it, 'team_bio') || undefined,
        skills: m(it, 'team_skills') || undefined,
        photo: await media(m(it, 'team_photo'), it.title),
        telegram: m(it, 'team_social_telegram') || undefined,
        vk: m(it, 'team_social_vk') || undefined,
        github: m(it, 'team_social_github') || undefined,
        published: !isEvgeny, // решение владельца: Евгения на сайте не показываем
        order: num(m(it, 'team_order')) ?? it.menu_order,
      } as any,
    })
  }
  for (const it of ofType('testimonial')) {
    await payload.create({
      collection: 'testimonials',
      data: {
        name: m(it, 'testimonial_client_name') || it.title,
        position: m(it, 'testimonial_client_position') || undefined,
        text: m(it, 'testimonial_text') || textOf(it.content),
        photo: await media(m(it, 'testimonial_client_photo'), m(it, 'testimonial_client_name')),
        rating: num(m(it, 'testimonial_rating')) ?? 5,
        project: m(it, 'testimonial_project') || undefined,
        published: true,
        order: it.menu_order,
      } as any,
    })
  }

  // ---------- Страницы-глобалы ----------
  console.log('Страницы-глобалы…')
  const pg = (slug: string) => items.find((i) => i.type === 'page' && i.slug === slug)!
  const home = pg('home')
  await payload.updateGlobal({
    slug: 'home',
    data: {
      // Новый первый экран (единственное, что меняем при переносе)
      heroBadge: 'Севастополь, Крым и вся Россия',
      heroTitle1: 'Сайты для бизнеса',
      heroTitle2: 'в Севастополе и Крыму',
      heroSubtitle:
        'Лендинги от 29\u00a0900\u00a0₽ и корпоративные сайты от 79\u00a0900\u00a0₽. Дизайн с нуля, цена и сроки в договоре, первый месяц поддержки — бесплатно.',
      heroCta1Text: 'Рассчитать стоимость',
      heroCta1Action: 'calculator',
      heroCta2Text: 'Написать в Telegram',
      heroCta2Action: 'custom',
      heroCta2ActionCustom: 'https://t.me/KRAKENO9',
      heroStats: [
        { value: 10, suffix: '+', label: 'Сайтов запущено' },
        { value: 5, suffix: '', label: 'Лет в разработке' },
        { value: 14, suffix: '', label: 'Дней на лендинг' },
      ],
      aboutTag: m(home, 'about_tag'),
      aboutTitle: m(home, 'about_title'),
      aboutText1: fixPrice(m(home, 'about_text_1')),
      aboutText2: fixPrice(m(home, 'about_text_2')),
      aboutYears: m(home, 'about_stat_years'),
      aboutProjects: m(home, 'about_stat_projects'),
      processTag: m(home, 'process_tag'),
      processTitle: m(home, 'process_title'),
      faqTag: m(home, 'faq_tag'),
      faqTitle: m(home, 'faq_title'),
      ctaTag: m(home, 'cta_tag'),
      ctaTitle: m(home, 'cta_title'),
      ctaButton: m(home, 'cta_btn_primary_text'),
      seo: { ...seoOf(home), image: await media(m(home, '_thumbnail_id')) },
    } as any,
  })

  const sp = pg('services')
  await payload.updateGlobal({
    slug: 'services-page',
    data: {
      tag: m(sp, 'services_page_tag'),
      title: m(sp, 'services_page_title'),
      subtitle: m(sp, 'services_page_subtitle'),
      pricingTitle: m(sp, 'services_pricing_title'),
      pricingSubtitle: m(sp, 'services_pricing_subtitle'),
      plans: group(sp, /^services_plans_plan_(\d+)_(name|price|desc|features|is_featured|btn_text)$/)
        .filter((p) => p.name)
        .map((p) => ({
          name: p.name,
          price: p.price,
          desc: p.desc,
          features: p.features,
          featured: p.is_featured === '1',
          btnText: p.btn_text || 'Выбрать тариф',
        })),
      seo: seoOf(sp),
    } as any,
  })

  const ab = pg('about')
  await payload.updateGlobal({
    slug: 'about-page',
    data: {
      tag: m(ab, 'about_page_tag'),
      title: m(ab, 'about_page_title'),
      subtitle: m(ab, 'about_page_subtitle'),
      storyTitle: m(ab, 'about_story_title'),
      storyText1: m(ab, 'about_story_text_1'),
      storyText2: m(ab, 'about_story_text_2'),
      storyImage: await media(m(ab, 'about_story_image')),
      stats: group(ab, /^about_page_stats_stat_(\d+)_(icon|value|label)$/)
        .filter((s) => s.value)
        .map((s) => ({ icon: s.icon || undefined, value: s.value, label: s.label })),
      valuesTitle: m(ab, 'about_values_title'),
      techTitle: m(ab, 'about_tech_title'),
      tech: group(ab, /^about_tech_stack_tech_(\d+)_(icon|label|level)$/)
        .filter((t) => t.label)
        .map((t) => ({ icon: t.icon, label: t.label, level: Number(t.level) || 80 })),
      timeline: group(ab, /^about_timeline_timeline_(\d+)_(year|title|text)$/)
        .filter((t) => t.title)
        .map((t) => ({ year: t.year, title: t.title, text: t.text })),
      seo: seoOf(ab),
    } as any,
  })

  const ct = pg('contacts')
  await payload.updateGlobal({
    slug: 'contacts-page',
    data: {
      // В шаблоне page-contacts.php заголовки были зашиты в код — переносим именно их
      tag: 'Напишите нам',
      title: '<span class="gradient-text">Заказать сайт</span> свяжитесь с нами',
      subtitle: 'Обсудим ваш проект — это бесплатно. Ответим в течение 1 часа.',
      formTitle: 'Оставить заявку',
      formSubtitle: 'Расскажите о вашем проекте — подберём оптимальное решение',
      servicesList: m(ct, 'contacts_services_list'),
      faq: [
        { q: 'Сколько стоит сайт?', a: 'Лендинг — от 29 900 ₽, корпоративный сайт — от 79 900 ₽, интернет-магазин — от 129 900 ₽. Точная цена после брифа.' },
        { q: 'Какой срок разработки?', a: 'Лендинг — 1–2 недели, корпоративный сайт — до 3 недель.' },
        { q: 'Работаете по договору?', a: 'Да, всегда. Оплата поэтапно: 50% аванс, 50% при сдаче.' },
      ],
      seo: seoOf(ct),
    } as any,
  })

  const pf = pg('portfolio')
  await payload.updateGlobal({ slug: 'portfolio-page', data: { seo: seoOf(pf) } as any })

  const bl = pg('blog')
  await payload.updateGlobal({
    slug: 'blog-page',
    data: {
      tag: m(bl, 'blog_tag'),
      title: m(bl, 'blog_title'),
      subtitle: m(bl, 'blog_subtitle'),
      newsletterTitle: m(bl, 'blog_newsletter_title'),
      newsletterText: m(bl, 'blog_newsletter_text'),
      seo: seoOf(bl),
    } as any,
  })

  await payload.updateGlobal({
    slug: 'faq-page',
    data: {
      faq: [
        { q: 'Сколько стоит создание сайта?', a: 'Стоимость зависит от типа сайта и задач. Лендинг — от 29 900 ₽, сайт-визитка — от 50 000 ₽, корпоративный сайт — от 79 900 ₽, интернет-магазин — от 129 900 ₽. Точную цену называем после обсуждения проекта — она фиксируется в договоре и не меняется.' },
        { q: 'Сколько времени занимает разработка?', a: 'Лендинг делаем от 7 дней, сайт-визитку — от 14 дней, корпоративный сайт и интернет-магазин — от 30 дней. Сроки зависят от сложности и скорости предоставления материалов. Все сроки фиксируем в договоре.' },
        { q: 'Работаете ли вы по договору?', a: 'Да, всегда. Оплата поэтапно: 50% предоплата, 50% после показа результата. Стоимость и сроки фиксируются в договоре.' },
        { q: 'Можно ли будет самому менять тексты и картинки?', a: 'Да. Вы получаете удобную панель управления и можете самостоятельно редактировать контент без программиста.' },
        { q: 'Что нужно от меня для начала работы?', a: 'Короткий бриф: чем занимается бизнес, кто клиенты, какие сайты нравятся. Тексты и фото можно подготовить вместе с нами.' },
        { q: 'Есть ли поддержка после запуска?', a: 'Первый месяц после запуска сопровождаем и исправляем недочёты бесплатно. Дальше — по тарифу техподдержки или по запросу.' },
      ],
    } as any,
  })

  // ---------- Настройки, меню, калькулятор ----------
  console.log('Настройки…')
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      phone: '+7 978 558-84-90',
      email: 'info@getgeobit.ru',
      telegramUsername: 'krakeno9',
      telegramUrl: 'https://t.me/KRAKENO9',
      whatsappUrl: 'https://wa.me/79785588490',
      maxUrl: 'https://max.ru/u/f9LHodD0cOL2eOLOvDsBjtxQzAQx_pKmnK75ZRRRTtuvM03p0UCTCNXEE9o',
      address: 'Севастополь, Крым, Россия',
      workHours: 'Пн–Пт: 10:00–19:00',
      geoLat: 44.6166,
      geoLng: 33.5254,
      priceRange: '29 900 ₽ – 129 900 ₽',
      legalName: 'Каляков Георгий Аскерович (самозанятый)',
      inn: '519052868002',
      chatWidgetSrc: 'https://chat.baggyweb.com/widget/8nuc97xwf7tmroukhidnujvo8ceazy1epwey.js',
      leadEmail: 'info@getgeobit.ru',
    } as any,
  })

  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      header: [
        { label: 'Главная', url: '/', dropdown: 'none' },
        { label: 'Услуги', url: '/services/', dropdown: 'services' },
        { label: 'О нас', url: '/about/', dropdown: 'none' },
        { label: 'Портфолио', url: '/portfolio/', dropdown: 'none' },
        { label: 'Блог', url: '/blog/', dropdown: 'none' },
        { label: 'Контакты', url: '/contacts/', dropdown: 'contacts' },
      ],
      footerNav: [
        { label: 'Услуги', url: '/services/' },
        { label: 'О нас', url: '/about/' },
        { label: 'Портфолио', url: '/portfolio/' },
        { label: 'Блог', url: '/blog/' },
        { label: 'Контакты', url: '/contacts/' },
      ],
    } as any,
  })

  await payload.updateGlobal({
    slug: 'calculator',
    data: {
      types: [
        { key: 'landing', name: 'Лендинг', price: 29900 },
        { key: 'multi', name: 'Многостраничный', price: 50000 },
        { key: 'corp', name: 'Корпоративный', price: 79900 },
        { key: 'shop', name: 'Магазин', price: 129900 },
      ],
      speeds: [
        { key: 'normal', name: 'Обычный', hint: '3–5 недель', mult: 1 },
        { key: 'fast', name: 'Срочно', hint: '+30%', mult: 1.3 },
      ],
      designs: [
        { key: 'template', name: 'Шаблонный', hint: 'быстро', price: 0 },
        { key: 'custom', name: 'Индивидуальный', hint: 'под бренд', price: 25000 },
        { key: 'premium', name: 'Премиум', hint: 'анимации', price: 55000 },
      ],
      ...JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/calculator-extra.json'), 'utf8')),
    } as any,
  })

  // ---------- Админ ----------
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (email && password) {
    const exists = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (!exists.docs.length) await payload.create({ collection: 'users', data: { email, password } as any })
    console.log('Админ:', email)
  }

  console.log(`Готово. Медиафайлов: ${mediaCache.size}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
