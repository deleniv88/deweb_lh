/* =========================================================
   Перевірка сайту: тексти для Google (title, description, блок «Що перевіряємо» і FAQ під формою).
   Сторінку /audyt/ (і /en/audit/, /ua/audyt/) індексуємо, звіти ?r=… — ні (public/.htaccess).
   ========================================================= */
import type { Locale } from "./i18n";

export type AuditSeo = {
  title: string;
  description: string;
  h2: string;
  intro: string;
  blocks: [string, string][];
  faqTitle: string;
  faq: [string, string][];
  footerLink: string;
};

export const AUDIT_SEO: Record<Locale, AuditSeo> = {
  pl: {
    title: "Darmowy audyt strony internetowej online | deweb studio",
    description: "Sprawdź stronę za darmo w minutę: SEO, szybkość, bezpieczeństwo, RODO i podgląd linku. Ponad 30 testów i porady dla WordPress, Wix, Tilda i Shopify.",
    h2: "Co sprawdza darmowy audyt strony",
    intro: "Wpisz adres, a w minutę zobaczysz, co przeszkadza Twojej stronie zdobywać klientów. Narzędzie sprawdza ponad 30 punktów, tych samych, które sprawdzam przed oddaniem każdej strony klientowi, i podaje wskazówki pod platformę, na której zbudowana jest strona: WordPress, Wix, Tilda, Shopify, Webflow albo własny kod.",
    blocks: [
      ["Widoczność w Google", "robots.txt, mapa strony sitemap.xml, blokady noindex, canonical, tytuły i opisy stron. Jeśli Google nie widzi strony, nie pokaże jej klientom."],
      ["Szybkość", "Wynik Google PageSpeed na telefonie i komputerze, waga zdjęć, kompresja i cache. Wolna strona to mniej zapytań i niższe pozycje."],
      ["Bezpieczeństwo", "Certyfikat SSL, przekierowanie na https, nagłówki bezpieczeństwa i otwarte pliki konfiguracyjne. Na WordPressie także wersja, widoczne loginy administratorów i xmlrpc."],
      ["Podgląd linku i treść", "Obrazek i opis w Messengerze, WhatsAppie i na Facebooku, favicon, nagłówek H1, opisy zdjęć, uszkodzone linki i dane strukturalne."],
      ["RODO i analityka", "Polityka prywatności, baner cookies przy trackerach, Google Analytics i ochrona formularza przed spamem."],
    ],
    faqTitle: "Częste pytania",
    faq: [
      ["Czy audyt strony jest naprawdę darmowy?", "Tak. Wynik i pierwsza część raportu są widoczne od razu, bez rejestracji. Pełny raport z poradami i PDF odblokujesz, zostawiając e-mail, Instagram albo Telegram."],
      ["Ile trwa sprawdzenie strony?", "Większość punktów jest gotowa w 20–40 sekund. Pomiar szybkości przez Google PageSpeed trwa do minuty i sam dopisuje się do raportu."],
      ["Czy audyt działa dla WordPressa, Wix i Tildy?", "Tak. Narzędzie rozpoznaje platformę i hosting, a wskazówki pisze pod nie. Na Wix, Tildzie czy Shopify nie wlicza do wyniku tego, czym zarządza sama platforma: serwera, SSL i nagłówków."],
      ["Czy sprawdzenie może zaszkodzić mojej stronie?", "Nie. Narzędzie otwiera tylko publiczne adresy, tak jak zwykły odwiedzający: stronę główną, robots.txt, sitemap i kilka linków. Niczego nie loguje i niczego nie zmienia."],
      ["Co zrobić z wynikami?", "Zacznij od punktów oznaczonych jako „ważne”, dają największy efekt. Jeśli wolisz, żeby ktoś zrobił to za Ciebie, napisz do mnie: powiem, co poprawić najpierw, albo zrobię nową stronę, która przechodzi wszystkie testy."],
    ],
    footerLink: "Darmowy audyt strony",
  },
  en: {
    title: "Free Website Audit & SEO Check Online | deweb studio",
    description: "Check your website for free in a minute: SEO, speed, security, GDPR and link previews. 30+ checks with tips for WordPress, Wix, Tilda and Shopify.",
    h2: "What the free website audit checks",
    intro: "Enter an address and in a minute you'll see what stops your website from winning clients. The tool runs 30+ checks, the same ones I go through before handing any site to a client, and gives tips for the platform the site is built on: WordPress, Wix, Tilda, Shopify, Webflow or custom code.",
    blocks: [
      ["Google visibility", "robots.txt, sitemap.xml, noindex blocks, canonical, page titles and descriptions. If Google can't see a page, it won't show it to clients."],
      ["Speed", "Google PageSpeed score on mobile and desktop, image weight, compression and caching. A slow site means fewer enquiries and lower rankings."],
      ["Security", "SSL certificate, https redirect, security headers and exposed config files. On WordPress also the version, visible admin logins and xmlrpc."],
      ["Link previews and content", "The image and text shown in WhatsApp, Messenger and Facebook, favicon, H1 heading, image alt text, broken links and structured data."],
      ["GDPR and analytics", "Privacy policy, cookie banner when trackers are used, Google Analytics and spam protection on forms."],
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      ["Is the website audit really free?", "Yes. The score and the first part of the report show right away, no sign-up. You unlock the full report with tips and the PDF by leaving an email, Instagram or Telegram."],
      ["How long does the check take?", "Most checks are ready in 20–40 seconds. The Google PageSpeed measurement takes up to a minute and is added to the report automatically."],
      ["Does it work for WordPress, Wix and Tilda?", "Yes. The tool detects the platform and hosting and writes tips for them. On Wix, Tilda or Shopify it doesn't count what the platform itself manages: server, SSL and headers."],
      ["Can the check harm my website?", "No. It only opens public addresses, like a regular visitor: the home page, robots.txt, the sitemap and a few links. It doesn't log in and doesn't change anything."],
      ["What should I do with the results?", "Start with the items marked “important”, they make the biggest difference. If you'd rather have someone fix it for you, message me: I'll tell you what to fix first, or build a new site that passes every check."],
    ],
    footerLink: "Free website audit",
  },
  ua: {
    title: "Безкоштовний аудит сайту і SEO онлайн | deweb studio",
    description: "Перевір сайт безкоштовно за хвилину: SEO, швидкість, безпека, GDPR і прев’ю посилання. Понад 30 перевірок і поради для WordPress, Wix, Tilda та Shopify.",
    h2: "Що перевіряє безкоштовний аудит сайту",
    intro: "Введи адресу, і за хвилину побачиш, що заважає твоєму сайту приводити клієнтів. Інструмент перевіряє понад 30 пунктів, ті самі, що я перевіряю перед здачею кожного сайту клієнту, і дає поради під платформу, на якій зроблений сайт: WordPress, Wix, Tilda, Shopify, Webflow чи власний код.",
    blocks: [
      ["Видимість у Google", "robots.txt, карта сайту sitemap.xml, заборони noindex, canonical, назви й описи сторінок. Якщо Google не бачить сторінку, він не покаже її клієнтам."],
      ["Швидкість", "Оцінка Google PageSpeed на телефоні й комп’ютері, вага картинок, стиснення і кеш. Повільний сайт — це менше заявок і нижчі позиції."],
      ["Безпека", "SSL-сертифікат, редирект на https, заголовки безпеки і відкриті службові файли. На WordPress також версія, видимі логіни адмінів і xmlrpc."],
      ["Прев’ю посилання і контент", "Картинка й опис у Telegram, WhatsApp і Facebook, favicon, заголовок H1, описи картинок, биті посилання і розмітка Schema.org."],
      ["GDPR і аналітика", "Політика приватності, банер cookies, якщо є трекери, Google Analytics і захист форми від спаму."],
    ],
    faqTitle: "Часті питання",
    faq: [
      ["Аудит сайту справді безкоштовний?", "Так. Оцінку і першу частину звіту видно одразу, без реєстрації. Повний звіт з порадами і PDF відкриваються, коли залишаєш email, Instagram або Telegram."],
      ["Скільки триває перевірка?", "Більшість пунктів готова за 20–40 секунд. Вимірювання швидкості через Google PageSpeed триває до хвилини і саме дописується у звіт."],
      ["Чи працює аудит для WordPress, Wix і Tilda?", "Так. Інструмент визначає платформу і хостинг та пише поради під них. На Wix, Tilda чи Shopify не рахує в оцінку те, чим керує сама платформа: сервер, SSL і заголовки."],
      ["Чи може перевірка зашкодити моєму сайту?", "Ні. Інструмент відкриває лише публічні адреси, як звичайний відвідувач: головну, robots.txt, sitemap і кілька посилань. Нікуди не логіниться і нічого не змінює."],
      ["Що робити з результатами?", "Почни з пунктів з позначкою «важливо», вони дають найбільший ефект. Якщо хочеш, щоб це виправили за тебе, напиши мені: скажу, що зробити першим, або зроблю новий сайт, який проходить усі перевірки."],
    ],
    footerLink: "Безкоштовний аудит сайту",
  },
};
