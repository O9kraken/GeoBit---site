/* GeoBit: подготовка перед запуском скриптов старой темы.
   Скрипты грузятся ПОСЛЕ гидратации React, поэтому события DOMContentLoaded и load
   к этому моменту уже прошли. Прослойка вызывает такие подписки сразу. */
(function () {
  if (window.__geobitBoot) return;
  window.__geobitBoot = true;
  function patch(target, evName, ready) {
    var orig = target.addEventListener;
    target.addEventListener = function (type, fn, opts) {
      if (type === evName && ready()) {
        setTimeout(function () {
          try { typeof fn === 'function' ? fn.call(target, new Event(type)) : fn.handleEvent(new Event(type)) } catch (e) { console.error(e) }
        }, 0);
        return;
      }
      return orig.call(this, type, fn, opts);
    };
  }
  patch(document, 'DOMContentLoaded', function () { return document.readyState !== 'loading' });
  patch(window, 'load', function () { return document.readyState === 'complete' });

  // Время рендера формы — для антиспам-проверки «не быстрее 2 секунд»
  var ts = Math.floor(Date.now() / 1000);
  document.querySelectorAll('[data-form-ts]').forEach(function (i) { i.value = ts });

  // Подсветка активного пункта меню (раньше делал WordPress)
  var path = location.pathname.replace(/\/+$/, '/') || '/';
  document.querySelectorAll('#navLinks a.nav-link').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href === path || (href !== '/' && path.indexOf(href) === 0)) a.classList.add('active');
  });
})();
