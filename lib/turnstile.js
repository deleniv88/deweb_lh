/* Cloudflare Turnstile вантажиться лише тоді, коли форма справді потрібна
   (відкрили заявку, чат або сторінку аудиту), а не на кожному вході на сайт:
   його перевірка важить ~1 МБ і вантажить процесор, що просаджувало PageSpeed.
   Після завантаження скрипт сам малює всі блоки .cf-turnstile на сторінці. */
export function loadTurnstile() {
  if (typeof document === 'undefined' || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
  if (document.getElementById('cf-turnstile-js')) return;
  var s = document.createElement('script');
  s.id = 'cf-turnstile-js';
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  s.async = true;
  document.head.appendChild(s);
}
