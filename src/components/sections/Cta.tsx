import { Html, MaxIcon } from '@/components/Common'
import { BudgetOptions, Consent, HiddenFields, MethodField } from '@/components/LeadForm'
import { getGlobal, getServices } from '@/lib/payload'
import { telHref } from '@/lib/util'

/** Финальный блок «Готовы создать крутой сайт?» + свой попап (как template-parts/cta.php) */
export default async function Cta() {
  const [h, s, services] = await Promise.all([getGlobal<any>('home'), getGlobal<any>('settings'), getServices()])
  const tg = s?.telegramUrl
  const max = s?.maxUrl
  const wa = s?.whatsappUrl
  return (
    <>
      <section className="cta-section" id="cta">
        <div className="cta-bg">
          <canvas id="ctaCanvas"></canvas>
        </div>
        <div className="container">
          <div className="cta-content">
            <span className="section-tag">{h?.ctaTag || 'Начнём?'}</span>
            <Html as="h2" html={h?.ctaTitle || 'Готовы создать <span class="gradient-text">крутой сайт</span>?'} />
            <p>{h?.ctaDesc || 'Оставьте заявку — обсудим ваш проект и предложим оптимальное решение бесплатно'}</p>
            <div className="cta-actions">
              <button type="button" className="btn btn-primary btn-lg" id="ctaLeadOpen" aria-haspopup="dialog" aria-controls="ctaLeadModal">
                <i className="fas fa-paper-plane"></i>
                <span>{h?.ctaButton || 'Оставить заявку'}</span>
              </button>
              {s?.phone && (
                <a href={telHref(s.phone)} className="btn btn-outline btn-lg">
                  <i className="fas fa-phone"></i>
                  <span>Позвонить</span>
                </a>
              )}
            </div>
            <div className="cta-messengers">
              <span>Или напишите:</span>
              {tg && (
                <a href={tg} className="messenger-link" target="_blank" rel="noopener">
                  <i className="fab fa-telegram"></i> Telegram
                </a>
              )}
              {max && (
                <a href={max} className="messenger-link" target="_blank" rel="noopener">
                  <MaxIcon size={20} /> MAX
                </a>
              )}
              {wa && (
                <a href={wa} className="messenger-link" target="_blank" rel="noopener">
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      <div id="ctaLeadModal" className="lead-modal" aria-hidden="true">
        <div className="lead-modal-overlay" data-cta-close></div>
        <div className="lead-modal-box" role="dialog" aria-modal="true" aria-labelledby="ctaLeadTitle">
          <button className="lead-modal-close" type="button" data-cta-close aria-label="Закрыть">
            ×
          </button>
          <h3 id="ctaLeadTitle" className="lead-modal-title">
            Оставить заявку
          </h3>
          <p className="lead-modal-sub">Расскажите о проекте — подберём решение и ответим в течение дня</p>
          <form id="ctaLeadForm" noValidate>
            <HiddenFields nonceName="adelf_nonce_cta" />
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cta_name">Ваше имя *</label>
                <input type="text" id="cta_name" name="name" placeholder="Александр" required />
              </div>
              <div className="form-group">
                <label htmlFor="cta_phone">Телефон *</label>
                <input type="tel" id="cta_phone" name="phone" placeholder="+7 (999) 123-45-67" autoComplete="tel" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="cta_email">Email</label>
              <input type="email" id="cta_email" name="email" placeholder="you@mail.ru" autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="cta_service">Интересующая услуга</label>
              <select id="cta_service" name="service" className="lead-select" defaultValue="">
                <option value="" disabled>
                  Выберите услугу
                </option>
                {services.map((sv: any) => (
                  <option key={sv.id} value={sv.title}>
                    {sv.title}
                  </option>
                ))}
                <option value="Другое">Другое</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cta_budget">Примерный бюджет</label>
              <select id="cta_budget" name="budget" className="lead-select" defaultValue="">
                <BudgetOptions />
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cta_message">Описание проекта</label>
              <textarea id="cta_message" name="message" placeholder="Расскажите о вашем бизнесе, целях сайта, пожеланиях..."></textarea>
            </div>
            <MethodField />
            <Consent />
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="fas fa-paper-plane"></i>
              <span>Отправить заявку</span>
            </button>
            <p className="form-note">
              <i className="fas fa-lock" style={{ color: 'var(--accent-cyan)' }}></i> Ваши данные защищены и не передаются третьим лицам
            </p>
            <div id="ctaLeadSuccess" className="success-msg"></div>
          </form>
        </div>
      </div>
    </>
  )
}
