/* ============================================================
   КАЛЬКУЛЯТОР — ДАННЫЕ (каталог блоков + шаблоны макетов)
   PREVIEW[key](ctx, visual):
     ctx    — тип сайта ('landing'|'multi'|'corp'|'shop').
     visual — false: «пустые» скелетоны; true: «с визуалом» (демо-тексты, иконки).
   ============================================================ */
window.SB_DATA = (function(){

    var BLOCKS = [
        { key:'hero',       name:'Первый экран',        icon:'fa-star',            price:5000 },
        { key:'about',      name:'О компании',          icon:'fa-circle-info',     price:3000 },
        { key:'services',   name:'Услуги',              icon:'fa-grip',            price:4000 },
        { key:'advantages', name:'Преимущества',        icon:'fa-award',           price:3000 },
        { key:'steps',      name:'Этапы работы',        icon:'fa-list-ol',         price:3000 },
        { key:'portfolio',  name:'Портфолио',           icon:'fa-images',          price:5000 },
        { key:'catalog',    name:'Каталог товаров',     icon:'fa-store',           price:9000 },
        { key:'pricing',    name:'Тарифы',              icon:'fa-tags',            price:4000 },
        { key:'calculator', name:'Калькулятор расчёта', icon:'fa-calculator',      price:7000 },
        { key:'team',       name:'Команда',             icon:'fa-users',           price:3000 },
        { key:'reviews',    name:'Отзывы',              icon:'fa-quote-left',      price:3000 },
        { key:'cases',      name:'Кейсы',               icon:'fa-folder-open',     price:4000 },
        { key:'faq',        name:'Вопросы-ответы',      icon:'fa-circle-question', price:2500 },
        { key:'gallery',    name:'Галерея/фото',        icon:'fa-photo-film',      price:3000 },
        { key:'video',      name:'Видео-блок',          icon:'fa-circle-play',     price:3000 },
        { key:'cta',        name:'Призыв к действию',   icon:'fa-bullhorn',        price:2500 },
        { key:'form',       name:'Форма заявки',        icon:'fa-paper-plane',     price:3000 },
        { key:'blog',       name:'Блог/новости',        icon:'fa-newspaper',       price:5000 },
        { key:'partners',   name:'Партнёры/клиенты',    icon:'fa-handshake',       price:2500 },
        { key:'stats',      name:'Цифры/достижения',    icon:'fa-chart-simple',    price:2500 },
        { key:'map',        name:'Карта/контакты',      icon:'fa-location-dot',    price:3000 }
    ];

    // Цены блоков можно поменять в админке (глобальная настройка «Калькулятор»)
    if (window.SB_BLOCK_PRICES) {
        BLOCKS.forEach(function(b){
            if (typeof window.SB_BLOCK_PRICES[b.key] === 'number') b.price = window.SB_BLOCK_PRICES[b.key];
        });
    }

    function isShop(ctx){ return ctx==='shop'; }
    function L(w, txt, cls){
        cls = cls ? (' '+cls) : '';
        return txt ? '<div class="m-txt'+cls+'">'+txt+'</div>'
                   : '<div class="m-line w'+w+cls+'"></div>';
    }
    function IMG(cls, icon){
        cls = cls || '';
        return '<div class="m-img '+cls+'">'+(icon?'<i class="fas '+icon+'"></i>':'')+'</div>';
    }

    var DEMO = {
        services: ['Разработка сайтов','SEO-продвижение','Реклама','Поддержка'],
        sIcons:   ['fa-code','fa-magnifying-glass','fa-bullhorn','fa-headset'],
        advantages: ['Гарантия результата','Сроки от 7 дней','Опытная команда','Честные цены'],
        aIcons:   ['fa-shield-halved','fa-bolt','fa-users','fa-ruble-sign'],
        steps: ['Заявка','Дизайн','Разработка','Запуск'],
        portfolio: ['Интернет-магазин','Лендинг','Корп. сайт','Каталог','Сайт-визитка','Промо'],
        plans: [['Старт','от 30 000 ₽'],['Бизнес','от 60 000 ₽'],['Премиум','от 120 000 ₽']],
        team: ['Анна — дизайнер','Иван — разработчик','Пётр — маркетолог','Ольга — менеджер'],
        reviews: ['Отличная работа, рекомендую!','Сделали быстро и качественно','Превзошли ожидания'],
        cases: ['Рост заявок в 3 раза','ТОП-10 за 4 месяца'],
        faq: ['Сколько стоит сайт?','Какие сроки разработки?','Будет ли поддержка?'],
        blog: ['Как выбрать CMS','Тренды веб-дизайна','Зачем бизнесу сайт'],
        stats: [['150+','проектов'],['8 лет','на рынке'],['98%','довольных'],['24/7','поддержка']],
        products: [['Товар 1','1 990 ₽'],['Товар 2','2 490 ₽'],['Товар 3','3 200 ₽'],['Товар 4','1 750 ₽'],['Товар 5','4 100 ₽'],['Товар 6','2 900 ₽']]
    };

    var PREVIEW = {
        hero: function(ctx, v){
            var shop = isShop(ctx);
            var title = shop ? 'Большой выбор товаров' : 'Создаём сайты, которые продают';
            var sub   = shop ? 'Доставка по всей России' : 'Дизайн, разработка и продвижение под ключ';
            var img   = IMG(shop?'big banner':'big', v?(shop?'fa-bag-shopping':'fa-rocket'):'');
            return '<div class="m-hero'+(shop?' m-hero-shop':'')+'">'+
                '<div class="m-hero-text">'+
                    (v?'<div class="m-h1">'+title+'</div>':L(60,'',' tall'))+
                    (v?'<div class="m-sub">'+sub+'</div>':L(80))+
                    (v?'':L(40))+
                    '<div class="m-row gap">'+
                        (v?'<div class="m-btn txt">Оставить заявку</div>':'<div class="m-btn"></div>')+
                        (v?'<div class="m-btn ghost txt">Подробнее</div>':'<div class="m-btn ghost"></div>')+
                    '</div>'+
                '</div>'+img+'</div>';
        },
        about: function(ctx, v){
            return '<div class="m-split">'+
                IMG('about', v?'fa-building':'')+
                '<div class="m-col">'+
                    (v?'<div class="m-h2">О компании</div>':L(40,'',' tall'))+
                    (v?'<div class="m-sub">Помогаем бизнесу расти в интернете уже 8 лет. Решаем задачи любой сложности.</div>':L(90)+L(80)+L(60))+
                '</div></div>';
        },
        services: function(ctx, v){
            var n=(ctx==='landing')?3:4, s='';
            for(var i=0;i<n;i++){
                s+='<div class="m-card">'+
                    '<div class="m-cardico">'+(v?'<i class="fas '+DEMO.sIcons[i]+'"></i>':'')+'</div>'+
                    (v?'<div class="m-cardttl">'+DEMO.services[i]+'</div>':L(70))+
                    (v?'<div class="m-cardtxt">Кратко о услуге и пользе</div>':L(90,'',' light'))+
                '</div>';
            }
            return '<div class="m-grid c'+n+'">'+s+'</div>';
        },
        advantages: function(ctx, v){
            var s='';
            for(var i=0;i<4;i++){
                s+='<div class="m-card mini">'+
                    '<div class="m-cardico sm">'+(v?'<i class="fas '+DEMO.aIcons[i]+'"></i>':'')+'</div>'+
                    (v?'<div class="m-cardttl sm">'+DEMO.advantages[i]+'</div>':L(80))+
                '</div>';
            }
            return '<div class="m-grid c4">'+s+'</div>';
        },
        steps: function(ctx, v){
            var s='';
            for(var i=0;i<4;i++){
                s+='<div class="m-step"><div class="m-step-num">'+(v?(i+1):'')+'</div>'+
                    (v?'<div class="m-cardttl sm">'+DEMO.steps[i]+'</div>':L(90))+'</div>';
            }
            return '<div class="m-steps">'+s+'</div>';
        },
        portfolio: function(ctx, v){
            var s='';
            for(var i=0;i<6;i++){
                s+='<div class="m-tile">'+(v?'<i class="fas fa-image"></i><span class="m-tile-cap">'+DEMO.portfolio[i]+'</span>':'')+'</div>';
            }
            return '<div class="m-tiles">'+s+'</div>';
        },
        catalog: function(ctx, v){
            var n=(ctx==='landing')?3:6, s='';
            for(var i=0;i<n;i++){
                var d=DEMO.products[i%DEMO.products.length];
                s+='<div class="m-prod">'+IMG('prod', v?'fa-box':'')+
                    (v?'<div class="m-cardttl sm">'+d[0]+'</div>':L(70))+
                    '<div class="m-prod-foot">'+
                        (v?'<div class="m-pricetxt">'+d[1]+'</div>':'<div class="m-price"></div>')+
                        (v?'<div class="m-btn-mini txt"><i class="fas fa-cart-shopping"></i></div>':'<div class="m-btn-mini"></div>')+
                    '</div></div>';
            }
            return '<div class="m-prods">'+s+'</div>';
        },
        pricing: function(ctx, v){
            var s='';
            DEMO.plans.forEach(function(p,i){
                s+='<div class="m-plan'+(i===1?' featured':'')+'">'+
                    (v?'<div class="m-cardttl">'+p[0]+'</div>':L(50))+
                    (v?'<div class="m-pricebig">'+p[1]+'</div>':'<div class="m-price big"></div>')+
                    (v?'<div class="m-cardtxt">Что входит в тариф</div>':L(80))+
                    (v?'<div class="m-cardtxt">и ещё пункт</div>':L(70))+
                    (v?'<div class="m-btn txt">Выбрать</div>':'<div class="m-btn"></div>')+
                '</div>';
            });
            return '<div class="m-grid c3">'+s+'</div>';
        },
        calculator: function(ctx, v){
            return '<div class="m-calc">'+
                '<div class="m-calc-side">'+(v?'<div class="m-cardttl sm">Параметры</div>':L(80))+L(60)+L(70)+'</div>'+
                '<div class="m-calc-main">'+
                    '<div class="m-calc-screen">'+(v?'<i class="fas fa-sliders"></i>':'')+'</div>'+
                    (v?'<div class="m-pricebig">от 45 000 ₽</div>':'<div class="m-price big"></div>')+
                '</div></div>';
        },
        team: function(ctx, v){
            var s='';
            for(var i=0;i<4;i++){
                s+='<div class="m-person">'+IMG('ava round', v?'fa-user':'')+
                    (v?'<div class="m-cardttl sm center">'+DEMO.team[i]+'</div>':L(70,'',' center'))+'</div>';
            }
            return '<div class="m-grid c4">'+s+'</div>';
        },
        reviews: function(ctx, v){
            var s='';
            for(var i=0;i<3;i++){
                s+='<div class="m-review">'+
                    '<div class="m-row">'+IMG('ava round sm', v?'fa-user':'')+(v?'<div class="m-cardttl sm">Клиент '+(i+1)+'</div>':L(50))+'</div>'+
                    (v?'<div class="m-cardtxt">'+DEMO.reviews[i]+'</div>':L(90)+L(80))+'</div>';
            }
            return '<div class="m-grid c3">'+s+'</div>';
        },
        cases: function(ctx, v){
            var s='';
            for(var i=0;i<2;i++){
                s+='<div class="m-case">'+IMG('case', v?'fa-chart-line':'')+
                    (v?'<div class="m-cardttl sm">'+DEMO.cases[i]+'</div>':L(60))+
                    (v?'<div class="m-cardtxt">Описание кейса и результата</div>':L(80))+'</div>';
            }
            return '<div class="m-grid c2">'+s+'</div>';
        },
        faq: function(ctx, v){
            var s='';
            for(var i=0;i<3;i++){
                s+='<div class="m-faq-q">'+(v?'<div class="m-cardttl sm">'+DEMO.faq[i]+'</div>':L(60))+'<div class="m-plus">'+(v?'+':'')+'</div></div>';
            }
            return '<div class="m-faq">'+s+'</div>';
        },
        gallery: function(ctx, v){
            var s='';
            for(var i=0;i<8;i++){ s+='<div class="m-tile">'+(v?'<i class="fas fa-image"></i>':'')+'</div>'; }
            return '<div class="m-gallery">'+s+'</div>';
        },
        video: function(ctx, v){
            return '<div class="m-video"><div class="m-play"></div>'+(v?'<span class="m-video-cap">Видео о компании</span>':'')+'</div>';
        },
        cta: function(ctx, v){
            return '<div class="m-cta">'+
                (v?'<div class="m-h2 center">Готовы начать проект?</div>':L(50,'',' center tall light'))+
                (v?'<div class="m-btn center txt">Получить расчёт</div>':'<div class="m-btn center"></div>')+'</div>';
        },
        form: function(ctx, v){
            return '<div class="m-form">'+
                '<div class="m-form-l">'+
                    (v?'<div class="m-h2">Оставьте заявку</div>':L(60,'',' tall'))+
                    (v?'<div class="m-sub">Ответим в течение часа</div>':L(80))+'</div>'+
                '<div class="m-form-r">'+
                    (v?'<div class="m-field txt">Ваше имя</div>':'<div class="m-field"></div>')+
                    (v?'<div class="m-field txt">Телефон</div>':'<div class="m-field"></div>')+
                    (v?'<div class="m-field tall txt">Сообщение</div>':'<div class="m-field tall"></div>')+
                    (v?'<div class="m-btn txt">Отправить</div>':'<div class="m-btn"></div>')+
                '</div></div>';
        },
        blog: function(ctx, v){
            var s='';
            for(var i=0;i<3;i++){
                s+='<div class="m-post">'+IMG('post', v?'fa-newspaper':'')+
                    (v?'<div class="m-cardttl sm">'+DEMO.blog[i]+'</div>':L(80))+
                    (v?'<div class="m-cardtxt">5 минут чтения</div>':L(60))+'</div>';
            }
            return '<div class="m-grid c3">'+s+'</div>';
        },
        partners: function(ctx, v){
            var s='';
            for(var i=0;i<5;i++){ s+='<div class="m-logo">'+(v?'<i class="fas fa-handshake"></i>':'')+'</div>'; }
            return '<div class="m-logos">'+s+'</div>';
        },
        stats: function(ctx, v){
            var s='';
            for(var i=0;i<4;i++){
                var d=DEMO.stats[i];
                s+='<div class="m-stat">'+
                    (v?'<div class="m-numtxt">'+d[0]+'</div>':'<div class="m-num"></div>')+
                    (v?'<div class="m-cardtxt center">'+d[1]+'</div>':L(70,'',' center'))+'</div>';
            }
            return '<div class="m-stats">'+s+'</div>';
        },
        map: function(ctx, v){
            return '<div class="m-map"><div class="m-map-pin"></div>'+
                (v?'<i class="fas fa-map-location-dot m-map-bg"></i>':'')+
                '<div class="m-map-card">'+
                    (v?'<div class="m-cardttl sm">Наш офис</div>':L(70))+
                    (v?'<div class="m-cardtxt">г. Москва, ул. Примерная, 1</div>':L(50))+
                '</div></div>';
        }
    };

    return { BLOCKS: BLOCKS, PREVIEW: PREVIEW };
})();
