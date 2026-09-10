/* ============================================================
   DKS main site upgrade (staging). Loaded AFTER script.js.
   script.js is a byte-identical copy of the live file and is never
   edited; this file only adds behaviour. Every module is an IIFE
   with a null guard on its root element, so any section can be
   removed from the page without breaking the rest.
   ============================================================ */
(function () {
'use strict';

/* ---------- shared infrastructure ---------- */
var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var SAVE_DATA = !!(navigator.connection && navigator.connection.saveData);
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX80BdKV6fdp7ylZwmIKVSQOGWLQugqnoEs57EiViBZNdN5zI0U08qsVyo1iebB6N7ow/exec';
var WA_NUMBER = '972537757323';

function clamp01(n) { return Math.min(1, Math.max(0, n)); }
function lang() { var l = document.documentElement.lang || 'he'; return /^(he|en|ru|ar)$/.test(l) ? l : 'he'; }
function t(dict) { return dict[lang()] || dict.he; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* one passive scroll handler for every scroll-driven module (no rAF, no IntersectionObserver:
   IO never fires inside some embedded webviews, rect maths behaves identically everywhere) */
var scrollFns = [];
function onScroll(fn) { scrollFns.push(fn); }
function runScroll() { for (var i = 0; i < scrollFns.length; i++) { try { scrollFns[i](); } catch (e) {} } }
window.addEventListener('scroll', runScroll, { passive: true });
window.addEventListener('resize', runScroll);

/* the intro overlay locks scrolling (style.css body:not(.intro-done)); modules register their first frame through this */
function onIntroDone(cb) {
    if (document.body.classList.contains('intro-done')) { cb(); return; }
    var mo = new MutationObserver(function () {
        if (document.body.classList.contains('intro-done')) { mo.disconnect(); cb(); }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { mo.disconnect(); cb(); }, 9000); // safety: never leave a module without its first frame
}

/* language hook: script.js declares `function applyLanguage` globally; the click handler resolves the
   identifier at call time, so wrapping the global binding is enough. Dynamic sections re-render here. */
var langFns = [];
function onLang(fn) { langFns.push(fn); }
(function () {
    var orig = window.applyLanguage;
    if (typeof orig !== 'function') return;
    window.applyLanguage = function (l) {
        orig(l);
        for (var i = 0; i < langFns.length; i++) { try { langFns[i](lang()); } catch (e) {} }
    };
})();

document.body.classList.add('has-site-bg');

/* ---------- analytics slot (phase 2): every [data-event] click lands in dataLayer ---------- */
window.dataLayer = window.dataLayer || [];
document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-event]');
    if (!el) return;
    window.dataLayer.push({ event: el.getAttribute('data-event'), pkg: el.getAttribute('data-pkg') || undefined, lang: lang() });
});

/* ---------- intro: skip on repeat visit is inline in index.html; here: any input ends it early ---------- */
(function introSkip() {
    var intro = document.getElementById('logoIntro');
    if (!intro || document.body.classList.contains('intro-done')) return;
    function skip() {
        if (document.body.classList.contains('intro-done')) return;
        intro.classList.add('done');
        document.body.classList.add('intro-done');
        setTimeout(function () { if (intro.parentNode) intro.remove(); }, 700);
    }
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
        window.addEventListener(ev, skip, { passive: true, once: true });
    });
})();

/* ---------- generic reveal (ported from track-days), through script.js's global observer ---------- */
(function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var obs = (typeof observer !== 'undefined' && observer && typeof observer.observe === 'function') ? observer : null;
    if (REDUCED || !obs) { els.forEach(function (el) { el.classList.add('visible'); }); return; }
    els.forEach(function (el) { obs.observe(el); });
    // belt and braces for webviews where IO never fires: reveal anything on screen on scroll
    onScroll(function () {
        var vh = window.innerHeight;
        els.forEach(function (el) {
            if (el.classList.contains('visible')) return;
            var r = el.getBoundingClientRect();
            if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('visible');
        });
    });
})();

