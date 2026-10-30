(function() {
  var scene = document.getElementById('cb-scene');

  /* --- Загрузка сторонних скриптов СТРОГО по согласию --- */
  var chatLoaded = false;
  function cbApplyConsent(c) {
    if (!c) return;
    // Чат-виджет — категория «Персонализация» (ставит сторонние cookie)
    if (c.pref && !chatLoaded) {
      chatLoaded = true;
      var s = document.createElement('script');
      s.src = (window.GEOBIT_CFG && window.GEOBIT_CFG.chatSrc) || '';
      if (!s.src) return;
      s.async = true;
      document.body.appendChild(s);
    }
    // Событие для аналитики (Метрика подключается в functions.php по нему)
    document.dispatchEvent(new CustomEvent('cb:consent', { detail: c }));
  }

  // Если выбор уже сделан ранее — применяем его и баннер не показываем
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('cb_consent') || 'null'); } catch(e) {}
  if (saved) {
    cbApplyConsent(saved);
  } else {
    // Показываем баннер сразу (небольшая пауза только ради анимации).
    // До нажатия пользователем НИКАКИЕ необязательные cookie не ставятся.
    setTimeout(function() {
      scene.classList.add('cb-visible');
    }, 800);
  }

  // «Настройки cookie» в подвале — открыть баннер повторно
  window.cbOpen = function() {
    try {
      var c = JSON.parse(localStorage.getItem('cb_consent') || 'null') || {};
      document.getElementById('cb-analytics').checked = !!c.analytics;
      document.getElementById('cb-marketing').checked = !!c.marketing;
      document.getElementById('cb-pref').checked = !!c.pref;
    } catch (e) {}
    scene.style.display = '';
    scene.style.opacity = '';
    scene.style.transform = '';
    scene.style.transition = '';
    scene.classList.add('cb-visible');
  };
  document.querySelectorAll('[data-cookie-settings]').forEach(function(a) {
    a.addEventListener('click', function(e) { e.preventDefault(); window.cbOpen(); });
  });

  function cbHide() {
    scene.style.transition = 'opacity 0.3s, transform 0.3s';
    scene.style.opacity = '0';
    scene.style.transform = 'translateY(10px) scale(0.97)';
    setTimeout(function() { scene.style.display = 'none'; }, 320);
  }

  function cbSaveConsent(data) {
    localStorage.setItem('cb_consent', JSON.stringify(data));
    cbApplyConsent(data);
    setTimeout(cbHide, 500);
  }

  function cbShowToast(msg) {
    var t = document.getElementById('cb-toast');
    t.textContent = msg;
    t.classList.add('cb-show');
    setTimeout(function() { t.classList.remove('cb-show'); }, 2200);
  }

  window.cbAcceptAll = function() {
    ['cb-analytics','cb-marketing','cb-pref'].forEach(function(id) {
      document.getElementById(id).checked = true;
    });
    cbShowToast('Все cookie приняты ✓');
    cbSaveConsent({ analytics: true, marketing: true, pref: true });
  };

  window.cbRejectAll = function() {
    ['cb-analytics','cb-marketing','cb-pref'].forEach(function(id) {
      document.getElementById(id).checked = false;
    });
    cbShowToast('Отклонено — только необходимые');
    cbSaveConsent({ analytics: false, marketing: false, pref: false });
  };

  window.cbSave = function() {
    var data = {
      analytics: document.getElementById('cb-analytics').checked,
      marketing: document.getElementById('cb-marketing').checked,
      pref: document.getElementById('cb-pref').checked
    };
    cbShowToast('Настройки сохранены ✓');
    cbSaveConsent(data);
  };

  window.cbDismiss = function() {
    cbHide();
  };
})();
