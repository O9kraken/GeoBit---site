import { getGlobal } from '@/lib/payload'

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ /g, ' ')
const TYPE_ICONS: Record<string, string> = { landing: 'fa-bolt', multi: 'fa-layer-group', corp: 'fa-building', shop: 'fa-cart-shopping' }

/** Калькулятор «Соберите свой сайт» (template-parts/calculator.php). Цены — из админки. */
export default async function Calculator() {
  const c = await getGlobal<any>('calculator')
  const types = c?.types?.length ? c.types : []
  const speeds = c?.speeds?.length ? c.speeds : []
  const designs = c?.designs?.length ? c.designs : []
  const addons = c?.addons?.length ? c.addons : []
  const blockPrices = Object.fromEntries((c?.blocks || []).map((b: any) => [b.key, b.price]))
  const first = types[0]
  return (
    <section className="sb section-padding" id="calculator">
      <script dangerouslySetInnerHTML={{ __html: `window.SB_BLOCK_PRICES=${JSON.stringify(blockPrices)};` }} />
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Калькулятор</span>
          <h2 className="section-title" dangerouslySetInnerHTML={{ __html: 'Соберите свой <span class="gradient-text">сайт</span>' }} />
          <p className="section-desc">
            Перетаскивайте блоки на экран, меняйте параметры и смотрите, как меняется стоимость. Это не финальная смета, а предварительная стоимость за минуту!
          </p>
        </div>
        <div className="sb-app">
          <div className="sb-settings">
            <div className="sb-group">
              <div className="sb-group-row">
                <div className="sb-set">
                  <div className="sb-set-head">
                    <span className="sb-set-num">1</span>
                    <h3>Тип сайта</h3>
                  </div>
                  <div className="sb-choices sb-choices-2" data-group="type">
                    {types.map((t: any, i: number) => (
                      <button key={t.key} className={'sb-choice' + (i === 0 ? ' is-active' : '')} data-price={t.price} data-mult="1" data-key={t.key}>
                        <i className={`fas ${TYPE_ICONS[t.key] || 'fa-globe'}`}></i>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sb-set">
                  <div className="sb-set-head">
                    <span className="sb-set-num">2</span>
                    <h3>Сроки</h3>
                  </div>
                  <div className="sb-choices sb-choices-1" data-group="speed">
                    {speeds.map((s: any, i: number) => (
                      <button key={s.key} className={'sb-choice' + (i === 0 ? ' is-active' : '')} data-mult={s.mult} data-key={s.key}>
                        <span>{s.name}</span>
                        <small>{s.hint}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sb-mode" id="sbMode" role="group" aria-label="Режим макета">
                <span className="sb-mode-label">
                  <i className="fas fa-eye"></i> Вид макета:
                </span>
                <div className="sb-mode-btns">
                  <button type="button" className="sb-mode-btn" data-mode="empty">
                    Пустые
                  </button>
                  <button type="button" className="sb-mode-btn is-active" data-mode="visual">
                    С визуалом
                  </button>
                </div>
              </div>
            </div>
            <div className="sb-set">
              <div className="sb-set-head">
                <span className="sb-set-num">3</span>
                <h3>Дизайн</h3>
              </div>
              <div className="sb-choices sb-choices-1" data-group="design">
                {designs.map((d: any, i: number) => (
                  <button key={d.key} className={'sb-choice' + (i === 0 ? ' is-active' : '')} data-price={d.price} data-key={d.key}>
                    <span>{d.name}</span>
                    <small>{d.hint}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="sb-set">
              <div className="sb-set-head">
                <span className="sb-set-num">+</span>
                <h3>Дополнительно</h3>
              </div>
              <div className="sb-addons" data-group="addons">
                {addons.map((a: any) => (
                  <label className="sb-addon" key={a.key}>
                    <input type="checkbox" data-price={a.price} data-key={a.key} />
                    <span className="sb-addon-box">
                      <i className="fas fa-check"></i>
                    </span>
                    <span className="sb-addon-label">{a.name}</span>
                    <span className="sb-addon-price">+{fmt(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="sb-build">
            <div className="sb-set sb-set-blocks">
              <div className="sb-set-head">
                <span className="sb-set-num">4</span>
                <h3>Блоки сайта</h3>
              </div>
              <p className="sb-hint">
                <i className="fas fa-arrow-pointer"></i> Перетащите на экран или нажмите «+»
              </p>
              <div className="sb-palette" id="sbPalette"></div>
            </div>
            <div className="sb-stage">
              <div className="sb-browser">
                <div className="sb-browser-bar">
                  <span className="sb-dot"></span>
                  <span className="sb-dot"></span>
                  <span className="sb-dot"></span>
                  <div className="sb-url">
                    <i className="fas fa-lock"></i> <span id="sbUrl">ваш-сайт.рф</span>
                  </div>
                  <div className="sb-browser-tag" id="sbTypeTag">
                    {first?.name || 'Лендинг'}
                  </div>
                </div>
                <div className="sb-canvas" id="sbCanvas">
                  <div className="sb-empty" id="sbEmpty">
                    <i className="fas fa-hand-pointer"></i>
                    <p>Перетащите блоки сюда</p>
                    <span>или нажмите «+» у блока слева</span>
                  </div>
                </div>
              </div>
              <div className="sb-result">
                <div className="sb-result-row">
                  <div className="sb-result-label">Предварительная стоимость</div>
                  <div className="sb-result-price">
                    от <span id="sbTotal">{fmt(first?.price || 0)}</span> ₽
                  </div>
                </div>
                <div className="sb-result-meta">
                  <span>
                    <i className="fas fa-cube"></i> <span id="sbBlocks">0</span> блоков
                  </span>
                  <span>
                    <i className="fas fa-clock"></i> <span id="sbTime">~2</span> недели
                  </span>
                </div>
                <button className="btn btn-primary btn-lg sb-cta" data-lead-open data-sb-summary>
                  <i className="fas fa-paper-plane"></i>
                  <span>Получить точную смету</span>
                </button>
                <p className="sb-disclaimer">Итог — ориентир. Финальная цена зависит от деталей и фиксируется в договоре.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
