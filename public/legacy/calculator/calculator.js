/* ============================================================
   КАЛЬКУЛЯТОР — ЛОГИКА
   Рендер интерактивного макета-превью сайта, drag-and-drop,
   подсчёт цены/сроков, проброс сводки в попап заявки.
   Зависит от window.SB_DATA (calculator-data.js).
   ============================================================ */
(function(){
    var app = document.getElementById('calculator');
    if (!app || !window.SB_DATA) return;

    var BLOCKS = SB_DATA.BLOCKS;
    var PREVIEW = SB_DATA.PREVIEW;
    var BLOCK_MAP = {}; BLOCKS.forEach(function(b){ BLOCK_MAP[b.key]=b; });

    var fmt = function(n){ return Math.round(n).toLocaleString('ru-RU'); };

    var palette   = document.getElementById('sbPalette');
    var canvas    = document.getElementById('sbCanvas');
    var empty     = document.getElementById('sbEmpty');
    var elTotal   = document.getElementById('sbTotal');
    var elBlocks  = document.getElementById('sbBlocks');
    var elTime    = document.getElementById('sbTime');
    var elTypeTag = document.getElementById('sbTypeTag');

    var state = {
        typePrice:30000, typeMult:1, typeKey:'landing', typeName:'Лендинг',
        designPrice:0000, designKey:'template',
        speedMult:1, speedKey:'normal',
        visual:true,
        addons:[]
    };

    // тип сайта → класс «рамки» макета (шапка с меню для multi/corp/shop)
    function applyTypeFrame(){
        canvas.className = 'sb-canvas sb-type-' + state.typeKey + (state.visual ? ' sb-visual' : '');
        // показать/скрыть фейковую шапку сайта
        var nav = canvas.querySelector('.m-nav');
        var needNav = (state.typeKey !== 'landing');
        if (needNav && !nav){
            nav = document.createElement('div');
            nav.className = 'm-nav';
            nav.innerHTML = '<div class="m-nav-logo"></div><div class="m-nav-links"><span></span><span></span><span></span><span></span></div>'+
                            (state.typeKey==='shop' ? '<div class="m-nav-cart"></div>' : '<div class="m-nav-btn"></div>');
            canvas.insertBefore(nav, canvas.firstChild);
        } else if (!needNav && nav){
            nav.remove();
        } else if (needNav && nav){
            // обновить вид (корзина/кнопка) при смене типа
            var last = nav.lastElementChild;
            if (last) last.className = (state.typeKey==='shop' ? 'm-nav-cart' : 'm-nav-btn');
        }
    }

    // перерисовать превью каждого блока под текущий тип
    function repaintPreviews(){
        Array.prototype.forEach.call(canvas.querySelectorAll('.sb-mock'), function(row){
            var key = row.dataset.key;
            var body = row.querySelector('.sb-mock-preview');
            if (body && PREVIEW[key]) body.innerHTML = PREVIEW[key](state.typeKey, state.visual);
        });
    }

    // ── Рендер палитры (первые N + «показать ещё») ──
    var VISIBLE = 7;
    BLOCKS.forEach(function(b, i){
        var chip = document.createElement('div');
        chip.className = 'sb-block-chip' + (i >= VISIBLE ? ' sb-hidden' : '');
        chip.setAttribute('draggable','true');
        chip.dataset.key = b.key;
        chip.innerHTML =
            '<span class="sb-block-ico"><i class="fas '+b.icon+'"></i></span>'+
            '<span class="sb-block-name">'+b.name+'</span>'+
            '<button type="button" class="sb-block-add" aria-label="Добавить">+</button>';
        chip.querySelector('.sb-block-add').addEventListener('click', function(e){ e.stopPropagation(); addBlock(b.key); });
        chip.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', b.key); e.dataTransfer.effectAllowed='copy'; chip.classList.add('dragging'); });
        chip.addEventListener('dragend', function(){ chip.classList.remove('dragging'); });
        palette.appendChild(chip);
    });

    if (BLOCKS.length > VISIBLE){
        var moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'sb-more';
        var hiddenCount = BLOCKS.length - VISIBLE;
        moreBtn.innerHTML = '<span>Показать ещё ' + hiddenCount + '</span> <i class="fas fa-chevron-down"></i>';
        moreBtn.addEventListener('click', function(){
            var expanded = palette.classList.toggle('sb-expanded');
            moreBtn.querySelector('span').textContent = expanded ? 'Свернуть' : ('Показать ещё ' + hiddenCount);
            moreBtn.classList.toggle('is-open', expanded);
        });
        palette.appendChild(moreBtn);
    }

    // ── Добавление блока (рисуем секцию-макет) ──
    function addBlock(key, index){
        var b = BLOCK_MAP[key]; if(!b) return;
        empty.style.display='none';

        var row = document.createElement('div');
        row.className = 'sb-mock';
        row.dataset.key = key;
        row.setAttribute('draggable','true');

        var previewHTML = PREVIEW[key] ? PREVIEW[key](state.typeKey, state.visual) : '';
        row.innerHTML =
            '<div class="sb-mock-bar">'+
                '<span class="sb-mock-grip"><i class="fas fa-grip-vertical"></i></span>'+
                '<span class="sb-mock-ico"><i class="fas '+b.icon+'"></i></span>'+
                '<span class="sb-mock-name">'+b.name+'</span>'+
                '<button type="button" class="sb-mock-del" aria-label="Удалить"><i class="fas fa-xmark"></i></button>'+
            '</div>'+
            '<div class="sb-mock-preview">'+previewHTML+'</div>';

        row.querySelector('.sb-mock-del').addEventListener('click', function(e){
            e.stopPropagation();
            row.classList.add('removing');
            setTimeout(function(){ row.remove(); recalc(); }, 220);
        });
        row.addEventListener('dragstart', function(e){ row.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/reorder', key); });
        row.addEventListener('dragend', function(){ row.classList.remove('dragging'); });

        // вставка с учётом фейковой шапки (она всегда первая)
        var navOffset = canvas.querySelector('.m-nav') ? 1 : 0;
        if (typeof index === 'number'){
            var ref = canvas.querySelectorAll('.sb-mock')[index];
            if (ref) canvas.insertBefore(row, ref); else canvas.appendChild(row);
        } else {
            canvas.appendChild(row);
        }

        row.classList.add('entering');
        requestAnimationFrame(function(){ row.classList.remove('entering'); });
        recalc();
    }

    // ── DnD: добавление + сортировка ──
    function afterElement(container, y){
        var els = Array.prototype.slice.call(container.querySelectorAll('.sb-mock:not(.dragging)'));
        return els.reduce(function(closest, child){
            var box = child.getBoundingClientRect();
            var offset = y - box.top - box.height/2;
            if (offset < 0 && offset > closest.offset) return { offset:offset, element:child };
            return closest;
        }, { offset: -Infinity, element:null }).element;
    }
    canvas.addEventListener('dragover', function(e){
        e.preventDefault();
        canvas.classList.add('sb-over');
        var dragging = canvas.querySelector('.sb-mock.dragging');
        if (dragging){
            var after = afterElement(canvas, e.clientY);
            if (after == null) canvas.appendChild(dragging);
            else canvas.insertBefore(dragging, after);
        }
    });
    canvas.addEventListener('dragleave', function(e){ if(e.target===canvas) canvas.classList.remove('sb-over'); });
    canvas.addEventListener('drop', function(e){
        e.preventDefault();
        canvas.classList.remove('sb-over');
        var newKey = e.dataTransfer.getData('text/plain');
        if (newKey && BLOCK_MAP[newKey]){
            var after = afterElement(canvas, e.clientY);
            var mocks = canvas.querySelectorAll('.sb-mock');
            var idx;
            if (after){ idx = Array.prototype.indexOf.call(mocks, after); }
            addBlock(newKey, idx);
        } else {
            recalc();
        }
    });

    // ── Группы выбора ──
    app.querySelectorAll('.sb-choices').forEach(function(group){
        var name = group.dataset.group;
        group.querySelectorAll('.sb-choice').forEach(function(btn){
            btn.addEventListener('click', function(){
                group.querySelectorAll('.sb-choice').forEach(function(b){ b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                if (name==='type'){
                    state.typePrice = +btn.dataset.price||0;
                    state.typeMult  = +btn.dataset.mult||1;
                    state.typeKey   = btn.dataset.key;
                    state.typeName  = btn.querySelector('span').textContent;
                    elTypeTag.textContent = state.typeName;
                    applyTypeFrame();
                    repaintPreviews();
                } else if (name==='design'){
                    state.designPrice = +btn.dataset.price||0;
                    state.designKey   = btn.dataset.key;
                } else if (name==='speed'){
                    state.speedMult = +btn.dataset.mult||1;
                    state.speedKey  = btn.dataset.key;
                }
                recalc();
            });
        });
    });

    // ── Доп. опции ──
    app.querySelectorAll('.sb-addon input').forEach(function(cb){
        cb.addEventListener('change', function(){
            state.addons = [];
            app.querySelectorAll('.sb-addon input:checked').forEach(function(c){
                state.addons.push({ key:c.dataset.key, price:+c.dataset.price||0, label:c.closest('.sb-addon').querySelector('.sb-addon-label').textContent });
            });
            recalc();
        });
    });

    // ── Пересчёт ──
    function recalc(){
        var mocks = Array.prototype.slice.call(canvas.querySelectorAll('.sb-mock'));
        if (mocks.length===0) empty.style.display='';
        var blocksSum = mocks.reduce(function(s,m){ return s + (BLOCK_MAP[m.dataset.key] ? BLOCK_MAP[m.dataset.key].price : 0); }, 0);

        var base = state.typePrice + blocksSum + state.designPrice;
        var addonsSum = state.addons.reduce(function(s,a){ return s+a.price; }, 0);
        var subtotal = (base * state.typeMult) + addonsSum;
        var total = subtotal * state.speedMult;

        elTotal.textContent = fmt(total);
        elBlocks.textContent = mocks.length;

        var weeks = mocks.length ? (1.5 + mocks.length*0.4) : 0;
        if (state.designKey==='premium') weeks += 1.5;
        else if (state.designKey==='custom') weeks += 0.7;
        weeks = weeks / state.speedMult;
        elTime.textContent = weeks ? ('~'+Math.max(1, Math.round(weeks))) : '0';

        app._sbSummary = buildSummary(mocks, total, weeks);
    }

    function buildSummary(mocks, total, weeks){
        var lines = [];
        lines.push('Тип сайта: '+state.typeName);
        var designName = {template:'Шаблонный',custom:'Индивидуальный',premium:'Премиум'}[state.designKey];
        lines.push('Дизайн: '+designName);
        lines.push('Сроки: '+(state.speedKey==='fast'?'Срочно (+30%)':'Обычный'));
        if (mocks.length){
            lines.push('Блоки: '+mocks.map(function(m){ return BLOCK_MAP[m.dataset.key].name; }).join(', '));
        }
        if (state.addons.length){
            lines.push('Доп.: '+state.addons.map(function(a){ return a.label; }).join(', '));
        }
        lines.push('Ориентир срока: ~'+Math.max(1,Math.round(weeks))+' нед.');
        lines.push('Предварительная стоимость: от '+fmt(total)+' ₽');
        return lines.join('\n');
    }

    // ── Проброс сводки в попап ──
    var ctaBtn = app.querySelector('[data-sb-summary]');
    if (ctaBtn){
        ctaBtn.addEventListener('click', function(){
            setTimeout(function(){
                var msg = document.querySelector('#leadForm [name="message"]');
                if (msg && app._sbSummary){
                    msg.value = 'Расчёт из калькулятора:\n'+app._sbSummary+'\n\n';
                    msg.focus();
                }
                var sub = document.querySelector('#leadModal .lead-modal-sub');
                if (sub) sub.textContent = 'Мы подготовим точную смету по вашему расчёту и свяжемся с вами.';
            }, 80);
        });
    }

    // ── Переключатель режима макета (пустые / с визуалом) ──
    var modeWrap = document.getElementById('sbMode');
    if (modeWrap){
        modeWrap.querySelectorAll('.sb-mode-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
                modeWrap.querySelectorAll('.sb-mode-btn').forEach(function(b){ b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                state.visual = (btn.dataset.mode === 'visual');
                canvas.classList.toggle('sb-visual', state.visual);
                repaintPreviews();
            });
        });
    }

    // ── Мобильный перенос переключателя: над окном с макетами ──
    // На узких экранах #sbMode переезжает в .sb-stage перед браузером,
    // на десктопе возвращается на своё место в группе настроек.
    (function(){
        var mode = document.getElementById('sbMode');
        if (!mode) return;
        var home = mode.parentNode;                 // место на десктопе (.sb-group)
        var stage = app.querySelector('.sb-stage'); // куда перенести на мобиле
        var browser = stage ? stage.querySelector('.sb-browser') : null;
        var mq = window.matchMedia('(max-width: 880px)');
        function place(){
            if (mq.matches){
                if (browser && mode.parentNode !== stage){
                    stage.insertBefore(mode, browser);
                    mode.classList.add('sb-mode-mobile');
                }
            } else if (mode.parentNode !== home){
                home.appendChild(mode);             // вернуть в конец группы (под Тип+Сроки)
                mode.classList.remove('sb-mode-mobile');
            }
        }
        place();
        mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place);
    })();

    // ── Старт: показать пример макета ──
//     applyTypeFrame();
//     addBlock('hero');
//     addBlock('services');
//     addBlock('portfolio');
//     addBlock('form');
//     recalc();
})();