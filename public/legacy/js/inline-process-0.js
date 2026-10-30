(function(){
    var root = document.getElementById('gbProc');
    if (!root) return;
    var svg     = root.querySelector('.gb-proc-wire');
    var base    = root.querySelector('.gb-proc-wire-base');
    var current = root.querySelector('.gb-proc-wire-current');
    var track   = root.querySelector('.gb-proc-track');
    var steps   = Array.prototype.slice.call(root.querySelectorAll('.gb-proc-step'));
    if (!steps.length || !svg) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vertical = false;
    var nodePts = [];      // координаты центров кружков в системе SVG
    var running = false, hoverIdx = -1, token = 0, timer = null;

    // --- Пересчёт геометрии провода под текущий layout ---
    function measure(){
        var rr = root.getBoundingClientRect();
        vertical = window.innerWidth <= 768;
        svg.setAttribute('width',  rr.width);
        svg.setAttribute('height', rr.height);
        svg.setAttribute('viewBox', '0 0 ' + rr.width + ' ' + rr.height);

        nodePts = steps.map(function(step){
            var node = step.querySelector('.gb-proc-node');
            var nr = node.getBoundingClientRect();
            return {
                x: nr.left - rr.left + nr.width / 2,
                y: nr.top  - rr.top  + nr.height / 2
            };
        });
        if (nodePts.length < 2) return;

        var a = nodePts[0], b = nodePts[nodePts.length - 1];
        [base, current].forEach(function(ln){
            ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
            ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
        });

        // Длина провода для dash-анимации «тока»
        var len = Math.hypot(b.x - a.x, b.y - a.y);
        current.style.strokeDasharray  = (len * 0.18) + ' ' + len;
        root.style.setProperty('--wire-len', len);
    }

    // --- Подсветка этапов ---
    function light(activeIdx, doneSet){
        steps.forEach(function(s, i){
            s.classList.toggle('is-active', i === activeIdx);
            s.classList.toggle('is-done', doneSet ? doneSet.indexOf(i) > -1 : i < activeIdx);
        });
    }
    function clearLights(){
        steps.forEach(function(s){ s.classList.remove('is-active','is-done'); });
    }

    // --- Импульс тока по проводу от узла i к узлу j ---
    // Реализуем через смещение градиента: current-линия имеет пунктир-«сгусток»,
    // мы гоним stroke-dashoffset от позиции i к позиции j.
    function segOffset(idx){
        // 0 → начало провода (узел 0), 1 → конец (последний узел)
        if (nodePts.length < 2) return 0;
        var frac = idx / (nodePts.length - 1);
        var a = nodePts[0], b = nodePts[nodePts.length - 1];
        var len = Math.hypot(b.x - a.x, b.y - a.y);
        return len * frac;
    }

    function runCurrent(fromIdx, toIdx, dur, done){
        current.classList.add('on');
        var start = -segOffset(fromIdx);
        var end   = -segOffset(toIdx);
        current.style.transition = 'none';
        current.style.strokeDashoffset = start;
        void current.getBoundingClientRect();
        current.style.transition = 'stroke-dashoffset ' + dur + 'ms linear';
        current.style.strokeDashoffset = end;
        if (timer) clearTimeout(timer);
        timer = setTimeout(done, dur);
    }

    // --- Авто-цикл: ток течёт слева направо, этапы зажигаются ---
    function autoCycle(){
        if (!running || hoverIdx > -1) return;
        var myToken = token;
        var idx = 0;
        light(0, [0]);

        function next(){
            if (!running || hoverIdx > -1 || myToken !== token) return;
            if (idx >= steps.length - 1){
                // финиш — пауза и заново
                timer = setTimeout(function(){
                    if (!running || hoverIdx > -1 || myToken !== token) return;
                    clearLights();
                    current.classList.remove('on');
                    timer = setTimeout(function(){
                        if (!running || hoverIdx > -1 || myToken !== token) return;
                        autoCycle();
                    }, 500);
                }, 1500);
                return;
            }
            var from = idx, to = idx + 1;
            runCurrent(from, to, 700, function(){
                if (!running || hoverIdx > -1 || myToken !== token) return;
                idx = to;
                var done = [];
                for (var k = 0; k <= idx; k++) done.push(k);
                light(idx, done);
                timer = setTimeout(next, 900);
            });
        }
        // задержка на первом узле
        timer = setTimeout(next, 900);
    }

    // --- Режим наведения: от узла i ток расходится к остальным по очереди ---
    function hoverChain(i){
        var myToken = token;
        var order = [];
        for (var k = i + 1; k < steps.length; k++) order.push(k);
        for (var k2 = i - 1; k2 >= 0; k2--) order.push(k2);

        light(i, [i]);
        var pos = 0, doneSet = [i];

        function step(){
            if (hoverIdx !== i || myToken !== token) return;
            if (pos >= order.length){
                timer = setTimeout(function(){
                    if (hoverIdx !== i || myToken !== token) return;
                    doneSet = [i];
                    hoverChain(i);
                }, 800);
                return;
            }
            var target = order[pos];
            runCurrent(i, target, 520, function(){
                if (hoverIdx !== i || myToken !== token) return;
                doneSet.push(target);
                light(i, doneSet);
                pos++;
                timer = setTimeout(step, 160);
            });
        }
        step();
    }

    function startHover(i){
        if (reduce) return;
        hoverIdx = i; token++;
        if (timer) clearTimeout(timer);
        hoverChain(i);
    }
    function endHover(){
        if (hoverIdx < 0) return;
        hoverIdx = -1; token++;
        if (timer) clearTimeout(timer);
        clearLights();
        current.classList.remove('on');
        if (running) timer = setTimeout(autoCycle, 300);
    }

    function start(){
        if (running) return;
        running = true;
        measure();
        if (reduce){
            // Без анимации — просто подсвечиваем все этапы
            steps.forEach(function(s){ s.classList.add('is-done'); });
            return;
        }
        token++;
        autoCycle();
    }
    function stop(){
        running = false; hoverIdx = -1; token++;
        if (timer) clearTimeout(timer);
        current.classList.remove('on');
    }

    // Наведение — только для мыши
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches){
        steps.forEach(function(step, i){
            step.addEventListener('mouseenter', function(){ startHover(i); });
            step.addEventListener('mouseleave', endHover);
        });
    }

    // Запуск по появлению в зоне видимости
    if ('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){ if (e.isIntersecting) start(); else stop(); });
        }, { threshold: 0.2 });
        io.observe(root);
    } else {
        start();
    }

    // Пересчёт при ресайзе
    var rT;
    window.addEventListener('resize', function(){
        clearTimeout(rT);
        rT = setTimeout(function(){
            measure();
            if (running && hoverIdx < 0){ token++; clearLights(); current.classList.remove('on'); autoCycle(); }
        }, 200);
    });

    // Первичный расчёт после загрузки шрифтов/картинок
    window.addEventListener('load', measure);
    setTimeout(measure, 300);
})();
