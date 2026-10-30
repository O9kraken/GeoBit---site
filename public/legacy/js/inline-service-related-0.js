(function(){
    var track = document.getElementById('gbxRsTrack');
    if (!track) return;
    var prev = document.getElementById('gbxRsPrev'),
        next = document.getElementById('gbxRsNext'),
        dotsWrap = document.getElementById('gbxRsDots'),
        cards = Array.prototype.slice.call(track.children),
        viewport = track.parentElement,
        index = 0;

    function perView(){
        var w = window.innerWidth;
        if (w < 600) return 1;
        if (w < 960) return 2;
        return 3;
    }
    function maxIndex(){ return Math.max(0, cards.length - perView()); }

    function buildDots(){
        if (!dotsWrap) return;
        dotsWrap.innerHTML='';
        var pages = maxIndex()+1;
        for (var i=0;i<pages;i++){
            var d=document.createElement('button');
            d.className='gbx-rs-dot'+(i===0?' active':'');
            d.setAttribute('aria-label','К группе '+(i+1));
            (function(i){ d.addEventListener('click',function(){ index=i; render(); }); })(i);
            dotsWrap.appendChild(d);
        }
    }
    function render(){
        if (index>maxIndex()) index=maxIndex();
        if (index<0) index=0;
        var card = cards[0];
        var style = getComputedStyle(track);
        var gap = parseFloat(style.columnGap||style.gap||0)||0;
        var step = card.getBoundingClientRect().width + gap;
        track.style.transform = 'translateX(-'+(index*step)+'px)';
        if (dotsWrap){
            Array.prototype.forEach.call(dotsWrap.children,function(d,i){ d.classList.toggle('active', i===index); });
        }
        if (prev) prev.disabled = (index<=0);
        if (next) next.disabled = (index>=maxIndex());
    }
    if (next) next.addEventListener('click', function(){ index++; render(); });
    if (prev) prev.addEventListener('click', function(){ index--; render(); });

    // свайп
    var startX=0, dragging=false;
    viewport.addEventListener('touchstart', function(e){ startX=e.touches[0].clientX; dragging=true; }, {passive:true});
    viewport.addEventListener('touchend', function(e){
        if(!dragging) return; dragging=false;
        var diff=startX-e.changedTouches[0].clientX;
        if(Math.abs(diff)>40){ diff>0?index++:index--; render(); }
    }, {passive:true});

    var rt;
    window.addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(function(){ buildDots(); render(); },150); });

    buildDots(); render();
})();
