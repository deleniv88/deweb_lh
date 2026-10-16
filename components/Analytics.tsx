/* Аналітика і реклама: Google Tag Manager, Google Ads (gtag), Meta Pixel, Microsoft Clarity.
   Вантажиться на всіх сторінках сайту (EN/PL/UA, блог, роботи). Адмінка /admin — окремий
   статичний застосунок Tina, цей layout її не зачіпає. Попередній перегляд сторінки всередині
   адмінки (iframe) теж не рахується — щоб власні правки не псували статистику.
   Конверсія "заявка" відправляється лише після успішної відправки форми — lib/behaviors.js → trackLead. */

export const GTM_ID = "GTM-M2QKT4F9";
export const GADS_ID = "AW-16902525708";
export const META_PIXEL_ID = "1307081700508678";
export const CLARITY_ID = "omjbunx06m";

const headScript = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
(function(){
  var off = false;
  try { off = window.self !== window.top || location.pathname.indexOf('/admin') === 0; } catch (e) { off = true; }
  window.__dwTrackingOff = off;
  if (off) return;
  /* Скрипти аналітики (~1 МБ JS разом із cookie-банером з GTM) вантажаться не під час
     першого показу сторінки, а з першою дією відвідувача (рух, дотик, скрол, клавіша)
     або через 4 с після повного завантаження — так вони не гальмують PageSpeed.
     Черги dataLayer / gtag / fbq / clarity працюють одразу, події не губляться. */
  /* Джерело переходу: UTM з посилання (біо Instagram, розсилка…) або соцмережа з referrer.
     Пам'ятаємо на сесію браузера (sessionStorage, не cookie) і раз рахуємо на сервері (api/events.php),
     тож у /stats видно і тих, хто відхилив cookies. Заявка й перевірка сайту додають джерело до CRM. */
  try {
    var q = new URLSearchParams(location.search), src = '';
    var cl = function(v){ return String(v || '').toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30); };
    if (q.get('utm_source')) src = [q.get('utm_source'), q.get('utm_medium'), q.get('utm_campaign')].map(cl).filter(Boolean).join(' / ');
    else if (document.referrer) {
      var m = new URL(document.referrer).hostname.match(/(instagram|facebook|threads|linkedin|tiktok|youtube|t\\.me|telegram)\\./);
      if (m) src = m[1].replace('t.me', 'telegram') + ' / referral';
    }
    if (src && !sessionStorage.getItem('dw-src')) {
      sessionStorage.setItem('dw-src', src);
      var hl = document.documentElement.lang;
      if (navigator.sendBeacon) navigator.sendBeacon('/api/events.php', 'visit|' + (hl === 'uk' ? 'ua' : hl === 'pl' ? 'pl' : 'en') + '|' + src);
    }
  } catch (e) {}

  var queue = [], started = false;
  function load(src){ if (started) inject(src); else queue.push(src); }
  function inject(src){ var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
  var evs = ['pointerdown','pointermove','touchstart','keydown','scroll','wheel'];
  function start(){
    if (started) return; started = true;
    evs.forEach(function(e){ removeEventListener(e, start, true); });
    queue.forEach(inject);
  }
  evs.forEach(function(e){ addEventListener(e, start, { capture: true, passive: true }); });
  if (document.readyState === 'complete') setTimeout(start, 4000);
  else addEventListener('load', function(){ setTimeout(start, 4000); });

  /* Google Tag Manager */
  dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  load('https://www.googletagmanager.com/gtm.js?id=${GTM_ID}');

  /* Google Ads (gtag.js) */
  load('https://www.googletagmanager.com/gtag/js?id=${GADS_ID}');
  gtag('js', new Date());
  gtag('config', '${GADS_ID}');

  /* Meta Pixel */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];load(v)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${META_PIXEL_ID}');
  fbq('track', 'PageView');

  /* Microsoft Clarity */
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    load("https://www.clarity.ms/tag/"+i);
  })(window, document, "clarity", "script", "${CLARITY_ID}");
})();
`;

export function AnalyticsHead() {
  return <script id="dw-analytics" dangerouslySetInnerHTML={{ __html: headScript }} />;
}

/* Для відвідувачів без JavaScript */
export function AnalyticsNoscript() {
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
    </noscript>
  );
}