/* ---------- site-wide background video (all sections except the hero) ---------- */
(function siteBg() {
    var wrap = document.getElementById('site-bg');
    var v = wrap && wrap.querySelector('video');
    var hero = document.getElementById('hero');
    var adv = document.getElementById('advantages');
    if (!wrap || !v) return;
    if (REDUCED || SAVE_DATA) return; // poster only
    var started = false;
    function play() { var p = v.play(); if (p && typeof p.catch === 'function') p.catch(function () {}); }
    function start() {
        if (started) return;
        started = true;
        v.src = v.getAttribute('data-src');
        v.load();
        play();
    }
    v.addEventListener('playing', function () { wrap.classList.add('live'); });
    function update() {
        var vh = window.innerHeight;
        if (!started) {
            var trigger = adv ? adv.getBoundingClientRect().top : 0;
            if (trigger < vh * 0.85) start(); else return;
        }
        var heroCovers = hero ? hero.getBoundingClientRect().bottom > 0 : false;
        if (heroCovers) { if (!v.paused) v.pause(); }
        else if (v.paused) { play(); }
    }
    onScroll(update);
    onIntroDone(update);
})();

/* ---------- hero: still image first (LCP), then the hero video takes over ---------- */
(function heroStillToVideo() {
    var hero = document.getElementById('hero');
    var v = hero && hero.querySelector('.hero-video');
    if (!hero || !v) return;
    var src = v.getAttribute('data-src'), fb = v.getAttribute('data-src-fallback');
    if (!src || REDUCED || SAVE_DATA) return; // the still stays
    var started = false, usingFallback = false;
    function play() { var p = v.play(); if (p && typeof p.catch === 'function') p.catch(useFallback); }
    function useFallback() {
        if (usingFallback || !fb) return;
        usingFallback = true;
        v.src = fb; v.load(); var p = v.play(); if (p && typeof p.catch === 'function') p.catch(function () {});
    }
    function start() {
        if (started) return;
        started = true;
        v.src = src; v.load(); play();
    }
    v.addEventListener('playing', function () { hero.classList.add('video-live'); }, { once: true });
    v.addEventListener('error', useFallback);
    onIntroDone(function () { setTimeout(start, 2500); });
    window.addEventListener('scroll', start, { passive: true, once: true });
})();

/* ---------- roadmap: the car drives down the road as you scroll ---------- */
(function roadmap() {
    var scene = document.getElementById('roadmap');
    if (!scene) return;
    var svg = scene.querySelector('.rm-svg');
    var path = scene.querySelector('#roadPath');
    var asphalt = scene.querySelector('#roadAsphalt');
    var car = scene.querySelector('.rm-car');
    var stops = [].slice.call(scene.querySelectorAll('.rm-stop'));
    var cards = [].slice.call(scene.querySelectorAll('.rm-card'));
    if (!svg || !path || !car || !cards.length) return;
    if (REDUCED) { cards.forEach(function (c) { c.classList.add('active'); }); return; }

    var STOP_AT = [0.06, 0.29, 0.52, 0.75, 0.96];
    var len = 0, lastW = 0, lastH = 0;

    function build() {
        var W = svg.clientWidth || window.innerWidth, H = svg.clientHeight || window.innerHeight;
        if (W === lastW && H === lastH) return;
        lastW = W; lastH = H;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        var mobile = W < 768;
        var y0 = mobile ? H * 0.30 : H * 0.30, y1 = mobile ? H * 0.62 : H * 0.95;
        var span = y1 - y0;
        var d = 'M ' + (W * 0.5) + ' ' + y0 +
            ' C ' + (W * 0.22) + ' ' + (y0 + span * 0.22) + ', ' + (W * 0.78) + ' ' + (y0 + span * 0.40) + ', ' + (W * 0.5) + ' ' + (y0 + span * 0.56) +
            ' S ' + (W * 0.22) + ' ' + (y0 + span * 0.88) + ', ' + (W * 0.5) + ' ' + y1;
        path.setAttribute('d', d);
        if (asphalt) asphalt.setAttribute('d', d);
        len = path.getTotalLength();
        stops.forEach(function (s, i) {
            var p = path.getPointAtLength((STOP_AT[i] || 0) * len);
            s.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')');
        });
    }

    function update() {
        build();
        if (!len) return;
        var top = scene.getBoundingClientRect().top;
        var dist = scene.offsetHeight - window.innerHeight;
        var p = dist > 0 ? clamp01(-top / dist) : 0;
        var pt = path.getPointAtLength(p * len);
        var ahead = path.getPointAtLength(Math.min(len, p * len + 4));
        var behind = path.getPointAtLength(Math.max(0, p * len - 4));
        var ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI + 90;
        car.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + ang + ')');
        var idx = 0;
        for (var i = 0; i < STOP_AT.length; i++) { if (p >= STOP_AT[i] - 0.05) idx = i; }
        stops.forEach(function (s, i) { s.classList.toggle('reached', i <= idx); });
        cards.forEach(function (c, i) { c.classList.toggle('active', i === idx); });
    }
    onScroll(update);
    onIntroDone(update);
    window.addEventListener('load', update);
})();

