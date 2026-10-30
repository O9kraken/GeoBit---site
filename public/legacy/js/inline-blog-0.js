/* Подписка в блоке «Подпишитесь на обновления» (/blog/).
   В старой теме форма была заглушкой и никуда не отправляла email — теперь подписка настоящая,
   с обязательным согласием на рассылку (152-ФЗ). */
(function () {
    var form = document.getElementById('newsletterForm');
    if ( ! form || form.__nlBound ) return;
    form.__nlBound = true;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var input   = form.querySelector('.newsletter-input');
        var success = form.querySelector('.newsletter-success');
        var notice  = form.querySelector('.newsletter-notice');
        var consent = form.querySelector('[name="consent_mailing"]');
        if ( ! input || ! input.value || ! input.checkValidity() ) { input && input.reportValidity(); return; }
        if ( consent && ! consent.checked ) { notice.classList.add('is-error'); return; }
        var btn = form.querySelector('[type="submit"]'); btn.disabled = true;
        var fd = new FormData(form);
        fd.append('action', 'adelf_subscribe');
        fd.append('consent', '1');
        fd.append('page', location.pathname);
        try {
            var r = await fetch(adelfAjax.ajaxUrl, { method: 'POST', body: fd });
            var d = await r.json();
            if ( d.success ) {
                form.querySelector('.newsletter-input-wrap').style.display = 'none';
                if ( notice ) notice.style.display = 'none';
                if ( success ) success.style.display = 'flex';
            } else {
                notice.textContent = (d.data && d.data.message) || 'Ошибка. Попробуйте позже.';
            }
        } catch (err) { notice.textContent = 'Произошла ошибка. Попробуйте позже.'; }
        btn.disabled = false;
    });
}());
