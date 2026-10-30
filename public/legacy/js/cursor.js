/* ========================================================
   GeoBit — кастомный курсор «Уголки-рамка»
   Рамка следует с инерцией, точка — строго под мышью.
   При наведении на кликабельное рамка раскрывается.
   Реагирует только курсор; элементы не анимируются.
======================================================== */
(function () {
    'use strict';

    // Не включаем на сенсорных устройствах / без мыши
    var hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasMouse) return;

    var html = document.documentElement;
    html.classList.add('geobit-cursor-on');

    // Создаём DOM курсора, если его ещё нет (на случай отсутствия в разметке)
    var cursor = document.querySelector('.gb-cursor');
    var dot = document.querySelector('.gb-cursor-dot');

    if (!cursor) {
        cursor = document.createElement('div');
        cursor.className = 'gb-cursor';
        cursor.innerHTML =
            '<div class="gb-cursor-frame">' +
            '<span class="gb-corner tl"></span>' +
            '<span class="gb-corner tr"></span>' +
            '<span class="gb-corner bl"></span>' +
            '<span class="gb-corner br"></span>' +
            '</div>';
        document.body.appendChild(cursor);
    }
    if (!dot) {
        dot = document.createElement('div');
        dot.className = 'gb-cursor-dot';
        document.body.appendChild(dot);
    }

    var frame = cursor.querySelector('.gb-cursor-frame');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var fx = mx, fy = my; // позиция рамки (с инерцией)
    var shown = false;

    window.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!shown) {
            shown = true;
            cursor.classList.add('is-visible');
            dot.style.opacity = 1;
        }
        // точка — мгновенно под мышью
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    }, { passive: true });

    // Прячем при уходе мыши за пределы окна
    document.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-visible');
        dot.style.opacity = 0;
    });
    document.addEventListener('mouseenter', function () {
        cursor.classList.add('is-visible');
        dot.style.opacity = 1;
    });

    // Нажатие
    window.addEventListener('mousedown', function () { cursor.classList.add('is-down'); });
    window.addEventListener('mouseup', function () { cursor.classList.remove('is-down'); });

    // Что считаем «кликабельным» для hover-состояния
    var hoverSel = 'a, button, input, textarea, select, label, [role="button"], .btn, ' +
        '.nav-link, .nav-cta, summary, [onclick], [data-lead-open], [data-lead-close], ' +
        '.lead-modal-close, .burger';

    // Делегированный hover через mouseover/mouseout (ловит и динамически добавленные элементы, напр. попап)
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest(hoverSel)) {
            cursor.classList.add('is-hover');
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest(hoverSel)) {
            // проверяем, что реально ушли с интерактивного (а не на его потомка)
            var to = e.relatedTarget;
            if (!to || !(to.closest && to.closest(hoverSel))) {
                cursor.classList.remove('is-hover');
            }
        }
    });

    // Анимация инерции рамки
    function loop() {
        fx += (mx - fx) * 0.28;
        fy += (my - fy) * 0.28;
        frame.style.transform = 'translate(' + fx + 'px,' + fy + 'px)';
        requestAnimationFrame(loop);
    }
    loop();
})();