/* ---------- Instagram reels (data/reels.json; embed.js only when the section approaches) ---------- */
(function reels() {
    var sec = document.getElementById('reels');
    var track = sec && sec.querySelector('.reels-track');
    if (!sec || !track) return;
    var VIEWS = { he: 'צפיות', en: 'views', ru: 'просмотров', ar: 'مشاهدة' };
    var OPEN = { he: 'לצפייה באינסטגרם', en: 'Watch on Instagram', ru: 'Смотреть в Instagram', ar: 'شاهد على إنستغرام' };
    var loaded = false, injected = false, items = [];

    function fmt(n) {
        n = Number(n) || 0;
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1000) return Math.round(n / 1000) + 'K';
        return String(n);
    }
    function reelUrl(id) { return 'https://www.instagram.com/reel/' + encodeURIComponent(id) + '/'; }
    function fallbackTile(id) {
        return '<a class="reel-fallback" href="' + reelUrl(id) + '" target="_blank" rel="noopener" data-event="reel_open" data-pkg="' + esc(id) + '">' +
            '<svg class="icon"><use href="#i-instagram"/></svg><span data-k="open">' + esc(t(OPEN)) + '</span></a>';
    }
    function render() {
        track.innerHTML = items.map(function (r) {
            return '<article class="reel-card" role="listitem">' +
                '<div class="reel-embed" data-id="' + esc(r.id) + '">' +
                '<blockquote class="instagram-media" data-instgrm-permalink="' + reelUrl(r.id) + '" data-instgrm-version="14" style="background:#0f1115;border:0;margin:0;padding:0;width:100%;min-width:0">' +
                '<a href="' + reelUrl(r.id) + '" target="_blank" rel="noopener" style="color:#fff;display:block;padding:2rem;text-align:center">Instagram</a></blockquote></div>' +
                '<div class="reel-meta"><span class="reel-views"><svg class="icon"><use href="#i-eye"/></svg>' + fmt(r.views) + ' <span data-k="views">' + esc(t(VIEWS)) + '</span></span>' +
                '<a class="reel-open" href="' + reelUrl(r.id) + '" target="_blank" rel="noopener" data-event="reel_open" data-pkg="' + esc(r.id) + '" data-k="open">' + esc(t(OPEN)) + '</a></div>' +
                '</article>';
        }).join('');
    }
    function fallbackAll() {
        track.querySelectorAll('.reel-embed').forEach(function (el) {
            if (!el.querySelector('iframe')) el.innerHTML = fallbackTile(el.getAttribute('data-id'));
        });
    }
    function inject() {
        if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') { window.instgrm.Embeds.process(); }
        else if (!injected) {
            injected = true;
            var s = document.createElement('script');
            s.async = true; s.src = 'https://www.instagram.com/embed.js';
            s.onerror = fallbackAll;
            document.body.appendChild(s);
        }
        setTimeout(fallbackAll, 8000); // blocked embeds (privacy extensions, no third-party cookies) degrade to tiles
    }
    function load() {
        if (loaded) return;
        loaded = true;
        fetch('data/reels.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) {
            items = (Array.isArray(j) ? j : []).filter(function (r) { return r && r.selected && r.id; })
                .sort(function (a, b) { return (b.views || 0) - (a.views || 0); });
            if (!items.length) { sec.hidden = true; return; }
            render();
            inject();
        }).catch(function () { sec.hidden = true; });
    }
    function update() { if (!loaded && sec.getBoundingClientRect().top < window.innerHeight * 1.2) load(); }
    onScroll(update);
    onIntroDone(update);
    onLang(function () {
        track.querySelectorAll('[data-k="views"]').forEach(function (el) { el.textContent = t(VIEWS); });
        track.querySelectorAll('[data-k="open"]').forEach(function (el) { el.textContent = t(OPEN); });
    });
})();

