/* Яндекс Метрика — только после согласия на «Аналитику» (cookie-баннер) */
(function () {
  var id = window.GEOBIT_CFG && window.GEOBIT_CFG.metrikaId;
  if (!id) return;
  var loaded = false;
  function loadMetrika() {
    if (loaded) return;
    loaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
      m[i].l = 1 * new Date();
      k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  function check(c) { if (c && c.analytics) loadMetrika(); }
  try { check(JSON.parse(localStorage.getItem('cb_consent') || 'null')); } catch (e) {}
  document.addEventListener('cb:consent', function (e) { check(e.detail); });
  // Цели: отправка заявки и клики по контактам
  window.geobitGoal = function (name) { try { if (loaded && window.ym) window.ym(Number(id), 'reachGoal', name); } catch (e) {} };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('tel:') === 0) window.geobitGoal('click_phone');
    else if (/t\.me\//.test(h)) window.geobitGoal('click_telegram');
    else if (/max\.ru\//.test(h)) window.geobitGoal('click_max');
    else if (/wa\.me\//.test(h)) window.geobitGoal('click_whatsapp');
  });
})();
