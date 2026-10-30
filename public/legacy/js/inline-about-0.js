(function(){
    var root = document.getElementById('gbAbout');
    if (!root) return;
    var cards = Array.prototype.slice.call(root.querySelectorAll('.gb-ab-card'));
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
        cards.forEach(function(c){ c.classList.add('is-in','is-done'); });
        return;
    }

    // Сообщаем CSS, что анимация активна — только теперь карточки прячутся до появления.
    // Если этот скрипт не выполнится, блок останется видимым (без анимации).
    root.classList.add('gb-anim');

    /* --- Анимация счётчиков: 5+ → считает от 0 --- */
    function runCounter(el){
        var raw = el.getAttribute('data-count') || el.textContent;
        var num = parseInt(raw.replace(/\D/g,''), 10);
        if (isNaN(num) || num === 0) return;
        var suffix = raw.replace(/[0-9]/g, '');   // «+», «шт» и т.п.
        var dur = 1100, start = null;
        function tick(ts){
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);   // ease-out
            el.textContent = Math.round(num * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
    }

    /* --- Каскадное появление карточек при скролле --- */
    cards.forEach(function(c){
        // После анимации появления снимаем её, чтобы заработал наклон за курсором
        c.addEventListener('animationend', function(){ c.classList.add('is-done'); });
    });

    if ('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
                if (!e.isIntersecting) return;
                e.target.classList.add('is-in');
                var num = e.target.querySelector('.gb-ab-stat-num');
                if (num && !num.dataset.done){ num.dataset.done = '1'; setTimeout(function(){ runCounter(num); }, 250); }
                io.unobserve(e.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
        cards.forEach(function(c){ io.observe(c); });
    } else {
        cards.forEach(function(c){ c.classList.add('is-in'); });
    }

})();