/* ---------- Google reviews marquee (data/reviews.json) ---------- */
(function reviews() {
    var sec = document.getElementById('reviews');
    var marquee = sec && sec.querySelector('.reviews-marquee');
    var track = sec && sec.querySelector('.reviews-track');
    if (!sec || !marquee || !track) return;
    var BADGE = { he: 'מגוגל', en: 'from Google', ru: 'из Google', ar: 'من جوجل' };
    var loaded = false, items = [];

    function stars(n) {
        var s = '';
        for (var i = 0; i < Math.max(1, Math.min(5, Number(n) || 5)); i++) s += '<svg class="icon"><use href="#i-star"/></svg>';
        return s;
    }
    function fmtDate(d) {
        var m = /^(\d{4})-(\d{2})/.exec(String(d || ''));
        return m ? m[2] + '/' + m[1] : esc(d);
    }
    function card(r) {
        return '<article class="rv-card"><div class="rv-head"><span class="rv-stars">' + stars(r.rating) + '</span>' +
            '<span class="rv-badge"><svg class="icon"><use href="#i-google"/></svg><span>' + esc(t(BADGE)) + '</span></span></div>' +
            '<p class="rv-text">' + esc(r.text) + '</p>' +
            '<div class="rv-foot"><b>' + esc(r.name) + '</b><time>' + fmtDate(r.date) + '</time></div></article>';
    }
    function render() {
        var html = items.map(card).join('');
        track.innerHTML = html + html; // rendered twice for a seamless loop
        track.style.setProperty('--rv-dur', (items.length * 7) + 's');
    }
    function load() {
        if (loaded) return;
        loaded = true;
        fetch('data/reviews.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) {
            items = (Array.isArray(j) ? j : []).filter(function (r) { return r && r.selected && r.text; });
            if (items.length < 3) { sec.hidden = true; return; }
            render();
        }).catch(function () { sec.hidden = true; });
    }
    var resumeTimer = null;
    function pause() { marquee.classList.add('paused'); if (resumeTimer) clearTimeout(resumeTimer); }
    function resume() { if (resumeTimer) clearTimeout(resumeTimer); resumeTimer = setTimeout(function () { marquee.classList.remove('paused'); }, 4000); }
    marquee.addEventListener('pointerdown', pause);
    marquee.addEventListener('touchstart', pause, { passive: true });
    marquee.addEventListener('pointerup', resume);
    marquee.addEventListener('pointercancel', resume);
    marquee.addEventListener('touchend', resume);

    function update() { if (!loaded && sec.getBoundingClientRect().top < window.innerHeight * 1.3) load(); }
    onScroll(update);
    onIntroDone(update);
    onLang(function () { if (items.length) render(); });
})();

