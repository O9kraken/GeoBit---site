import { LOGO_SVG } from '@/lib/logo-svg'
import { autop } from '@/lib/util'

export const Html = ({ html, as: Tag = 'span', className }: { html?: string | null; as?: any; className?: string }) =>
  html ? <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} /> : null

/** Внутренность логотипа — инлайн SVG (для currentColor) */
export const LogoInner = () => <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />

export const MaxIcon = ({ size = 20 }: { size?: number }) => (
  <img src="/legacy/img/max-logo.svg" alt="MAX" className="max-glyph" width={size} height={size} loading="lazy" decoding="async" />
)

export const Breadcrumbs = ({ items }: { items: { label: string; href?: string }[] }) => (
  <nav className="breadcrumbs" aria-label="Навигация">
    <a href="/">Главная</a>
    {items.map((it, i) => (
      <span key={i} style={{ display: 'contents' }}>
        {' '}
        <span>/</span> {it.href ? <a href={it.href}>{it.label}</a> : <span>{it.label}</span>}
      </span>
    ))}
  </nav>
)

export type FaqItem = { q: string; a: string }

export const FaqList = ({ faqs, openFirst = true }: { faqs: FaqItem[]; openFirst?: boolean }) =>
  faqs?.length ? (
    <div className="faq-list">
      {faqs.map((item, idx) => {
        const open = openFirst && idx === 0
        return (
          <div className={'faq-item' + (open ? ' is-open' : '')} key={idx}>
            <button type="button" className="faq-question" aria-expanded={open ? 'true' : 'false'}>
              <span>{item.q}</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            <div className="faq-answer" dangerouslySetInnerHTML={{ __html: autop(item.a) }} />
          </div>
        )
      })}
    </div>
  ) : null

export const JsonLd = ({ data }: { data: unknown }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
)

export const faqSchema = (faqs: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q.replace(/<[^>]*>/g, ''),
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]*>/g, '') },
  })),
})

/** Секция FAQ в стиле темы + разметка FAQPage */
export const FaqSection = ({ faqs, tag = 'Вопросы и ответы', title = 'Частые <span class="gradient-text">вопросы</span>' }: { faqs: FaqItem[]; tag?: string; title?: string }) =>
  faqs?.length ? (
    <>
      <section className="faq section-padding" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{tag}</span>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: title }} />
          </div>
          <FaqList faqs={faqs} />
        </div>
      </section>
      <JsonLd data={faqSchema(faqs)} />
    </>
  ) : null
