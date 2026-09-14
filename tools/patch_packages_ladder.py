# -*- coding: utf-8 -*-
"""Staging demo: new drift price ladder (1-8 sessions) + Drift King rebuilt as the
all-inclusive 10-session flagship at 9,999."""
import io, os

ROOT = r"C:\Users\sokol\OneDrive\Desktop\DKS\dks-staging"
IDX = os.path.join(ROOT, 'index.html')
CSS = os.path.join(ROOT, 'sections.css')

WA = 'https://wa.me/972537757323?text='

# qty, total, per session, he/en/ru/ar label for the quantity
TIERS = [
    (1,  '950',   '950', '1 מקצה',   '1 session',  '1 заезд',   'جلسة واحدة'),
    (2,  '1,800', '900', '2 מקצים',  '2 sessions', '2 заезда',  'جلستان'),
    (3,  '2,600', '867', '3 מקצים',  '3 sessions', '3 заезда',  '3 جلسات'),
    (4,  '3,400', '850', '4 מקצים',  '4 sessions', '4 заезда',  '4 جلسات'),
    (6,  '4,900', '817', '6 מקצים',  '6 sessions', '6 заездов', '6 جلسات'),
    (8,  '6,300', '788', '8 מקצים',  '8 sessions', '8 заездов', '8 جلسات'),
]


def tile(n, total, unit, he, en, ru, ar):
    msg = 'שלום! אני מעוניין בחבילה של ' + he
    href = WA + msg.replace(' ', '%20')
    return (
        '                <a class="ladder-tile" href="' + href + '" target="_blank" rel="noopener" data-event="cta_whatsapp_ladder" data-pkg="sessions-' + str(n) + '">\n'
        '                    <span class="lt-qty" data-he="' + he + '" data-en="' + en + '" data-ru="' + ru + '" data-ar="' + ar + '">' + he + '</span>\n'
        '                    <span class="lt-price">' + total + ' <small>₪</small></span>\n'
        '                    <span class="lt-unit" data-he="' + unit + ' ₪ למקצה" data-en="' + unit + ' ₪ per session" data-ru="' + unit + ' ₪ за заезд" data-ar="' + unit + ' ₪ للجلسة">' + unit + ' ₪ למקצה</span>\n'
        '                </a>\n')


LADDER = (
'        <!-- ===== Drift price ladder: the more sessions, the lower the price per session ===== -->\n'
'        <div class="pkg-ladder" id="pkg-ladder">\n'
'            <div class="ladder-head">\n'
'                <h3 class="ladder-title" data-he="בחרו כמה מקצים אתם רוצים" data-en="Choose how many sessions you want" data-ru="Выберите количество заездов" data-ar="اختاروا عدد الجلسات">בחרו כמה מקצים אתם רוצים</h3>\n'
'                <p class="ladder-sub" data-he="כל מקצה 15 דקות נהיגה נטו. ככל שלוקחים יותר מקצים, המחיר למקצה יורד." data-en="Every session is 15 net driving minutes. The more sessions you take, the lower the price per session." data-ru="Каждый заезд - 15 чистых минут за рулём. Чем больше заездов, тем ниже цена за заезд." data-ar="كل جلسة 15 دقيقة قيادة فعلية. كلما زاد عدد الجلسات، انخفض سعر الجلسة.">כל מקצה 15 דקות נהיגה נטו. ככל שלוקחים יותר מקצים, המחיר למקצה יורד.</p>\n'
'            </div>\n'
'            <div class="ladder-grid">\n'
+ ''.join(tile(*t) for t in TIERS) +
'            </div>\n'
'            <p class="ladder-note" data-he="רוצים 10 מקצים? זו כבר חוויית הדגל שלנו, Drift King, והכל בה כלול." data-en="Want 10 sessions? That is our flagship experience, Drift King, all inclusive." data-ru="Хотите 10 заездов? Это наш флагман, Drift King, всё включено." data-ar="تريدون 10 جلسات؟ تلك هي تجربتنا الرئيسية، Drift King، كل شيء مشمول.">רוצים 10 מקצים? זו כבר חוויית הדגל שלנו, Drift King, והכל בה כלול.</p>\n'
'        </div>\n\n')

s = io.open(IDX, encoding='utf-8').read()
orig = s

# 1. ladder goes right above the category filter
anchor = '        <div class="pkg-filter" role="radiogroup"'
assert s.count(anchor) == 1, 'filter anchor %d' % s.count(anchor)
if 'pkg-ladder' not in s:
    s = s.replace(anchor, LADDER + anchor)

# 2. King: two badges instead of one
old_badge = '                <div class="pkg-badge king-badge" data-he="MASTER - חבילת הדגל" data-en="MASTER - Flagship" data-ru="MASTER - Флагман" data-ar="MASTER - الباقة الرئيسية">MASTER - חבילת הדגל</div>'
new_badge = (
'                <div class="pkg-badges">\n'
'                    <span class="pkg-badge king-badge" data-he="חוויית הדגל שלנו" data-en="Our flagship experience" data-ru="Наш флагманский опыт" data-ar="تجربتنا الرئيسية">חוויית הדגל שלנו</span>\n'
'                    <span class="pkg-badge allin-badge" data-he="הכל כלול" data-en="All inclusive" data-ru="Всё включено" data-ar="كل شيء مشمول">הכל כלול</span>\n'
'                </div>')
assert s.count(old_badge) == 1, 'king badge %d' % s.count(old_badge)
s = s.replace(old_badge, new_badge)