/* ---------- map embed (keyless Google Maps iframe, injected on approach or click) ---------- */
(function mapEmbed() {
    var frame = document.getElementById('mapFrame');
    if (!frame) return;
    var base = frame.getAttribute('data-src');
    var btn = frame.querySelector('.map-load');
    var iframe = null;
    function src() { return base.replace(/([?&])hl=[a-z]+/, '$1hl=' + (lang() === 'he' ? 'iw' : lang())); }
    function load() {
        if (iframe) return;
        iframe = document.createElement('iframe');
        iframe.src = src();
        iframe.loading = 'lazy';
        iframe.title = 'Motor City map';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        frame.appendChild(iframe);
        frame.classList.add('loaded');
    }
    if (btn) btn.addEventListener('click', load);
    function update() { if (!iframe && frame.getBoundingClientRect().top < window.innerHeight * 1.1) load(); }
    onScroll(update);
    onIntroDone(update);
    onLang(function () { if (iframe) iframe.src = src(); });
})();

/* ---------- lead form -> Apps Script formType:'lead' (sheet + email to Paul + auto-reply) ---------- */
(function leadForm() {
    var form = document.getElementById('lead-form');
    var btn = document.getElementById('lead-submit');
    var status = document.getElementById('lead-status');
    if (!form || !btn || !status) return;
    var icon = document.getElementById('lead-status-icon');
    var title = document.getElementById('lead-status-title');
    var msg = document.getElementById('lead-status-msg');
    var wa = document.getElementById('lead-wa-fallback');
    var btnLabel = btn.querySelector('span');
    var I18N = {
        sending: { he: 'שולחים...', en: 'Sending...', ru: 'Отправляем...', ar: 'جارٍ الإرسال...' },
        okTitle: { he: 'קיבלנו! נחזור אליכם בהקדם', en: 'Got it! We will get back to you shortly', ru: 'Получили! Скоро свяжемся с вами', ar: 'وصلتنا! سنعود إليكم قريباً' },
        okMsg: { he: 'שלחנו לכם גם מייל אישור. רוצים תשובה מיידית? אנחנו זמינים בוואטסאפ ובטלפון 053-775-7323.', en: 'A confirmation email is on its way. Want an instant answer? We are on WhatsApp and at 053-775-7323.', ru: 'Письмо с подтверждением уже отправлено. Нужен ответ сразу? Мы в WhatsApp и по телефону 053-775-7323.', ar: 'أرسلنا لكم أيضاً بريد تأكيد. تريدون رداً فورياً؟ نحن متاحون على واتساب وعلى الهاتف 053-775-7323.' },
        errTitle: { he: 'הפרטים לא נשלחו', en: 'The details were not sent', ru: 'Данные не отправлены', ar: 'لم يتم إرسال التفاصيل' },
        errMsg: { he: 'משהו השתבש בדרך. נסו שוב, או שלחו לנו את הפרטים בוואטסאפ בלחיצה אחת.', en: 'Something went wrong. Try again, or send us the details on WhatsApp in one tap.', ru: 'Что-то пошло не так. Попробуйте ещё раз или отправьте данные в WhatsApp одним нажатием.', ar: 'حدث خطأ ما. حاولوا مجدداً أو أرسلوا لنا التفاصيل عبر واتساب بضغطة واحدة.' },
        waIntro: { he: 'היי, השארתי פרטים באתר ולא הצלחתי לשלוח.', en: 'Hi, I tried to leave my details on the site and it failed.', ru: 'Привет, я пытался оставить данные на сайте, но не получилось.', ar: 'مرحباً، حاولت ترك بياناتي في الموقع ولم ينجح الإرسال.' }
    };
    var phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput) phoneInput.addEventListener('input', function () {
        var clean = phoneInput.value.replace(/[\s-]/g, '');
        if (clean !== phoneInput.value) phoneInput.value = clean;
    });
    var originalLabel = btnLabel ? btnLabel.textContent : '';
    function show(kind, ttl, body, payload) {
        status.hidden = false;
        status.className = 'lead-status ' + kind;
        if (icon) icon.textContent = kind === 'success' ? '✅' : '⚠️';
        if (title) title.textContent = ttl;
        if (msg) msg.textContent = body;
        if (wa) {
            wa.hidden = kind !== 'error';
            if (kind === 'error' && payload) {
                wa.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(t(I18N.waIntro) + '\n' + payload.fullName + '\n' + payload.phone + '\n' + payload.email + (payload.message ? '\n' + payload.message : ''));
            }
        }
        status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (phoneInput) phoneInput.value = phoneInput.value.replace(/[\s-]/g, '');
        if (!form.reportValidity()) return;
        var fd = new FormData(form);
        var payload = {
            formType: 'lead',
            fullName: String(fd.get('fullName') || '').trim(),
            phone: String(fd.get('phone') || '').replace(/[\s-]/g, ''),
            email: String(fd.get('email') || '').trim(),
            message: String(fd.get('message') || '').trim(),
            website: String(fd.get('website') || ''), // honeypot
            source: String(fd.get('source') || 'staging-main'),
            page: location.href,
            lang: lang(),
            userAgent: navigator.userAgent
        };
        btn.disabled = true;
        if (btnLabel) { originalLabel = btnLabel.textContent; btnLabel.textContent = t(I18N.sending); }
        status.hidden = true;
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // simple request: no CORS preflight
            body: JSON.stringify(payload),
            redirect: 'follow'
        }).then(function (res) { return res.json(); }).then(function (result) {
            if (!result || !result.ok) throw new Error((result && result.error) || 'send failed');
            form.reset();
            show('success', t(I18N.okTitle), t(I18N.okMsg));
            window.dataLayer.push({ event: 'lead_submit_success', lang: lang() });
        }).catch(function (err) {
            if (window.console) console.error('lead submit failed', err);
            show('error', t(I18N.errTitle), (err && err.message && /[֐-׿]/.test(err.message)) ? err.message : t(I18N.errMsg), payload);
        }).then(function () {
            btn.disabled = false;
            if (btnLabel) btnLabel.textContent = originalLabel;
        });
    });
    onLang(function () { if (btnLabel && !btn.disabled) originalLabel = btnLabel.textContent; });
})();

