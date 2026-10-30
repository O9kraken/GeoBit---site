/** Общие поля формы заявки (совместимы со старыми скриптами темы) */
export const HiddenFields = ({ nonceName = 'adelf_nonce_lead' }: { nonceName?: string }) => (
  <>
    <input type="hidden" name={nonceName} value="geobit" />
    <input type="hidden" name="form_ts" value="0" data-form-ts />
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Не заполняйте это поле
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  </>
)

export const BudgetOptions = () => (
  <>
    <option value="" disabled>
      Выберите бюджет
    </option>
    <option value="10-30">10 000 — 30 000 ₽</option>
    <option value="30-60">30 000 — 60 000 ₽</option>
    <option value="60-150">60 000 — 150 000 ₽</option>
    <option value="150+">от 150 000 ₽</option>
  </>
)

export const MethodField = () => (
  <fieldset className="form-group form-method">
    <legend>Как удобнее связаться?</legend>
    <div className="form-method__opts">
      <label className="form-method__opt">
        <input type="radio" name="contact_method" value="telegram" defaultChecked /> <span>Telegram</span>
      </label>
      <label className="form-method__opt">
        <input type="radio" name="contact_method" value="max" /> <span>MAX</span>
      </label>
      <label className="form-method__opt">
        <input type="radio" name="contact_method" value="call" /> <span>Звонок</span>
      </label>
    </div>
  </fieldset>
)

export const Consent = () => (
  <label className="form-consent">
    <input type="checkbox" name="consent" value="1" required />
    <span>
      Я даю{' '}
      <a href="/soglasie-pd/" target="_blank" rel="noopener" style={{ color: 'var(--accent-cyan)' }}>
        согласие на обработку персональных данных
      </a>{' '}
      в соответствии с{' '}
      <a href="/privacy-policy/" target="_blank" rel="noopener" style={{ color: 'var(--accent-cyan)' }}>
        политикой конфиденциальности
      </a>
    </span>
  </label>
)

export function LeadModal({ services }: { services: string[] }) {
  return (
    <div id="leadModal" className="lead-modal" aria-hidden="true">
      <div className="lead-modal-overlay" data-lead-close></div>
      <div className="lead-modal-box" role="dialog" aria-modal="true" aria-labelledby="leadModalTitle">
        <button className="lead-modal-close" data-lead-close aria-label="Закрыть">
          ×
        </button>
        <h3 id="leadModalTitle" className="lead-modal-title">
          Оставить заявку
        </h3>
        <p className="lead-modal-sub">Расскажите о проекте — подберём решение и ответим в течение дня</p>
        <form id="leadForm" noValidate>
          <HiddenFields />
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pf_name">Ваше имя *</label>
              <input type="text" id="pf_name" name="name" placeholder="Александр" required />
            </div>
            <div className="form-group">
              <label htmlFor="pf_phone">Телефон *</label>
              <input type="tel" id="pf_phone" name="phone" placeholder="+7 (999) 123-45-67" autoComplete="tel" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pf_email">Email</label>
            <input type="email" id="pf_email" name="email" placeholder="you@mail.ru" autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="pf_service">Интересующая услуга</label>
            <select id="pf_service" name="service" className="lead-select" defaultValue="">
              <option value="" disabled>
                Выберите услугу
              </option>
              {services.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="Другое">Другое</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pf_budget">Примерный бюджет</label>
            <select id="pf_budget" name="budget" className="lead-select" defaultValue="">
              <BudgetOptions />
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pf_message">Описание проекта</label>
            <textarea id="pf_message" name="message" placeholder="Расскажите о вашем бизнесе, целях сайта, пожеланиях..."></textarea>
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
          <div id="leadFormSuccess" className="success-msg"></div>
        </form>
      </div>
    </div>
  )
}