# 3. King price 6,499 -> 9,999 (only inside the king card)
i = s.index('<div class="pkg-card king-card" data-tier="king" data-category="drift">')
j = s.index('<!-- Package 8: Your Own Car -->', i)
king = s[i:j]
assert king.count('<span class="price-amount">6,499</span>') == 1
king = king.replace('<span class="price-amount">6,499</span>', '<span class="price-amount">9,999</span>')

# 4. King subtitle says what it is now
king = king.replace(
    '<p class="pkg-subtitle" data-he="מלך הדריפט" data-en="King of Drift" data-ru="Король дрифта" data-ar="ملك الدرفت">מלך הדריפט</p>',
    '<p class="pkg-subtitle" data-he="מלך הדריפט, יום שלם והכל כלול" data-en="King of Drift, a full day, all inclusive" data-ru="Король дрифта, целый день, всё включено" data-ar="ملك الدرفت، يوم كامل وكل شيء مشمول">מלך הדריפט, יום שלם והכל כלול</p>')

# 5. the three things Paul added to the package
extras = (
'                    <li class="pkg-star" data-he="נסיעה על ב.מ.וו E36 עם מנוע V8 4.4 ליטר" data-en="Driving a BMW E36 with a 4.4 litre V8" data-ru="Поездка на BMW E36 с двигателем V8 4.4 л" data-ar="قيادة BMW E36 بمحرك V8 سعة 4.4 لتر">נסיעה על ב.מ.וו E36 עם מנוע V8 4.4 ליטר</li>\n'
'                    <li class="pkg-star" data-he="ליווי אישי של לביא אוחיון, נהג מירוצים רשמי בדריפט ומדריך מוסמך" data-en="Personal guidance from Lavi Ohayon, official drift racing driver and certified instructor" data-ru="Личное сопровождение Лави Охайона, официального гонщика по дрифту и сертифицированного инструктора" data-ar="مرافقة شخصية من لافي أوحايون، سائق سباقات درفت رسمي ومدرب معتمد">ליווי אישי של לביא אוחיון, נהג מירוצים רשמי בדריפט ומדריך מוסמך</li>\n'
'                    <li class="pkg-star" data-he="ארוחות ושתייה לאורך כל היום, הכל עלינו" data-en="Meals and drinks all day long, on us" data-ru="Еда и напитки весь день, за наш счёт" data-ar="وجبات ومشروبات طوال اليوم، على حسابنا">ארוחות ושתייה לאורך כל היום, הכל עלינו</li>\n')
first_li = '                    <li data-he="10 מקצי נהיגה מקצועית"'
assert king.count(first_li) == 1
king = king.replace(first_li, extras + first_li)

s = s[:i] + king + s[j:]
assert s != orig
io.open(IDX, 'w', encoding='utf-8', newline='\n').write(s)
print('index.html patched')

# ---------- styles ----------
c = io.open(CSS, encoding='utf-8').read()
if '.pkg-ladder' not in c:
    c += '''
/* ===== 14/09/26: drift price ladder (1-8 sessions) above the package grid ===== */
.pkg-ladder { margin: 0 auto 2.6rem; max-width: 1100px; padding: 1.8rem 1.6rem 1.5rem; border-radius: 18px; background: #ffffff; border: 1px solid rgba(184,134,11,0.28); box-shadow: 0 14px 40px rgba(10,10,12,0.10); }
.ladder-head { text-align: center; margin-bottom: 1.4rem; }
.ladder-title { font-size: clamp(1.15rem, 2.6vw, 1.6rem); font-weight: 900; margin: 0 0 0.45rem; color: var(--text-heading, #101114); }
.ladder-sub { margin: 0; font-size: 0.95rem; line-height: 1.6; color: var(--text-body, #4a4d55); }
.ladder-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
.ladder-tile { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 1.1rem 0.7rem; border-radius: 14px; text-decoration: none; background: linear-gradient(180deg, #fffdf7, #ffffff); border: 1.5px solid rgba(184,134,11,0.22); cursor: pointer; }
.ladder-tile:active { transform: translateY(1px); }
.lt-qty { font-size: 0.95rem; font-weight: 800; color: var(--text-body, #4a4d55); }
.lt-price { font-size: clamp(1.5rem, 3.2vw, 1.95rem); font-weight: 900; color: var(--gold, #b8860b); line-height: 1.1; }
.lt-price small { font-size: 0.55em; font-weight: 800; }
.lt-unit { font-size: 0.82rem; font-weight: 700; color: #7a7d85; }
.ladder-note { margin: 1.2rem 0 0; text-align: center; font-size: 0.95rem; font-weight: 700; color: var(--text-body, #4a4d55); }
@media (max-width: 720px) { .ladder-grid { grid-template-columns: repeat(2, 1fr); } .pkg-ladder { padding: 1.4rem 1rem 1.2rem; } }

/* King card: flagship badge + all-inclusive badge side by side, and the three headline extras */
.pkg-badges { position: absolute; top: 1rem; inset-inline-end: 1rem; z-index: 2; display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-end; }
.pkg-badges .pkg-badge { position: static; top: auto; inset-inline-end: auto; }
.allin-badge { background: linear-gradient(135deg, #101114, #2b2d33); box-shadow: 0 4px 12px rgba(16,17,20,0.28); }
.king-card .pkg-features .pkg-star { font-weight: 800; color: #101114; }
.king-card .pkg-features .pkg-star::marker { color: var(--gold, #b8860b); }
@media (max-width: 560px) { .pkg-badges { position: static; justify-content: flex-start; margin-bottom: 0.8rem; } }
'''
    io.open(CSS, 'w', encoding='utf-8', newline='\n').write(c)
    print('sections.css patched')
else:
    print('sections.css: already has the ladder')