/* ---------- floating contact widget (hidden while the hero or the lead form is on screen) ---------- */
(function floatContact() {
    var root = document.getElementById('float-contact');
    if (!root) return;
    var toggle = document.getElementById('fcToggle');
    var menu = document.getElementById('fcMenu');
    var hero = document.getElementById('hero');
    var lead = document.getElementById('lead');
    root.hidden = false;
    function setOpen(open) {
        if (!toggle || !menu) return;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        menu.hidden = !open;
    }
    if (toggle && menu) {
        toggle.addEventListener('click', function () { setOpen(menu.hidden); });
        document.addEventListener('click', function (e) { if (!root.contains(e.target)) setOpen(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }
    function update() {
        var vh = window.innerHeight;
        var heroVisible = false, leadVisible = false;
        if (hero) { var hr = hero.getBoundingClientRect(); heroVisible = hr.bottom > vh * 0.05 && hr.top < vh * 0.95; }
        if (lead) { var lr = lead.getBoundingClientRect(); leadVisible = lr.bottom > vh * 0.15 && lr.top < vh * 0.85; }
        var visible = !heroVisible && !leadVisible;
        root.classList.toggle('visible', visible);
        if (!visible) setOpen(false);
    }
    onScroll(update);
    onIntroDone(update);
})();

})();
